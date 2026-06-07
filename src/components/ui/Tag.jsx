export default function Tag({ children, onRemove, color = 'default', className = '' }) {
  const colors = {
    default: 'bg-zinc-100 text-zinc-600',
    primary: 'bg-zinc-900 text-white',
    gold: 'bg-amber-100 text-amber-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[color] ?? colors.default} ${className}`}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-60 transition-smooth"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  )
}
