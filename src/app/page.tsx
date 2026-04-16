'use client'

import { useEffect, useState } from 'react'
import { Users, Eye, TrendingUp, Heart, MessageCircle, Bookmark, MousePointer, Image, ArrowUpRight } from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { FollowersChart } from '@/components/FollowersChart'
import { EngagementChart } from '@/components/EngagementChart'
import { ReachChart } from '@/components/ReachChart'
import { MetricEntry, Profile } from '@/types'
import { getMetrics, getActiveProfile } from '@/lib/storage'
import { InsightsCard } from '@/components/InsightsCard'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricEntry[]>([])
  const [profile, setProfile] = useState<Profile | undefined>()

  function load() {
    setMetrics(getMetrics())
    setProfile(getActiveProfile())
  }

  useEffect(() => {
    load()
    window.addEventListener('profile-changed', load)
    return () => window.removeEventListener('profile-changed', load)
  }, [])

  const latest = metrics[metrics.length - 1]
  const previous = metrics[metrics.length - 2]

  const diff = (curr: number, prev?: number) => (prev !== undefined ? curr - prev : undefined)

  if (metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className={`w-16 h-16 bg-gradient-to-br ${profile?.color ?? 'from-pink-500 to-purple-600'} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
          <span className="text-white text-2xl font-bold uppercase">{profile?.username?.[0] ?? 'M'}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">@{profile?.username ?? 'maxxessencial'}</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          Nenhum dado inserido ainda para este perfil. Comece adicionando as métricas.
        </p>
        <Link
          href="/inserir"
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
          Inserir primeiras métricas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Último registro:{' '}
            {latest ? format(parseISO(latest.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—'}
          </p>
        </div>
        <Link
          href="/inserir"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
          Inserir dados
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Seguidores"
          value={latest.followers}
          trend={latest.followers_growth !== 0 ? latest.followers_growth : undefined}
          icon={Users}
          color="bg-indigo-500"
          subtitle="total atual"
        />
        <MetricCard
          title="Taxa de Engajamento"
          value={latest.engagement_rate}
          trend={diff(latest.engagement_rate, previous?.engagement_rate)}
          icon={TrendingUp}
          color="bg-emerald-500"
          format="percent"
          subtitle="curtidas + coment. + salvamentos"
        />
        <MetricCard
          title="Alcance"
          value={latest.reach}
          trend={diff(latest.reach, previous?.reach)}
          icon={Eye}
          color="bg-blue-500"
          subtitle="pessoas únicas alcançadas"
        />
        <MetricCard
          title="Impressões"
          value={latest.impressions}
          trend={diff(latest.impressions, previous?.impressions)}
          icon={MousePointer}
          color="bg-purple-500"
          subtitle="visualizações totais"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Curtidas"
          value={latest.likes}
          trend={diff(latest.likes, previous?.likes)}
          icon={Heart}
          color="bg-rose-500"
        />
        <MetricCard
          title="Comentários"
          value={latest.comments}
          trend={diff(latest.comments, previous?.comments)}
          icon={MessageCircle}
          color="bg-amber-500"
        />
        <MetricCard
          title="Salvamentos"
          value={latest.saves}
          trend={diff(latest.saves, previous?.saves)}
          icon={Bookmark}
          color="bg-teal-500"
          subtitle="importante para móveis"
        />
        <MetricCard
          title="Posts Publicados"
          value={latest.posts_published}
          trend={diff(latest.posts_published, previous?.posts_published)}
          icon={Image}
          color="bg-orange-500"
          subtitle="no período"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowersChart data={metrics} />
        <ReachChart data={metrics} />
      </div>

      <EngagementChart data={metrics} />

      <InsightsCard metrics={metrics} />

      {metrics.length >= 2 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Resumo geral do período</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Registros</p>
              <p className="text-lg font-bold text-gray-900">{metrics.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Crescimento total</p>
              <p className="text-lg font-bold text-indigo-600">
                +{(latest.followers - metrics[0].followers).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Maior alcance</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.max(...metrics.map((m) => m.reach)).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Melhor engajamento</p>
              <p className="text-lg font-bold text-emerald-600">
                {Math.max(...metrics.map((m) => m.engagement_rate))}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
