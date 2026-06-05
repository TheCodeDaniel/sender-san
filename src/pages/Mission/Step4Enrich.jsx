import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Button from '../../components/ui/Button.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { findContacts } from '../../api/gemini.js'
import { searchPerson, verifyEmail, getDomainFromWebsite } from '../../api/contactout.js'
import { setCompanies, getCachedContactOut, setCachedContactOut } from '../../db/indexeddb.js'

function calcActivityScore(contact) {
  const recency = [contact.last_active_github, contact.last_active_linkedin, contact.last_active_twitter]
    .filter(Boolean)
    .map(s => s.toLowerCase())

  for (const r of recency) {
    if (r.includes('hour') || r.includes('today') || r.includes('1 day') || r.includes('2 day') || r.includes('3 day') || r.includes('4 day') || r.includes('5 day') || r.includes('6 day') || r.includes('7 day')) return 9
    if (r.includes('week') || r.includes('2 week') || r.includes('3 week') || r.includes('4 week')) return 7
    if (r.includes('month') && !r.includes('2 month') && !r.includes('3 month')) return 6
    if (r.includes('2 month') || r.includes('3 month')) return 5
    if (r.includes('4 month') || r.includes('5 month') || r.includes('6 month')) return 3
  }
  return recency.length > 0 ? 2 : 1
}

export default function Step4Enrich({ companies: rawCompanies, brief, apiKey, contactoutKey, onDone }) {
  const [progress, setProgress] = useState(0)
  const [currentCompany, setCurrentCompany] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    enrich()
  }, [])

  const enrich = async () => {
    const enriched = []

    for (let i = 0; i < rawCompanies.length; i++) {
      const company = rawCompanies[i]
      setCurrentCompany(company.name)
      setProgress(i)

      let contacts = []
      try {
        const raw = await findContacts(apiKey, company, brief.ideal_contact_roles ?? [])
        contacts = Array.isArray(raw) ? raw : []
      } catch {
        contacts = []
      }

      // ContactOut fallback + email verification
      for (const contact of contacts) {
        const domain = getDomainFromWebsite(company.website)
        const cacheKey = `${contact.name}|${domain}`
        let coResult = await getCachedContactOut(cacheKey)

        if (!coResult && (!contact.email || contact.email_confidence !== 'high')) {
          try {
            coResult = await searchPerson(contactoutKey, contact.name, domain)
            await setCachedContactOut(cacheKey, coResult ?? {})
          } catch {
            coResult = null
          }
          if (coResult?.email && !contact.email) {
            contact.email = coResult.email
            contact.email_source = 'contactout'
          }
        }

        if (contact.email) {
          try {
            contact.email_verified = await verifyEmail(contactoutKey, contact.email)
          } catch {
            contact.email_verified = false
          }
        } else {
          contact.email_verified = false
        }

        contact.email_source = contact.email_source ?? (contact.email ? 'gemini' : 'unknown')
        contact.activity_score = calcActivityScore(contact)
        contact.sent = false
        contact.sent_at = null
        contact.email_subject = null
        contact.email_body = null
      }

      // Sort by activity score, keep top 3
      contacts.sort((a, b) => b.activity_score - a.activity_score)
      contacts = contacts.slice(0, 3)

      enriched.push({
        id: uuidv4(),
        name: company.name,
        website: company.website,
        description: company.description,
        why_relevant: company.why_relevant,
        industry: company.industry,
        size_estimate: company.size_estimate ?? 'unknown',
        batch_number: Math.floor(i / 10) + 1,
        status: 'pending',
        contacts,
      })
    }

    try {
      await setCompanies(enriched)
      setProgress(rawCompanies.length)
      setDone(true)
    } catch (e) {
      setError('Failed to save enriched companies.')
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✓</div>
        <p className="text-text-primary font-semibold text-lg mb-2">Mission ready!</p>
        <p className="text-text-muted text-sm mb-6">Companies and contacts have been enriched and saved to your vault.</p>
        <Button onClick={onDone}>Go to Queue →</Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-1">Enriching contacts</h2>
      <p className="text-text-muted text-sm mb-6">Finding decision-makers at each company. This may take a few minutes.</p>

      <ProgressBar value={progress} max={rawCompanies.length} label={currentCompany ? `Processing ${currentCompany}...` : 'Starting...'} className="mb-6" />

      {error && <p className="text-primary text-sm mb-4">{error}</p>}

      <div className="flex justify-center">
        <div className="flex items-center gap-3 text-text-muted text-sm">
          <Spinner size="sm" />
          <span>{progress}/{rawCompanies.length} companies processed</span>
        </div>
      </div>
    </div>
  )
}
