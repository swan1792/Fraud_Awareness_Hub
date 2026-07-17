import Phaser from "phaser"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * EvidenceBoard - Overlay showing all collected evidence items
 * Opens from PhoneUI Notebook or when examining evidence
 */
export class EvidenceBoard extends Phaser.Scene {
  constructor() {
    super({ key: "EvidenceBoard" })

    this.evidenceItems = []
    this.selectedEvidence = null
    this.isOpen = false
  }

  init(data) {
    this.evidenceItems = data?.evidence || []
    this.selectedEvidence = null
  }

  create() {
    const { width, height } = this.cameras.main
    this.t = (key) => window.__GAME_TRANSLATIONS?.[key] || key

    // Dark overlay
    this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
    this.overlay.setInteractive()
    this.overlay.on("pointerdown", () => this.close())

    // Board background
    const boardW = Math.min(500, width - 20)
    const boardH = Math.min(380, height - 20)
    const boardX = (width - boardW) / 2
    const boardY = (height - boardH) / 2

    const board = this.add.graphics()
    board.fillStyle(0x2d1b0e, 0.95)
    board.fillRoundedRect(boardX, boardY, boardW, boardH, 12)
    board.lineStyle(3, 0x8b6914)
    board.strokeRoundedRect(boardX, boardY, boardW, boardH, 12)

    // Cork texture dots
    for (let i = 0; i < 30; i++) {
      const dx = boardX + 10 + Math.random() * (boardW - 20)
      const dy = boardY + 10 + Math.random() * (boardH - 20)
      board.fillStyle(0x3d2b1e, 0.3)
      board.fillCircle(dx, dy, 1)
    }

    // Title
    this.add.text(width / 2, boardY + 15, this.t("evidence.title"), {
      font: "bold 16px Arial",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5)

    // Evidence count
    this.add.text(width / 2, boardY + 35, this.t("evidence.itemsCollected").replace("{{count}}", this.evidenceItems.length), {
      font: "10px Arial",
      color: "#aaaaaa",
    }).setOrigin(0.5)

    // Close button
    const closeBtn = this.add.text(boardX + boardW - 15, boardY + 10, "✕", {
      font: "bold 16px Arial",
      color: "#ff6666",
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    closeBtn.on("pointerdown", () => this.close())

    // ESC to close
    this.input.keyboard.on("keydown-ESC", () => this.close())

    // Evidence grid
    this.createEvidenceGrid(boardX + 10, boardY + 50, boardW - 20, boardH - 60)
  }

  createEvidenceGrid(x, y, w, h) {
    const cols = 4
    const itemW = 80
    const itemH = 90
    const gap = 8
    const startX = x + (w - (cols * itemW + (cols - 1) * gap)) / 2

    const typeIcons = {
      sms: "💬",
      call_log: "📞",
      screenshot: "📸",
      photo: "📷",
      qr_scan: "📱",
      witness: "👤",
      document: "📄",
      recording: "🎙️",
    }

    const typeColors = {
      sms: 0x4caf50,
      call_log: 0x2196f3,
      screenshot: 0xff9800,
      photo: 0x9c27b0,
      qr_scan: 0x009688,
      witness: 0x795548,
      document: 0x607d8b,
      recording: 0xf44336,
    }

    this.evidenceItems.forEach((item, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const ix = startX + col * (itemW + gap)
      const iy = y + row * (itemH + gap)

      if (iy + itemH > y + h) return

      // Card background
      const card = this.add.graphics()
      const isUnread = !item.isRead
      card.fillStyle(isUnread ? 0x1a3a1a : 0x1a2a3a, 0.9)
      card.fillRoundedRect(ix, iy, itemW, itemH, 8)
      card.lineStyle(isUnread ? 2 : 1, isUnread ? 0x4caf50 : 0x333333)
      card.strokeRoundedRect(ix, iy, itemW, itemH, 8)

      // Type icon
      const icon = this.add.text(ix + itemW / 2, iy + 20, typeIcons[item.evidenceType] || "❓", {
        font: "20px Arial",
      }).setOrigin(0.5)

      // Title (truncated)
      const title = this.add.text(ix + itemW / 2, iy + 45, item.title.substring(0, 12), {
        font: "8px Arial",
        color: "#ffffff",
        wordWrap: { width: itemW - 8 },
        align: "center",
      }).setOrigin(0.5)

      // Type badge
      const badge = this.add.text(ix + itemW / 2, iy + 65, item.evidenceType.replace("_", " "), {
        font: "7px Arial",
        color: `#${(typeColors[item.evidenceType] || 0x888888).toString(16).padStart(6, "0")}`,
      }).setOrigin(0.5)

      // Unread indicator
      if (isUnread) {
        const dot = this.add.graphics()
        dot.fillStyle(0x4caf50, 1)
        dot.fillCircle(ix + itemW - 8, iy + 8, 4)
      }

      // Interactive
      const hitArea = this.add.rectangle(ix + itemW / 2, iy + itemH / 2, itemW, itemH, 0x000000, 0)
      hitArea.setInteractive({ useHandCursor: true })
      hitArea.on("pointerdown", () => this.showEvidenceDetail(item))

      this.children.add([card, icon, title, badge, hitArea])
    })
  }

  showEvidenceDetail(item) {
    const { width, height } = this.cameras.main
    const detailW = Math.min(350, width - 40)
    const detailH = Math.min(250, height - 40)
    const detailX = (width - detailW) / 2
    const detailY = (height - detailH) / 2

    // Remove existing detail if any
    if (this.detailContainer) {
      this.detailContainer.destroy()
    }

    this.detailContainer = this.add.container(0, 0)

    // Detail background
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.98)
    bg.fillRoundedRect(detailX, detailY, detailW, detailH, 12)
    bg.lineStyle(2, 0x00bcd4)
    bg.strokeRoundedRect(detailX, detailY, detailW, detailH, 12)

    // Close button
    const closeBtn = this.add.text(detailX + detailW - 10, detailY + 8, "✕", {
      font: "bold 14px Arial",
      color: "#ff6666",
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    closeBtn.on("pointerdown", () => {
      this.detailContainer.destroy()
      this.detailContainer = null
    })

    // Title
    const title = this.add.text(detailX + 15, detailY + 12, item.title, {
      font: "bold 13px Arial",
      color: "#00bcd4",
      wordWrap: { width: detailW - 30 },
    })

    // Type
    const type = this.add.text(detailX + 15, detailY + 32, `Type: ${item.evidenceType.replace("_", " ")}`, {
      font: "9px Arial",
      color: "#888888",
    })

    // Description
    const desc = this.add.text(detailX + 15, detailY + 50, item.description || "No description", {
      font: "10px Arial",
      color: "#cccccc",
      wordWrap: { width: detailW - 30 },
      lineSpacing: 3,
    })

    // Content details
    let contentY = detailY + 80
    if (item.content) {
      const contentLines = this.formatContent(item.content)
      contentLines.forEach((line, i) => {
        if (contentY + i * 14 > detailY + detailH - 20) return
        const text = this.add.text(detailX + 15, contentY + i * 14, line, {
          font: "9px Arial",
          color: "#aaaaaa",
          wordWrap: { width: detailW - 30 },
        })
        this.detailContainer.add(text)
      })
    }

    // Collected at
    const collected = this.add.text(detailX + 15, detailY + detailH - 25, `Collected: ${item.collectedAt}`, {
      font: "8px Arial",
      color: "#666666",
    })

    this.detailContainer.add([bg, closeBtn, title, type, desc, collected])

    // Mark as read
    if (!item.isRead) {
      item.isRead = true
      fetch(`${API_URL}/api/evidence/${item.id}/read`, { method: "PUT" }).catch(() => {})
    }
  }

  formatContent(content) {
    if (typeof content === "string") return [content]
    const lines = []
    for (const [key, value] of Object.entries(content)) {
      if (typeof value === "object") {
        lines.push(`${key}: ${JSON.stringify(value)}`)
      } else {
        lines.push(`${key}: ${value}`)
      }
    }
    return lines
  }

  open(evidenceItems) {
    if (this.isOpen) return
    this.isOpen = true
    this.evidenceItems = evidenceItems || []
    this.setVisible(true)
    this.scene.bringToTop()
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false
    if (this.detailContainer) {
      this.detailContainer.destroy()
      this.detailContainer = null
    }
    this.setVisible(false)
  }

  setVisible(visible) {
    this.children.list.forEach(child => {
      child.setVisible(visible)
    })
  }
}
