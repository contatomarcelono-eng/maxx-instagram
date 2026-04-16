export type MetaFileType =
  | 'impressions'
  | 'reach'
  | 'interactions'
  | 'followers'
  | 'profile_visits'
  | 'link_clicks'
  | 'demographics'
  | 'unknown'

export interface DetectedFile {
  name: string
  type: MetaFileType
  label: string
  rows: number
  dateRange: string
  values: Partial<{
    impressions: number
    reach: number
    likes: number
    comments: number
    saves: number
    followers_growth: number
    profile_visits: number
  }>
}

const TYPE_LABELS: Record<MetaFileType, string> = {
  impressions:    'Visualizações / Impressões',
  reach:          'Alcance',
  interactions:   'Interações',
  followers:      'Aumento de Seguidores',
  profile_visits: 'Visitas ao Perfil',
  link_clicks:    'Cliques no Link',
  demographics:   'Público (Demográfico)',
  unknown:        'Arquivo não reconhecido',
}

function cleanText(text: string): string {
  return text.replace(/^\uFEFF/, '').trim()
}

function detectSep(line: string): string {
  const semis = (line.match(/;/g) || []).length
  const commas = (line.match(/,/g) || []).length
  return semis > commas ? ';' : ','
}

function parseNum(s: string): number {
  if (!s) return 0
  return Number(s.replace(/"/g, '').replace(/\./g, '').replace(',', '.')) || 0
}

function formatDate(raw: string): string {
  // "2026-04-08T00:00:00" → "08/04/2026"
  const d = raw.replace(/"/g, '').split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }
  return d
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

interface ParsedCSV {
  title: string
  headers: string[]
  rows: string[][]
}

// Meta Business Suite exports CSVs with this structure:
//   Line 1: sep=,          (separator hint for Excel — skip)
//   Line 2: "Alcance"      (metric title — single value)
//   Line 3: "Data","Primary" (actual column headers)
//   Line 4+: data rows
function parseMetaCSV(text: string): ParsedCSV {
  const lines = cleanText(text)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  let i = 0

  // Skip "sep=X" line
  if (lines[i]?.toLowerCase().startsWith('sep=')) i++

  // Determine separator
  const sep = detectSep(lines[i] || ',')
  const split = (l: string) => l.split(sep).map((c) => c.trim().replace(/"/g, ''))

  // If current line is a single-value title row, capture it
  let title = ''
  const firstParts = split(lines[i] || '')
  if (firstParts.length === 1) {
    title = firstParts[0]
    i++
  }

  // Headers
  const headers = split(lines[i] || '').map((h) => normalize(h))
  i++

  // Data rows
  const rows = lines.slice(i).map((l) => split(l))

  return { title, headers, rows }
}

function detectType(title: string, filename: string): MetaFileType {
  const t = normalize(title)
  const f = normalize(filename.replace(/\s*\(\d+\)\s*/g, '').replace(/\.csv$/i, '').trim())

  if (/seguidor/.test(t) || /seguidor/.test(f)) return 'followers'
  if (/alcance/.test(t) || /alcance/.test(f)) return 'reach'
  if (/visualiza|impressa|impressao/.test(t) || /visualiza|impressa|impressao/.test(f)) return 'impressions'
  if (/visita/.test(t) || /visita/.test(f)) return 'profile_visits'
  if (/clique/.test(t) || /clique/.test(f)) return 'link_clicks'
  if (/intera/.test(t) || /intera/.test(f)) return 'interactions'
  if (/publi|demog|genero|idade|locali/.test(t) || /publi|demog/.test(f)) return 'demographics'

  return 'unknown'
}

export function detectAndParse(text: string, filename: string): DetectedFile {
  const { title, headers, rows } = parseMetaCSV(text)
  const type = detectType(title, filename)

  // Date range
  const dateCol = headers.findIndex((h) => h === 'data' || h === 'date')
  const dates = dateCol !== -1 ? rows.map((r) => r[dateCol]).filter(Boolean) : []
  const dateRange =
    dates.length > 0
      ? `${formatDate(dates[0])} a ${formatDate(dates[dates.length - 1])}`
      : '—'

  // Meta uses "Primary" as the default value column name
  const primaryIdx = headers.findIndex((h) => h === 'primary')
  const firstValueCol =
    primaryIdx !== -1
      ? primaryIdx
      : headers.findIndex((_, i) => i !== dateCol)

  const sumCol = (idx: number) =>
    idx !== -1 ? rows.reduce((acc, r) => acc + parseNum(r[idx] ?? ''), 0) : 0

  const colIdx = (...terms: string[]) =>
    headers.findIndex((h) => terms.some((t) => h.includes(t)))

  const values: DetectedFile['values'] = {}

  if (type === 'impressions') {
    values.impressions = sumCol(firstValueCol)
  }

  if (type === 'reach') {
    values.reach = sumCol(firstValueCol)
  }

  if (type === 'profile_visits') {
    values.profile_visits = sumCol(firstValueCol)
  }

  if (type === 'interactions') {
    const likesIdx = colIdx('curtida', 'like')
    const commentsIdx = colIdx('comentar', 'comment')
    const savesIdx = colIdx('salvamento', 'salvo', 'save')

    if (likesIdx !== -1 || commentsIdx !== -1 || savesIdx !== -1) {
      if (likesIdx !== -1) values.likes = sumCol(likesIdx)
      if (commentsIdx !== -1) values.comments = sumCol(commentsIdx)
      if (savesIdx !== -1) values.saves = sumCol(savesIdx)
    } else {
      // Only total available — store as likes
      values.likes = sumCol(firstValueCol)
    }
  }

  if (type === 'followers') {
    values.followers_growth = sumCol(firstValueCol)
  }

  return {
    name: filename,
    type,
    label: TYPE_LABELS[type],
    rows: rows.length,
    dateRange,
    values,
  }
}

export function mergeDetectedFiles(
  files: DetectedFile[]
): Partial<{
  impressions: number
  reach: number
  likes: number
  comments: number
  saves: number
  followers_growth: number
  profile_visits: number
}> {
  const merged: ReturnType<typeof mergeDetectedFiles> = {}
  for (const f of files) {
    for (const [key, val] of Object.entries(f.values)) {
      if (val !== undefined) {
        const k = key as keyof typeof merged
        merged[k] = (merged[k] ?? 0) + val
      }
    }
  }
  return merged
}
