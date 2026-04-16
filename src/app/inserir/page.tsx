'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveMetric, getActiveProfile } from '@/lib/storage'
import { MetricFormData, Profile } from '@/types'
import { CheckCircle } from 'lucide-react'

const initialForm: MetricFormData = {
  date: new Date().toISOString().split('T')[0],
  followers: 0,
  reach: 0,
  impressions: 0,
  likes: 0,
  comments: 0,
  saves: 0,
  profile_visits: 0,
  posts_published: 0,
}

interface FieldConfig {
  key: keyof MetricFormData
  label: string
  hint: string
  color: string
}

const fields: FieldConfig[] = [
  { key: 'followers', label: 'Seguidores', hint: 'Total de seguidores no momento', color: 'focus:ring-indigo-400' },
  { key: 'reach', label: 'Alcance', hint: 'Quantas pessoas únicas viram seus posts', color: 'focus:ring-blue-400' },
  { key: 'impressions', label: 'Impressões', hint: 'Total de visualizações (conta repetição)', color: 'focus:ring-purple-400' },
  { key: 'likes', label: 'Curtidas', hint: 'Soma de curtidas do período', color: 'focus:ring-rose-400' },
  { key: 'comments', label: 'Comentários', hint: 'Soma de comentários do período', color: 'focus:ring-amber-400' },
  { key: 'saves', label: 'Salvamentos', hint: 'Soma de salvamentos — muito relevante para móveis', color: 'focus:ring-teal-400' },
  { key: 'profile_visits', label: 'Visitas ao Perfil', hint: 'Quantas pessoas visitaram o perfil', color: 'focus:ring-cyan-400' },
  { key: 'posts_published', label: 'Posts Publicados', hint: 'Quantos posts foram publicados no período', color: 'focus:ring-orange-400' },
]

export default function InsertPage() {
  const router = useRouter()
  const [form, setForm] = useState<MetricFormData>(initialForm)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<Profile | undefined>()

  function loadProfile() {
    setProfile(getActiveProfile())
  }

  useEffect(() => {
    loadProfile()
    window.addEventListener('profile-changed', loadProfile)
    return () => window.removeEventListener('profile-changed', loadProfile)
  }, [])

  function handleChange(key: keyof MetricFormData, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: key === 'date' ? value : Number(value),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveMetric(form)
    setSaved(true)
    setTimeout(() => {
      router.push('/')
    }, 1500)
  }

  const engagement =
    form.followers > 0
      ? (((form.likes + form.comments + form.saves) / form.followers) * 100).toFixed(2)
      : '0.00'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Inserir Métricas</h1>
          {profile && (
            <span className={`bg-gradient-to-r ${profile.color} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
              @{profile.username}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Preencha os dados do período. Você encontra essas informações no Instagram Insights.
        </p>
      </div>

      {saved ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle className="w-14 h-14 text-emerald-500 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Dados salvos com sucesso!</p>
          <p className="text-sm text-gray-500 mt-1">Redirecionando para o dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Data de referência
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Escolha a data ou período que esses dados representam
            </p>
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
            <p className="text-sm font-semibold text-gray-700">Métricas do período</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.map(({ key, label, hint, color }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <p className="text-xs text-gray-400 mb-2">{hint}</p>
                  <input
                    type="number"
                    min={0}
                    value={form[key] as number}
                    onChange={(e) => handleChange(key, e.target.value)}
                    required
                    className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${color} transition`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Prévia calculada automaticamente</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Taxa de Engajamento</p>
                <p className="text-2xl font-bold text-indigo-600">{engagement}%</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  (curtidas + comentários + salvamentos) ÷ seguidores × 100
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Interações totais</p>
                <p className="text-xl font-bold text-gray-800">
                  {(form.likes + form.comments + form.saves).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
          >
            Salvar métricas
          </button>
        </form>
      )}
    </div>
  )
}
