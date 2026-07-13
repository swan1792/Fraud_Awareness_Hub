import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import jsQR from 'jsqr'
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  Hash,
  Clock,
  DollarSign,
  ShieldCheck,
  Loader2,
  QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Flexible transaction number extraction — tries many KPay/Myanmar patterns
function extractTxnNumber(text) {
  if (!text) return null
  // Remove extra whitespace and normalize
  const clean = text.replace(/\s+/g, ' ').trim()

  const patterns = [
    // KPay-style: 13-digit transaction numbers (timestamps)
    /\b(\d{13})\b/,
    // TXN-20260702-84721 style
    /TXN[-:\s]?\d{8}[-:\s]?\d{4,}/i,
    // "Transaction No: 123456" or "Ref: 123456"
    /(?:Transaction|Trans|Txn|Ref|Reference|ID|No|Number)[#:\s.-]*(\d{6,})/i,
    // Generic long numeric IDs (6+ digits)
    /\b(\d{6,15})\b/,
    // KPay/KBZ/Wave prefix + number
    /(?:KPay|KBZ|Wave)[#\s]*(\d{6,})/i,
  ]

  for (const p of patterns) {
    const match = clean.match(p)
    if (match) {
      // Return the captured group if available, otherwise full match
      const result = match[1] || match[0]
      console.log('[OCR] Extracted txn:', result, '| pattern:', p.source)
      return result
    }
  }
  return null
}

// Base64URL → standard Base64, then decode (robust polyfill, no atob)
function base64UrlDecode(str) {
  // Clean: remove whitespace, newlines
  let cleaned = str.replace(/[\s\r\n]/g, '')

  // Replace URL-safe chars with standard Base64 chars
  let base64 = cleaned.replace(/-/g, '+').replace(/_/g, '/')

  // Add padding if needed
  const pad = base64.length % 4
  if (pad === 2) base64 += '=='
  else if (pad === 3) base64 += '='
  else if (pad === 1) base64 += '==='

  // Decode using binary string approach (works everywhere, no atob needed)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < base64.length; i += 4) {
    const a = chars.indexOf(base64[i])
    const b = chars.indexOf(base64[i + 1])
    const c = base64[i + 2] === '=' ? 0 : chars.indexOf(base64[i + 2])
    const d = base64[i + 3] === '=' ? 0 : chars.indexOf(base64[i + 3])
    const triplet = (a << 18) | (b << 12) | (c << 6) | d
    result += String.fromCharCode((triplet >> 16) & 0xFF)
    if (base64[i + 2] !== '=') result += String.fromCharCode((triplet >> 8) & 0xFF)
    if (base64[i + 3] !== '=') result += String.fromCharCode(triplet & 0xFF)
  }
  return result
}

// Decode QR payload — returns { decoded, txnNumber, format }
function decodeQrPayload(raw) {
  if (!raw) return { decoded: null, txnNumber: null, format: 'none' }
  const s = raw.trim()
  console.log('[QR] Raw content length:', s.length, '| starts with:', s.substring(0, 60))

  // Strip known prefixes (KPay uses "KPRSC." before Base64URL data)
  const knownPrefixes = ['KPRSC.', 'KP:', 'KPAY:', 'KBZ:']
  let stripped = s
  let prefixFound = ''
  for (const prefix of knownPrefixes) {
    if (s.startsWith(prefix)) {
      stripped = s.substring(prefix.length)
      prefixFound = prefix
      console.log('[QR] Stripped prefix:', prefix, '→ base64url starts with:', stripped.substring(0, 40))
      break
    }
  }

  // Also try splitting on first dot (some formats: "prefix.encodedData")
  if (!prefixFound && s.includes('.')) {
    const dotIndex = s.indexOf('.')
    const beforeDot = s.substring(0, dotIndex)
    // If the part before dot looks like a prefix (not base64), strip it
    if (beforeDot.length <= 10 && !/^[A-Za-z0-9+/=]+$/.test(beforeDot)) {
      stripped = s.substring(dotIndex + 1)
      prefixFound = beforeDot + '.'
      console.log('[QR] Stripped dot prefix:', prefixFound, '→ base64url starts with:', stripped.substring(0, 40))
    }
  }

  // 1. Try JSON directly on stripped content
  try {
    const data = JSON.parse(stripped)
    console.log('[QR] Direct JSON parse succeeded:', data)
    const txn = findTxnInObject(data)
    if (txn) return { decoded: data, txnNumber: txn, format: 'JSON (direct)' }
    return { decoded: data, txnNumber: null, format: 'JSON (no txn field found)' }
  } catch {}

  // 2. Try Base64URL decode on stripped content
  try {
    console.log('[QR] Trying Base64URL decode on:', stripped.substring(0, 60), '...')
    const decoded = base64UrlDecode(stripped)
    console.log('[QR] Base64URL decoded length:', decoded.length, '| starts with:', decoded.substring(0, 40))

    // Try parsing as JSON — extract JSON portion if there's trailing garbage
    try {
      // First try direct parse
      const data = JSON.parse(decoded)
      console.log('[QR] Parsed JSON from Base64URL:', data)
      const txn = findTxnInObject(data)
      return { decoded: data, txnNumber: txn, format: (prefixFound ? prefixFound + ' → ' : '') + 'Base64URL → JSON' }
    } catch {
      // Try extracting JSON object from decoded text (may have trailing binary data)
      const jsonMatch = decoded.match(/\{[^}]*\}/)
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0])
          console.log('[QR] Extracted JSON from decoded:', data)
          const txn = findTxnInObject(data)
          return { decoded: data, txnNumber: txn, format: (prefixFound ? prefixFound + ' → ' : '') + 'Base64URL → JSON' }
        } catch {}
      }
      // Plain text after decode
      console.log('[QR] Base64URL decoded to text:', decoded)
      const txn = extractTxnNumber(decoded)
      return { decoded: decoded, txnNumber: txn, format: (prefixFound ? prefixFound + ' → ' : '') + 'Base64URL → text' }
    }
  } catch (e) {
    console.log('[QR] Base64URL decode failed:', e.message)
  }

  // 3. Try URL query params
  try {
    const url = new URL(s)
    const params = url.searchParams
    for (const key of ['txn', 'txnNo', 'transactionNo', 'id', 'ref', 'trx_id', 'transaction_id']) {
      if (params.get(key)) return { decoded: s, txnNumber: params.get(key), format: 'URL params' }
    }
  } catch {}

  // 4. Try standard Base64 decode
  try {
    const decoded = atob(stripped)
    console.log('[QR] Standard Base64 decoded:', decoded)
    try {
      const data = JSON.parse(decoded)
      const txn = findTxnInObject(data)
      return { decoded: data, txnNumber: txn, format: 'Base64 → JSON' }
    } catch {
      const txn = extractTxnNumber(decoded)
      return { decoded: decoded, txnNumber: txn, format: 'Base64 → text' }
    }
  } catch (e) {
    console.log('[QR] Standard Base64 decode failed:', e.message)
  }

  // 5. Raw string scan
  console.log('[QR] No decoding succeeded, using raw string')
  const txn = extractTxnNumber(s)
  return { decoded: null, txnNumber: txn, format: 'raw (not decoded)' }
}

