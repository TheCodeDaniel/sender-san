import { useState } from 'react'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import Tag from '../../components/ui/Tag.jsx'

const SKILL_SUGGESTIONS = ['JavaScript', 'TypeScript', 'React', 'Flutter', 'Dart', 'Python', 'Node.js', 'Go', 'Rust', 'Swift', 'Kotlin', 'Java', 'C#', 'PostgreSQL', 'MongoDB', 'AWS', 'GCP', 'Docker', 'Kubernetes']

const WORK_TYPES = ['Remote', 'Hybrid', 'On-site']

export default function Step2Links({ onNext, onBack }) {
  const [form, setForm] = useState({
    name: '', location: '', github: '', linkedin: '', blog: '', devto: '',
    experience: '', skills: [], workTypes: [],
    extras: [],
  })
  const [skillInput, setSkillInput] = useState('')
  const [extraLabel, setExtraLabel] = useState('')
  const [extraUrl, setExtraUrl] = useState('')
  const [errors, setErrors] = useState({})

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const addSkill = (skill) => {
    const trimmed = skill.trim()
    if (trimmed && !form.skills.includes(trimmed)) {
      set('skills', [...form.skills, trimmed])
    }
    setSkillInput('')
  }

  const toggleWork = (type) => {
    set('workTypes', form.workTypes.includes(type)
      ? form.workTypes.filter(t => t !== type)
      : [...form.workTypes, type])
  }

  const addExtra = () => {
    if (extraLabel && extraUrl && form.extras.length < 3) {
      set('extras', [...form.extras, { label: extraLabel, url: extraUrl }])
      setExtraLabel('')
      setExtraUrl('')
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Required'
    if (!form.location) e.location = 'Required'
    if (!form.github) e.github = 'Required'
    if (!form.linkedin) e.linkedin = 'Required'
    if (!form.experience) e.experience = 'Required'
    if (!form.skills.length) e.skills = 'Add at least one skill'
    if (!form.workTypes.length) e.workTypes = 'Select at least one'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleNext = () => {
    if (validate()) onNext({ links: form })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-1">Your info &amp; links</h2>
        <p className="text-text-muted text-sm">These will be used to personalize your profile and outreach emails.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full name *" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} placeholder="Jane Smith" />
        <Input label="Location (city, country) *" value={form.location} onChange={e => set('location', e.target.value)} error={errors.location} placeholder="London, UK" />
        <Input label="GitHub URL *" value={form.github} onChange={e => set('github', e.target.value)} error={errors.github} placeholder="https://github.com/..." />
        <Input label="LinkedIn URL *" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} error={errors.linkedin} placeholder="https://linkedin.com/in/..." />
        <Input label="Years of experience *" type="number" min="0" max="50" value={form.experience} onChange={e => set('experience', e.target.value)} error={errors.experience} placeholder="5" />
        <Input label="Blog / Portfolio" value={form.blog} onChange={e => set('blog', e.target.value)} placeholder="https://..." />
        <Input label="Dev.to or Hashnode" value={form.devto} onChange={e => set('devto', e.target.value)} placeholder="https://dev.to/..." />
      </div>

      <div>
        <label className="block text-sm text-text-muted mb-2">Skills *</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.skills.map(s => (
            <Tag key={s} onRemove={() => set('skills', form.skills.filter(x => x !== s))}>{s}</Tag>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input-base flex-1"
            placeholder="Add skill…"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))}
            list="skill-suggestions"
          />
          <datalist id="skill-suggestions">
            {SKILL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
          </datalist>
          <Button variant="ghost" onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}>Add</Button>
        </div>
        {errors.skills && <p className="text-primary text-xs mt-1">{errors.skills}</p>}
      </div>

      <div>
        <label className="block text-sm text-text-muted mb-2">Work preference *</label>
        <div className="flex gap-2 flex-wrap">
          {WORK_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => toggleWork(type)}
              className={`px-3 py-1.5 rounded-card text-sm border transition-smooth ${form.workTypes.includes(type) ? 'bg-primary border-primary text-white' : 'border-border text-text-muted hover:border-text-muted'}`}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.workTypes && <p className="text-primary text-xs mt-1">{errors.workTypes}</p>}
      </div>

      {form.extras.length < 3 && (
        <div>
          <label className="block text-sm text-text-muted mb-2">Extra platform (optional, up to 3)</label>
          <div className="flex gap-2">
            <input className="input-base w-32" placeholder="Label" value={extraLabel} onChange={e => setExtraLabel(e.target.value)} />
            <input className="input-base flex-1" placeholder="URL" value={extraUrl} onChange={e => setExtraUrl(e.target.value)} />
            <Button variant="ghost" onClick={addExtra} disabled={!extraLabel || !extraUrl}>Add</Button>
          </div>
        </div>
      )}
      {form.extras.map((ex, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-text-muted">
          <span>{ex.label}:</span><span className="truncate">{ex.url}</span>
          <button onClick={() => set('extras', form.extras.filter((_, j) => j !== i))} className="text-primary text-xs ml-auto">Remove</button>
        </div>
      ))}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext}>Next →</Button>
      </div>
    </div>
  )
}
