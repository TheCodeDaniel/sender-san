import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext.jsx'
import { getMission, getMeta, getCompanies } from '../db/indexeddb.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Tag from '../components/ui/Tag.jsx'
import CountdownTimer from '../components/ui/CountdownTimer.jsx'
import Spinner from '../components/ui/Spinner.jsx'

function NavBar() {
  const navigate = useNavigate()
  const links = [
    { label: 'Dashboard', path: '/' },
    { label: 'Queue', path: '/queue' },
    { label: 'Send', path: '/send' },
    { label: 'History', path: '/history' },
  ]
  const current = window.location.hash.replace('#', '') || '/'
  return (
    <nav className="border-b border-border bg-surface sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-jp text-text-muted text-sm">送信者</span>
          <span className="text-primary font-semibold">Sender-san</span>
        </div>
        <div className="flex items-center gap-6">
          {links.map(l => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className={`text-sm transition-smooth pb-0.5 ${current === l.path ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile, loadProfile } = useProfile()
  const [mission, setMission] = useState(null)
  const [companies, setCompanies] = useState([])
  const [meta, setMetaState] = useState({})
  const [loading, setLoading] = useState(true)
  const [profileExpanded, setProfileExpanded] = useState(false)

  useEffect(() => {
    Promise.all([
      loadProfile(),
      getMission().then(setMission),
      getMeta().then(setMetaState),
      getCompanies().then(setCompanies),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const sentToday = companies.flatMap(c => c.contacts ?? []).filter(ct => {
    if (!ct.sent_at) return false
    const d = new Date(ct.sent_at)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }).length

  const totalSent = companies.flatMap(c => c.contacts ?? []).filter(ct => ct.sent).length

  const nextSendTarget = meta.last_send_timestamp
    ? new Date(new Date(meta.last_send_timestamp).getTime() + 24 * 3_600_000).toISOString()
    : null

  const pendingCount = companies.filter(c => c.status === 'pending').length

  const missionTypeBadge = { job: 'Job Hunt', investor: 'Investor Pitch', services: 'Services' }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="relative mb-8">
          <div className="kanji-watermark" style={{ top: '-3rem', left: '-2rem' }}>送信</div>
          <h1 className="text-2xl font-semibold text-text-primary">
            こんにちは, <span className="text-primary">{profile?.name ?? 'Developer'}</span>.
          </h1>
          <p className="text-text-muted mt-1">{profile?.title ?? ''}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="relative overflow-hidden">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-text-primary font-medium">{profile?.name}</p>
                <p className="text-text-muted text-sm">{profile?.title}</p>
                <Tag color="gold" className="mt-1">{profile?.career_level}</Tag>
              </div>
              <button onClick={() => setProfileExpanded(e => !e)} className="text-xs text-text-muted hover:text-primary transition-smooth">
                {profileExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {(profile?.skills ?? []).slice(0, 5).map(s => <Tag key={s}>{s}</Tag>)}
            </div>

            {profileExpanded && (
              <div className="space-y-3 border-t border-border pt-3">
                <p className="text-text-muted text-sm">{profile?.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.skills ?? []).slice(5).map(s => <Tag key={s}>{s}</Tag>)}
                </div>
                <p className="text-xs text-text-muted">📍 {profile?.location}</p>
              </div>
            )}

            <button onClick={() => navigate('/setup')} className="mt-3 text-xs text-text-muted hover:text-primary transition-smooth">
              Edit profile
            </button>
          </Card>

          <Card goldTop={!!mission} className="relative overflow-hidden">
            {mission ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-text-muted uppercase tracking-widest font-medium">Mission Brief</span>
                  <Tag color="primary">{missionTypeBadge[mission.mission_type] ?? mission.mission_type}</Tag>
                </div>
                <p className="text-text-primary font-semibold text-lg mb-4">{mission.headline}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Companies queued</span>
                    <span className="text-text-primary">{pendingCount} pending</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Sent today</span>
                    <span className="text-text-primary">{sentToday}/30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Total sent</span>
                    <span className="text-text-primary">{totalSent}</span>
                  </div>
                  {nextSendTarget && (
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Next send window</span>
                      <CountdownTimer targetTimestamp={nextSendTarget} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-text-muted mb-4">No active mission yet.</p>
                <Button onClick={() => navigate('/mission/new')}>Start your first mission</Button>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/mission/new')} variant="ghost">New Mission</Button>
          <Button onClick={() => navigate('/queue')} variant="ghost">View Queue</Button>
          <Button onClick={() => navigate('/send')}>Send Today's Batch 送信</Button>
          <Button onClick={() => navigate('/history')} variant="ghost">History</Button>
        </div>
      </main>
    </div>
  )
}

export { NavBar }
