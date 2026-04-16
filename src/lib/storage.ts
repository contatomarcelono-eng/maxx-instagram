import { MetricEntry, MetricFormData, Profile } from '@/types'

const METRICS_KEY = 'maxx_instagram_metrics'
const PROFILES_KEY = 'maxx_instagram_profiles'
const ACTIVE_PROFILE_KEY = 'maxx_instagram_active_profile'

const PROFILE_COLORS = [
  'from-pink-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-red-500 to-rose-500',
  'from-violet-500 to-indigo-500',
]

// ─── Profiles ────────────────────────────────────────────────────────────────

export function getProfiles(): Profile[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(PROFILES_KEY)
  if (!raw) {
    const defaultProfile: Profile = {
      id: 'default',
      username: 'maxxessencial',
      color: PROFILE_COLORS[0],
      created_at: new Date().toISOString(),
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify([defaultProfile]))
    return [defaultProfile]
  }
  try {
    return JSON.parse(raw) as Profile[]
  } catch {
    return []
  }
}

export function addProfile(username: string): Profile {
  const profiles = getProfiles()
  const colorIndex = profiles.length % PROFILE_COLORS.length
  const newProfile: Profile = {
    id: crypto.randomUUID(),
    username: username.replace('@', '').trim().toLowerCase(),
    color: PROFILE_COLORS[colorIndex],
    created_at: new Date().toISOString(),
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify([...profiles, newProfile]))
  return newProfile
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter((p) => p.id !== id)
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))

  // Delete all metrics from this profile
  const metrics = getAllMetrics().filter((m) => m.profile_id !== id)
  localStorage.setItem(METRICS_KEY, JSON.stringify(metrics))

  // If active profile was deleted, switch to first available
  if (getActiveProfileId() === id) {
    const first = profiles[0]
    if (first) setActiveProfile(first.id)
  }
}

export function getActiveProfileId(): string {
  if (typeof window === 'undefined') return 'default'
  return localStorage.getItem(ACTIVE_PROFILE_KEY) ?? getProfiles()[0]?.id ?? 'default'
}

export function setActiveProfile(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id)
}

export function getActiveProfile(): Profile | undefined {
  const profiles = getProfiles()
  const activeId = getActiveProfileId()
  return profiles.find((p) => p.id === activeId) ?? profiles[0]
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

function getAllMetrics(): MetricEntry[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(METRICS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as MetricEntry[]
  } catch {
    return []
  }
}

export function getMetrics(profileId?: string): MetricEntry[] {
  const id = profileId ?? getActiveProfileId()
  return getAllMetrics()
    .filter((m) => m.profile_id === id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function saveMetric(data: MetricFormData, profileId?: string): MetricEntry {
  const id = profileId ?? getActiveProfileId()
  const all = getAllMetrics()

  const profileMetrics = all
    .filter((m) => m.profile_id === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const previous = profileMetrics[0]
  const followers_growth = previous ? data.followers - previous.followers : 0
  const total_interactions = data.likes + data.comments + data.saves
  const engagement_rate =
    data.followers > 0
      ? parseFloat(((total_interactions / data.followers) * 100).toFixed(2))
      : 0

  const newEntry: MetricEntry = {
    id: crypto.randomUUID(),
    profile_id: id,
    ...data,
    followers_growth,
    engagement_rate,
    created_at: new Date().toISOString(),
  }

  localStorage.setItem(METRICS_KEY, JSON.stringify([...all, newEntry]))
  return newEntry
}

export function deleteMetric(id: string): void {
  const updated = getAllMetrics().filter((m) => m.id !== id)
  localStorage.setItem(METRICS_KEY, JSON.stringify(updated))
}

export function importFromCSV(csvText: string, profileId?: string): number {
  const id = profileId ?? getActiveProfileId()
  const lines = csvText.trim().split('\n').filter((l) => l.trim() !== '')
  if (lines.length < 2) return 0

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

  const col = (...names: string[]) => {
    for (const name of names) {
      const idx = headers.findIndex((h) => h.includes(name))
      if (idx !== -1) return idx
    }
    return -1
  }

  const dateIdx = col('data')
  const followersIdx = col('seguidores')
  const reachIdx = col('alcance')
  const impressionsIdx = col('impressões', 'impressoes', 'impressão', 'impressao')
  const likesIdx = col('curtidas')
  const commentsIdx = col('comentários', 'comentarios', 'comentário', 'comentario')
  const savesIdx = col('salvamentos')
  const visitsIdx = col('visitas')
  const postsIdx = col('posts')

  if (dateIdx === -1 || followersIdx === -1) return 0

  const all = getAllMetrics()
  let count = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const dateRaw = cols[dateIdx]
    if (!dateRaw) continue

    // Aceita dd/MM/yyyy ou yyyy-MM-dd
    let date = dateRaw
    if (dateRaw.includes('/')) {
      const p = dateRaw.split('/')
      if (p.length === 3) {
        date = p[0].length === 4
          ? `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`
          : `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`
      }
    }

    const getNum = (idx: number) => (idx !== -1 ? Number(cols[idx]) || 0 : 0)

    const followers = getNum(followersIdx)
    const reach = getNum(reachIdx)
    const impressions = getNum(impressionsIdx)
    const likes = getNum(likesIdx)
    const comments = getNum(commentsIdx)
    const saves = getNum(savesIdx)
    const profile_visits = getNum(visitsIdx)
    const posts_published = getNum(postsIdx)

    const profileMetrics = all
      .filter((m) => m.profile_id === id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const previous = profileMetrics[profileMetrics.length - 1]
    const followers_growth = previous ? followers - previous.followers : 0
    const total_interactions = likes + comments + saves
    const engagement_rate =
      followers > 0 ? parseFloat(((total_interactions / followers) * 100).toFixed(2)) : 0

    const newEntry: MetricEntry = {
      id: crypto.randomUUID(),
      profile_id: id,
      date,
      followers,
      reach,
      impressions,
      likes,
      comments,
      saves,
      profile_visits,
      posts_published,
      followers_growth,
      engagement_rate,
      created_at: new Date().toISOString(),
    }

    all.push(newEntry)
    count++
  }

  localStorage.setItem(METRICS_KEY, JSON.stringify(all))
  return count
}

export function exportToCSV(metrics: MetricEntry[], username?: string): void {
  const headers = [
    'Data', 'Seguidores', 'Crescimento', 'Alcance', 'Impressões',
    'Curtidas', 'Comentários', 'Salvamentos', 'Visitas ao Perfil',
    'Posts Publicados', 'Taxa de Engajamento (%)',
  ]
  const rows = metrics.map((m) => [
    m.date, m.followers, m.followers_growth, m.reach, m.impressions,
    m.likes, m.comments, m.saves, m.profile_visits,
    m.posts_published, m.engagement_rate,
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${username ?? 'instagram'}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
