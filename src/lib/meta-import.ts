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
  impressions: 'Visualizações / Impressões',
  reach: 'Alcance',
  interactions: 'Interações',
  followers: 'Aumento de Seguidores',
  profile_visits: 'Visitas ao Perfil',
  link_clicks: 'Cliques no Link',
  demographics: 'Público (Demográfico)',
  unknown: 'Arquivo não reconhecido',
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
  return Number(s.replace(/['"]/g, '').replace(/\./g, '').replace(',', '.')) || 0
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = cleanText(text).split('\n').filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const sep = detectSep(lines[0])
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/['"]/g, '').toLowerCase())
  const rows = lines.slice(1).map((l) => l.split(sep).map((c) => c.trim().replace(/['"]/g, '')))
  return { headers, rows }
}

function detectType(headers: string[], filename: string): MetaFileType {
  const h = headers.join(' ')
  const f = filename.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (/seguidor/.test(h) || /seguidor/.test(f)) return 'followers'
  if (/visualiza|impressa|impressao/.test(h) || /visualiza|impressa|impressao/.test(f)) return 'impressions'
  if (/alcance/.test(h) || /alcance/.test(f)) return 'reach'
  if (/visita/.test(h) || /visita/.test(f)) return 'profile_visits'
  if (/clique/.test(h) || /clique/.test(f)) return 'link_clicks'
  if (/intera/.test(h) || /intera/.test(f)) return 'interactions'
  if (/publi|demog|genero|genero|idade|locali/.test(h) || /publi|demog/.test(f)) return 'demographics'
  return 'unknown'
}

export function detectAndParse(text: string, filename: string): DetectedFile {
  const { headers, rows } = parseCSV(text)
  const type = detectType(headers, filename)

  // Date range
  const dateCol = headers.findIndex((h) => h.includes('data') || h.includes('date') || h === 'período' || h === 'periodo')
  const dates = dateCol !== -1 ? rows.map((r) => r[dateCol]).filter(Boolean) : []
  const dateRange = dates.length > 0 ? `${dates[0]} a ${dates[dates.length - 1]}` : '—'

  const colIdx = (...terms: string[]) =>
    headers.findIndex((h) => terms.some((t) => h.includes(t)))

  const sumCol = (idx: number) =>
    idx !== -1 ? rows.reduce((acc, r) => acc + parseNum(r[idx] ?? ''), 0) : 0

  // First numeric column (fallback)
  const firstNumericCol = headers.findIndex((h, i) => i !== dateCol && !h.includes('data') && !h.includes('date'))

  const values: DetectedFile['values'] = {}

  if (type === 'impressions') {
    const idx = colIdx('impressa', 'impressao', 'visualiza')
    values.impressions = sumCol(idx !== -1 ? idx : firstNumericCol)
  }

  if (type === 'reach') {
    const idx = colIdx('alcance')
    values.reach = sumCol(idx !== -1 ? idx : firstNumericCol)
  }

  if (type === 'profile_visits') {
    const idx = colIdx('visita')
    values.profile_visits = sumCol(idx !== -1 ? idx : firstNumericCol)
  }

  if (type === 'interactions') {
    const likesIdx = colIdx('curtida', 'like')
    const commentsIdx = colIdx('comentár', 'comentar', 'comment')
    const savesIdx = colIdx('salvamento', 'salvo', 'save')

    if (likesIdx !== -1 || commentsIdx !== -1 || savesIdx !== -1) {
      if (likesIdx !== -1) values.likes = sumCol(likesIdx)
      if (commentsIdx !== -1) values.comments = sumCol(commentsIdx)
      if (savesIdx !== -1) values.saves = sumCol(savesIdx)
    } else {
      // Only total interactions available — store as likes
      values.likes = sumCol(firstNumericCol)
    }
  }

  if (type === 'followers') {
    const newIdx = colIdx('novo', 'new', 'ganho', 'adquirido')
    const lostIdx = colIdx('perdido', 'lost', 'cancelado', 'parou', 'deixou')

    if (newIdx !== -1 || lostIdx !== -1) {
      const gained = sumCol(newIdx)
      const lost = sumCol(lostIdx)
      values.followers_growth = gained - lost
    } else {
      // Single column — treat as net growth
      values.followers_growth = sumCol(firstNumericCol)
    }
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

export function mergeDetectedFiles(files: DetectedFile[]): Partial<{
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
