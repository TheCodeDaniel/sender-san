export default function Card({ children, className = '', goldTop = false, ...rest }) {
  return (
    <div className={`card p-4 ${goldTop ? 'border-t-2 border-t-zinc-400' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}
