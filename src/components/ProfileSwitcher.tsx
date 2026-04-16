'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Trash2, Check, X } from 'lucide-react'
import { Profile } from '@/types'
import {
  getProfiles,
  getActiveProfileId,
  setActiveProfile,
  addProfile,
  deleteProfile,
} from '@/lib/storage'

export function ProfileSwitcher() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  function refresh() {
    setProfiles(getProfiles())
    setActiveId(getActiveProfileId())
  }

  useEffect(() => {
    refresh()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setAdding(false)
        setConfirmDelete(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSwitch(id: string) {
    setActiveProfile(id)
    setActiveId(id)
    setOpen(false)
    router.refresh()
    // Force re-render on same page
    window.dispatchEvent(new Event('profile-changed'))
  }

  function handleAdd() {
    const clean = newUsername.replace('@', '').trim()
    if (!clean) return
    const profile = addProfile(clean)
    handleSwitch(profile.id)
    setAdding(false)
    setNewUsername('')
    refresh()
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      deleteProfile(id)
      refresh()
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
    }
  }

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0]
  if (!active) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); setAdding(false); setConfirmDelete(null) }}
        className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className={`w-7 h-7 bg-gradient-to-br ${active.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-xs font-bold uppercase">{active.username[0]}</span>
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-gray-900 leading-tight">@{active.username}</p>
          <p className="text-[10px] text-gray-400 leading-tight">{profiles.length} conta{profiles.length !== 1 ? 's' : ''}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
            Contas do Instagram
          </p>

          {profiles.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-2.5 group transition-colors ${
                p.id === activeId ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <button
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => handleSwitch(p.id)}
              >
                <div className={`w-8 h-8 bg-gradient-to-br ${p.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm font-bold uppercase">{p.username[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">@{p.username}</p>
                </div>
                {p.id === activeId && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </button>

              {profiles.length > 1 && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                    confirmDelete === p.id
                      ? 'bg-red-500 text-white'
                      : 'text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                  }`}
                  title={confirmDelete === p.id ? 'Clique para confirmar' : 'Remover conta'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          <div className="border-t border-gray-100 mt-1 pt-1">
            {adding ? (
              <div className="px-4 py-2.5 flex items-center gap-2">
                <span className="text-gray-400 text-sm">@</span>
                <input
                  autoFocus
                  type="text"
                  placeholder="nomedaconta"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd()
                    if (e.key === 'Escape') { setAdding(false); setNewUsername('') }
                  }}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button onClick={handleAdd} className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setAdding(false); setNewUsername('') }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar conta
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
