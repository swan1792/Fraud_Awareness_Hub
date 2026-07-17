import Phaser from "phaser"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * BossBattle - Boss confrontation scene
 * Player presents evidence to defeat the scam boss
 */
export class BossBattle extends Phaser.Scene {
  constructor() {
    super({ key: "BossBattle" })

    this.bossData = null
    this.playerEvidence = []
    this.requiredEvidence = []
    this.hp = 3
    this.maxHp = 3
    this.onComplete = null
    this.isDefeated = false

    // UI
    this.bossSprite = null
    this.hpBar = null
    this.hpText = null
    this.dialogueText = null
    this.evidenceButtons = []
    this.feedbackText = null
  }

  init(data) {
    this.bossData = data?.boss || null
    this.playerEvidence = data?.playerEvidence || []
    this.requiredEvidence = data?.requiredEvidence || []
    this.hp = this.bossData?.hp || 3
    this.maxHp = this.bossData?.hp || 3
    this.onComplete = data?.onComplete || null
    this.isDefeated = false
    this.t = (key) => window.__GAME_TRANSLATIONS?.[key] || key
  }

  create() {
    if (!this.bossData) {
      this.close()
      return
    }

    const { width, height } = this.cameras.main

    // Dark battle background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a0a0a, 0x2a0a0a, 0x1a0a0a, 0x0a0a0a, 1)
    bg.fillRect(0, 0, width, height)

    // Tension lines
    for (let i = 0; i < 8; i++) {
      const line = this.add.graphics()
      line.lineStyle(1, 0xff0000, 0.1)
      line.lineBetween(0, i * 60, width, i * 60 + 30)
    }

    // ─── BOSS DISPLAY ───
    this.createBossDisplay(width, height)

    // ─── HP BAR ───
    this.createHpBar(width)

    // ─── DIALOGUE BOX ───
    this.createDialogueBox(width, height)

    // ─── EVIDENCE SELECTION ───
    this.createEvidenceSelection(width, height)

    // Start with boss intro
    this.showBossIntro()
  }

