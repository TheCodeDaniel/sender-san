import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-card text-sm border transition-smooth ${selected ? 'bg-primary border-primary text-white' : 'border-border text-text-muted hover:border-text-muted'}`}
    >
      {label}
    </button>
  )
}

function JobParams({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  const toggleArr = (k, v) => {
    const arr = value[k] ?? []
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-xs text-text-muted block mb-2">Employment type</label>
        <div className="flex gap-2">
          {['Full-time', 'Contract', 'Both'].map(t => (
            <Chip key={t} label={t} selected={value.employment_type === t} onClick={() => set('employment_type', t)} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Target role</label>
        <input className="input-base" value={value.target_role ?? ''} onChange={e => set('target_role', e.target.value)} placeholder="e.g. Senior Flutter Engineer" />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-2">Company size</label>
        <div className="flex gap-2 flex-wrap">
          {['Startup', 'Mid-size', 'Enterprise', 'Any'].map(s => (
            <Chip key={s} label={s} selected={(value.company_size ?? []).includes(s)} onClick={() => toggleArr('company_size', s)} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-2">Remote preference</label>
        <div className="flex gap-2">
          {['Remote', 'Hybrid', 'On-site'].map(r => (
            <Chip key={r} label={r} selected={(value.remote_pref ?? []).includes(r)} onClick={() => toggleArr('remote_pref', r)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function InvestorParams({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-xs text-text-muted block mb-1">Project / product name</label>
        <input className="input-base" value={value.project_name ?? ''} onChange={e => set('project_name', e.target.value)} placeholder="MyStartup" />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">One-line pitch (120 chars)</label>
        <input className="input-base" maxLength={120} value={value.pitch ?? ''} onChange={e => set('pitch', e.target.value)} placeholder="We help X do Y so they can Z" />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-2">Stage</label>
        <div className="flex gap-2 flex-wrap">
          {['Idea', 'MVP', 'Early Revenue', 'Scaling'].map(s => (
            <Chip key={s} label={s} selected={value.stage === s} onClick={() => set('stage', s)} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Funding sought (optional)</label>
        <input className="input-base" value={value.funding_amount ?? ''} onChange={e => set('funding_amount', e.target.value)} placeholder="$500K" />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Industry / sector</label>
        <input className="input-base" value={value.industry ?? ''} onChange={e => set('industry', e.target.value)} placeholder="Fintech" />
      </div>
    </div>
  )
}

function ServicesParams({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-xs text-text-muted block mb-2">Service type</label>
        <div className="flex gap-2 flex-wrap">
          {['Freelance Contract', 'Consulting', 'Technical Partnership'].map(t => (
            <Chip key={t} label={t} selected={value.service_type === t} onClick={() => set('service_type', t)} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Service offering</label>
        <input className="input-base" value={value.service_offering ?? ''} onChange={e => set('service_offering', e.target.value)} placeholder="Flutter mobile development for fintech" />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Target company profile</label>
        <input className="input-base" value={value.target_company ?? ''} onChange={e => set('target_company', e.target.value)} placeholder="Fintech startups building mobile-first apps" />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Budget expectation (optional)</label>
        <input className="input-base" value={value.budget ?? ''} onChange={e => set('budget', e.target.value)} placeholder="£500/day or £10k project" />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-2">Availability</label>
        <div className="flex gap-2 flex-wrap">
          {['Immediately', 'Within 2 weeks', 'Within a month'].map(a => (
            <Chip key={a} label={a} selected={value.availability === a} onClick={() => set('availability', a)} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-2">Contract duration</label>
        <div className="flex gap-2">
          {['Short-term', 'Long-term', 'Either'].map(d => (
            <Chip key={d} label={d} selected={value.duration === d} onClick={() => set('duration', d)} />
          ))}
        </div>
      </div>
    </div>
  )
}

const GOAL_TYPES = [
  { id: 'job', label: 'Find a Job', jp: '仕事を探す', desc: 'Target companies hiring developers like you.' },
  { id: 'investor', label: 'Pitch to Investors', jp: '投資家へ', desc: 'Reach investors who fund projects in your space.' },
  { id: 'services', label: 'Offer Services', jp: 'サービスを提供する', desc: 'Find companies that need your freelance or consulting services.' },
]

export default function Step1Goal({ onNext, profile }) {
  const [goalType, setGoalType] = useState(null)
  const [params, setParams] = useState({})

  const handleNext = () => {
    if (!goalType) return
    onNext({ goalType, goalParams: params })
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-1">Mission goal</h2>
      <p className="text-text-muted text-sm mb-6">What are you trying to accomplish with this outreach campaign?</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {GOAL_TYPES.map(g => (
          <Card
            key={g.id}
            className={`cursor-pointer transition-smooth ${goalType === g.id ? 'border-primary' : 'hover:border-text-muted'}`}
            onClick={() => { setGoalType(g.id); setParams({}) }}
          >
            <p className="font-jp text-text-muted text-xs mb-1">{g.jp}</p>
            <p className="text-text-primary font-medium">{g.label}</p>
            <p className="text-text-muted text-xs mt-1">{g.desc}</p>
          </Card>
        ))}
      </div>

      {goalType === 'job' && (
        <JobParams value={params} onChange={setParams} />
      )}
      {goalType === 'investor' && (
        <InvestorParams value={params} onChange={setParams} />
      )}
      {goalType === 'services' && (
        <ServicesParams value={params} onChange={setParams} />
      )}

      <div className="flex justify-end mt-6">
        <Button disabled={!goalType} onClick={handleNext}>Next →</Button>
      </div>
    </div>
  )
}
