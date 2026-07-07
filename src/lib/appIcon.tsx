export function AppIcon({ size }: { size: number }) {
  const fontSize = Math.round(size * 0.42)
  const borderRadius = Math.round(size * 0.2)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4F46E5, #0EA5E9)',
        borderRadius,
      }}
    >
      <div style={{ color: 'white', fontSize, fontWeight: 900 }}>D</div>
    </div>
  )
}
