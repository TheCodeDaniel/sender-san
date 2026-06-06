import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '../context/ProfileContext.jsx'
import { getCompanies, getMission, getKeys } from '../db/indexeddb.js'
import { NavBar } from './Dashboard.jsx'
import Tag from '../components/ui/Tag.jsx'
import CompanyCard from '../components/CompanyCard.jsx'
import Spinner from '../components/ui/Spinner.jsx'

export default function Queue() {
  const { profile, loadProfile } = useProfile()
  const [companies, setCompanies] = useState([])
  const [mission, setMission] = useState(null)
  const [keys, setKeys] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: 'all', batch: 'all', email: 'all' })
  const [sort, setSort] = useState('batch')

  const load = useCallback(async () => {
    const [c, m, k] = await Promise.all([
      getCompanies(),
      getMission(),
      getKeys(),
    ])
    setCompanies(c)
    setMission(m)
    setKeys(k)
  }, [])

  useEffect(() => {
    Promise.all([loadProfile(), load()]).finally(() => setLoading(false))
  }, [])

  const filtered = companies.filter(c => {
    if (filter.status !== 'all' && c.status !== filter.status) return false
    if (filter.batch !== 'all' && c.batch_number !== Number(filter.batch)) return false
    if (filter.email === 'verified' && !c.contacts?.every(ct => ct.email_verified)) return false
    if (filter.email === 'none' && c.contacts?.some(ct => ct.email)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'batch') return a.batch_number - b.batch_number
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'activity') {
      const scoreA = (a.contacts ?? []).reduce((s, c) => s + (c.activity_score ?? 0), 0) / (a.contacts?.length || 1)
      const scoreB = (b.contacts ?? []).reduce((s, c) => s + (c.activity_score ?? 0), 0) / (b.contacts?.length || 1)
      return scoreB - scoreA
    }
    return 0
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const batchNumbers = [...new Set(companies.map(c => c.batch_number))].sort()

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="relative mb-6">
          <div className="kanji-watermark" style={{ top: '-3rem', left: '-2rem' }}>仕事</div>
          <h1 className="text-2xl font-semibold text-text-primary">Outreach Queue</h1>
          <p className="text-text-muted text-sm mt-1">{companies.length} companies · {companies.filter(c => c.status === 'pending').length} pending</p>
        </div>

        {batchNumbers.map(bn => {
          const batch = companies.filter(c => c.batch_number === bn)
          const verified = batch.flatMap(c => c.contacts ?? []).filter(ct => ct.email_verified).length
          return (
            <div key={bn} className="card p-3 mb-3 text-sm flex items-center gap-4">
              <span className="text-text-primary font-medium">Batch {bn}</span>
              <span className="text-text-muted">{batch.length} companies</span>
              <span className="text-text-muted">{verified} verified contacts</span>
              <Tag className="ml-auto" color={batch.every(c => c.status === 'sent') ? 'green' : 'default'}>
                {batch.every(c => c.status === 'sent') ? 'Sent' : batch.some(c => c.status === 'sent') ? 'Partial' : 'Pending'}
              </Tag>
            </div>
          )
        })}

        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <select className="input-base py-1.5 w-auto text-sm" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="skipped">Skipped</option>
          </select>
          <select className="input-base py-1.5 w-auto text-sm" value={filter.batch} onChange={e => setFilter(f => ({ ...f, batch: e.target.value }))}>
            <option value="all">All batches</option>
            {batchNumbers.map(n => <option key={n} value={n}>Day {n}</option>)}
          </select>
          <select className="input-base py-1.5 w-auto text-sm" value={filter.email} onChange={e => setFilter(f => ({ ...f, email: e.target.value }))}>
            <option value="all">All email coverage</option>
            <option value="verified">Verified only</option>
            <option value="none">No email</option>
          </select>
          <select className="input-base py-1.5 w-auto text-sm ml-auto" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="batch">Sort: Batch</option>
            <option value="name">Sort: Name</option>
            <option value="activity">Sort: Activity</option>
          </select>
        </div>

        {sorted.length === 0 ? (
          <div className="card p-12 text-center text-text-muted">
            {companies.length === 0 ? 'No companies yet. Start a mission first.' : 'No companies match the current filters.'}
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(company => (
              <CompanyCard
                key={company.id}
                company={company}
                profile={profile}
                mission={mission}
                apiKey={keys?.groq_key}
                onChange={load}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
