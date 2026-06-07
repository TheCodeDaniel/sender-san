import { useState } from 'react'
import Tag from './ui/Tag.jsx'
import ContactRow from './ContactRow.jsx'
import EmailPreview from './EmailPreview.jsx'
import { updateCompany, updateContact, deleteCompany } from '../db/indexeddb.js'

const BATCH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function CompanyCard({ company, profile, mission, apiKey, onChange }) {
  const [expanded, setExpanded] = useState(false)
  const [previewContact, setPreviewContact] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const statusColor = { pending: 'default', sent: 'green', skipped: 'default' }
  const coverageCount = company.contacts?.filter(c => c.email)?.length ?? 0
  const verifiedCount = company.contacts?.filter(c => c.email_verified)?.length ?? 0
  const totalContacts = company.contacts?.length ?? 0

  const emailStatus = verifiedCount === totalContacts && totalContacts > 0
    ? { label: 'All Verified', color: 'green' }
    : verifiedCount > 0
    ? { label: 'Partial', color: 'gold' }
    : { label: 'No email', color: 'default' }

  const handleSkip = async () => {
    await updateCompany(company.id, { status: 'skipped' })
    onChange?.()
  }

  const handleRemove = async () => {
    await deleteCompany(company.id)
    onChange?.()
  }

  const handleBatchChange = async (e) => {
    await updateCompany(company.id, { batch_number: Number(e.target.value) })
    onChange?.()
  }

  const handleEmailSave = async (contact, contactIdx, emailData) => {
    await updateContact(company.id, contactIdx, emailData)
    onChange?.()
    setPreviewContact(null)
  }

  return (
    <div className={`card transition-smooth ${company.status === 'skipped' ? 'opacity-50' : ''}`}>
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer p-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-primary font-medium">{company.name}</span>
            <Tag>{company.industry}</Tag>
            {company.status !== 'pending' && (
              <Tag color={statusColor[company.status] ?? 'default'}>{company.status}</Tag>
            )}
          </div>
          {company.website && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{company.website}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
          <span>Contacts: {coverageCount}/{totalContacts}</span>
          <Tag color={emailStatus.color}>{emailStatus.label}</Tag>
          <span>Day {company.batch_number}</span>
          <span className="text-text-primary">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 pb-3">
          <div className="py-3">
            <p className="text-text-muted text-sm mb-1">{company.description}</p>
            {company.why_relevant && (
              <p className="text-xs text-secondary italic">{company.why_relevant}</p>
            )}
          </div>

          {(company.contacts ?? []).map((contact, i) => (
            <ContactRow
              key={i}
              contact={contact}
              companyId={company.id}
              onPreviewEmail={() => setPreviewContact(previewContact === i ? null : i)}
              previewOpen={previewContact === i}
            />
          ))}

          {previewContact !== null && (
            <div className="mt-3 card p-4 bg-background">
              <p className="text-text-muted text-xs mb-3 uppercase tracking-wide font-medium">
                Email preview — {company.contacts[previewContact]?.name}
              </p>
              <EmailPreview
                contact={company.contacts[previewContact]}
                company={company}
                profile={profile}
                mission={mission}
                apiKey={apiKey}
                onSave={(emailData) => handleEmailSave(company.contacts[previewContact], previewContact, emailData)}
              />
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            {company.status !== 'skipped' && (
              <button onClick={handleSkip} className="text-xs text-text-muted hover:text-text-primary transition-smooth">
                Skip
              </button>
            )}

            {confirmRemove ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Remove permanently?</span>
                <button
                  onClick={handleRemove}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-smooth"
                >
                  Yes, remove
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="text-xs text-text-muted hover:text-text-primary transition-smooth"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemove(true)}
                className="text-xs text-text-muted hover:text-red-500 transition-smooth"
              >
                Remove
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs text-text-muted">Move to batch</label>
              <select
                value={company.batch_number}
                onChange={handleBatchChange}
                onClick={e => e.stopPropagation()}
                className="input-base text-xs py-1 w-24"
              >
                {BATCH_OPTIONS.map(n => (
                  <option key={n} value={n}>Day {n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
