import Tag from './ui/Tag.jsx'
import ProgressBar from './ui/ProgressBar.jsx'

function maskEmail(email) {
  if (!email) return 'No email'
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local[0]}***@${domain}`
}

export default function ContactRow({ contact, companyId, onPreviewEmail }) {
  const scoreColor = contact.activity_score >= 8 ? 'green' : contact.activity_score >= 5 ? 'gold' : 'default'

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-text-primary text-sm font-medium">{contact.name}</span>
          <span className="text-text-muted text-xs">{contact.role}</span>
          {contact.sent && <Tag color="green">Sent</Tag>}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-text-muted text-xs font-mono">{maskEmail(contact.email)}</span>
          {contact.email && (
            <Tag color={contact.email_verified ? 'green' : 'default'}>
              {contact.email_verified ? '✓ Verified' : 'Unverified'}
            </Tag>
          )}
          {contact.email_source && contact.email_source !== 'unknown' && (
            <Tag>{contact.email_source}</Tag>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Activity</span>
            <Tag color={scoreColor}>{contact.activity_score}/10</Tag>
          </div>
          {contact.last_active_github && (
            <span className="text-xs text-text-muted">GitHub: {contact.last_active_github}</span>
          )}
          {contact.last_active_linkedin && (
            <span className="text-xs text-text-muted">LinkedIn: {contact.last_active_linkedin}</span>
          )}
          {contact.last_active_twitter && (
            <span className="text-xs text-text-muted">Twitter: {contact.last_active_twitter}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-secondary hover:underline"
            aria-label="LinkedIn profile"
          >
            LinkedIn
          </a>
        )}
        {!contact.sent && contact.email && (
          <button
            type="button"
            onClick={() => onPreviewEmail?.(contact)}
            className="text-xs text-text-muted hover:text-primary transition-smooth"
          >
            Preview email
          </button>
        )}
      </div>
    </div>
  )
}
