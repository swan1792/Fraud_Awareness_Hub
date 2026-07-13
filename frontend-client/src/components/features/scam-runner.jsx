import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdventureScenariosQuery } from '@/lib/api'

const CW = 480, CH = 720, LANES = 3, LW = 100
const LC = [CW / 2 - LW, CW / 2, CW / 2 + LW]
const HY = 100, PY = CH - 150, PW = 46, PH = 64
const SPD0 = 0.9, SPDMAX = 3, SPDINC = 0.0004
const SPAWN_INT = 70, COLLECT_INT = 45, INV_FRAMES = 80
const SHAKE_DECAY = 0.88

const SCAM_TYPES = [
  { id: 'fake-apk', label: 'Fake APK', color: '#ef4444', icon: '⚠️', title: 'Fake APK Download', desc: 'Scammers send links to download fake versions of popular apps like KPay, KBZPay, or Wave Money. These APKs steal your login credentials and OTP codes.', flags: ['Download link from unknown Viber/Telegram group', 'App asks for excessive permissions', 'App name is slightly misspelled (e.g. "KPayy")'], avoid: 'Only download apps from official Google Play Store or App Store. Never install APK files from chat links.' },
  { id: 'phishing-link', label: 'Phishing Link', color: '#f97316', icon: '🎣', title: 'Phishing Link', desc: 'Fake websites that look like real banking or payment sites. They trick you into entering your username, password, and OTP code.', flags: ['URL does not match the official domain', 'Urgent message asking you to "verify" or "confirm"', 'Asks for password or OTP input'], avoid: 'Always check the URL carefully. Official sites use .com.mm or verified domains. Never enter credentials from a link in a message.' },
  { id: 'fake-alert', label: 'Fake Alert', color: '#dc2626', icon: '🚨', title: 'Fake Security Alert', desc: 'Messages claiming your account has been compromised or frozen, urging you to click a link immediately to "fix" the problem.', flags: ['Claims your account is locked or frozen', 'Creates panic with short deadlines', 'Links to a non-official website'], avoid: 'Banks never ask you to verify accounts via SMS links. Call your bank directly using the number on your card.' },
  { id: 'scam-link', label: 'Scam Link', color: '#e11d48', icon: '🔗', title: 'Malicious Link', desc: 'Any suspicious link sent via SMS, Viber, or email that leads to a fake site designed to harvest your personal information.', flags: ['Shortened or suspicious URLs', 'Sent from unknown numbers', 'Message contains spelling errors'], avoid: 'Do not click links from unknown senders. When in doubt, search for the official website yourself.' },
  { id: 'otp-scam', label: 'OTP Scam', color: '#b91c1c', icon: '🔑', title: 'OTP Scam', desc: 'Scammers call or message you pretending to be bank staff, asking you to share your One-Time Password (OTP) code.', flags: ['Someone asks for your OTP code', 'Caller claims to be from your bank', 'Says they need the code to "fix" your account'], avoid: 'Never share your OTP with anyone. Banks will NEVER ask for your OTP over phone, SMS, or chat.' },
  { id: 'investment-scam', label: 'Investment Scam', color: '#a855f7', icon: '💵', title: 'Investment Scam', desc: 'Promises of guaranteed high returns from crypto, forex, or "VIP trading groups". They pressure you to invest quickly with fake profit screenshots.', flags: ['Guaranteed high returns (e.g. "30% weekly")', 'Pressure to recruit friends for bonuses', 'Fake profit screenshots from "members"'], avoid: 'No investment can guarantee returns. Real investments carry risk. Never invest based on messages from strangers.' },
  { id: 'delivery-scam', label: 'Delivery Scam', color: '#0ea5e9', icon: '📦', title: 'Delivery/Parcel Scam', desc: 'Fake delivery notifications claiming your package is stuck at customs and you need to pay a fee via mobile wallet to release it.', flags: ['You never ordered anything', 'Asks for mobile wallet payment before delivery', 'Vague details with no tracking number'], avoid: 'Real delivery companies provide tracking numbers. Contact the delivery company directly using their official number.' },
  { id: 'lottery-scam', label: 'Lottery Scam', color: '#f59e0b', icon: '🎰', title: 'Lottery/Prize Scam', desc: 'Messages claiming you won a lottery or prize you never entered. They ask for personal details or a "processing fee" to claim your winnings.', flags: ['You never entered any lottery', 'Asks for upfront payment to "release" prize', 'Creates urgency with deadlines'], avoid: 'If you did not enter a lottery, you cannot win one. Legitimate prizes never require upfront payment.' },
  { id: 'romance-scam', label: 'Romance Scam', color: '#ec4899', icon: '💔', title: 'Romance Scam', desc: 'Scammers build fake romantic relationships online, then ask for money due to "emergencies" like hospital bills or travel costs.', flags: ['Refuses to video call or meet in person', 'Quickly declares love then asks for money', 'Has excuses for every request to meet'], avoid: 'Never send money to someone you have not met in person. Be suspicious of anyone who asks for financial help online.' },
  { id: 'job-scam', label: 'Job Scam', color: '#10b981', icon: '💼', title: 'Fake Job Offer', desc: 'Unsolicited job offers with unrealistically high pay. They ask for registration fees, training costs, or your personal documents.', flags: ['Job offer you never applied for', 'Asks for upfront payment for "training"', 'Salary seems too good to be true'], avoid: 'Legitimate employers never ask for money. Research the company and apply through official channels.' },
]

