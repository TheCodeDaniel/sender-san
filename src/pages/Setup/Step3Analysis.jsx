import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Button from '../../components/ui/Button.jsx'
import Tag from '../../components/ui/Tag.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

const LOADING_MESSAGES = [
  'Parsing your career history...',
  'Identifying your strengths...',
  'Building your profile...',
]

export default function Step3Analysis({ data, onNext, onBack }) {
  const [geminiKey, setGeminiKey] = useState(data.tempGeminiKey ?? '')
  const [keySubmitted, setKeySubmitted] = useState(!!data.profile)
  const [profile, setProfile] = useState(data.profile ?? null)
  const [loading, setLoading] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState({})

  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (keySubmitted && geminiKey && !profile) analyseCV()
  }, [keySubmitted])

  const analyseCV = async () => {
    setLoading(true)
    setError('')
    try {
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

      const { cvText, links } = data
      const prompt = `You are a professional career analyst. Analyse the provided CV text and platform links. Return ONLY a valid JSON object matching the schema below. No markdown, no explanation, no preamble — raw JSON only.

Schema:
{
  "name": "string",
  "title": "string",
  "summary": "string",
  "skills": ["string"],
  "experience_years": number,
  "notable_projects": [{"name": "string", "description": "string"}],
  "industries_worked_in": ["string"],
  "career_level": "junior | mid | senior | lead | principal",
  "strengths": ["string"],
  "github_url": "string",
  "linkedin_url": "string",
  "other_links": ["string"],
  "location": "string",
  "work_preference": ["string"]
}

CV Text:
${cvText}

Personal info:
Name: ${links.name}
Location: ${links.location}
GitHub: ${links.github}
LinkedIn: ${links.linkedin}
Skills: ${links.skills.join(', ')}
Years of experience: ${links.experience}
Work preference: ${links.workTypes.join(', ')}
Blog/Portfolio: ${links.blog || 'N/A'}
Dev.to: ${links.devto || 'N/A'}
${links.extras.map(e => `${e.label}: ${e.url}`).join('\n')}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
      setProfile(JSON.parse(text))
    } catch (e) {
      setError('AI analysis failed. Check your Gemini API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const setField = (key, val) => setProfile(p => ({ ...p, [key]: val }))

  const EditableField = ({ label, field, multiline }) => {
    const isEditing = editing[field]
    return (
      <div className="mb-4">
        <label className="block text-xs text-text-muted mb-1">{label}</label>
        {isEditing ? (
          multiline ? (
            <textarea
              className="input-base text-sm min-h-[80px]"
              value={profile[field] ?? ''}
              onChange={e => setField(field, e.target.value)}
              onBlur={() => setEditing(e => ({ ...e, [field]: false }))}
              autoFocus
            />
          ) : (
            <input
              className="input-base text-sm"
              value={profile[field] ?? ''}
              onChange={e => setField(field, e.target.value)}
              onBlur={() => setEditing(e => ({ ...e, [field]: false }))}
              autoFocus
            />
          )
        ) : (
          <p
            className="text-text-primary text-sm cursor-pointer hover:text-primary transition-smooth border-b border-transparent hover:border-border pb-0.5"
            onClick={() => setEditing(e => ({ ...e, [field]: true }))}
          >
            {profile[field] || <span className="text-text-muted italic">Click to edit</span>}
          </p>
        )}
      </div>
    )
  }

  if (!keySubmitted) {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-semibold text-text-primary mb-1">AI Career Analysis</h2>
        <p className="text-text-muted text-sm">Enter your Gemini API key to analyse your CV. You'll save all keys permanently in the next step.</p>
        <div>
          <label className="block text-sm text-text-muted mb-1">Google AI Studio Key (Gemini)</label>
          <input
            type="password"
            className="input-base"
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            placeholder="AIza..."
          />
          <p className="text-xs text-text-muted mt-1">
            Get yours at <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">aistudio.google.com</a>
          </p>
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <Button disabled={!geminiKey.trim()} onClick={() => { setLoading(true); setKeySubmitted(true) }}>Analyse my CV →</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative min-h-[400px] flex flex-col items-center justify-center">
        <div className="kanji-watermark" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>分析</div>
        <Spinner size="lg" className="mb-6" />
        <p className="text-text-primary font-medium">{LOADING_MESSAGES[msgIdx]}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-primary mb-4">{error}</p>
        <Button onClick={analyseCV}>Retry</Button>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-1">Your profile</h2>
      <p className="text-text-muted text-sm mb-6">Click any field to edit.</p>

      <div className="card p-5 mb-6 space-y-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <EditableField label="Name" field="name" />
          <EditableField label="Title" field="title" />
          <EditableField label="Location" field="location" />
          <EditableField label="Career level" field="career_level" />
          <EditableField label="Years of experience" field="experience_years" />
        </div>

        <EditableField label="Professional summary" field="summary" multiline />

        <div>
          <label className="block text-xs text-text-muted mb-2">Skills</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(profile.skills ?? []).map((s, i) => (
              <Tag key={i} onRemove={() => setField('skills', profile.skills.filter((_, j) => j !== i))}>{s}</Tag>
            ))}
          </div>
          <input
            className="input-base text-sm"
            placeholder="Add a skill and press Enter"
            onKeyDown={e => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                setField('skills', [...(profile.skills ?? []), e.target.value.trim()])
                e.target.value = ''
              }
            }}
          />
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-2">Strengths</label>
          <div className="flex flex-wrap gap-2">
            {(profile.strengths ?? []).map((s, i) => (
              <Tag key={i} color="gold">{s}</Tag>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-2">Notable projects</label>
          <div className="space-y-2">
            {(profile.notable_projects ?? []).map((p, i) => (
              <div key={i} className="text-sm">
                <span className="text-text-primary font-medium">{p.name}</span>
                <span className="text-text-muted"> — {p.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={() => onNext({ profile, tempGeminiKey: geminiKey })}>Looks good →</Button>
      </div>
    </div>
  )
}