// Search an object for transaction number fields
function findTxnInObject(obj) {
  if (!obj || typeof obj !== 'object') return null

  // Fields to EXCLUDE (not transaction IDs)
  const excludeKeys = ['v', 'exp', 'typ', 'version', 'type', 'expiry', 'expires']

  // Common transaction ID field names (KPay, KBZ, Wave, etc.)
  // Priority order: tid (KPay) first, then others
  const txnKeys = [
    'tid', // KPay transaction ID
    'txnNo', 'txn_no', 'txnId', 'txn_id',
    'transactionNo', 'transaction_no', 'transactionId', 'transaction_id',
    'transId', 'trans_id',
    'refNo', 'ref_no', 'refId', 'ref_id',
    'reference', 'referenceNo', 'reference_no',
    'id', 'orderId', 'order_id',
    'paymentId', 'payment_id',
    'receiptNo', 'receipt_no', 'receiptId',
    'slipNo', 'slip_no',
    'code', 'trackingNo', 'tracking_no',
  ]

  // Direct field lookup
  for (const key of txnKeys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      console.log('[QR] Found txn field:', key, '=', obj[key])
      return String(obj[key])
    }
  }

  // Scan all string values for patterns (skip excluded fields)
  for (const [key, val] of Object.entries(obj)) {
    if (excludeKeys.includes(key)) continue
    if (typeof val === 'string' && val.length >= 6) {
      const found = extractTxnNumber(val)
      if (found) {
        console.log('[QR] Found txn in field:', key, '=', found)
        return found
      }
    }
  }

  // Log all fields for debugging
  console.log('[QR] Object fields:', Object.keys(obj).join(', '))
  console.log('[QR] Object values:', JSON.stringify(obj).substring(0, 200))

  return null
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ])
}