const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[randInt(0, arr.length - 1)]
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ─── Audio Engine (Web Audio API — no external files) ────────
let _audioCtx = null
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

// ─── Background Music (MP3) ──────────────────────────────────
let _bgmAudio = null

function playBGM() {
  try {
    stopBGM()
    _bgmAudio = new Audio('/bgm/Subway-Surfers-theme-song.mp3')
    _bgmAudio.loop = true
    _bgmAudio.volume = 0.3
    _bgmAudio.play().catch(() => {})
  } catch (_) { /* silent fail */ }
}

function stopBGM() {
  if (_bgmAudio) {
    _bgmAudio.pause()
    _bgmAudio.currentTime = 0
    _bgmAudio = null
  }
}

function playCashSound() {
  try {
    const ctx = getAudioCtx()
    const now = ctx.currentTime
    // Rising chime — "cha-ching"
    const freqs = [523, 659, 784, 1047]
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0, now + i * 0.06)
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.06 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + i * 0.06)
      osc.stop(now + i * 0.06 + 0.3)
    })
  } catch (_) { /* silent fail */ }
}

function playHitSound() {
  try {
    const ctx = getAudioCtx()
    const now = ctx.currentTime
    // Descending buzz — alarm
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.linearRampToValueAtTime(120, now + 0.3)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.4)
    // Second layer — gritty
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sawtooth'
    osc2.frequency.setValueAtTime(220, now)
    osc2.frequency.linearRampToValueAtTime(80, now + 0.25)
    gain2.gain.setValueAtTime(0.08, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc2.connect(gain2).connect(ctx.destination)
    osc2.start(now)
    osc2.stop(now + 0.35)
  } catch (_) { /* silent fail */ }
}

function projectZ(d) {
  if (d >= 0) {
    const t = Math.min(1, d)
    return { y: PY - t * (PY - HY), scale: 1 - t * 0.72 }
  }
  return { y: PY + Math.abs(d) * 480, scale: 1 }
}

function laneX(lane, depth) {
  const s = depth >= 0 ? projectZ(depth).scale : 1
  return CW / 2 + (LC[lane] - CW / 2) * s
}

