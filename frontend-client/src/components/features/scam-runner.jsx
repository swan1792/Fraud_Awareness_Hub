import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdventureScenariosQuery } from '@/lib/api'

// ─── Sound Manager (Web Audio API + HTML5 Audio for BGM) ────────
const BGM_SRC = '/bgm/Subway-Surfers-theme-song.mp3'

function createSoundManager() {
  let audioCtx = null
  const bgm = new Audio(BGM_SRC)
  bgm.loop = true
  bgm.volume = 0.35

  function ensureCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  }

  function playTone(freq, duration, type = 'square', vol = 0.18) {
    try {
      ensureCtx()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(vol, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + duration)
    } catch (_) { /* ignore audio errors */ }
  }

  return {
    startBgm() { bgm.currentTime = 0; bgm.play().catch(() => {}) },
    stopBgm() { bgm.pause(); bgm.currentTime = 0 },
    collect() { playTone(880, 0.08, 'sine', 0.15); setTimeout(() => playTone(1320, 0.1, 'sine', 0.12), 60) },
    hit() { playTone(200, 0.25, 'sawtooth', 0.2); setTimeout(() => playTone(140, 0.3, 'sawtooth', 0.15), 80) },
    gameOver() { playTone(440, 0.15, 'square', 0.2); setTimeout(() => playTone(330, 0.15, 'square', 0.18), 150); setTimeout(() => playTone(220, 0.35, 'square', 0.15), 300) },
  }
}

const CW = 480, CH = 720, LANES = 3, LW = 100
const LC = [CW / 2 - LW, CW / 2, CW / 2 + LW]
const HY = 120, PY = CH - 140, PW = 50, PH = 70
const SPD0 = 2.5, SPDMAX = 7, SPDINC = 0.001
const SPAWN_INT = 80, COLLECT_INT = 55, INV_FRAMES = 90

