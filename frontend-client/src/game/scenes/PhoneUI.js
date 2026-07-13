import Phaser from "phaser"

/**
 * PhoneUI - In-game smartphone overlay
 * Opens as a parallel scene on top of WorldScene
 */
export class PhoneUI extends Phaser.Scene {
  constructor() {
    super({ key: "PhoneUI" })

    // State
    this.currentApp = null
    this.isOpen = false

    // UI refs
    this.phoneFrame = null
    this.appGrid = null
    this.appScreens = {}
    this.backButton = null
    this.statusBar = null
  }

  create() {
    const { width, height } = this.cameras.main

    // ─── PHONE FRAME ───
    const phoneW = Math.min(320, width - 40)
    const phoneH = Math.min(500, height - 40)
    const phoneX = (width - phoneW) / 2
    const phoneY = (height - phoneH) / 2

    // Dark overlay behind phone
    this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
    this.overlay.setInteractive() // Block clicks behind phone

    // Phone body
    this.phoneFrame = this.add.graphics()
    this.phoneFrame.fillStyle(0x1a1a1a, 1)
    this.phoneFrame.fillRoundedRect(phoneX, phoneY, phoneW, phoneH, 20)
    this.phoneFrame.lineStyle(3, 0x333333)
    this.phoneFrame.strokeRoundedRect(phoneX, phoneY, phoneW, phoneH, 20)

    // Screen area
    const screenMargin = 8
    const screenX = phoneX + screenMargin
    const screenY = phoneY + 40
    const screenW = phoneW - screenMargin * 2
    const screenH = phoneH - 80

    this.phoneFrame.fillStyle(0x0f1530, 1)
    this.phoneFrame.fillRoundedRect(screenX, screenY, screenW, screenH, 12)

    // Status bar
    this.statusBar = this.add.text(screenX + 10, screenY + 5, "📱 Fraud City Phone", {
      font: "bold 9px Arial",
      color: "#00bcd4",
    })

    // Time
    const now = new Date()
    this.add.text(screenX + screenW - 10, screenY + 5, `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`, {
      font: "9px Arial",
      color: "#888888",
    }).setOrigin(1, 0)

    // ─── APP GRID (home screen) ───
    this.createAppGrid(screenX, screenY + 20, screenW, screenH - 30)

    // ─── BACK BUTTON ───
    this.backButton = this.add.text(width / 2, phoneY + phoneH - 15, "◀ Back", {
      font: "bold 11px Arial",
      color: "#00bcd4",
      backgroundColor: "#222222",
      padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    this.backButton.on("pointerdown", () => this.close())

    // Close on ESC or overlay click
    this.input.keyboard.on("keydown-ESC", () => this.close())
    this.overlay.on("pointerdown", () => this.close())

    // Start closed
    this.close()
  }

  createAppGrid(x, y, w, h) {
    this.appGrid = this.add.container(0, 0)

    const apps = [
      { id: "messages", name: "Messages", icon: "💬", color: 0x4caf50 },
      { id: "contacts", name: "Contacts", icon: "👤", color: 0x2196f3 },
      { id: "skills", name: "Skills", icon: "⭐", color: 0xffd700 },
      { id: "camera", name: "Camera", icon: "📷", color: 0xff9800 },
      { id: "scanner", name: "Scanner", icon: "📱", color: 0x9c27b0 },
      { id: "notebook", name: "Notebook", icon: "📝", color: 0x795548 },
      { id: "map", name: "Map", icon: "🗺️", color: 0x009688 },
      { id: "evidence", name: "Evidence", icon: "🔍", color: 0xf44336 },
    ]

    const cols = 3
    const appSize = 60
    const gap = 12
    const startX = x + (w - (cols * appSize + (cols - 1) * gap)) / 2
    const startY = y + 20

    apps.forEach((app, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const ax = startX + col * (appSize + gap)
      const ay = startY + row * (appSize + gap + 14)

      // App icon background
      const iconBg = this.add.graphics()
      iconBg.fillStyle(app.color, 0.9)
      iconBg.fillRoundedRect(ax, ay, appSize, appSize, 14)

      // App icon emoji
      const icon = this.add.text(ax + appSize / 2, ay + appSize / 2 - 4, app.icon, {
        font: "24px Arial",
      }).setOrigin(0.5)

      // App name
      const name = this.add.text(ax + appSize / 2, ay + appSize + 6, app.name, {
        font: "9px Arial",
        color: "#cccccc",
      }).setOrigin(0.5)

      // Interactive
      const hitArea = this.add.rectangle(ax + appSize / 2, ay + appSize / 2, appSize, appSize, 0x000000, 0)
      hitArea.setInteractive({ useHandCursor: true })
      hitArea.on("pointerdown", () => this.openApp(app.id))

      this.appGrid.add([iconBg, icon, name, hitArea])
    })
  }

  openApp(appId) {
    this.currentApp = appId
    this.appGrid.setVisible(false)

    const { width, height } = this.cameras.main
    const screenMargin = 8
    const screenX = (width - (Math.min(320, width - 40) - screenMargin * 2)) / 2
    const screenY = 48
    const screenW = Math.min(320, width - 40) - screenMargin * 2
    const screenH = Math.min(500, height - 40) - 80

    switch (appId) {
      case "messages": this.showMessages(screenX, screenY + 20, screenW, screenH - 30); break
      case "contacts": this.showContacts(screenX, screenY + 20, screenW, screenH - 30); break
      case "skills": this.showSkills(screenX, screenY + 20, screenW, screenH - 30); break
      case "camera": this.showCamera(screenX, screenY + 20, screenW, screenH - 30); break
      case "scanner": this.showScanner(screenX, screenY + 20, screenW, screenH - 30); break
      case "notebook": this.showNotebook(screenX, screenY + 20, screenW, screenH - 30); break
      case "map": this.showMap(screenX, screenY + 20, screenW, screenH - 30); break
      case "evidence": this.showEvidence(screenX, screenY + 20, screenW, screenH - 30); break
    }
  }

  closeApp() {
    if (this.currentScreen) {
      this.currentScreen.destroy()
      this.currentScreen = null
    }
    this.currentApp = null
    this.appGrid.setVisible(true)
  }

  // ─── MESSAGES APP ───
  showMessages(x, y, w, h) {
    this.currentScreen = this.add.container(0, 0)

    // Title
    const title = this.add.text(x + 10, y, "💬 Messages", {
      font: "bold 13px Arial",
      color: "#ffffff",
    })
    this.currentScreen.add(title)

    // Scam messages
    const messages = [
      { from: "KBZ Security", text: "Your account is locked! Verify now: kbz-verify.net", time: "2 min ago", scam: true },
      { from: "Wave Money", text: "You have a 50,000 MMK refund. Call 09-123456789", time: "1 hr ago", scam: true },
      { from: "Mom", text: "Don't forget to eat lunch!", time: "3 hrs ago", scam: false },
      { from: "Unknown", text: "You won a lottery! Click here to claim: lottery-win.mm", time: "5 hrs ago", scam: true },
      { from: "U Kyaw Win", text: "Be careful at the ATM today", time: "Yesterday", scam: false },
    ]

    messages.forEach((msg, i) => {
      const my = y + 30 + i * 52
      if (my > y + h - 20) return

      // Message card
      const card = this.add.graphics()
      card.fillStyle(msg.scam ? 0x4a1a1a : 0x1a2a3a, 0.9)
      card.fillRoundedRect(x + 5, my, w - 10, 46, 8)
      if (msg.scam) {
        card.lineStyle(1, 0xff4444, 0.5)
        card.strokeRoundedRect(x + 5, my, w - 10, 46, 8)
      }

      // Sender
      const sender = this.add.text(x + 15, my + 6, msg.from, {
        font: "bold 10px Arial",
        color: msg.scam ? "#ff6666" : "#4fc3f7",
      })

      // Text
      const text = this.add.text(x + 15, my + 20, msg.text, {
        font: "9px Arial",
        color: "#cccccc",
        wordWrap: { width: w - 80 },
      })

      // Time
      const time = this.add.text(x + w - 15, my + 6, msg.time, {
        font: "8px Arial",
        color: "#888888",
      }).setOrigin(1, 0)

      // Scam warning
      if (msg.scam) {
        const warn = this.add.text(x + w - 15, my + 32, "⚠️ SCAM", {
          font: "bold 8px Arial",
          color: "#ff4444",
        }).setOrigin(1, 0)
        this.currentScreen.add(warn)
      }

      this.currentScreen.add([card, sender, text, time])
    })
  }

  // ─── CONTACTS APP ───
  showContacts(x, y, w, h) {
    this.currentScreen = this.add.container(0, 0)

    const title = this.add.text(x + 10, y, "👤 Contacts", {
      font: "bold 13px Arial",
      color: "#ffffff",
    })
    this.currentScreen.add(title)

    // Fetch relationships from API
    fetch("http://localhost:3001/api/relationships")
      .then(res => res.json())
      .then(contacts => {
        if (contacts.length === 0) {
          const empty = this.add.text(x + w / 2, y + 60, "No contacts yet.\nTalk to NPCs to add them!", {
            font: "10px Arial",
            color: "#888888",
            align: "center",
          }).setOrigin(0.5)
          this.currentScreen.add(empty)
          return
        }

        contacts.forEach((contact, i) => {
          const cy = y + 30 + i * 44
          if (cy > y + h - 20) return

          const card = this.add.graphics()
          card.fillStyle(0x1a2a3a, 0.9)
          card.fillRoundedRect(x + 5, cy, w - 10, 38, 8)

          // Name
          const name = this.add.text(x + 15, cy + 6, contact.npcName, {
            font: "bold 10px Arial",
            color: "#ffffff",
          })

          // Type
          const type = this.add.text(x + 15, cy + 22, contact.npcType.replace("_", " "), {
            font: "8px Arial",
            color: "#888888",
          })

          // Trust bar
          const trustColor = contact.trustLevel >= 70 ? 0x4caf50 : contact.trustLevel >= 40 ? 0xff9800 : 0xf44336
          const trustBar = this.add.graphics()
          trustBar.fillStyle(0x333333, 1)
          trustBar.fillRoundedRect(x + w - 80, cy + 8, 60, 6, 3)
          trustBar.fillStyle(trustColor, 1)
          trustBar.fillRoundedRect(x + w - 80, cy + 8, 60 * (contact.trustLevel / 100), 6, 3)

          const trustText = this.add.text(x + w - 15, cy + 6, `${contact.trustLevel}%`, {
            font: "bold 9px Arial",
            color: `#${trustColor.toString(16).padStart(6, "0")}`,
          }).setOrigin(1, 0)

          // Talks count
          const talks = this.add.text(x + w - 15, cy + 22, `${contact.totalTalks} talks`, {
            font: "8px Arial",
            color: "#666666",
          }).setOrigin(1, 0)

          this.currentScreen.add([card, name, type, trustBar, trustText, talks])
        })
      })
      .catch(() => {
        const err = this.add.text(x + w / 2, y + 60, "Failed to load contacts", {
          font: "10px Arial",
          color: "#ff4444",
        }).setOrigin(0.5)
        this.currentScreen.add(err)
      })
  }

  // ─── CAMERA APP ───
  showCamera(x, y, w, h) {
    this.currentScreen = this.add.container(0, 0)

    // Camera viewfinder
    const viewfinder = this.add.graphics()
    viewfinder.fillStyle(0x111111, 1)
    viewfinder.fillRoundedRect(x, y, w, h - 40, 8)

    // Crosshair
    viewfinder.lineStyle(2, 0x00bcd4, 0.5)
    viewfinder.strokeRect(x + 20, y + 20, w - 40, h - 80)

    // Center cross
    viewfinder.lineStyle(1, 0x00bcd4, 0.8)
    viewfinder.lineBetween(x + w / 2 - 15, y + h / 2 - 20, x + w / 2 + 15, y + h / 2 - 20)
    viewfinder.lineBetween(x + w / 2, y + h / 2 - 35, x + w / 2, y + h / 2 - 5)

    const hint = this.add.text(x + w / 2, y + 15, "📷 Camera", {
      font: "bold 11px Arial",
      color: "#00bcd4",
    }).setOrigin(0.5)

    const desc = this.add.text(x + w / 2, y + h / 2 - 20, "Point at evidence\nto photograph it", {
      font: "10px Arial",
      color: "#888888",
      align: "center",
    }).setOrigin(0.5)

    // Capture button
    const captureBtn = this.add.graphics()
    captureBtn.fillStyle(0xff4444, 1)
    captureBtn.fillCircle(x + w / 2, y + h - 25, 18)
    captureBtn.lineStyle(3, 0xffffff, 1)
    captureBtn.strokeCircle(x + w / 2, y + h - 25, 18)

    const captureText = this.add.text(x + w / 2, y + h - 25, "📸", {
      font: "16px Arial",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    captureText.on("pointerdown", () => {
      this.cameras.main.flash(200, 255, 255, 255)
      const saved = this.add.text(x + w / 2, y + h / 2, "✅ Evidence Photographed!", {
        font: "bold 11px Arial",
        color: "#4caf50",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5)
      this.currentScreen.add(saved)
      this.time.delayedCall(1500, () => saved.destroy())
    })

    this.currentScreen.add([viewfinder, hint, desc, captureBtn, captureText])
  }

  // ─── SCANNER APP ───
  showScanner(x, y, w, h) {
    this.currentScreen = this.add.container(0, 0)

    const bg = this.add.graphics()
    bg.fillStyle(0x111111, 1)
    bg.fillRoundedRect(x, y, w, h - 40, 8)

    const title = this.add.text(x + w / 2, y + 20, "📱 QR Scanner", {
      font: "bold 13px Arial",
      color: "#9c27b0",
    }).setOrigin(0.5)

    // Scan area
    const scanArea = this.add.graphics()
    scanArea.lineStyle(3, 0x9c27b0, 0.8)
    scanArea.strokeRect(x + 30, y + 50, w - 60, h - 120)

    // Scanning line animation
    const scanLine = this.add.graphics()
    scanLine.fillStyle(0x9c27b0, 0.6)
    scanLine.fillRect(x + 35, y + 55, w - 70, 3)

    this.tweens.add({
      targets: scanLine,
      y: y + h - 75,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })

    const hint = this.add.text(x + w / 2, y + h - 50, "Point camera at QR code\nto scan it", {
      font: "10px Arial",
      color: "#888888",
      align: "center",
    }).setOrigin(0.5)

    this.currentScreen.add([bg, title, scanArea, scanLine, hint])
  }

  // ─── NOTEBOOK APP ───
  showNotebook(x, y, w, h) {
    this.currentScreen = this.add.container(0, 0)

    const bg = this.add.graphics()
    bg.fillStyle(0xfff8e1, 1)
    bg.fillRoundedRect(x, y, w, h - 40, 8)

    const title = this.add.text(x + 10, y + 8, "📝 Investigation Notebook", {
      font: "bold 12px Arial",
      color: "#5d4037",
    })

    // Ruled lines
    for (let i = 0; i < 15; i++) {
      const lineY = y + 35 + i * 18
      if (lineY > y + h - 50) break
      const line = this.add.graphics()
      line.lineStyle(1, 0xbbdefb, 0.5)
      line.lineBetween(x + 10, lineY, x + w - 10, lineY)
      this.currentScreen.add(line)
    }

    // Clue entries
    const clues = [
      { text: "ATM skimmer sticker spotted at neighborhood booth", icon: "🔍" },
      { text: "Phishing SMS from kbz-verify.net - fake KBZ link", icon: "⚠️" },
      { text: "Shady Guy selling phones in market - possible scam", icon: "🎭" },
      { text: "Delivery call asking for 15,000 MMK - fake fee", icon: "📦" },
    ]

    clues.forEach((clue, i) => {
      const cy = y + 35 + i * 18
      if (cy > y + h - 50) return
      const entry = this.add.text(x + 15, cy, `${clue.icon} ${clue.text}`, {
        font: "9px Arial",
        color: "#333333",
        wordWrap: { width: w - 30 },
      })
      this.currentScreen.add(entry)
    })

    this.currentScreen.add([bg, title])
  }

  // ─── MAP APP ───
  showMap(x, y, w, h) {
    this.currentScreen = this.add.container(0, 0)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a2a1a, 1)
    bg.fillRoundedRect(x, y, w, h - 40, 8)

    const title = this.add.text(x + 10, y + 8, "🗺️ Fraud City Map", {
      font: "bold 12px Arial",
      color: "#009688",
    })

    // Simple map grid
    const mapArea = this.add.graphics()
    mapArea.fillStyle(0x2d5016, 1)
    mapArea.fillRoundedRect(x + 15, y + 30, w - 30, h - 80, 6)

    // Location pins
    const locations = [
      { name: "Home", x: 0.2, y: 0.3, color: 0x4caf50 },
      { name: "Neighborhood", x: 0.4, y: 0.4, color: 0x2196f3 },
      { name: "Market", x: 0.7, y: 0.5, color: 0xff9800 },
      { name: "School", x: 0.5, y: 0.2, color: 0x9c27b0 },
      { name: "ATM", x: 0.3, y: 0.6, color: 0xf44336 },
      { name: "Coffee Shop", x: 0.6, y: 0.7, color: 0x795548 },
    ]

    locations.forEach(loc => {
      const lx = x + 15 + (w - 30) * loc.x
      const ly = y + 30 + (h - 80) * loc.y

      // Pin
      const pin = this.add.graphics()
      pin.fillStyle(loc.color, 1)
      pin.fillCircle(lx, ly, 6)
      pin.fillStyle(0xffffff, 1)
      pin.fillCircle(lx, ly, 2)

      // Label
      const label = this.add.text(lx, ly + 10, loc.name, {
        font: "8px Arial",
        color: "#ffffff",
      }).setOrigin(0.5)

      this.currentScreen.add([pin, label])
    })

    // Current location indicator
    const curLoc = this.add.text(x + w / 2, y + h - 55, "📍 You are here: Neighborhood", {
      font: "bold 9px Arial",
      color: "#00bcd4",
    }).setOrigin(0.5)

    this.currentScreen.add([bg, title, mapArea, curLoc])
  }

  // ─── SKILLS APP ───
  showSkills(x, y, w, h) {
    this.currentScreen = this.add.container(0, 0)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 1)
    bg.fillRoundedRect(x, y, w, h - 40, 8)

    const title = this.add.text(x + 10, y + 8, "⭐ Skills", {
      font: "bold 13px Arial",
      color: "#ffd700",
    })

    // Fetch player stats
    fetch("http://localhost:3001/api/player/stats")
      .then(res => res.json())
      .then(stats => {
        // Skill points
        const spText = this.add.text(x + w - 10, y + 8, `${stats.skillPoints} SP`, {
          font: "bold 11px Arial",
          color: stats.skillPoints > 0 ? "#ffd700" : "#666666",
        }).setOrigin(1, 0)
        this.currentScreen.add(spText)

        // Skill tree
        const skills = [
          { id: "investigation", name: "Investigation", icon: "🔍", desc: "Find evidence faster", color: 0x4caf50 },
          { id: "communication", name: "Communication", icon: "💬", desc: "Better dialogue options", color: 0x2196f3 },
          { id: "trust", name: "Trust", icon: "🤝", desc: "Earn more trust from NPCs", color: 0xff9800 },
          { id: "technology", name: "Technology", icon: "💻", desc: "Use phone features better", color: 0x9c27b0 },
        ]

        skills.forEach((skill, i) => {
          const sy = y + 35 + i * 65
          if (sy > y + h - 60) return

          const level = stats.skills[skill.id] || 0
          const maxLevel = 10
          const canUpgrade = stats.skillPoints > 0 && level < maxLevel

          // Skill card
          const card = this.add.graphics()
          card.fillStyle(0x222233, 0.9)
          card.fillRoundedRect(x + 8, sy, w - 16, 58, 8)
          card.lineStyle(1, canUpgrade ? skill.color : 0x333333)
          card.strokeRoundedRect(x + 8, sy, w - 16, 58, 8)

          // Icon
          const icon = this.add.text(x + 25, sy + 12, skill.icon, {
            font: "18px Arial",
          }).setOrigin(0.5)

          // Name
          const name = this.add.text(x + 42, sy + 6, skill.name, {
            font: "bold 10px Arial",
            color: "#ffffff",
          })

          // Description
          const desc = this.add.text(x + 42, sy + 20, skill.desc, {
            font: "8px Arial",
            color: "#888888",
          })

          // Level bar
          const barW = w - 80
          const barBg = this.add.graphics()
          barBg.fillStyle(0x333333, 1)
          barBg.fillRoundedRect(x + 42, sy + 34, barW, 8, 4)

          const barFill = this.add.graphics()
          barFill.fillStyle(skill.color, 1)
          barFill.fillRoundedRect(x + 42, sy + 34, barW * (level / maxLevel), 8, 4)

          // Level text
          const levelText = this.add.text(x + 42 + barW + 5, sy + 34, `${level}/${maxLevel}`, {
            font: "8px Arial",
            color: "#aaaaaa",
          })

          // Upgrade button
          if (canUpgrade) {
            const btn = this.add.text(x + w - 25, sy + 15, "⬆️", {
              font: "14px Arial",
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })

            btn.on("pointerdown", () => {
              fetch("http://localhost:3001/api/player/skill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skill: skill.id }),
              })
              .then(res => res.json())
              .then(result => {
                if (result.skills) {
                  // Refresh the skills screen
                  this.closeApp()
                  this.showSkills(x, y, w, h)
                }
              })
              .catch(err => console.error("Failed to upgrade skill:", err))
            })
            this.currentScreen.add(btn)
          }

          this.currentScreen.add([card, icon, name, desc, barBg, barFill, levelText])
        })
      })
      .catch(() => {
        const err = this.add.text(x + w / 2, y + 60, "Failed to load skills", {
          font: "10px Arial",
          color: "#ff4444",
        }).setOrigin(0.5)
        this.currentScreen.add(err)
      })

    this.currentScreen.add([bg, title])
  }

  // ─── EVIDENCE APP ───
  showEvidence(x, y, w, h) {
    this.currentScreen = this.add.container(0, 0)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a1a, 1)
    bg.fillRoundedRect(x, y, w, h - 40, 8)

    const title = this.add.text(x + 10, y + 8, "🔍 Evidence Vault", {
      font: "bold 13px Arial",
      color: "#f44336",
    })

    // Fetch evidence
    fetch("http://localhost:3001/api/evidence")
      .then(res => res.json())
      .then(evidence => {
        if (evidence.length === 0) {
          const empty = this.add.text(x + w / 2, y + 60, "No evidence collected yet.\nExplore and investigate!", {
            font: "10px Arial",
            color: "#888888",
            align: "center",
          }).setOrigin(0.5)
          this.currentScreen.add(empty)
          return
        }

        const typeIcons = {
          sms: "💬", call_log: "📞", screenshot: "📸", photo: "📷",
          qr_scan: "📱", witness: "👤", document: "📄", recording: "🎙️",
        }

        evidence.forEach((ev, i) => {
          const ey = y + 30 + i * 40
          if (ey > y + h - 20) return

          const card = this.add.graphics()
          card.fillStyle(!ev.isRead ? 0x2a1a1a : 0x1a2a2a, 0.9)
          card.fillRoundedRect(x + 5, ey, w - 10, 34, 6)

          const icon = this.add.text(x + 20, ey + 17, typeIcons[ev.evidenceType] || "❓", {
            font: "14px Arial",
          }).setOrigin(0.5)

          const name = this.add.text(x + 35, ey + 6, ev.title, {
            font: "bold 9px Arial",
            color: !ev.isRead ? "#ff8888" : "#cccccc",
          })

          const type = this.add.text(x + 35, ey + 20, ev.evidenceType.replace("_", " "), {
            font: "8px Arial",
            color: "#666666",
          })

          this.currentScreen.add([card, icon, name, type])
        })
      })
      .catch(() => {
        const err = this.add.text(x + w / 2, y + 60, "Failed to load evidence", {
          font: "10px Arial",
          color: "#ff4444",
        }).setOrigin(0.5)
        this.currentScreen.add(err)
      })

    this.currentScreen.add([bg, title])
  }

  open() {
    if (this.isOpen) return
    this.isOpen = true
    this.appGrid.setVisible(true)
    this.setVisible(true)
    this.scene.bringToTop()
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false
    this.closeApp()
    this.setVisible(false)
  }

  setVisible(visible) {
    this.children.list.forEach(child => {
      child.setVisible(visible)
    })
  }
}
