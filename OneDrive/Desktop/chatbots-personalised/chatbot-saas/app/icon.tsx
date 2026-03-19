import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
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
          borderRadius: '24%', // Squircle shape
          color: '#EF4444', // Brand crimson
          fontSize: 22,
          fontWeight: 900,
          fontFamily: 'sans-serif', // Archivo system fallback
        }}
      >
        X
      </div>
    ),
    {
      ...size,
    }
  )
}