const SCAM_TYPES = [
  {
    id: 'fake-apk', label: 'Fake APK', color: '#ef4444', icon: '⚠️',
    title: 'Fake APK Download',
    desc: 'Scammers send links to download fake versions of popular apps like KPay, KBZPay, or Wave Money. These APKs steal your login credentials and OTP codes.',
    flags: ['Download link from unknown Viber/Telegram group', 'App asks for excessive permissions', 'App name is slightly misspelled (e.g. "KPayy")'],
    avoid: 'Only download apps from official Google Play Store or App Store. Never install APK files from chat links.',
  },
  {
    id: 'phishing-link', label: 'Phishing Link', color: '#f97316', icon: '🎣',
    title: 'Phishing Link',
    desc: 'Fake websites that look like real banking or payment sites. They trick you into entering your username, password, and OTP code.',
    flags: ['URL does not match the official domain', 'Urgent message asking you to "verify" or "confirm"', 'Asks for password or OTP input'],
    avoid: 'Always check the URL carefully. Official sites use .com.mm or verified domains. Never enter credentials from a link in a message.',
  },
  {
    id: 'fake-alert', label: 'Fake Alert', color: '#dc2626', icon: '🚨',
    title: 'Fake Security Alert',
    desc: 'Messages claiming your account has been compromised or frozen, urging you to click a link immediately to "fix" the problem.',
    flags: ['Claims your account is locked or frozen', 'Creates panic with short deadlines', 'Links to a non-official website'],
    avoid: 'Banks never ask you to verify accounts via SMS links. Call your bank directly using the number on your card.',
  },
  {
    id: 'scam-link', label: 'Scam Link', color: '#e11d48', icon: '🔗',
    title: 'Malicious Link',
    desc: 'Any suspicious link sent via SMS, Viber, or email that leads to a fake site designed to harvest your personal information.',
    flags: ['Shortened or suspicious URLs', 'Sent from unknown numbers', 'Message contains spelling errors'],
    avoid: 'Do not click links from unknown senders. When in doubt, search for the official website yourself.',
  },
  {
    id: 'otp-scam', label: 'OTP Scam', color: '#b91c1c', icon: '🔑',
    title: 'OTP Scam',
    desc: 'Scammers call or message you pretending to be bank staff, asking you to share your One-Time Password (OTP) code.',
    flags: ['Someone asks for your OTP code', 'Caller claims to be from your bank', 'Says they need the code to "fix" your account'],
    avoid: 'Never share your OTP with anyone. Banks will NEVER ask for your OTP over phone, SMS, or chat.',
  },
  {
    id: 'investment-scam', label: 'Investment Scam', color: '#a855f7', icon: '💰',
    title: 'Investment Scam',
    desc: 'Promises of guaranteed high returns from crypto, forex, or "VIP trading groups". They pressure you to invest quickly with fake profit screenshots.',
    flags: ['Guaranteed high returns (e.g. "30% weekly")', 'Pressure to recruit friends for bonuses', 'Fake profit screenshots from "members"'],
    avoid: 'No investment can guarantee returns. Real investments carry risk. Never invest based on messages from strangers.',
  },
  {
    id: 'delivery-scam', label: 'Delivery Scam', color: '#0ea5e9', icon: '📦',
    title: 'Delivery/Parcel Scam',
    desc: 'Fake delivery notifications claiming your package is stuck at customs and you need to pay a fee via mobile wallet to release it.',
    flags: ['You never ordered anything', 'Asks for mobile wallet payment before delivery', 'Vague details with no tracking number'],
    avoid: 'Real delivery companies provide tracking numbers. Contact the delivery company directly using their official number.',
  },
  {
    id: 'lottery-scam', label: 'Lottery Scam', color: '#f59e0b', icon: '🎰',
    title: 'Lottery/Prize Scam',
    desc: 'Messages claiming you won a lottery or prize you never entered. They ask for personal details or a "processing fee" to claim your winnings.',
    flags: ['You never entered any lottery', 'Asks for upfront payment to "release" prize', 'Creates urgency with deadlines'],
    avoid: 'If you did not enter a lottery, you cannot win one. Legitimate prizes never require upfront payment.',
  },
  {
    id: 'romance-scam', label: 'Romance Scam', color: '#ec4899', icon: '💔',
    title: 'Romance Scam',
    desc: 'Scammers build fake romantic relationships online, then ask for money due to "emergencies" like hospital bills or travel costs.',
    flags: ['Refuses to video call or meet in person', 'Quickly declares love then asks for money', 'Has excuses for every request to meet'],
    avoid: 'Never send money to someone you have not met in person. Be suspicious of anyone who asks for financial help online.',
  },
  {
    id: 'job-scam', label: 'Job Scam', color: '#10b981', icon: '💼',
    title: 'Fake Job Offer',
    desc: 'Unsolicited job offers with unrealistically high pay. They ask for registration fees, training costs, or your personal documents.',
    flags: ['Job offer you never applied for', 'Asks for upfront payment for "training"', 'Salary seems too good to be true'],
    avoid: 'Legitimate employers never ask for money. Research the company and apply through official channels.',
  },
]

const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[randInt(0, arr.length - 1)]


function projectZ(d) {
  if (d >= 0) {
    const t = Math.min(1, d)
    return { y: PY - t * (PY - HY), scale: 1 - t * 0.7 }
  }
  // Past player: full size, same speed as approaching (460 px per depth unit)
  return { y: PY + Math.abs(d) * 460, scale: 1 }
}

function laneX(lane, depth) {
  // Past player: keep objects on their lane (no convergence)
  const s = depth >= 0 ? projectZ(depth).scale : 1
  return CW / 2 + (LC[lane] - CW / 2) * s
}