  createBossDisplay(width, height) {
    // Boss name
    this.add.text(width / 2, 25, `⚔️ ${this.bossData.name}`, {
      font: "bold 18px Arial",
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5)

    // Boss title
    this.add.text(width / 2, 45, this.bossData.title || "Scam Boss", {
      font: "11px Arial",
      color: "#ff8888",
    }).setOrigin(0.5)

    // Boss sprite (large)
    const spriteY = 100
    this.bossSprite = this.add.graphics()
    this.bossSprite.fillStyle(0x8b0000, 1)
    this.bossSprite.fillRect(width / 2 - 25, spriteY - 30, 50, 60)
    this.bossSprite.fillStyle(0xf5deb3, 1)
    this.bossSprite.fillCircle(width / 2, spriteY - 40, 18)
    this.bossSprite.fillStyle(0x1a1a1a, 1)
    this.bossSprite.fillRect(width / 2 - 15, spriteY - 58, 30, 10)
    this.bossSprite.fillStyle(0x000000, 1)
    this.bossSprite.fillRect(width / 2 - 8, spriteY - 44, 3, 3)
    this.bossSprite.fillRect(width / 2 + 5, spriteY - 44, 3, 3)
    // Evil grin
    this.bossSprite.lineStyle(2, 0x000000)
    this.bossSprite.beginPath()
    this.bossSprite.moveTo(width / 2 - 8, spriteY - 34)
    this.bossSprite.lineTo(width / 2 + 8, spriteY - 32)
    this.bossSprite.strokePath()

    // Tint effect
    this.tweens.add({
      targets: this.bossSprite,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    })
  }

  createHpBar(width) {
    const barW = 200
    const barH = 20
    const barX = width / 2 - barW / 2
    const barY = 155

    // Background
    this.add.rectangle(width / 2, barY + barH / 2, barW + 4, barH + 4, 0x333333)
      .setStrokeStyle(2, 0xff4444)

    // HP fill
    this.hpBar = this.add.rectangle(barX + 2, barY + 2, barW - 4, barH - 4, 0xff4444)
    this.hpBar.setOrigin(0, 0)

    // HP text
    this.hpText = this.add.text(width / 2, barY + barH / 2, `HP: ${this.hp}/${this.maxHp}`, {
      font: "bold 10px Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 1,
    }).setOrigin(0.5)

    // Label
    this.add.text(barX - 5, barY + barH / 2, "❤️", {
      font: "12px Arial",
    }).setOrigin(1, 0.5)
  }

  createDialogueBox(width, height) {
    const boxH = 60
    const boxY = height - boxH - 10

    const box = this.add.graphics()
    box.fillStyle(0x1a1a2e, 0.95)
    box.fillRoundedRect(10, boxY, width - 20, boxH, 10)
    box.lineStyle(2, 0xff4444)
    box.strokeRoundedRect(10, boxY, width - 20, boxH, 10)

    this.dialogueText = this.add.text(width / 2, boxY + boxH / 2, "", {
      font: "11px Arial",
      color: "#ffffff",
      wordWrap: { width: width - 40 },
      align: "center",
    }).setOrigin(0.5)
  }

  createEvidenceSelection(width, height) {
    const startY = 185
    const btnH = 28
    const btnW = width - 40
    const gap = 6

    this.evidenceButtons = []

    // Filter to only relevant evidence
    const relevantEvidence = this.playerEvidence.filter(ev =>
      this.requiredEvidence.includes(ev.id)
    )

    relevantEvidence.forEach((ev, i) => {
      const by = startY + i * (btnH + gap)
      if (by > height - 90) return

      const btn = this.add.graphics()
      const isUsed = this.bossData._presentedEvidence?.includes(ev.id)
      btn.fillStyle(isUsed ? 0x333333 : 0x1a3a1a, 0.9)
      btn.fillRoundedRect(20, by, btnW, btnH, 6)
      btn.lineStyle(isUsed ? 1 : 2, isUsed ? 0x555555 : 0x4caf50)
      btn.strokeRoundedRect(20, by, btnW, btnH, 6)

      const icon = this.getEvidenceIcon(ev.evidenceType)
      const label = this.add.text(35, by + btnH / 2, `${icon} ${ev.title}`, {
        font: "9px Arial",
        color: isUsed ? "#666666" : "#ffffff",
      }).setOrigin(0, 0.5)

      if (isUsed) {
        const check = this.add.text(btnW + 10, by + btnH / 2, "✓", {
          font: "bold 12px Arial",
          color: "#4caf50",
        }).setOrigin(0.5)
        this.evidenceButtons.push({ btn, label, check, evidence: ev, used: true })
      } else {
        const hitArea = this.add.rectangle(20 + btnW / 2, by + btnH / 2, btnW, btnH, 0x000000, 0)
        hitArea.setInteractive({ useHandCursor: true })
        hitArea.on("pointerdown", () => this.presentEvidence(ev))

        this.evidenceButtons.push({ btn, label, hitArea, evidence: ev, used: false })
      }

      this.children.add([btn, label])
    })

    // Show hint if no relevant evidence
    if (relevantEvidence.length === 0) {
      this.add.text(width / 2, startY + 30, this.t("boss.noEvidence"), {
        font: "10px Arial",
        color: "#888888",
        align: "center",
      }).setOrigin(0.5)
    }
  }

  getEvidenceIcon(type) {
    const icons = {
      sms: "💬", call_log: "📞", screenshot: "📸", photo: "📷",
      qr_scan: "📱", witness: "👤", document: "📄", recording: "🎙️",
    }
    return icons[type] || "❓"
  }

  showBossIntro() {
    this.dialogueText.setText(this.t("boss.readyToFight").replace("{{name}}", this.bossData.name))
    this.cameras.main.shake(300, 0.01)
  }

  presentEvidence(evidence) {
    if (this.isDefeated) return

    // Send to API
    fetch(`${API_URL}/api/bosses/${this.bossData.id}/present`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evidenceId: evidence.id }),
    })
    .then(res => res.json())
    .then(result => {
      if (result.bossDefeated) {
        this.handleBossDefeated(result)
      } else {
        this.handleDamageDealt(evidence, result)
      }
    })
    .catch(err => {
      console.error("Failed to present evidence:", err)
      this.showFeedback("Failed to present evidence!", "#ff4444")
    })
  }

  handleDamageDealt(evidence, result) {
    this.hp = result.hpRemaining

    // Update HP bar
    const percentage = this.hp / this.maxHp
    this.hpBar.width = 196 * percentage
    this.hpText.setText(`HP: ${this.hp}/${this.maxHp}`)

    if (percentage <= 0.33) {
      this.hpBar.fillColor = 0xff2222
    } else if (percentage <= 0.66) {
      this.hpBar.fillColor = 0xffaa22
    }

    // Boss damage animation
    this.tweens.add({
      targets: this.bossSprite,
      x: this.bossSprite.x + 20,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
    })

    // Screen shake
    this.cameras.main.shake(200, 0.02)

    // Flash effect
    this.cameras.main.flash(150, 255, 68, 68)

    // Show feedback
    const isWeakness = evidence.evidenceType === this.bossData.weakness
    const damage = isWeakness ? this.t("boss.criticalHit") : this.t("boss.evidencePresented")
    const color = isWeakness ? "#ffd700" : "#4caf50"
    this.showFeedback(`💥 ${damage} (${result.evidencePresented}/${result.evidenceRequired})`, color)

    // Update dialogue
    this.dialogueText.setText(this.t("boss.losingConfidence").replace("{{name}}", this.bossData.name).replace("{{remaining}}", result.evidenceRequired - result.evidencePresented))

    // Mark evidence as used
    if (!this.bossData._presentedEvidence) this.bossData._presentedEvidence = []
    this.bossData._presentedEvidence.push(evidence.id)

    // Refresh evidence buttons
    this.refreshEvidenceButtons()
  }

  handleBossDefeated(result) {
    this.isDefeated = true
    this.hp = 0
    this.hpBar.width = 0
    this.hpText.setText("HP: 0/0")

    // Boss defeat animation
    this.tweens.add({
      targets: this.bossSprite,
      alpha: 0,
      y: this.bossSprite.y + 50,
      scaleX: 0.3,
      scaleY: 0.3,
      angle: 360,
      duration: 1000,
    })

    // Victory effects
    this.cameras.main.flash(500, 34, 204, 34)

    // Victory text
    const { width, height } = this.cameras.main
    const victoryText = this.add.text(width / 2, height / 2 - 40, this.t("boss.defeated"), {
      font: "bold 20px Arial",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 3,
      backgroundColor: "#00000088",
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5)

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: "Back.easeOut",
    })

    // XP reward
    this.add.text(width / 2, height / 2, `+${result.rewardXp} XP`, {
      font: "bold 14px Arial",
      color: "#ffd700",
    }).setOrigin(0.5)

    // Show defeat dialogue
    if (result.defeatDialogue) {
      this.time.delayedCall(2000, () => {
        this.showDefeatDialogue(result.defeatDialogue)
      })
    } else {
      this.time.delayedCall(3000, () => {
        this.close()
      })
    }
  }

  showDefeatDialogue(dialogue) {
    let lineIndex = 0

    const showLine = () => {
      if (lineIndex >= dialogue.length) {
        this.time.delayedCall(1000, () => {
          if (this.onComplete) {
            this.onComplete({ defeated: true, rewardXp: this.bossData.rewardXp })
          }
          this.close()
        })
        return
      }

      const line = dialogue[lineIndex]
      this.dialogueText.setText(`${line.speaker}: "${line.text}"`)
      lineIndex++
      this.time.delayedCall(3000, showLine)
    }

    showLine()
  }

  showFeedback(text, color) {
    const { width } = this.cameras.main
    if (this.feedbackText) this.feedbackText.destroy()

    this.feedbackText = this.add.text(width / 2, 140, text, {
      font: "bold 11px Arial",
      color: color,
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: this.feedbackText,
      alpha: 1,
      y: 130,
      duration: 200,
      yoyo: true,
      hold: 1000,
    })
  }

  refreshEvidenceButtons() {
    // Simple approach: just update colors
    this.evidenceButtons.forEach(item => {
      if (this.bossData._presentedEvidence?.includes(item.evidence.id)) {
        item.btn.clear()
        item.btn.fillStyle(0x333333, 0.9)
        item.btn.fillRoundedRect(20, item.btn.y || 0, 300, 28, 6)
        item.label.setColor("#666666")
      }
    })
  }

  close() {
    if (this.onComplete && !this.isDefeated) {
      this.onComplete({ defeated: false })
    }
    this.scene.stop("BossBattle")
  }
}
