import { useState, useEffect, useRef } from 'react'
import Button from '../../components/ui/Button.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Tag from '../../components/ui/Tag.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { discoverCompanies } from '../../api/llm.js'

export default function Step3Discover({ brief, apiKey, profile, onNext, onBack }) {
  const [companies, setCompanies] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [skipped, setSkipped] = useState(new Set())
  const stopRef = useRef(false)

  useEffect(() => {
    startDiscovery()
    return () => { stopRef.current = true }
  }, [])

  const startDiscovery = async () => {
    setStatus('running')
    setCompanies([])
    setError('')
    stopRef.current = false

    try {
      await discoverCompanies(apiKey, brief, profile, (company, count) => {
        if (stopRef.current) return
        setCompanies(prev => [...prev, { ...company, _idx: count - 1 }])
      })
      setStatus('done')
    } catch (e) {
      setError('Discovery failed. You can retry or continue with companies found so far.')
      setStatus('error')
    }
  }

  const toggleSkip = (idx) => {
    setSkipped(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const handleNext = () => {
    const active = companies.filter((_, i) => !skipped.has(i))
    onNext({ discoveredCompanies: active })
  }

  const sizeColors = { startup: 'blue', 'mid-size': 'gold', enterprise: 'green', unknown: 'default' }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-text-primary">Discovering companies</h2>
        {status === 'running' && <Spinner size="sm" />}
      </div>

      <ProgressBar value={companies.length} max={100} label={status === 'done' ? `Found ${companies.length} companies` : `Discovering companies...`} className="mb-4" />

      {error && (
        <div className="card p-3 border-primary mb-4">
          <p className="text-primary text-sm mb-2">{error}</p>
          <Button onClick={startDiscovery} variant="ghost">Retry discovery</Button>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {companies.map((c, i) => (
          <div
            key={i}
            className={`card p-3 flex items-start gap-3 transition-smooth ${skipped.has(i) ? 'opacity-40' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-text-primary font-medium text-sm">{c.name}</span>
                <Tag color={sizeColors[c.size_estimate] ?? 'default'}>{c.size_estimate ?? 'unknown'}</Tag>
                <Tag>{c.industry}</Tag>
              </div>
              <p className="text-text-muted text-xs">{c.why_relevant}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleSkip(i)}
              className={`text-xs shrink-0 transition-smooth ${skipped.has(i) ? 'text-secondary hover:text-text-muted' : 'text-text-muted hover:text-primary'}`}
            >
              {skipped.has(i) ? 'Unskip' : 'Skip'}
            </button>
          </div>
        ))}
      </div>

      {skipped.size > 0 && (
        <p className="text-text-muted text-xs mt-2">{skipped.size} companies skipped</p>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button
          disabled={companies.length === 0 || status === 'running'}
          onClick={handleNext}
        >
          Enrich contacts ({companies.length - skipped.size} companies) →
        </Button>
      </div>
    </div>
  )
}
