export default function Tag({ children, onRemove, color = 'default', className = '' }) {
  const colors = {
    default: 'bg-border text-text-muted',
    primary: 'bg-primary/20 text-primary',
    gold: 'bg-secondary/20 text-secondary',
    green: 'bg-green-900/40 text-green-400',
    red: 'bg-red-900/40 text-primary',
    blue: 'bg-blue-900/40 text-blue-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[color] ?? colors.default} ${className}`}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:text-white transition-smooth"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  )
}