// ─── Draw helpers ──────────────────────────────────────────────
function drawBg(ctx, off) {
  const sky = ctx.createLinearGradient(0, 0, 0, HY + 50)
  sky.addColorStop(0, '#0f172a'); sky.addColorStop(0.6, '#1e293b'); sky.addColorStop(1, '#475569')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, HY + 50)

  ctx.fillStyle = '#94a3b8'
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.3 + (Math.sin(off * 0.01 + i) * 0.5 + 0.5) * 0.7
    ctx.fillRect((i * 67 + 15) % CW, (i * 43 + 8) % (HY - 20), 2, 2)
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = '#1e293b'
  const bOff = off * 0.15 % 120
  for (let i = -1; i < CW / 60 + 2; i++)
    ctx.fillRect(i * 60 - bOff, HY - (40 + (i * 31) % 50) + 30, 45, 40 + (i * 31) % 50)

  const road = ctx.createLinearGradient(0, HY, 0, CH)
  road.addColorStop(0, '#475569'); road.addColorStop(0.3, '#334155'); road.addColorStop(1, '#1e293b')
  ctx.fillStyle = road; ctx.fillRect(0, HY, CW, CH - HY)

  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.setLineDash([20, 30])
  const LB = [CW / 2 - LW * 1.5, CW / 2 - LW * 0.5, CW / 2 + LW * 0.5, CW / 2 + LW * 1.5]
  for (let l = 0; l <= LANES; l++) {
    ctx.beginPath()
    ctx.moveTo(CW / 2 + (LB[l] - CW / 2) * 0.3, HY + 20)
    ctx.lineTo(LB[l], CH)
    ctx.stroke()
  }
  ctx.setLineDash([])

  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.setLineDash([30, 30])
  ctx.lineDashOffset = -(off * 2 % 60)
  ctx.beginPath(); ctx.moveTo(CW / 2, HY + 20); ctx.lineTo(CW / 2, CH); ctx.stroke()
  ctx.setLineDash([]); ctx.lineDashOffset = 0
}

// ─── Sprite Sheet Generator (Robot) ────────────────────────────
const SPRITE_FRAMES = 8
const SPRITE_W = 64, SPRITE_H = 80
let _spriteSheet = null

function generateSpriteSheet() {
  const canvas = document.createElement('canvas')
  canvas.width = SPRITE_W * SPRITE_FRAMES
  canvas.height = SPRITE_H
  const ctx = canvas.getContext('2d')

  for (let f = 0; f < SPRITE_FRAMES; f++) {
    const cx = f * SPRITE_W + SPRITE_W / 2
    const cy = SPRITE_H / 2 + 6
    const t = f / SPRITE_FRAMES
    const stride = Math.sin(t * Math.PI * 2)

    ctx.save()
    ctx.translate(cx, cy)

    // ─── Back leg (robot) ───
    const bExt = Math.max(0, stride) * 12
    ctx.fillStyle = '#64748b'
    ctx.fillRect(-6 - bExt * 0.4, 6, 6, 14)
    // Knee joint
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(-3 - bExt * 0.4, 20, 3, 0, Math.PI * 2)
    ctx.fill()
    // Lower leg
    ctx.fillStyle = '#64748b'
    ctx.fillRect(-7 - bExt * 0.5, 20, 6, 14)
    // Foot
    ctx.fillStyle = '#475569'
    ctx.fillRect(-9 - bExt * 0.5, 33, 10, 4)

    // ─── Front leg (robot, knee up) ───
    const fExt = Math.max(0, -stride) * 14
    ctx.fillStyle = '#64748b'
    ctx.fillRect(1, 6, 6, 12 - fExt * 0.3)
    // Knee joint
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(4, 18 - fExt * 0.3, 3, 0, Math.PI * 2)
    ctx.fill()
    // Lower leg
    ctx.fillStyle = '#64748b'
    ctx.fillRect(1 + fExt * 0.2, 18 - fExt * 0.3, 6, 14 - fExt * 0.2)
    // Foot
    ctx.fillStyle = '#475569'
    ctx.fillRect(-1 + fExt * 0.2, 31 - fExt * 0.3, 10, 4)

    // ─── Torso (robot body) ───
    ctx.fillStyle = '#06b6d4'
    ctx.fillRect(-10, -22, 20, 28)
    // Chest plate
    ctx.fillStyle = '#0891b2'
    ctx.fillRect(-8, -18, 16, 10)
    // Core light
    ctx.fillStyle = '#22d3ee'
    ctx.shadowColor = '#22d3ee'
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(0, -13, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    // Belt
    ctx.fillStyle = '#475569'
    ctx.fillRect(-10, 2, 20, 4)
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(-3, 2, 6, 4)

    // ─── Arms (robot) ───
    const arm = -stride * 8
    // Shoulder joints
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(-12, -18, 3, 0, Math.PI * 2)
    ctx.arc(12, -18, 3, 0, Math.PI * 2)
    ctx.fill()
    // Back arm
    ctx.fillStyle = '#64748b'
    ctx.fillRect(-15 - arm * 0.4, -16, 5, 12)
    // Front arm
    ctx.fillRect(10 + arm * 0.4, -16, 5, 12)
    // Hands
    ctx.fillStyle = '#475569'
    ctx.fillRect(-14 - arm * 0.5, -4, 6, 5)
    ctx.fillRect(10 + arm * 0.5, -4, 6, 5)

    // ─── Head (robot) ───
    // Neck
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(-4, -26, 8, 4)
    // Head box
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(-11, -42, 22, 16)
    // Visor
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(-9, -38, 18, 8)
    // Eyes (glowing)
    ctx.fillStyle = '#22d3ee'
    ctx.shadowColor = '#22d3ee'
    ctx.shadowBlur = 4
    ctx.fillRect(-7, -36, 4, 4)
    ctx.fillRect(3, -36, 4, 4)
    ctx.shadowBlur = 0
    // Antenna
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(-1, -46, 2, 4)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(0, -47, 2, 0, Math.PI * 2)
    ctx.fill()
    // Mouth grille
    ctx.fillStyle = '#94a3b8'
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-6 + i * 5, -30, 3, 1)
    }

    ctx.restore()
  }

  _spriteSheet = canvas
}

