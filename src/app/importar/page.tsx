'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Save, ArrowRight } from 'lucide-react'
import { detectAndParse, mergeDetectedFiles, DetectedFile } from '@/lib/meta-import'
import { saveMetric, getActiveProfile, getMetrics } from '@/lib/storage'
import { useRouter } from 'next/navigation'

const FIELD_LABELS: { key: string; label: string; hint: string }[] = [
  { key: 'followers',       label: 'Seguidores (total atual)',    hint: 'Total de seguidores no final da semana' },
  { key: 'impressions',     label: 'Visualizações / Impressões',  hint: 'Soma da semana' },
  { key: 'reach',           label: 'Alcance',                     hint: 'Pessoas únicas alcançadas na semana' },
  { key: 'likes',           label: 'Curtidas',                    hint: 'Soma da semana' },
  { key: 'comments',        label: 'Comentários',                 hint: 'Soma da semana' },
  { key: 'saves',           label: 'Salvamentos',                 hint: 'Soma da semana' },
  { key: 'profile_visits',  label: 'Visitas ao Perfil',           hint: 'Soma da semana' },
  { key: 'posts_published', label: 'Posts Publicados',            hint: 'Quantos posts foram ao ar na semana' },
]

type FormValues = {
  date: string
  followers: number
  impressions: number
  reach: number
  likes: number
  comments: number
  saves: number
  profile_visits: number
  posts_published: number
}

const TYPE_COLORS: Record<string, string> = {
  impressions:    'bg-purple-100 text-purple-700',
  reach:          'bg-blue-100 text-blue-700',
  interactions:   'bg-rose-100 text-rose-700',
  followers:      'bg-indigo-100 text-indigo-700',
  profile_visits: 'bg-teal-100 text-teal-700',
  link_clicks:    'bg-amber-100 text-amber-700',
  demographics:   'bg-gray-100 text-gray-500',
  unknown:        'bg-red-100 text-red-500',
}

export default function ImportarPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [detected, setDetected] = useState<DetectedFile[]>([])
  const [form, setForm] = useState<FormValues>({
    date: new Date().toISOString().split('T')[0],
    followers: 0,
    impressions: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    saves: 0,
    profile_visits: 0,
    posts_published: 0,
  })
  const [saved, setSaved] = useState(false)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const readers: Promise<DetectedFile>[] = Array.from(files).map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const text = e.target?.result as string
            resolve(detectAndParse(text, file.name))
          }
          reader.readAsText(file, 'UTF-8')
        })
    )

    Promise.all(readers).then((results) => {
      const all = [...detected, ...results]
      setDetected(all)

      // Merge all detected values into form
      const merged = mergeDetectedFiles(all)
      const profile = getActiveProfile()
      const metrics = getMetrics(profile?.id)
      const lastFollowers = metrics[metrics.length - 1]?.followers ?? 0
      const growthFromCSV = merged.followers_growth ?? 0

      setForm((prev) => ({
        ...prev,
        impressions:    merged.impressions    ?? prev.impressions,
        reach:          merged.reach          ?? prev.reach,
        likes:          merged.likes          ?? prev.likes,
        comments:       merged.comments       ?? prev.comments,
        saves:          merged.saves          ?? prev.saves,
        profile_visits: merged.profile_visits ?? prev.profile_visits,
        // Pre-fill followers = last known + detected growth (user can edit)
        followers: prev.followers === 0 && (lastFollowers > 0 || growthFromCSV !== 0)
          ? lastFollowers + growthFromCSV
          : prev.followers,
      }))
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveMetric({
      date:             form.date,
      followers:        form.followers,
      reach:            form.reach,
      impressions:      form.impressions,
      likes:            form.likes,
      comments:         form.comments,
      saves:            form.saves,
      profile_visits:   form.profile_visits,
      posts_published:  form.posts_published,
    })
    setSaved(true)
    setTimeout(() => router.push('/'), 1500)
  }

  function clearFiles() {
    setDetected([])
    setForm({
      date: new Date().toISOString().split('T')[0],
      followers: 0, impressions: 0, reach: 0,
      likes: 0, comments: 0, saves: 0,
      profile_visits: 0, posts_published: 0,
    })
  }

  const useful = detected.filter((f) => f.type !== 'unknown' && f.type !== 'demographics')
  const skipped = detected.filter((f) => f.type === 'unknown' || f.type === 'demographics')

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle className="w-14 h-14 text-emerald-500 mb-4" />
        <p className="text-lg font-semibold text-gray-900">Dados importados com sucesso!</p>
        <p className="text-sm text-gray-500 mt-1">Redirecionando para o dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar do Meta Business</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecione os CSVs exportados dos últimos 7 dias. Pode enviar todos de uma vez.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {detected.length > 0 ? 'Adicionar mais arquivos' : 'Clique ou arraste os CSVs do Meta aqui'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Visualizações · Alcance · Interações · Seguidores · Visitas
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Detected files */}
      {detected.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Arquivos detectados</p>
            <button onClick={clearFiles} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Limpar tudo
            </button>
          </div>

          {useful.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[f.type]}`}>
                    {f.label}
                  </span>
                  <span className="text-xs text-gray-400 truncate">{f.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {f.rows} dias · {f.dateRange}
                </p>
                {Object.entries(f.values).length > 0 && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {Object.entries(f.values)
                      .map(([k, v]) => `${k}: ${v?.toLocaleString('pt-BR')}`)
                      .join(' · ')}
                  </p>
                )}
                {/* Debug info */}
                <details className="mt-1">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">diagnóstico</summary>
                  <div className="mt-1 text-xs text-gray-500 font-mono bg-white rounded p-2 space-y-0.5">
                    <p>título: &quot;{f._debug.title}&quot;</p>
                    <p>colunas: [{f._debug.headers.join(', ')}]</p>
                    <p>1ª linha: [{f._debug.firstRow.join(', ')}]</p>
                    <p>col.data: {f._debug.dateCol} · col.valor: {f._debug.primaryIdx}</p>
                  </div>
                </details>
              </div>
            </div>
          ))}

          {skipped.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-60">
              <XCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{f.name} — {f.label} (ignorado)</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {detected.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-700">
                Revise e complete os dados
              </p>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Os campos foram pré-preenchidos com a soma da semana. Corrija se necessário.
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de referência (fim da semana)
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELD_LABELS.map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <p className="text-xs text-gray-400 mb-1">{hint}</p>
                  <input
                    type="number"
                    min={0}
                    value={form[key as keyof FormValues] as number}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: Number(e.target.value) }))
                    }
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar semana no dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {detected.length === 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Como exportar do Meta Business Suite:</p>
          <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
            <li>Acesse business.facebook.com → Instagram → Insights</li>
            <li>Selecione o período: últimos 7 dias</li>
            <li>Clique em &quot;Exportar dados&quot; em cada métrica</li>
            <li>Exporte: Visualizações, Alcance, Interações, Visitas, Seguidores</li>
            <li>Traga todos os CSVs aqui de uma vez</li>
          </ol>
        </div>
      )}
    </div>
  )
}