// Preprocess image for better QR detection: grayscale + contrast boost
function preprocessForQR(sourceCanvas) {
  const w = sourceCanvas.width
  const h = sourceCanvas.height
  const ctx = sourceCanvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  // Convert to grayscale + boost contrast
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    // Increase contrast: push toward black or white
    const contrast = gray < 128 ? Math.max(0, gray - 40) : Math.min(255, gray + 40)
    d[i] = contrast
    d[i + 1] = contrast
    d[i + 2] = contrast
  }
  return imageData
}

async function scanQR(imageFile) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        console.log('[QR] Image size:', img.width, 'x', img.height)

        // Scale up small images, scale down large ones
        const maxDim = 1500
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        // Minimum size for QR detection
        if (w < 400) {
          const ratio = 400 / w
          w = 400
          h = Math.round(h * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)

        // Attempt 1: Original image
        let imageData = ctx.getImageData(0, 0, w, h)
        let code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' })
        if (code && code.data) {
          console.log('[QR] Found on original image')
          resolve({ success: true, data: code.data })
          return
        }

        // Attempt 2: Preprocessed (grayscale + contrast)
        console.log('[QR] Trying preprocessed image...')
        const preprocessed = preprocessForQR(canvas)
        code = jsQR(preprocessed.data, w, h, { inversionAttempts: 'attemptBoth' })
        if (code && code.data) {
          console.log('[QR] Found on preprocessed image')
          resolve({ success: true, data: code.data })
          return
        }

        // Attempt 3: Inverted colors
        console.log('[QR] Trying inverted image...')
        const inverted = ctx.getImageData(0, 0, w, h)
        for (let i = 0; i < inverted.data.length; i += 4) {
          inverted.data[i] = 255 - inverted.data[i]
          inverted.data[i + 1] = 255 - inverted.data[i + 1]
          inverted.data[i + 2] = 255 - inverted.data[i + 2]
        }
        code = jsQR(inverted.data, w, h, { inversionAttempts: 'attemptBoth' })
        if (code && code.data) {
          console.log('[QR] Found on inverted image')
          resolve({ success: true, data: code.data })
          return
        }

        console.log('[QR] No QR code found after all attempts')
        resolve({ success: false, error: 'No QR code found in image. Make sure the QR code is clearly visible and well-lit.' })
      }
      img.onerror = () => resolve({ success: false, error: 'Failed to load image' })
      img.src = reader.result
    }
    reader.onerror = () => resolve({ success: false, error: 'Failed to read file' })
    reader.readAsDataURL(imageFile)
  })
}

async function scanOCR(imageFile, onProgress) {
  const Tesseract = await import('tesseract.js')
  const { data } = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m) => {
      if (onProgress) onProgress(m)
    },
  })
  console.log('[OCR] Full OCR text:', data.text)
  return data.text
}

