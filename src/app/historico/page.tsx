'use client'

import { useEffect, useState } from 'react'
import { getMetrics, deleteMetric, exportToCSV, importFromCSV, getActiveProfile } from '@/lib/storage'
import { MetricEntry, Profile } from '@/types'
import { Trash2, Download, Upload, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function HistoricoPage() {
  const [metrics, setMetrics] = useState<MetricEntry[]>([])
  const [profile, setProfile] = useState<Profile | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  function load() {
    setMetrics(getMetrics())
    setProfile(getActiveProfile())
  }

  useEffect(() => {
    load()
    window.addEventListener('profile-changed', load)
    return () => window.removeEventListener('profile-changed', load)
  }, [])

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const count = importFromCSV(text)
      if (count === 0) {
        setImportMsg('Nenhum dado importado. Verifique se o CSV tem as colunas corretas.')
      } else {
        setImportMsg(`${count} registro(s) importado(s) com sucesso!`)
        load()
      }
      setTimeout(() => setImportMsg(null), 4000)
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      deleteMetric(id)
      setMetrics(getMetrics())
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
    }
  }

  const sorted = [...metrics].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-400 text-base mb-2">
          Nenhum registro encontrado para <span className="font-semibold">@{profile?.username}</span>.
        </p>
        <p className="text-gray-400 text-sm mb-6">Troque de conta no menu superior ou insira dados.</p>
        <Link
          href="/inserir"
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm"
        >
          <ArrowUpRight className="w-4 h-4" />
          Inserir primeiras métricas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
            {profile && (
              <span className={`bg-gradient-to-r ${profile.color} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                @{profile.username}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{metrics.length} registro(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Importar CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => exportToCSV(sorted, profile?.username)}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {importMsg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${importMsg.includes('sucesso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {importMsg}
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {format(parseISO(m.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Inserido em {format(parseISO(m.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  confirmDelete === m.id
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmDelete === m.id ? 'Confirmar exclusão' : 'Excluir'}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center">
              {[
                { label: 'Seguidores', value: m.followers.toLocaleString('pt-BR'), badge: m.followers_growth > 0 ? `+${m.followers_growth}` : m.followers_growth < 0 ? `${m.followers_growth}` : null, positive: m.followers_growth >= 0 },
                { label: 'Engajamento', value: `${m.engagement_rate}%`, badge: null, positive: true },
                { label: 'Alcance', value: m.reach.toLocaleString('pt-BR'), badge: null, positive: true },
                { label: 'Impressões', value: m.impressions.toLocaleString('pt-BR'), badge: null, positive: true },
                { label: 'Curtidas', value: m.likes.toLocaleString('pt-BR'), badge: null, positive: true },
                { label: 'Comentários', value: m.comments.toLocaleString('pt-BR'), badge: null, positive: true },
                { label: 'Salvamentos', value: m.saves.toLocaleString('pt-BR'), badge: null, positive: true },
                { label: 'Visitas', value: m.profile_visits.toLocaleString('pt-BR'), badge: null, positive: true },
                { label: 'Posts', value: m.posts_published.toString(), badge: null, positive: true },
              ].map(({ label, value, badge, positive }) => (
                <div key={label} className="bg-gray-50 rounded-xl py-2 px-1">
                  <p className="text-xs text-gray-400 leading-tight">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                  {badge && (
                    <p className={`text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>{badge}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
