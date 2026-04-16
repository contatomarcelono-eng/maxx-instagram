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
  _debug: {
    title: string
    headers: string[]
    firstRow: string[]
    primaryIdx: number
    dateCol: number
  }
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

function parseNum(s: string): number {
  if (!s || !s.trim()) return 0
  const cleaned = s.replace(/"/g, '').trim()
  // Handle both "1.234,56" (PT) and "1,234.56" (EN)
  const num = Number(cleaned.replace(/\./g, '').replace(',', '.'))
  return isNaN(num) ? 0 : num
}

function formatDate(raw: string): string {
  const d = raw.replace(/"/g, '').split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }
  return d
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// Meta Business Suite CSV format:
//   Line 1: sep=,              (optional — skip)
//   Line 2: "Título da Métrica" (optional single-cell title — capture)
//   Line 3: "Data","Primary"   (column headers)
//   Line 4+: data rows
function parseMetaCSV(text: string): {
  title: string
  headers: string[]
  rows: string[][]
  sep: string
} {
  const lines = cleanText(text)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  let i = 0
  let sep = ','

  // Extract separator from "sep=X" line
  if (lines[i]?.toLowerCase().startsWith('sep=')) {
    const declared = lines[i].slice(4).trim()
    if (declared) sep = declared
    i++
  } else {
    // Auto-detect from first meaningful line
    const sample = lines[i] || ''
    const semis = (sample.match(/;/g) || []).length
    const commas = (sample.match(/,/g) || []).length
    sep = semis > commas ? ';' : ','
  }

  const split = (l: string) => l.split(sep).map((c) => c.trim().replace(/"/g, ''))

  // Check if current line is a single-value title row
  let title = ''
  const firstParts = split(lines[i] || '')
  if (firstParts.length === 1 && firstParts[0].length > 0) {
    title = firstParts[0]
    i++
  }

  // Headers
  const headers = split(lines[i] || '').map(normalize)
  i++

  // Data rows (skip empty)
  const rows = lines.slice(i)
    .map((l) => split(l))
    .filter((r) => r.some((c) => c.length > 0))

  return { title, headers, rows, sep }
}

function detectType(title: string, filename: string): MetaFileType {
  const t = normalize(title)
  const f = normalize(filename.replace(/\s*\(\d+\)\s*/g, '').replace(/\.csv$/i, '').trim())

  if (/seguidor/.test(t) || /seguidor/.test(f)) return 'followers'
  if (/alcance/.test(t) || /alcance/.test(f)) return 'reach'
  if (/visualiza|impressa|impressao|viewer/.test(t) || /visualiza|impressa|impressao/.test(f)) return 'impressions'
  if (/visita/.test(t) || /visita/.test(f)) return 'profile_visits'
  if (/clique/.test(t) || /clique/.test(f)) return 'link_clicks'
  if (/intera/.test(t) || /intera/.test(f)) return 'interactions'
  if (/publi|demog|genero|idade|locali/.test(t) || /publi|demog/.test(f)) return 'demographics'

  return 'unknown'
}

export function detectAndParse(text: string, filename: string): DetectedFile {
  const { title, headers, rows } = parseMetaCSV(text)
  const type = detectType(title, filename)

  // Find date column — use includes for robustness
  const dateCol = headers.findIndex((h) => h.includes('data') || h === 'date')

  // Find value column — Meta uses "primary" as the default column name
  const primaryIdx = headers.findIndex((h) => h === 'primary')

  // Best value column: primary > first non-date column > column 1 fallback
  const valueCol =
    primaryIdx !== -1
      ? primaryIdx
      : dateCol !== -1
        ? headers.findIndex((_, i) => i !== dateCol)
        : 1  // fallback: column index 1

  // Date range
  const dates = dateCol !== -1 ? rows.map((r) => r[dateCol]).filter(Boolean) : []
  const dateRange =
    dates.length > 0
      ? `${formatDate(dates[0])} a ${formatDate(dates[dates.length - 1])}`
      : '—'

  const sumCol = (idx: number) =>
    idx >= 0 ? rows.reduce((acc, r) => acc + parseNum(r[idx] ?? ''), 0) : 0

  const colIdx = (...terms: string[]) =>
    headers.findIndex((h) => terms.some((t) => normalize(h).includes(t)))

  const values: DetectedFile['values'] = {}

  if (type === 'impressions') {
    values.impressions = sumCol(valueCol)
  }

  if (type === 'reach') {
    values.reach = sumCol(valueCol)
  }

  if (type === 'profile_visits') {
    values.profile_visits = sumCol(valueCol)
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
      values.likes = sumCol(valueCol)
    }
  }

  if (type === 'followers') {
    values.followers_growth = sumCol(valueCol)
  }

  return {
    name: filename,
    type,
    label: TYPE_LABELS[type],
    rows: rows.length,
    dateRange,
    values,
    _debug: {
      title,
      headers,
      firstRow: rows[0] ?? [],
      primaryIdx,
      dateCol,
    },
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
