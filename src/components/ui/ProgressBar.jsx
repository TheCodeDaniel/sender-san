export default function ProgressBar({ value, max = 100, label, className = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
