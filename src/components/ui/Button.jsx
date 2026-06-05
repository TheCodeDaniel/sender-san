export default function Button({ children, variant = 'primary', className = '', disabled, onClick, type = 'button', ...props }) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-ghost'
  return (
    <button
      type={type}
      className={`${base} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
