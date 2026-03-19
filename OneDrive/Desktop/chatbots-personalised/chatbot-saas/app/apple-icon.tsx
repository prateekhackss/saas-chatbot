import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Dynamic icon generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A', // Brand black
          color: '#FFFFFF', // White N
          fontSize: 90,
          fontWeight: 900,
          fontFamily: 'sans-serif', // Archivo system fallback
          letterSpacing: '-0.05em',
        }}
      >
        N<span style={{ color: '#EF4444' }}>X</span>
      </div>
    ),
    {
      ...size,
    }
  )
}
