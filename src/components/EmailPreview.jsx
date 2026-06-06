import { useState } from 'react'
import Button from './ui/Button.jsx'
import Spinner from './ui/Spinner.jsx'
import { generateEmail } from '../api/llm.js'

export default function EmailPreview({ contact, company, profile, mission, apiKey, onSave }) {
  const [subject, setSubject] = useState(contact.email_subject ?? '')
  const [body, setBody] = useState(contact.email_body ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await generateEmail(apiKey, profile, contact, company, mission)
      setSubject(result.subject)
      setBody(result.body)
    } catch (e) {
      setError('Failed to generate email. Check your Groq API key.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => onSave?.({ subject, body })

  return (
    <div className="space-y-3">
      {!subject && !body ? (
        <div className="text-center py-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="text-text-muted text-sm">Generating email…</p>
            </div>
          ) : (
            <Button onClick={generate}>Generate email</Button>
          )}
          {error && <p className="text-primary text-xs mt-2">{error}</p>}
        </div>
      ) : (
        <>
          <div>
            <label className="text-xs text-text-muted block mb-1">Subject</label>
            <input
              className="input-base text-sm"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Body</label>
            <textarea
              className="input-base text-sm min-h-[200px]"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={generate} disabled={loading}>
              {loading ? 'Regenerating…' : 'Regenerate'}
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </div>
        </>
      )}
    </div>
  )
}
