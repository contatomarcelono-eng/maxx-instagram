'use client'

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  icon: LucideIcon
  color: string
  format?: 'number' | 'percent'
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color,
  format = 'number',
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const trendText =
    trend !== undefined
      ? `${isPositive ? '+' : ''}${format === 'percent' ? trend.toFixed(2) + '%' : trend.toLocaleString('pt-BR')}`
      : null

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number'
              ? format === 'percent'
                ? `${value}%`
                : value.toLocaleString('pt-BR')
              : value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trendText && (
            <div className={`flex items-center mt-2 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{isPositive ? '▲' : '▼'} {trendText} vs período anterior</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}
