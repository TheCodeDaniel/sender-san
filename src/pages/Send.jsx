import { useState, useEffect, useRef } from 'react'
import { useProfile } from '../context/ProfileContext.jsx'
import { getCompanies, getMission, getMeta, setMeta, getKeys, setKeys as saveKeys, updateCompany, updateContact, addHistoryEntry } from '../db/indexeddb.js'
import EmailPreview from '../components/EmailPreview.jsx'
import Button from '../components/ui/Button.jsx'
import Tag from '../components/ui/Tag.jsx'
import CountdownTimer from '../components/ui/CountdownTimer.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { buildRFC2822, sendGmailMessage, getGmailProfile, refreshAccessToken, randomBetween, sleep } from '../api/gmail.js'
import { generateEmail } from '../api/llm.js'
import { useGoogleLogin } from '@react-oauth/google'
import { v4 as uuidv4 } from 'uuid'

const BATCH_SIZE = 10

export default function Send() {
  const { profile, loadProfile } = useProfile()
  const [companies, setCompanies] = useState([])
  const [mission, setMission] = useState(null)
  const [meta, setMetaState] = useState({})
  const [keys, setKeys] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendLog, setSendLog] = useState([])
  const [previewMap, setPreviewMap] = useState({})
  const [skipMap, setSkipMap] = useState({})
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [gmailEmail, setGmailEmail] = useState('')
  const stopRef = useRef(false)

  const load = async () => {
    const [c, m, mt, k] = await Promise.all([
      getCompanies(),
      getMission(),
      getMeta(),
      getKeys(),
    ])
    setCompanies(c)
    setMission(m)
    setMetaState(mt)
    setKeys(k)
  }

  useEffect(() => {
    Promise.all([loadProfile(), load()]).finally(() => setLoading(false))
  }, [])

  const pendingBatches = companies
    .filter(c => c.status === 'pending')
    .sort((a, b) => a.batch_number - b.batch_number)
    .slice(0, BATCH_SIZE)

  const nextSendTarget = meta.last_send_timestamp
    ? new Date(new Date(meta.last_send_timestamp).getTime() + 24 * 3_600_000).toISOString()
    : null

  const canSend = pendingBatches.length > 0 &&
    (!meta.last_send_timestamp || Date.now() >= new Date(nextSendTarget).getTime())

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.metadata',
    onSuccess: async (response) => {
      const expiry = new Date(Date.now() + (response.expires_in ?? 3600) * 1000).toISOString()
      const updated = { ...(keys ?? {}), gmail_token: { access_token: response.access_token, expiry } }
      setKeys(updated)
      await saveKeys(updated)
      // Profile fetch is best-effort — token is saved regardless
      try {
        const gProfile = await getGmailProfile(response.access_token)
        setGmailEmail(gProfile.emailAddress)
      } catch {
        // Gmail API not enabled or scope insufficient — sending still works
      }
    },
    onError: () => setError('Gmail login failed.'),
  })

  const getAccessToken = async () => {
    const token = keys?.gmail_token
    if (!token) return null
    if (new Date(token.expiry).getTime() > Date.now()) return token.access_token
    try {
      const fresh = await refreshAccessToken(token.refresh_token, keys.google_client_id)
      const updated = { ...keys, gmail_token: { ...token, access_token: fresh.access_token, expiry: new Date(Date.now() + fresh.expires_in * 1000).toISOString() } }
      setKeys(updated)
      await saveKeys(updated)
      return fresh.access_token
    } catch {
      return null
    }
  }

  const togglePreview = (companyId, contactIdx) => {
    const key = `${companyId}-${contactIdx}`
    setPreviewMap(m => ({ ...m, [key]: !m[key] }))
  }

  const toggleSkip = (companyId, contactIdx) => {
    const key = `${companyId}-${contactIdx}`
    setSkipMap(m => ({ ...m, [key]: !m[key] }))
  }

  const handleSend = async () => {
    const accessToken = await getAccessToken()
    if (!accessToken) { setError('Connect Gmail first.'); return }

    setSending(true)
    setError('')
    setDone(false)
    stopRef.current = false
    const log = []

    for (const company of pendingBatches) {
      if (stopRef.current) break
      const contacts = (company.contacts ?? []).filter(c => c.email && !c.sent)

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i]
        const skipKey = `${company.id}-${i}`
        if (skipMap[skipKey]) continue
        if (stopRef.current) break

        let subject = contact.email_subject
        let body = contact.email_body
        if (!subject || !body) {
          try {
            const gen = await generateEmail(keys.groq_key, profile, contact, company, mission)
            subject = gen.subject
            body = gen.body
            await updateContact(company.id, i, { email_subject: subject, email_body: body })
          } catch (e) {
            setSendLog(l => [...l, `⚠ Skipped ${contact.name} — email generation failed`])
            continue
          }
        }

        setSendLog(l => [...l, `Sending to ${company.name} — ${contact.name}…`])

        try {
          const raw = buildRFC2822(profile.name, gmailEmail || profile.email || '', contact.email, subject, body)
          await sendGmailMessage(accessToken, raw)
          await updateContact(company.id, i, { sent: true, sent_at: new Date().toISOString() })
          log.push({ company: company.name, contact: contact.name, email: contact.email, sentAt: new Date().toISOString() })
          setSendLog(l => {
            const n = [...l]
            n[n.length - 1] = `✓ Sent to ${company.name} — ${contact.name}`
            return n
          })
        } catch (e) {
          setSendLog(l => [...l, `✗ Failed: ${company.name} — ${contact.name}: ${e.message}`])
        }

        if (i < contacts.length - 1) {
          await sleep(randomBetween(8000, 12000))
        }
      }

      await updateCompany(company.id, { status: 'sent' })
    }

    const now = new Date().toISOString()
    await setMeta({ last_send_timestamp: now })
    await addHistoryEntry({
      id: uuidv4(),
      date: now,
      companies: pendingBatches.map(c => c.name),
      sent_count: log.length,
      replies: 0,
    })

    await load()
    setSending(false)
    setDone(true)
  }

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
          <div className="kanji-watermark" style={{ top: '-3rem', left: '-2rem' }}>送信</div>
          <h1 className="text-2xl font-semibold text-text-primary">Daily Send 送信</h1>
        </div>

        {pendingBatches.length === 0 && (
          <div className="card p-8 text-center text-text-muted mb-6">No batch ready. All companies have been sent or none discovered yet.</div>
        )}

        {!canSend && nextSendTarget && pendingBatches.length > 0 && (
          <div className="card p-4 mb-6 flex items-center gap-4">
            <span className="text-text-muted text-sm">Next send window opens in</span>
            <CountdownTimer targetTimestamp={nextSendTarget} />
          </div>
        )}

        {!keys?.gmail_token && (
          <div className="card p-4 mb-6 flex items-center gap-4">
            <span className="text-text-muted text-sm">Connect Gmail to send emails</span>
            <Button onClick={() => googleLogin()}>Connect Gmail</Button>
          </div>
        )}

        {gmailEmail && <p className="text-xs text-text-muted mb-4">Sending from: {gmailEmail}</p>}

        {pendingBatches.map(company => (
          <div key={company.id} className="card p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-text-primary font-medium">{company.name}</span>
              <Tag>{company.industry}</Tag>
            </div>

            {(company.contacts ?? []).filter(c => c.email && !c.sent).map((contact, i) => {
              const skipKey = `${company.id}-${i}`
              const previewKey = `${company.id}-${i}`
              return (
                <div key={i} className="border-t border-border py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="checkbox"
                      checked={!skipMap[skipKey]}
                      onChange={() => toggleSkip(company.id, i)}
                      className="w-4 h-4 accent-primary"
                      aria-label={`Include ${contact.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-text-primary text-sm font-medium">{contact.name}</span>
                      <span className="text-text-muted text-xs ml-2">{contact.role}</span>
                      <span className="text-text-muted text-xs ml-2 font-mono">{contact.email}</span>
                    </div>
                    <Tag color="gold">{contact.activity_score}/10</Tag>
                    <button
                      onClick={() => togglePreview(company.id, i)}
                      className="text-xs text-text-muted hover:text-primary transition-smooth"
                    >
                      {previewMap[previewKey] ? 'Hide email' : 'Preview email'}
                    </button>
                  </div>

                  {previewMap[previewKey] && (
                    <div className="mt-3 pl-7">
                      <EmailPreview
                        contact={contact}
                        company={company}
                        profile={profile}
                        mission={mission}
                        apiKey={keys?.groq_key}
                        onSave={async (data) => {
                          await updateContact(company.id, i, data)
                          await load()
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {sendLog.length > 0 && (
          <div className="card p-4 mb-6 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
            {sendLog.map((line, i) => (
              <p key={i} className={line.startsWith('✓') ? 'text-green-400' : line.startsWith('✗') ? 'text-primary' : 'text-text-muted'}>{line}</p>
            ))}
          </div>
        )}

        {error && <p className="text-primary text-sm mb-4">{error}</p>}

        {done && (
          <div className="card p-4 mb-6 text-center">
            <p className="text-green-400 font-semibold">Batch complete. {sendLog.filter(l => l.startsWith('✓')).length} emails sent to {pendingBatches.length} companies.</p>
          </div>
        )}

        <Button
          disabled={!canSend || sending || !keys?.gmail_token}
          onClick={handleSend}
          className="w-full sm:w-auto text-base py-3 px-8"
        >
          {sending ? <span className="flex items-center gap-2"><Spinner size="sm" /> Sending…</span> : 'Send Today\'s Batch 送信'}
        </Button>
    </main>
  )
}