function drawPlayer(ctx, p, inv) {
  if (inv && Math.floor(Date.now() / 80) % 2 === 0) return
  if (!_spriteSheet) generateSpriteSheet()

  const x = LC[p.lane], y = PY
  const t = Date.now()

  // Sprite sheet animation
  const frame = Math.floor((t / 80) % SPRITE_FRAMES)
  const srcX = frame * SPRITE_W

  // Hop bounce
  const cycle = (t % 80) / 80
  const hop = Math.max(0, Math.sin(cycle * Math.PI * 2)) * 4

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(x, y + PH / 2 + 8, PW / 2, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Draw sprite frame
  ctx.drawImage(
    _spriteSheet,
    srcX, 0, SPRITE_W, SPRITE_H,
    x - SPRITE_W / 2, y - SPRITE_H / 2 - hop + 6,
    SPRITE_W, SPRITE_H
  )

  // Invincibility glow
  if (inv) {
    ctx.globalAlpha = 0.3 + Math.sin(t / 100) * 0.2
    ctx.shadowColor = '#fbbf24'
    ctx.shadowBlur = 25
    ctx.beginPath()
    ctx.arc(x, y - hop, 28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }
}

function drawObs(ctx, o) {
  const { y, scale } = projectZ(o.depth)
  if (scale < 0.15) return
  const x = laneX(o.lane, o.depth), w = 50 * scale, h = 60 * scale

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath(); ctx.ellipse(x, y + h / 2 + 3 * scale, w / 2, 5 * scale, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = o.type.color; ctx.fillRect(x - w / 2, y - h / 2, w, h)
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2 * scale; ctx.strokeRect(x - w / 2, y - h / 2, w, h)

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  if (scale > 0.3) { ctx.font = `bold ${Math.floor(20 * scale)}px sans-serif`; ctx.fillText(o.type.icon, x, y - 2) }
  if (scale > 0.4) {
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.floor(9 * scale)}px sans-serif`
    ctx.fillText(o.type.label, x, y + h / 2 - 6 * scale)
  }
}

function drawCol(ctx, c) {
  const { y, scale } = projectZ(c.depth)
  if (scale < 0.15) return
  const x = laneX(c.lane, c.depth), r = 16 * scale

  ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 14 * scale
  ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  if (scale > 0.3) {
    ctx.fillStyle = '#1e293b'; ctx.font = `bold ${Math.floor(16 * scale)}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('💰', x, y + 1)
  }
  ctx.shadowBlur = 0
}

function drawHUD(ctx, score, lives, speed) {
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillText(`💰 ${score}`, 15, 15)
  ctx.textAlign = 'right'
  for (let i = 0; i < lives; i++) { ctx.fillStyle = '#ef4444'; ctx.fillText('♥', CW - 15 - i * 28, 15) }
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(`Speed: ${speed.toFixed(1)}`, CW / 2, 15)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '12px sans-serif'
  ctx.fillText('← → Arrow keys or swipe to dodge', CW / 2, CH - 20)

  // Pause button (top-right, below lives)
  const pbx = CW - 35, pby = 44, pbs = 32
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.beginPath()
  ctx.arc(pbx, pby, pbs / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillRect(pbx - 7, pby - 8, 5, 16)
  ctx.fillRect(pbx + 2, pby - 8, 5, 16)
}

function drawParticles(ctx, parts) {
  for (const p of parts) {
    ctx.globalAlpha = p.life / p.ml
    ctx.fillStyle = p.color
    const s = p.size * ctx.globalAlpha
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
  }
  ctx.globalAlpha = 1
}

function drawTip(ctx, text, timer) {
  if (timer <= 0 || !text) return
  ctx.globalAlpha = Math.min(1, timer / 30); ctx.fillStyle = '#fef3c7'
  ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(`⚠ ${text}`, CW / 2, HY + 60); ctx.globalAlpha = 1
}

function spawnParticles(arr, x, y, count, color, sizeRange, speedRange, life) {
  for (let i = 0; i < count; i++) {
    arr.push({
      x: x + (Math.random() - 0.5) * speedRange * 5,
      y: y + (Math.random() - 0.5) * speedRange * 4,
      dx: (Math.random() - 0.5) * speedRange,
      dy: (Math.random() - 0.5) * speedRange,
      life, ml: life, color, size: randInt(sizeRange[0], sizeRange[1]),
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
function PausePopup({ onResume, onRestart, onExit, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="text-4xl mb-3">⏸️</div>
          <h3 className="text-xl font-bold text-gray-900">
            {t('game.runner.paused.title', 'Game Paused')}
          </h3>
        </div>
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-base transition-colors shadow-md active:scale-[0.98]"
          >
            {t('game.runner.paused.resume', '▶  Continue')}
          </button>
          <button
            onClick={onRestart}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-base transition-colors shadow-md active:scale-[0.98]"
          >
            {t('game.runner.paused.restart', '🔄  Restart')}
          </button>
          <button
            onClick={onExit}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-base transition-colors shadow-md active:scale-[0.98]"
          >
            {t('game.runner.paused.exit', '🚪  Exit')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ScamPopup({ scam, onContinue, t }) {
  if (!scam) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ background: `linear-gradient(135deg, ${scam.color}22, ${scam.color}11)` }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{scam.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{scam.title}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: scam.color }}>
                {scam.label}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">{scam.desc}</p>
        </div>

        {/* Red Flags */}
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

        {/* How to Avoid */}
        <div className="px-6 py-4 bg-green-50 border-t border-green-100">
          <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <span>🛡️</span> {t('game.runner.popup.howToAvoid', 'How to Protect Yourself')}
          </h4>
          <p className="text-sm text-green-800 leading-relaxed">{scam.avoid}</p>
        </div>

        {/* Continue Button */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onContinue}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-base transition-colors shadow-md active:scale-[0.98]"
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
  const [showPause, setShowPause] = useState(false)
  const keysRef = useRef({ left: false, right: false })
  const touchRef = useRef({ startX: 0, swiping: false })
  const soundRef = useRef(null)
  const continueRef = useRef(null)

  const handleStart = useCallback(() => {
    gameRef.current = {
      state: 'playing', score: 0, lives: 7, speed: SPD0, frameCount: 0,
      spawnT: 0, collectT: 0, invT: 0, paused: false,
      player: { lane: 1, targetLane: 1 },
      obstacles: [], collectibles: [], particles: [],
      tipText: '', tipTimer: 0, scrollOff: 0, switchCD: 0,
    }
    if (!soundRef.current) soundRef.current = createSoundManager()
    soundRef.current.startBgm()
    setGameState('playing'); setFinalScore(0); setScamPopup(null); setShowPause(false)
  }, [])

  const handleContinue = useCallback(() => {
    setScamPopup(null)
    if (gameRef.current) gameRef.current.paused = false
  }, [])

  const handlePauseToggle = useCallback(() => {
    if (gameRef.current?.state !== 'playing') return
    setShowPause((p) => {
      const next = !p
      if (gameRef.current) gameRef.current.paused = next
      return next
    })
  }, [])

  const handleRestart = useCallback(() => {
    setShowPause(false); setScamPopup(null)
    handleStart()
  }, [handleStart])

  const handleExit = useCallback(() => {
    if (soundRef.current) soundRef.current.stopBgm()
    setShowPause(false); setScamPopup(null)
    gameRef.current = null
    setGameState('idle')
  }, [])

  useEffect(() => { continueRef.current = handleContinue }, [handleContinue])

  useEffect(() => {
    const kd = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); keysRef.current.left = true }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); keysRef.current.right = true }
      if (e.code === 'Enter' || e.code === 'Space') {
        if ((scamPopup || showPause) && continueRef.current) { e.preventDefault(); continueRef.current() }
      }
      if (e.code === 'Escape') {
        if (scamPopup) return
        if (gameRef.current?.state === 'playing') {
          e.preventDefault()
          handlePauseToggle()
        }
      }
    }
    const ku = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false
    }
    const ts = (e) => { touchRef.current.startX = e.touches[0].clientX; touchRef.current.swiping = true }
    const tm = (e) => {
      if (!touchRef.current.swiping) return
      const dx = e.touches[0].clientX - touchRef.current.startX
      if (Math.abs(dx) > 30) {
        dx < 0 ? (keysRef.current.left = true) : (keysRef.current.right = true)
        touchRef.current.swiping = false
      }
    }
    const te = () => { touchRef.current.swiping = false; keysRef.current.left = false; keysRef.current.right = false }
    const onClick = (e) => {
      const cv = canvasRef.current
      if (!cv || gameRef.current?.state !== 'playing') return
      const rect = cv.getBoundingClientRect()
      const scaleX = CW / rect.width
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * (CH / rect.height)
      if (x > CW - 60 && y < 75) handlePauseToggle()
    }

    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    const cv = canvasRef.current
    if (cv) {
      cv.addEventListener('touchstart', ts, { passive: true }); cv.addEventListener('touchmove', tm, { passive: true }); cv.addEventListener('touchend', te, { passive: true })
      cv.addEventListener('click', onClick)
    }
    return () => {
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku)
      if (cv) { cv.removeEventListener('touchstart', ts); cv.removeEventListener('touchmove', tm); cv.removeEventListener('touchend', te); cv.removeEventListener('click', onClick) }
    }
  }, [scamPopup, showPause, handlePauseToggle])

  useEffect(() => {
    if (gameState !== 'playing') return
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')

    const loop = () => {
      const g = gameRef.current
      if (!g || g.state !== 'playing') return
      if (g.paused) { animRef.current = requestAnimationFrame(loop); return }

      g.frameCount++; g.scrollOff += g.speed
      if (g.speed < SPDMAX) g.speed += SPDINC

      // Lane switching
      if (g.switchCD > 0) g.switchCD--
      if (g.switchCD <= 0) {
        if (keysRef.current.left && g.player.targetLane > 0) { g.player.targetLane--; g.switchCD = 12; keysRef.current.left = false }
        if (keysRef.current.right && g.player.targetLane < LANES - 1) { g.player.targetLane++; g.switchCD = 12; keysRef.current.right = false }
      }
      if (Math.abs(g.player.targetLane - g.player.lane) > 0.1)
        g.player.lane += (g.player.targetLane - g.player.lane) * 0.2
      else g.player.lane = g.player.targetLane

      // Spawn obstacles
      if (++g.spawnT >= SPAWN_INT) {
        g.spawnT = 0
        const s = scenarios.length > 0 ? pick(scenarios) : null
        g.obstacles.push({ lane: randInt(0, LANES - 1), depth: 1, type: pick(SCAM_TYPES), scenario: s })
      }

      // Spawn collectibles
      if (++g.collectT >= COLLECT_INT) {
        g.collectT = 0
        const l = randInt(0, LANES - 1)
        if (!g.obstacles.some((o) => o.lane === l && o.depth > 0.7))
          g.collectibles.push({ lane: l, depth: 1 })
      }

      moveAndCull(g.obstacles, g.speed)
      moveAndCull(g.collectibles, g.speed)

      const pl = Math.round(g.player.lane)

      // Collision: obstacles
      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const o = g.obstacles[i]
        if (o.lane === pl && o.depth > -0.05 && o.depth < 0.15) {
          g.obstacles.splice(i, 1)
          if (g.invT <= 0) {
            g.lives--; g.invT = INV_FRAMES
            g.score = Math.max(0, g.score - 3)
            spawnParticles(g.particles, LC[pl], PY, 15, '#ef4444', [3, 7], 8, 40)
            if (soundRef.current) soundRef.current.hit()

            // Show scam popup and pause game
            g.paused = true
            setScamPopup(o.type)

            if (g.lives <= 0) {
              if (soundRef.current) { soundRef.current.stopBgm(); soundRef.current.gameOver() }
              g.state = 'gameOver'; setFinalScore(g.score); setGameState('gameOver'); return
            }
          }
        }
      }

      // Collision: collectibles
      for (let i = g.collectibles.length - 1; i >= 0; i--) {
        const c = g.collectibles[i]
        if (c.lane === pl && c.depth > -0.05 && c.depth < 0.15) {
          g.collectibles.splice(i, 1); g.score++
          spawnParticles(g.particles, LC[pl], PY, 10, '#22c55e', [2, 5], 6, 30)
          if (soundRef.current) soundRef.current.collect()
        }
      }

      // Update particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]
        p.x += p.dx; p.y += p.dy; p.dx *= 0.95; p.dy *= 0.95
        if (--p.life <= 0) g.particles.splice(i, 1)
      }

      if (g.tipTimer > 0) g.tipTimer--
      if (g.invT > 0) g.invT--

      // Render
      ctx.clearRect(0, 0, CW, CH)
      drawBg(ctx, g.scrollOff)
      g.collectibles.forEach((c) => drawCol(ctx, c))
      g.obstacles.forEach((o) => drawObs(ctx, o))
      drawPlayer(ctx, g.player, g.invT > 0)
      drawParticles(ctx, g.particles)
      drawHUD(ctx, g.score, g.lives, g.speed)
      drawTip(ctx, g.tipText, g.tipTimer)

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [gameState, scenarios])

  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏃‍♂️📱</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('game.runner.title', 'Scam Runner')}
          </h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            {t('game.runner.intro', 'Run through the digital city! Dodge scam obstacles and collect safe messages. Learn about each scam type when you hit one!')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3 border border-green-200">
            <span className="text-lg">💰</span>
            <span className="text-green-800">Collect cash = +1 point</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 rounded-lg p-3 border border-red-200">
            <span className="text-red-600 text-lg">⛔</span>
            <span className="text-red-800">Hit red = learn about scam</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mb-8 text-sm text-gray-600 max-w-sm text-center">
          <p className="font-medium text-gray-700 mb-2">{t('game.runner.controls', 'Controls')}</p>
          <p>🖥️ Desktop: <span className="font-mono bg-gray-200 px-1 rounded">← →</span> arrow keys, <span className="font-mono bg-gray-200 px-1 rounded">Enter</span> continue, <span className="font-mono bg-gray-200 px-1 rounded">Esc</span> pause</p>
          <p>📱 Mobile: <span className="font-mono bg-gray-200 px-1 rounded">Swipe</span> left/right, <span className="font-mono bg-gray-200 px-1 rounded">Tap ▐▐</span> to pause</p>
        </div>
        <button onClick={handleStart} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-lg transition-colors shadow-lg">
          {t('game.runner.start', 'Start Running')}
        </button>
      </div>
    )
  }

  if (gameState === 'gameOver') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">💀</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('game.runner.gameOver', 'Game Over')}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">💰</span>
            <span className="text-3xl font-bold text-amber-500">{finalScore}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {finalScore >= 30
              ? t('game.runner.great', 'Amazing! You really know how to spot scams!')
              : finalScore >= 15
              ? t('game.runner.good', 'Good job! Keep practicing to improve.')
              : t('game.runner.learn', 'Keep learning! Review the scam patterns to improve.')}
          </p>
          <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 font-medium leading-relaxed">
              ⚠️ {t('game.runner.warning', 'In real life, scammers steal your money! Stay alert, verify before you trust, and protect your wallet. If you fall for a scam, you lose real cash!')}
            </p>
          </div>
        </div>
        <button onClick={handleStart} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-lg transition-colors shadow-lg">
          {t('game.runner.playAgain', 'Play Again')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex justify-center py-4">
      <canvas ref={canvasRef} width={CW} height={CH} className="rounded-xl border border-gray-200 shadow-lg max-w-full" style={{ touchAction: 'none', maxHeight: '70vh' }} />
      <ScamPopup scam={scamPopup} onContinue={handleContinue} t={t} />
      {showPause && (
        <PausePopup
          onResume={handlePauseToggle}
          onRestart={handleRestart}
          onExit={handleExit}
          t={t}
        />
      )}
    </div>
  )
}
