'use client'

import {
  LineChart,
  Line,
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

interface ReachChartProps {
  data: MetricEntry[]
}

export function ReachChart({ data }: ReachChartProps) {
  const chartData = data.map((m) => ({
    date: format(parseISO(m.date), 'dd MMM', { locale: ptBR }),
    alcance: m.reach,
    impressões: m.impressions,
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
      <p className="text-sm font-semibold text-gray-700 mb-4">Alcance & Impressões</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => v.toLocaleString('pt-BR')} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            formatter={(v) => [(v as number).toLocaleString('pt-BR')]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="alcance" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="impressões" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