// ─── Drawing Helpers ─────────────────────────────────────────
function drawBg(ctx, off, speed) {
  const sky = ctx.createLinearGradient(0, 0, 0, HY + 60)
  sky.addColorStop(0, '#0c0e1a')
  sky.addColorStop(0.4, '#141830')
  sky.addColorStop(0.7, '#1e2748')
  sky.addColorStop(1, '#2a3558')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, CW, HY + 60)

  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 50; i++) {
    const twinkle = Math.sin(off * 0.008 + i * 2.1) * 0.5 + 0.5
    ctx.globalAlpha = 0.15 + twinkle * 0.6
    const sx = (i * 53 + 12) % CW
    const sy = (i * 37 + 5) % (HY - 15)
    ctx.fillRect(sx, sy, 1.5 + twinkle, 1.5 + twinkle)
  }
  ctx.globalAlpha = 1

  const moonX = CW - 70, moonY = 35
  ctx.fillStyle = 'rgba(255,250,220,0.08)'
  ctx.beginPath(); ctx.arc(moonX, moonY, 35, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,250,220,0.2)'
  ctx.beginPath(); ctx.arc(moonX, moonY, 20, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,250,220,0.6)'
  ctx.beginPath(); ctx.arc(moonX, moonY, 12, 0, Math.PI * 2); ctx.fill()

  const bOff = off * 0.12 % 100
  const buildings = [
    { x: 0, w: 55, h: 110, c: '#0d1225' }, { x: 60, w: 40, h: 80, c: '#111833' },
    { x: 105, w: 65, h: 130, c: '#0a0f20' }, { x: 175, w: 45, h: 70, c: '#131b35' },
    { x: 225, w: 55, h: 100, c: '#0e1428' }, { x: 285, w: 50, h: 120, c: '#0c1122' },
    { x: 340, w: 60, h: 90, c: '#101730' }, { x: 405, w: 45, h: 105, c: '#0d1325' },
    { x: 455, w: 50, h: 75, c: '#121a32' },
  ]
  for (const b of buildings) {
    const bx = ((b.x - bOff * 0.8) % (CW + 80)) - 40
    const by = HY - b.h + 40
    ctx.fillStyle = b.c
    ctx.fillRect(bx, by, b.w, b.h)
    ctx.strokeStyle = 'rgba(100,120,180,0.08)'
    ctx.lineWidth = 1
    ctx.strokeRect(bx, by, b.w, b.h)
    for (let wy = by + 10; wy < by + b.h - 8; wy += 14) {
      for (let wx = bx + 6; wx < bx + b.w - 6; wx += 12) {
        const lit = Math.sin(wx * 0.3 + wy * 0.5 + off * 0.003) > 0.3
        ctx.fillStyle = lit ? 'rgba(255,220,120,0.35)' : 'rgba(30,40,60,0.5)'
        ctx.fillRect(wx, wy, 6, 7)
      }
    }
  }

  const road = ctx.createLinearGradient(0, HY + 30, 0, CH)
  road.addColorStop(0, '#2a3050')
  road.addColorStop(0.15, '#232840')
  road.addColorStop(0.5, '#1c2038')
  road.addColorStop(1, '#141830')
  ctx.fillStyle = road
  ctx.fillRect(0, HY + 30, CW, CH - HY - 30)

  ctx.fillStyle = 'rgba(80,100,140,0.06)'
  for (let i = 0; i < 8; i++) {
    const rx = ((i * 70 + 20 - bOff * 0.5) % (CW + 40)) - 20
    ctx.fillRect(rx, HY + 35, 55, CH - HY - 35)
  }

  const edgeL = CW / 2 - LW * 1.7
  const edgeR = CW / 2 + LW * 1.7
  ctx.strokeStyle = 'rgba(255,200,50,0.15)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(CW / 2 + (edgeL - CW / 2) * 0.25, HY + 35)
  ctx.lineTo(edgeL, CH); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(CW / 2 + (edgeR - CW / 2) * 0.25, HY + 35)
  ctx.lineTo(edgeR, CH); ctx.stroke()

  ctx.strokeStyle = 'rgba(100,120,160,0.2)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([18, 25])
  const LB = [CW / 2 - LW * 1.5, CW / 2 - LW * 0.5, CW / 2 + LW * 0.5, CW / 2 + LW * 1.5]
  for (let l = 0; l <= LANES; l++) {
    ctx.beginPath()
    ctx.moveTo(CW / 2 + (LB[l] - CW / 2) * 0.25, HY + 40)
    ctx.lineTo(LB[l], CH)
    ctx.stroke()
  }
  ctx.setLineDash([])

  ctx.strokeStyle = 'rgba(255,200,50,0.5)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([25, 25])
  ctx.lineDashOffset = -(off * 2.5 % 50)
  ctx.beginPath()
  ctx.moveTo(CW / 2, HY + 40)
  ctx.lineTo(CW / 2, CH)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.lineDashOffset = 0

  if (speed > 4) {
    const alpha = clamp((speed - 4) / 4, 0, 0.15)
    ctx.strokeStyle = `rgba(200,220,255,${alpha})`
    ctx.lineWidth = 1
    for (let i = 0; i < 6; i++) {
      const lx = 60 + i * 80
      const ly = HY + 60 + (off * 3 + i * 100) % (CH - HY - 60)
      ctx.beginPath()
      ctx.moveTo(lx, ly)
      ctx.lineTo(lx, ly + 30 + speed * 4)
      ctx.stroke()
    }
  }
}

