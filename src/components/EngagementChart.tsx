'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { MetricEntry } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EngagementChartProps {
  data: MetricEntry[]
}

export function EngagementChart({ data }: EngagementChartProps) {
  const chartData = data.map((m) => ({
    date: format(parseISO(m.date), 'dd MMM', { locale: ptBR }),
    curtidas: m.likes,
    comentários: m.comments,
    salvamentos: m.saves,
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
      <p className="text-sm font-semibold text-gray-700 mb-4">Engajamento por Período</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="curtidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="comentários" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="salvamentos" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
