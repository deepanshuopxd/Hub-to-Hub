const Loader = ({ fullScreen = false, size = 'md', label = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size]} border-2 border-brand-mid border-t-brand-amber rounded-full animate-spin`}
      />
      {label && (
        <span className="font-mono text-xs tracking-widest uppercase text-brand-muted">
          {label}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-brand-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <span className="font-display text-4xl text-brand-amber tracking-wider">
            HUB<span className="text-brand-cream">DRIVE</span>
          </span>
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

export default Loader