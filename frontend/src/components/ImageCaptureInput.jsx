import { useRef, useState } from 'react'

export default function ImageCaptureInput({ label = 'Photo', onChange, maxWidth = 800, quality = 0.8 }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const img = await loadImage(file)
      const { blob, dataUrl } = await toCompressedBlob(img, file.type || 'image/jpeg', maxWidth, quality)
      setPreview(dataUrl)
      onChange && onChange({ blob, fileName: file.name || 'photo.jpg', type: blob.type })
    } catch (e) {
      console.error('Image processing failed', e)
      onChange && onChange({ blob: file, fileName: file.name, type: file.type })
    } finally {
      setBusy(false)
    }
  }

  const onInput = (e) => handleFile(e.target.files?.[0])

  return (
    <div style={{ width: '100%' }}>
      {label && <label style={{ display:'block', marginBottom: 8, fontSize: '14px', fontWeight: '600', color: '#374151' }}>{label}</label>}
      <div style={{ 
        display:'flex', 
        flexDirection: 'column',
        alignItems:'center', 
        gap: 16,
        width: '100%'
      }}>
        <button 
          type="button" 
          onClick={() => inputRef.current?.click()} 
          disabled={busy}
          style={{
            background: busy ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '160px',
            justifyContent: 'center',
            boxShadow: busy ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!busy) {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 6px 12px -2px rgba(0, 0, 0, 0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (!busy) {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <span style={{ fontSize: '16px' }}>📷</span>
          {busy ? 'Processing...' : 'Capture / Upload'}
        </button>
        
        {preview && (
          <div style={{
            padding: '8px',
            background: 'white',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <img 
              src={preview} 
              alt="Student photo preview" 
              style={{ 
                height: 80, 
                width: 80, 
                objectFit: 'cover', 
                borderRadius: '8px',
                display: 'block'
              }} 
            />
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '11px',
              color: '#059669',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              ✓ Photo Ready
            </p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display:'none' }}
        onChange={onInput}
      />
    </div>
  )
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function toCompressedBlob(img, mime, maxWidth, quality) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, maxWidth / img.width)
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      const dataUrl = canvas.toDataURL(mime, quality)
      resolve({ blob, dataUrl })
    }, mime, quality)
  })
}
