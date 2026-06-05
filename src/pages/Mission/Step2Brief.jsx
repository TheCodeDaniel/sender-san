import { useState, useEffect } from 'react'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Tag from '../../components/ui/Tag.jsx'
import { generateMissionBrief } from '../../api/gemini.js'

export default function Step2Brief({ data, apiKey, profile, onNext, onBack }) {
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    generate()
  }, [])

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await generateMissionBrief(apiKey, profile, data.goalType, data.goalParams)
      setBrief(result)
    } catch (e) {
      setError('Failed to generate mission brief. Check your Gemini API key.')
    } finally {
      setLoading(false)
    }
  }

  const setField = (field, val) => setBrief(b => ({ ...b, [field]: val }))

  const EditRow = ({ label, field, multiline }) => {
    const [editing, setEditing] = useState(false)
    return (
      <div className="flex gap-3 py-2 border-b border-border last:border-0">
        <span className="text-text-muted text-xs w-36 shrink-0 pt-0.5 uppercase tracking-wide">{label}</span>
        {editing ? (
          multiline ? (
            <textarea
              className="input-base text-sm flex-1 min-h-[60px]"
              value={brief[field] ?? ''}
              onChange={e => setField(field, e.target.value)}
              onBlur={() => setEditing(false)}
              autoFocus
            />
          ) : (
            <input
              className="input-base text-sm flex-1"
              value={brief[field] ?? ''}
              onChange={e => setField(field, e.target.value)}
              onBlur={() => setEditing(false)}
              autoFocus
            />
          )
        ) : (
          <span
            className="text-text-primary text-sm flex-1 cursor-pointer hover:text-primary transition-smooth"
            onClick={() => setEditing(true)}
          >
            {Array.isArray(brief[field]) ? brief[field].join(', ') : (brief[field] || <span className="text-text-muted italic">Click to edit</span>)}
          </span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <Spinner size="lg" />
        <p className="text-text-muted">Generating your mission brief…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-primary mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <Button onClick={generate}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card p-6 border-t-2 border-t-secondary mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-text-muted uppercase tracking-widest font-medium">Mission Brief</span>
          <Tag color="gold">{brief?.email_tone}</Tag>
        </div>
        <p className="text-text-primary text-xl font-bold mb-6">{brief?.headline}</p>

        <div className="space-y-0">
          <EditRow label="Target profile" field="target_profile" multiline />
          <EditRow label="Value proposition" field="value_proposition" multiline />
          <EditRow label="Search keywords" field="search_keywords" />
          <EditRow label="Ideal contacts" field="ideal_contact_roles" />
          <EditRow label="Email tone" field="email_tone" />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={() => onNext({ brief })}>Confirm Mission →</Button>
      </div>
    </div>
  )
}