function drawPlayerTrail(ctx, p, inv, frameCount, squash) {
  if (inv && Math.floor(frameCount / 4) % 2 === 0) return
  const x = LC[p.lane], y = PY
  const runCycle = Math.sin(frameCount * 0.35)
  const lean = (p.targetLane - p.lane) * 3
  const sway = p.sway || 0
  const moving = Math.abs(sway) > 0.5
  const rotation = clamp(sway * 0.04, -0.25, 0.25)

  const scaleX = 1 + squash * 0.15
  const scaleY = 1 - squash * 0.15

  ctx.save()
  ctx.translate(x + lean, y)
  ctx.rotate(rotation)
  ctx.scale(scaleX, scaleY)

  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(0, PH / 2 + 6, PW / 2.2, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  const bodyGrad = ctx.createLinearGradient(-PW / 2, -PH / 2, PW / 2, PH / 2)
  bodyGrad.addColorStop(0, '#00d4ff')
  bodyGrad.addColorStop(0.5, '#0099cc')
  bodyGrad.addColorStop(1, '#006688')
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.roundRect(-PW / 2 + 4, -PH / 4, PW - 8, PH / 2 + 4, 6)
  ctx.fill()

  ctx.fillStyle = 'rgba(0,180,255,0.3)'
  ctx.beginPath()
  ctx.roundRect(-PW / 2 + 6, -PH / 4 + 2, PW / 2 - 6, PH / 2, 4)
  ctx.fill()

  const headY = -PH / 3 - 2
  const headGrad = ctx.createRadialGradient(0, headY, 2, 0, headY, 15)
  headGrad.addColorStop(0, '#ffe066')
  headGrad.addColorStop(1, '#cc9900')
  ctx.fillStyle = headGrad
  ctx.beginPath()
  ctx.arc(0, headY, 13, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(8, headY - 3, 9, 7)
  ctx.fillStyle = '#00d4ff'
  ctx.fillRect(9, headY - 2, 5, 4)

  ctx.fillStyle = '#005577'
  const legSwing = runCycle * 10
  ctx.fillRect(-7, PH / 6, 6, PH / 3 + 2)
  ctx.fillRect(1, PH / 6 + legSwing, 6, PH / 3 + 2)

  ctx.fillStyle = '#0088aa'
  const armSwing = -runCycle * 8
  const armLean = clamp(sway * 1.5, -8, 8)
  ctx.fillRect(-PW / 2 + 2 + armLean, -PH / 6 + armSwing, 5, 18)
  ctx.fillRect(PW / 2 - 7 + armLean, -PH / 6 - armSwing, 5, 18)

  ctx.shadowColor = '#00d4ff'
  ctx.shadowBlur = 25
  ctx.fillStyle = 'transparent'
  ctx.fillRect(-PW / 2, -PH / 2, PW, PH)
  ctx.shadowBlur = 0

  ctx.restore()
}

function drawObs(ctx, o, frameCount) {
  const { y, scale } = projectZ(o.depth)
  if (scale < 0.15) return
  const x = laneX(o.lane, o.depth)
  const w = 52 * scale, h = 62 * scale

  const pulse = Math.sin(frameCount * 0.08 + o.lane) * 0.1 + 0.9

  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(x, y + h / 2 + 4 * scale, w / 2.2, 6 * scale, 0, 0, Math.PI * 2)
  ctx.fill()

  const obsGrad = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2)
  const baseColor = o.type.color
  obsGrad.addColorStop(0, baseColor)
  obsGrad.addColorStop(1, shadeColor(baseColor, -30))
  ctx.fillStyle = obsGrad
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 8 * scale)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.roundRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h * 0.4, 6 * scale)
  ctx.stroke()

  ctx.shadowColor = baseColor
  ctx.shadowBlur = 15 * pulse * scale
  ctx.strokeStyle = baseColor
  ctx.lineWidth = 2 * scale
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 8 * scale)
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (scale > 0.3) {
    ctx.font = `bold ${Math.floor(22 * scale)}px sans-serif`
    ctx.fillText(o.type.icon, x, y - 4 * scale)
  }
  if (scale > 0.4) {
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.floor(9 * scale)}px sans-serif`
    ctx.fillText(o.type.label, x, y + h / 2 - 8 * scale)
  }
}

function shadeColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const r = clamp((num >> 16) + percent, 0, 255)
  const g = clamp(((num >> 8) & 0x00FF) + percent, 0, 255)
  const b = clamp((num & 0x0000FF) + percent, 0, 255)
  return `rgb(${r},${g},${b})`
}

function drawCol(ctx, c, frameCount) {
  const { y, scale } = projectZ(c.depth)
  if (scale < 0.15) return
  const x = laneX(c.lane, c.depth)
  const bw = 26 * scale
  const bh = 14 * scale
  const bob = Math.sin(frameCount * 0.12 + c.lane * 2) * 3 * scale
  const tilt = Math.sin(frameCount * 0.06) * 0.15

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.rotate(tilt)

  ctx.shadowColor = '#22c55e'
  ctx.shadowBlur = 18 * scale

  const cashGrad = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2)
  cashGrad.addColorStop(0, '#86efac')
  cashGrad.addColorStop(0.5, '#22c55e')
  cashGrad.addColorStop(1, '#15803d')
  ctx.fillStyle = cashGrad
  ctx.beginPath()
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 3 * scale)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1 * scale
  ctx.beginPath()
  ctx.roundRect(-bw / 2 + 2 * scale, -bh / 2 + 2 * scale, bw - 4 * scale, bh - 4 * scale, 2 * scale)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = `bold ${Math.floor(9 * scale)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', 0, 1)

  ctx.restore()
}

