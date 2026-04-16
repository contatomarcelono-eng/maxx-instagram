export interface Profile {
  id: string
  username: string
  color: string
  created_at: string
}

export interface MetricEntry {
  id: string
  profile_id: string
  date: string
  followers: number
  followers_growth: number
  reach: number
  impressions: number
  likes: number
  comments: number
  saves: number
  profile_visits: number
  posts_published: number
  engagement_rate: number
  created_at: string
}

export interface MetricFormData {
  date: string
  followers: number
  reach: number
  impressions: number
  likes: number
  comments: number
  saves: number
  profile_visits: number
  posts_published: number
}