export function QrReceiptVerifier() {
  const { t } = useTranslation()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [qrResult, setQrResult] = useState(null)
  const [ocrResult, setOcrResult] = useState(null)
  const [qrStatus, setQrStatus] = useState('idle')
  const [ocrStatus, setOcrStatus] = useState('idle')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrPhase, setOcrPhase] = useState('')
  const [scanning, setScanning] = useState(false)
  const [extractedTxn, setExtractedTxn] = useState({ qr: null, ocr: null })
  const fileInputRef = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setQrResult(null)
    setOcrResult(null)
    setExtractedTxn({ qr: null, ocr: null, qrDecoded: null, qrFormat: null })
    setScanning(false)
    setQrStatus('idle')
    setOcrStatus('idle')
    setOcrProgress(0)
    setOcrPhase('')
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  const handleFileInput = useCallback((e) => {
    handleFile(e.target.files[0])
  }, [handleFile])

  const handleScan = useCallback(async () => {
    if (!imageFile) return
    setScanning(true)
    setQrResult(null)
    setOcrResult(null)
    setQrStatus('loading')
    setOcrStatus('loading')
    setOcrProgress(0)
    setOcrPhase('')

    const qrPromise = withTimeout(scanQR(imageFile), 15000, 'QR scan')
      .then((res) => { setQrStatus('done'); return res })
      .catch((err) => { setQrStatus('error'); return { success: false, error: err.message } })

    const ocrPromise = withTimeout(
      scanOCR(imageFile, (m) => {
        if (m.status === 'loading tesseract core') {
          setOcrPhase('Loading OCR engine...')
          setOcrProgress(0)
        } else if (m.status === 'initializing tesseract') {
          setOcrPhase('Initializing OCR...')
          setOcrProgress(5)
        } else if (m.status === 'loading language traineddata') {
          setOcrPhase('Downloading language data (first time may be slow)...')
          setOcrProgress(10)
        } else if (m.status === 'initializing api') {
          setOcrPhase('Preparing OCR...')
          setOcrProgress(20)
        } else if (m.status === 'recognizing text') {
          setOcrPhase('Reading text from receipt...')
          setOcrProgress(20 + Math.round(m.progress * 80))
        }
      }),
      60000,
      'OCR scan'
    )
      .then((text) => { setOcrStatus('done'); return text })
      .catch((err) => { setOcrStatus('error'); return '' })

    const [qr, ocrText] = await Promise.all([qrPromise, ocrPromise])

    setQrResult(qr)

    const qrDecoded = qr.success ? decodeQrPayload(qr.data) : { decoded: null, txnNumber: null, format: 'none' }
    const ocrExtracted = ocrText ? extractTxnNumber(ocrText) : null

    // Normalize both for comparison (trim, remove dashes/spaces)
    const normalizeTxn = (s) => s ? s.replace(/[\s\-]/g, '').trim() : null
    const qrTxn = normalizeTxn(qrDecoded.txnNumber)
    const ocrTxn = normalizeTxn(ocrExtracted)

    console.log('[Compare] QR txn:', qrTxn, '| OCR txn:', ocrTxn, '| Match:', qrTxn && ocrTxn && qrTxn === ocrTxn)

    setOcrResult({ text: ocrText, extractedTxn: ocrExtracted })
    setExtractedTxn({ qr: qrTxn, ocr: ocrTxn, qrDecoded: qrDecoded.decoded, qrFormat: qrDecoded.format })
    setScanning(false)
  }, [imageFile])

  const handleReset = useCallback(() => {
    setImageFile(null)
    setImagePreview(null)
    setQrResult(null)
    setOcrResult(null)
    setExtractedTxn({ qr: null, ocr: null, qrDecoded: null, qrFormat: null })
    setScanning(false)
    setQrStatus('idle')
    setOcrStatus('idle')
    setOcrProgress(0)
    setOcrPhase('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const txnMatch = extractedTxn.qr && extractedTxn.ocr && extractedTxn.qr === extractedTxn.ocr
  const txnMismatch = extractedTxn.qr && extractedTxn.ocr && extractedTxn.qr !== extractedTxn.ocr
  const hasResults = qrResult !== null || ocrResult !== null

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Awareness Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
          <ShieldCheck className="h-4 w-4" />
          {t('qrVerifier.awarenessTitle')}
        </div>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <DollarSign className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-900">{t('qrVerifier.checkAmount')}</p>
              <p className="text-xs text-amber-700">{t('qrVerifier.checkAmountDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-900">{t('qrVerifier.checkDateTime')}</p>
              <p className="text-xs text-amber-700">{t('qrVerifier.checkDateTimeDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Hash className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-900">{t('qrVerifier.checkTxnNo')}</p>
              <p className="text-xs text-amber-700">{t('qrVerifier.checkTxnNoDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-800">{t('qrVerifier.verifyInApp')}</p>
              <p className="text-xs text-red-600">{t('qrVerifier.verifyInAppDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {!imagePreview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">{t('qrVerifier.uploadTitle')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('qrVerifier.uploadHint')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Image Preview + Scan Button */}
      {imagePreview && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img
              src={imagePreview}
              alt="Receipt"
              className="w-full h-auto max-h-64 object-contain bg-gray-50"
            />
            {!scanning && (
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {!hasResults && !scanning && (
            <Button onClick={handleScan} className="w-full">
              <QrCode className="h-4 w-4 mr-2" />
              {t('qrVerifier.scanReceipt')}
            </Button>
          )}

          {scanning && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                {qrStatus === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                {qrStatus === 'done' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                {qrStatus === 'error' && <XCircle className="h-3 w-3 text-orange-500" />}
                <span className={qrStatus === 'loading' ? 'text-blue-700' : 'text-gray-500'}>
                  {qrStatus === 'loading' && 'Scanning QR code...'}
                  {qrStatus === 'done' && 'QR scan complete'}
                  {qrStatus === 'error' && 'QR scan finished (no code found)'}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  {ocrStatus === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  {ocrStatus === 'done' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  {ocrStatus === 'error' && <XCircle className="h-3 w-3 text-orange-500" />}
                  <span className={ocrStatus === 'loading' ? 'text-blue-700' : 'text-gray-500'}>
                    {ocrPhase || (ocrStatus === 'loading' && 'Starting OCR...')}
                    {ocrStatus === 'done' && 'OCR complete'}
                    {ocrStatus === 'error' && 'OCR finished'}
                  </span>
                </div>
                {ocrStatus === 'loading' && ocrProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {hasResults && !scanning && (
        <div className="space-y-4">
          {/* Verification Status */}
          {txnMatch && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 text-sm">{t('qrVerifier.matchTitle')}</p>
                <p className="text-xs text-green-700 mt-1">{t('qrVerifier.matchDesc')}</p>
              </div>
            </div>
          )}

          {txnMismatch && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">{t('qrVerifier.mismatchTitle')}</p>
                <p className="text-xs text-red-700 mt-1">{t('qrVerifier.mismatchDesc')}</p>
              </div>
            </div>
          )}

          {/* QR Data — ALWAYS show raw content */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <QrCode className="h-3.5 w-3.5" />
                {t('qrVerifier.qrData')}
              </div>
              {qrResult && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  qrResult.success ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                )}>
                  {qrResult.success ? 'Decoded' : 'Not found'}
                </span>
              )}
            </div>
            {qrResult?.success ? (
              <div className="space-y-2">
                {/* Format badge */}
                {extractedTxn.qrFormat && extractedTxn.qrFormat !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Format:</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {extractedTxn.qrFormat}
                    </span>
                  </div>
                )}

                {/* Transaction number */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{t('qrVerifier.txnFromQR')}:</span>
                  <span className={cn(
                    'text-sm font-mono font-bold',
                    extractedTxn.qr ? 'text-green-700' : 'text-gray-400'
                  )}>
                    {extractedTxn.qr || t('qrVerifier.notFound')}
                  </span>
                </div>

                {/* Decoded data */}
                {extractedTxn.qrDecoded ? (
                  <details className="text-xs text-gray-500" open>
                    <summary className="cursor-pointer hover:text-gray-700 font-medium">Decoded QR data</summary>
                    <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-x-auto break-all max-h-40">
                      {typeof extractedTxn.qrDecoded === 'object'
                        ? JSON.stringify(extractedTxn.qrDecoded, null, 2)
                        : String(extractedTxn.qrDecoded)}
                    </pre>
                  </details>
                ) : (
                  <p className="text-xs text-orange-600 italic">Could not decode QR content — showing raw string below</p>
                )}

                {/* Raw QR string */}
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700 font-medium">Raw QR string (encoded)</summary>
                  <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto break-all">
                    {qrResult.data}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-xs text-red-600">{qrResult?.error || t('qrVerifier.qrError')}</p>
            )}
          </div>

          {/* OCR Data — ALWAYS show full text */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5" />
                {t('qrVerifier.ocrData')}
              </div>
              {ocrResult && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  ocrResult.text ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                )}>
                  {ocrResult.text ? 'Text found' : 'No text'}
                </span>
              )}
            </div>
            {ocrResult?.text ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{t('qrVerifier.txnFromOCR')}:</span>
                  <span className={cn(
                    'text-sm font-mono font-bold',
                    extractedTxn.ocr ? 'text-green-700' : 'text-gray-400'
                  )}>
                    {extractedTxn.ocr || t('qrVerifier.notFound')}
                  </span>
                </div>
                <details className="text-xs text-gray-500" open>
                  <summary className="cursor-pointer hover:text-gray-700 font-medium">{t('qrVerifier.showFullText')}</summary>
                  <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                    {ocrResult.text}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-xs text-orange-600">{t('qrVerifier.ocrError')}</p>
            )}
          </div>

          {/* Final Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">{t('qrVerifier.finalWarning')}</p>
          </div>

          {/* Upload New */}
          <Button onClick={handleReset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('qrVerifier.uploadNew')}
          </Button>
        </div>
      )}
    </div>
  )
}
