export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="thinking-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}
