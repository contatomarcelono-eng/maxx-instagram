'use client'

import { MetricEntry } from '@/types'
import { TrendingDown, MessageCircle, Bookmark, Eye, Users, CheckCircle, Lightbulb, Heart } from 'lucide-react'

interface Insight {
  icon: React.ElementType
  bg: string
  iconColor: string
  title: string
  tip: string
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function buildInsights(latest: MetricEntry, history: MetricEntry[]): Insight[] {
  const prev = history.slice(0, -1)
  if (prev.length === 0) return []

  const insights: Insight[] = []
  const LOW = 0.8 // abaixo de 80% da média = problema

  const avgEngagement     = avg(prev.map((m) => m.engagement_rate))
  const avgReach          = avg(prev.map((m) => m.reach))
  const avgSaves          = avg(prev.map((m) => m.saves))
  const avgComments       = avg(prev.map((m) => m.comments))
  const avgLikes          = avg(prev.map((m) => m.likes))
  const avgGrowth         = avg(prev.map((m) => m.followers_growth))

  if (latest.engagement_rate < avgEngagement * LOW) {
    insights.push({
      icon: TrendingDown,
      bg: 'bg-rose-50 border-rose-100',
      iconColor: 'text-rose-500',
      title: 'Engajamento abaixo da média',
      tip: 'Reels mostrando ambientes completos têm 3× mais alcance que fotos estáticas. Tente mostrar um cômodo "do zero até pronto" com os móveis da loja.',
    })
  }

  if (latest.saves < avgSaves * LOW) {
    insights.push({
      icon: Bookmark,
      bg: 'bg-amber-50 border-amber-100',
      iconColor: 'text-amber-500',
      title: 'Poucos salvamentos',
      tip: 'Salvamentos são o sinal mais forte para o algoritmo. Posts com "dimensões ideais para sala pequena", listas de itens ou inspirações de decoração são muito salvos — as pessoas guardam para comprar depois.',
    })
  }

  if (latest.comments < avgComments * LOW) {
    insights.push({
      icon: MessageCircle,
      bg: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-500',
      title: 'Poucos comentários',
      tip: 'Termine os posts com uma pergunta: "Qual cor você escolheria?" ou "Esse ambiente combina com a sua casa?" Perguntas simples dobram os comentários.',
    })
  }

  if (latest.likes < avgLikes * LOW) {
    insights.push({
      icon: Heart,
      bg: 'bg-pink-50 border-pink-100',
      iconColor: 'text-pink-500',
      title: 'Curtidas abaixo do normal',
      tip: 'Fotos com boa iluminação e ângulo amplo do ambiente performam melhor. Se possível, fotografe os móveis em um ambiente decorado, não isolados.',
    })
  }

  if (latest.reach < avgReach * LOW) {
    insights.push({
      icon: Eye,
      bg: 'bg-purple-50 border-purple-100',
      iconColor: 'text-purple-500',
      title: 'Alcance baixo',
      tip: 'Poste nos horários de pico do seu público (geralmente 19h–21h) e use hashtags específicas como #moveisplanejados #decoracaosala #ambientedecor junto com as da loja.',
    })
  }

  if (latest.followers_growth < avgGrowth * LOW) {
    insights.push({
      icon: Users,
      bg: 'bg-indigo-50 border-indigo-100',
      iconColor: 'text-indigo-500',
      title: 'Crescimento de seguidores lento',
      tip: 'Stories de "chegada de novos móveis" ou "antes e depois de um ambiente" costumam viralizar. Peça também que clientes marquem o perfil da loja quando montarem o ambiente.',
    })
  }

  return insights
}

interface Props {
  metrics: MetricEntry[]
}

export function InsightsCard({ metrics }: Props) {
  if (metrics.length < 2) return null

  const latest = metrics[metrics.length - 1]
  const insights = buildInsights(latest, metrics)

  if (insights.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Ótima semana! Tudo acima da média.</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Engajamento, alcance e salvamentos estão acima das semanas anteriores. Continue com a frequência de posts!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <p className="text-sm font-semibold text-gray-700">
          Dicas para melhorar esta semana
        </p>
        <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
          {insights.length} ponto{insights.length > 1 ? 's' : ''} de atenção
        </span>
      </div>

      {insights.map((insight, i) => (
        <div key={i} className={`border rounded-2xl p-4 flex items-start gap-3 ${insight.bg}`}>
          <div className="shrink-0 mt-0.5">
            <insight.icon className={`w-4 h-4 ${insight.iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{insight.title}</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{insight.tip}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