function drawHUD(ctx, score, lives, speed, combo, distance) {
  ctx.save()

  const hudBg = ctx.createLinearGradient(0, 0, 0, 55)
  hudBg.addColorStop(0, 'rgba(0,0,0,0.5)')
  hudBg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = hudBg
  ctx.fillRect(0, 0, CW, 55)

  ctx.fillStyle = '#22c55e'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.shadowColor = '#22c55e'
  ctx.shadowBlur = 8
  ctx.fillText(`$ ${score}`, 16, 12)
  ctx.shadowBlur = 0

  if (combo > 1) {
    ctx.fillStyle = '#ff6b35'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(`x${combo}`, 16, 36)
  }

  ctx.textAlign = 'right'
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i < lives ? '#ef4444' : 'rgba(255,255,255,0.15)'
    ctx.font = `${i < lives ? 'bold ' : ''}16px sans-serif`
    ctx.fillText('♥', CW - 8 - i * 22, 12)
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '11px sans-serif'
  ctx.fillText(`${Math.floor(distance)}m`, CW / 2, 14)

  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.font = '10px sans-serif'
  ctx.fillText('← → Swipe or Arrow Keys  |  Enter to continue', CW / 2, CH - 14)

  ctx.restore()
}

function drawFloatingTexts(ctx, texts) {
  for (const ft of texts) {
    const t = ft.life / ft.ml
    ctx.save()
    ctx.globalAlpha = t
    ctx.fillStyle = ft.color
    ctx.font = `bold ${ft.size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = ft.color
    ctx.shadowBlur = 6
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}

function drawParticles(ctx, parts) {
  for (const p of parts) {
    ctx.globalAlpha = p.life / p.ml
    ctx.fillStyle = p.color
    const s = p.size * (p.life / p.ml)
    ctx.beginPath()
    ctx.arc(p.x, p.y, s, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawCoinSparkle(ctx, parts) {
  for (const p of parts) {
    const t = p.life / p.ml
    ctx.globalAlpha = t
    ctx.fillStyle = p.color
    const s = p.size * t
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle || 0)
    ctx.fillRect(-s / 2, -s / 2, s, s)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}

function spawnParticles(arr, x, y, count, color, sizeRange, speedRange, life) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const spd = Math.random() * speedRange
    arr.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 15,
      dx: Math.cos(angle) * spd,
      dy: Math.sin(angle) * spd,
      life, ml: life, color,
      size: randInt(sizeRange[0], sizeRange[1]),
      angle: Math.random() * Math.PI * 2,
    })
  }
}

function spawnCoinSparkles(arr, x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5
    arr.push({
      x, y,
      dx: Math.cos(angle) * (2 + Math.random() * 3),
      dy: Math.sin(angle) * (2 + Math.random() * 3),
      life: 20 + randInt(0, 10), ml: 30,
      color: ['#22c55e', '#86efac', '#bbf7d0'][randInt(0, 2)],
      size: randInt(2, 4),
      angle: angle,
    })
  }
}

function moveAndCull(arr, speed) {
  for (let i = arr.length - 1; i >= 0; i--) {
    arr[i].depth -= speed * 0.006
    if (arr[i].depth < -0.3) arr.splice(i, 1)
  }
}

// ─── Scam Info Popup ──────────────────────────────────────────
function ScamPopup({ scam, onContinue, t }) {
  if (!scam) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.5)] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/10">
        <div className="px-6 pt-6 pb-4" style={{ background: `linear-gradient(135deg, ${scam.color}30, ${scam.color}10)` }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${scam.color}20` }}>
              {scam.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{scam.title}</h3>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold text-white tracking-wide" style={{ backgroundColor: scam.color }}>
                {scam.label}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">{scam.desc}</p>
        </div>
        <div className="px-6 py-4">
          <h4 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span>🚩</span> {t('game.runner.popup.redFlags', 'Red Flags')}
          </h4>
          <ul className="space-y-1.5">
            {scam.flags.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
          <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <span>🛡️</span> {t('game.runner.popup.howToAvoid', 'How to Protect Yourself')}
          </h4>
          <p className="text-sm text-green-800 leading-relaxed">{scam.avoid}</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onContinue}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-cyan-500/25 active:scale-[0.97]"
          >
            {t('game.runner.popup.continue', 'Continue Running →')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
export function ScamRunner() {
  const { t } = useTranslation()
  const { data: scenarios = [] } = useAdventureScenariosQuery()
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const animRef = useRef(null)
  const [gameState, setGameState] = useState('idle')
  const [finalScore, setFinalScore] = useState(0)
  const [scamPopup, setScamPopup] = useState(null)
  const keysRef = useRef({ left: false, right: false })
  const touchRef = useRef({ startX: 0, swiping: false })

  useEffect(() => {
    const kd = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); keysRef.current.left = true }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); keysRef.current.right = true }
    }
    const ku = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false
    }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => {
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku)
      stopBGM()
    }
  }, [])

  // Touch events — bind when canvas is available (not on idle)
  useEffect(() => {
    if (gameState !== 'playing') return
    const cv = canvasRef.current
    if (!cv) return

    const ts = (e) => { touchRef.current.startX = e.touches[0].clientX; touchRef.current.swiping = true }
    const tm = (e) => {
      if (!touchRef.current.swiping) return
      const dx = e.touches[0].clientX - touchRef.current.startX
      if (Math.abs(dx) > 25) {
        dx < 0 ? (keysRef.current.left = true) : (keysRef.current.right = true)
        touchRef.current.swiping = false
      }
    }
    const te = () => { touchRef.current.swiping = false; keysRef.current.left = false; keysRef.current.right = false }

    cv.addEventListener('touchstart', ts, { passive: true })
    cv.addEventListener('touchmove', tm, { passive: true })
    cv.addEventListener('touchend', te, { passive: true })
    return () => {
      cv.removeEventListener('touchstart', ts)
      cv.removeEventListener('touchmove', tm)
      cv.removeEventListener('touchend', te)
    }
  }, [gameState])

  const handleStart = useCallback(() => {
    gameRef.current = {
      state: 'playing', score: 0, lives: 7, speed: SPD0, frameCount: 0,
      spawnT: 0, collectT: 0, invT: 0, paused: false,
      player: { lane: 1, targetLane: 1, sway: 0 },
      obstacles: [], collectibles: [], particles: [], coinSparkles: [],
      floatingTexts: [],
      tipText: '', tipTimer: 0, scrollOff: 0, switchCD: 0,
      shakeX: 0, shakeY: 0, shakeMag: 0,
      combo: 0, comboTimer: 0, distance: 0,
      squash: 0, flashAlpha: 0, flashColor: '#fff',
    }
    setGameState('playing'); setFinalScore(0); setScamPopup(null)
    playBGM()
  }, [])

  const handleContinue = useCallback(() => {
    setScamPopup(null)
    if (gameRef.current) gameRef.current.paused = false
    playBGM()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Enter' && scamPopup) {
        e.preventDefault()
        handleContinue()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scamPopup, handleContinue])

  useEffect(() => {
    if (gameState !== 'playing') return
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')

    const loop = () => {
      const g = gameRef.current
      if (!g || g.state !== 'playing') return
      if (g.paused) { animRef.current = requestAnimationFrame(loop); return }

      g.frameCount++
      g.scrollOff += g.speed
      g.distance += g.speed * 0.05
      if (g.speed < SPDMAX) g.speed += SPDINC

      if (g.shakeMag > 0.1) {
        g.shakeX = (Math.random() - 0.5) * g.shakeMag * 2
        g.shakeY = (Math.random() - 0.5) * g.shakeMag * 2
        g.shakeMag *= SHAKE_DECAY
      } else {
        g.shakeX = 0; g.shakeY = 0; g.shakeMag = 0
      }

      if (g.switchCD > 0) g.switchCD--
      if (g.switchCD <= 0) {
        if (keysRef.current.left && g.player.targetLane > 0) { g.player.targetLane--; g.switchCD = 10; keysRef.current.left = false }
        if (keysRef.current.right && g.player.targetLane < LANES - 1) { g.player.targetLane++; g.switchCD = 10; keysRef.current.right = false }
      }
      if (Math.abs(g.player.targetLane - g.player.lane) > 0.05) {
        const prevLane = g.player.lane
        g.player.lane += (g.player.targetLane - g.player.lane) * 0.18
        g.player.sway = (g.player.lane - prevLane) * 16
      } else {
        g.player.lane = g.player.targetLane
        g.player.sway *= 0.82
      }

      if (++g.spawnT >= SPAWN_INT) {
        g.spawnT = 0
        const usedLanes = g.obstacles.filter(o => o.depth > 0.6).map(o => o.lane)
        const freeLanes = [0, 1, 2].filter(l => !usedLanes.includes(l))
        if (freeLanes.length > 0) {
          const s = scenarios.length > 0 ? pick(scenarios) : null
          g.obstacles.push({ lane: pick(freeLanes), depth: 1, type: pick(SCAM_TYPES), scenario: s })
        }
      }

      if (++g.collectT >= COLLECT_INT) {
        g.collectT = 0
        const l = randInt(0, LANES - 1)
        if (!g.obstacles.some((o) => o.lane === l && o.depth > 0.65))
          g.collectibles.push({ lane: l, depth: 1 })
      }

      moveAndCull(g.obstacles, g.speed)
      moveAndCull(g.collectibles, g.speed)

      const pl = Math.round(g.player.lane)

      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const o = g.obstacles[i]
        if (o.lane === pl && o.depth > -0.05 && o.depth < 0.15) {
          g.obstacles.splice(i, 1)
          if (g.invT <= 0) {
            g.lives--; g.invT = INV_FRAMES
            g.combo = 0; g.comboTimer = 0
            const scamPenalty = Math.min(3, g.score)
            g.score -= scamPenalty
            g.shakeMag = 12
            g.squash = -3 // horizontal squash on hit
            g.flashAlpha = 0.6
            g.flashColor = o.type.color
            playHitSound()
            spawnParticles(g.particles, LC[pl], PY, 20, '#ef4444', [3, 7], 10, 45)
            spawnParticles(g.particles, LC[pl], PY, 10, '#ff6b35', [2, 5], 8, 35)
            g.floatingTexts.push({ x: LC[pl], y: PY - 60, text: `-$${scamPenalty} ${o.type.label}`, color: '#ef4444', size: 20, life: 50, ml: 50, dy: -1.5 })
            g.paused = true
            setScamPopup(o.type)
            stopBGM()
            if (g.lives <= 0) {
              g.state = 'gameOver'; setFinalScore(g.score); setGameState('gameOver'); stopBGM(); return
            }
          }
        }
      }

      for (let i = g.collectibles.length - 1; i >= 0; i--) {
        const c = g.collectibles[i]
        if (c.lane === pl && c.depth > -0.05 && c.depth < 0.15) {
          g.collectibles.splice(i, 1)
          g.combo++
          g.comboTimer = 60
          const pts = Math.min(g.combo, 5)
          g.score += pts
          g.shakeMag = Math.min(g.shakeMag + 3, 8)
          g.squash = 2.5 // vertical stretch on collect
          playCashSound()
          spawnParticles(g.particles, LC[pl], PY, 8, '#22c55e', [2, 5], 7, 30)
          spawnCoinSparkles(g.coinSparkles, LC[pl], PY - 10)
          const comboLabel = g.combo > 1 ? ` x${g.combo}` : ''
          g.floatingTexts.push({ x: LC[pl], y: PY - 50, text: `+$${pts}${comboLabel}`, color: '#22c55e', size: 18 + Math.min(g.combo, 5) * 2, life: 45, ml: 45, dy: -2 })
        }
      }

      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]
        p.x += p.dx; p.y += p.dy; p.dx *= 0.94; p.dy *= 0.94
        if (--p.life <= 0) g.particles.splice(i, 1)
      }
      for (let i = g.coinSparkles.length - 1; i >= 0; i--) {
        const p = g.coinSparkles[i]
        p.x += p.dx; p.y += p.dy; p.dx *= 0.92; p.dy *= 0.92
        if (--p.life <= 0) g.coinSparkles.splice(i, 1)
      }

      // Floating text update
      for (let i = g.floatingTexts.length - 1; i >= 0; i--) {
        const ft = g.floatingTexts[i]
        ft.y += ft.dy
        if (--ft.life <= 0) g.floatingTexts.splice(i, 1)
      }

      // Squash & stretch decay
      if (Math.abs(g.squash) > 0.05) g.squash *= 0.85
      else g.squash = 0

      // Flash decay
      if (g.flashAlpha > 0.01) g.flashAlpha *= 0.88
      else g.flashAlpha = 0

      if (g.comboTimer > 0) g.comboTimer--
      else g.combo = 0
      if (g.tipTimer > 0) g.tipTimer--
      if (g.invT > 0) g.invT--

      ctx.clearRect(0, 0, CW, CH)
      ctx.save()
      ctx.translate(g.shakeX, g.shakeY)
      drawBg(ctx, g.scrollOff, g.speed)
      g.collectibles.forEach((c) => drawCol(ctx, c, g.frameCount))
      g.obstacles.forEach((o) => drawObs(ctx, o, g.frameCount))
      drawPlayerTrail(ctx, g.player, g.invT > 0, g.frameCount, g.squash)
      drawParticles(ctx, g.particles)
      drawCoinSparkle(ctx, g.coinSparkles)
      drawFloatingTexts(ctx, g.floatingTexts)
      ctx.restore()

      // Screen flash overlay
      if (g.flashAlpha > 0.01) {
        ctx.fillStyle = g.flashColor
        ctx.globalAlpha = g.flashAlpha
        ctx.fillRect(0, 0, CW, CH)
        ctx.globalAlpha = 1
      }

      drawHUD(ctx, g.score, g.lives, g.speed, g.combo, g.distance)

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [gameState, scenarios])

  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative text-7xl mb-2 animate-bounce" style={{ animationDuration: '2s' }}>🏃‍♂️</div>
        </div>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            {t('game.runner.title', 'Scam Runner')}
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
            {t('game.runner.intro', 'Run through the digital city! Dodge scam obstacles and collect safe messages. Learn about each scam type when you hit one!')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6 text-sm w-full max-w-xs">
          <div className="flex items-center gap-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200/60 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-lg">💵</span>
            <span className="text-green-800 font-medium">Collect cash</span>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3 border border-red-200/60 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-lg">⛔</span>
            <span className="text-red-800 font-medium">Dodge scams</span>
          </div>
        </div>
        <div className="bg-gray-50/80 backdrop-blur rounded-2xl p-4 mb-6 text-sm text-gray-500 max-w-xs text-center border border-gray-100">
          <p className="font-semibold text-gray-700 mb-2">{t('game.runner.controls', 'Controls')}</p>
          <div className="flex justify-center gap-6 text-xs">
            <span>🖥️ <kbd className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">← →</kbd></span>
            <span>📱 Swipe</span>
          </div>
        </div>
        <button
          onClick={handleStart}
          className="relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black rounded-2xl text-lg transition-all shadow-xl shadow-cyan-500/30 active:scale-95 tracking-wide group"
        >
          <span className="relative z-10 flex items-center gap-2">
            {t('game.runner.start', 'START RUNNING')}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
          <div className="absolute inset-0 bg-white/10 rounded-2xl" />
        </button>
      </div>
    )
  }

  if (gameState === 'gameOver') {
    const grade = finalScore >= 30 ? { emoji: '🏆', color: 'text-yellow-500', label: 'Scam Expert', bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200' }
      : finalScore >= 15 ? { emoji: '⭐', color: 'text-cyan-600', label: 'Getting There', bg: 'from-cyan-50 to-blue-50', border: 'border-cyan-200' }
      : { emoji: '📚', color: 'text-gray-500', label: 'Keep Learning', bg: 'from-gray-50 to-slate-50', border: 'border-gray-200' }
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative text-6xl animate-bounce" style={{ animationDuration: '1.5s' }}>💵</div>
        </div>
        <div className="text-center mb-5">
          <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
            {t('game.runner.gameOver', 'GAME OVER')}
          </h2>
        </div>

        {/* Dollar earned card */}
        <div className={`w-full max-w-xs bg-gradient-to-br ${grade.bg} rounded-2xl border ${grade.border} p-5 mb-4 shadow-lg`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('game.runner.totalEarned', 'Total Earned')}</span>
            <span className="text-lg">{grade.emoji}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-green-600">${finalScore}</span>
            <span className="text-sm text-gray-400 font-medium">USD</span>
          </div>
          <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${grade.color} bg-white/60`}>
            {grade.label}
          </div>
        </div>

        {/* Warning message */}
        <div className="w-full max-w-xs bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-4 mb-5">
          <div className="flex items-start gap-2.5">
            <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-red-700 mb-1">{t('game.runner.warning.title', 'Stay Alert!')}</h4>
              <p className="text-xs text-red-600 leading-relaxed">
                {t('game.runner.warning.message', 'Every scam you dodge protects your real money. Learn to recognize fake APKs, phishing links, and OTP scams — they target your wallet every day.')}
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="w-full max-w-xs bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">{t('game.runner.tips.title', 'How to Protect Your Money')}</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-xs text-gray-600">
              <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
              <span>{t('game.runner.tips.tip1', 'Never share OTP codes with anyone — not even bank staff')}</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-gray-600">
              <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
              <span>{t('game.runner.tips.tip2', 'Only download apps from official Google Play or App Store')}</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-gray-600">
              <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
              <span>{t('game.runner.tips.tip3', 'Always verify URLs before entering login credentials')}</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          className="relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black rounded-2xl text-lg transition-all shadow-xl shadow-cyan-500/30 active:scale-95 tracking-wide group"
        >
          <span className="relative z-10 flex items-center gap-2">
            {t('game.runner.playAgain', 'PLAY AGAIN')}
            <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
          </span>
          <div className="absolute inset-0 bg-white/10 rounded-2xl" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex justify-center py-2">
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="rounded-2xl border border-zinc-200/50 shadow-2xl max-w-full"
        style={{ touchAction: 'none', maxHeight: '72vh' }}
      />
      <ScamPopup scam={scamPopup} onContinue={handleContinue} t={t} />
    </div>
  )
}
