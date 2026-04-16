'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MetricEntry } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FollowersChartProps {
  data: MetricEntry[]
}

export function FollowersChart({ data }: FollowersChartProps) {
  const chartData = data.map((m) => ({
    date: format(parseISO(m.date), 'dd MMM', { locale: ptBR }),
    seguidores: m.followers,
  }))

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center h-[280px]">
        <p className="text-gray-400 text-sm">Sem dados ainda. Insira métricas para ver o gráfico.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-sm font-semibold text-gray-700 mb-4">Evolução de Seguidores</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSeguidores" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => v.toLocaleString('pt-BR')} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            formatter={(v) => [(v as number).toLocaleString('pt-BR'), 'Seguidores']}
          />
          <Area type="monotone" dataKey="seguidores" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorSeguidores)" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
