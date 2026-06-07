import { useState, useEffect } from 'react'
import { getHistory, updateHistoryEntry, exportBackup, importBackup } from '../db/indexeddb.js'
import Tag from '../components/ui/Tag.jsx'
import Spinner from '../components/ui/Spinner.jsx'

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [importError, setImportError] = useState('')

  const load = async () => {
    const h = await getHistory()
    setHistory(h)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const toggleExpand = (id) => {
    setExpanded(e => {
      const n = new Set(e)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const setReplies = async (id, replies) => {
    await updateHistoryEntry(id, { replies })
    await load()
  }

  const handleExport = async () => {
    const json = await exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sender-san-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      await importBackup(text)
      await load()
    } catch {
      setImportError('Import failed. Make sure the file is a valid Sender-san backup.')
    }
  }

  const totalSent = history.reduce((s, h) => s + (h.sent_count ?? 0), 0)
  const totalCompanies = history.reduce((s, h) => s + (h.companies?.length ?? 0), 0)
  const totalReplies = history.reduce((s, h) => s + (h.replies ?? 0), 0)
  const replyRate = totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : '0.0'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="relative mb-6">
        <div className="kanji-watermark" style={{ top: '-3rem', left: '-2rem' }}>履歴</div>
        <h1 className="text-2xl font-semibold text-text-primary">History 履歴</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Companies reached', value: totalCompanies },
          { label: 'Emails sent', value: totalSent },
          { label: 'Replies received', value: totalReplies },
          { label: 'Reply rate', value: `${replyRate}%` },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <button onClick={handleExport} className="btn-ghost text-sm">Export backup</button>
        <label className="btn-ghost text-sm cursor-pointer">
          Import backup
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
      {importError && <p className="text-red-500 text-xs mb-4">{importError}</p>}

      {history.length === 0 ? (
        <div className="card p-12 text-center text-text-muted">
          No send history yet. Send your first batch to see it here.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(entry => (
            <div key={entry.id} className="card">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => toggleExpand(entry.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-text-primary font-medium">
                      {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <Tag>{entry.sent_count} emails</Tag>
                    <Tag>{entry.companies?.length ?? 0} companies</Tag>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">Replies received:</span>
                    <select
                      value={entry.replies ?? 0}
                      onChange={e => { e.stopPropagation(); setReplies(entry.id, Number(e.target.value)) }}
                      onClick={e => e.stopPropagation()}
                      className="input-base text-xs py-0.5 w-20"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <span className="text-text-muted text-sm">{expanded.has(entry.id) ? '▲' : '▼'}</span>
              </div>

              {expanded.has(entry.id) && (
                <div className="border-t border-border px-4 pb-4">
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(entry.companies ?? []).map((name, i) => (
                      <Tag key={i}>{name}</Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
