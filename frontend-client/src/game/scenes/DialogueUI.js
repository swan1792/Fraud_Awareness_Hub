import Phaser from "phaser"

/**
 * DialogueUI - Handles dialogue display with text box, portrait, and choices
 * Overlay scene that pauses gameplay during conversations
 */
export class DialogueUI extends Phaser.Scene {
  constructor() {
    super({ key: "DialogueUI" })

    // Dialogue state
    this.dialogueData = null
    this.currentLineIndex = 0
    this.isTyping = false
    this.typewriterTimer = null
    this.selectedChoice = 0
    this.onComplete = null

    // UI elements
    this.container = null
    this.portrait = null
    this.nameText = null
    this.dialogueText = null
    this.choiceContainers = []
    this.continueIndicator = null
  }

  init(data) {
    this.dialogueData = data?.dialogue
    this.onComplete = data?.onComplete
    this.currentLineIndex = 0
    this.selectedChoice = 0
    this.t = (key) => window.__GAME_TRANSLATIONS?.[key] || key
  }

  create() {
    if (!this.dialogueData || !this.dialogueData.lines) {
      this.close()
      return
    }

    const { width, height } = this.cameras.main
    const t = (key) => window.__GAME_TRANSLATIONS?.[key] || key

    // ─── DIALOGUE BOX (bottom of screen) ───
    const boxHeight = 140
    const boxY = height - boxHeight

    // Box background
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.95)
    bg.fillRoundedRect(10, boxY, width - 20, boxHeight, 12)
    bg.lineStyle(3, 0x00bcd4)
    bg.strokeRoundedRect(10, boxY, width - 20, boxHeight, 12)

    // ─── PORTRAIT ───
    const portraitSize = 60
    const portraitX = 50
    const portraitY = boxY + 30

    // Portrait background circle
    const portraitBg = this.add.graphics()
    portraitBg.fillStyle(0x333333, 1)
    portraitBg.fillCircle(portraitX, portraitY + portraitSize / 2, portraitSize / 2 + 4)

    // Portrait sprite (we'll use a colored circle with emoji as placeholder)
    this.portrait = this.add.graphics()
    this.portrait.fillStyle(0x4a90d9, 1)
    this.portrait.fillCircle(portraitX, portraitY + portraitSize / 2, portraitSize / 2)

    // Portrait emoji
    this.portraitEmoji = this.add.text(portraitX, portraitY + portraitSize / 2, "👤", {
      font: "28px Arial",
    }).setOrigin(0.5)

    // ─── NAME TAG ───
    this.nameText = this.add.text(portraitX + portraitSize / 2 + 12, boxY + 15, "", {
      font: "bold 14px Arial",
      color: "#00bcd4",
      stroke: "#000000",
      strokeThickness: 2,
    })

    // ─── DIALOGUE TEXT ───
    this.dialogueText = this.add.text(portraitX + portraitSize / 2 + 12, boxY + 38, "", {
      font: "13px Arial",
      color: "#ffffff",
      wordWrap: { width: width - portraitSize - 60 },
      lineSpacing: 4,
    })

    // ─── CONTINUE INDICATOR ───
    this.continueIndicator = this.add.text(width - 40, boxY + boxHeight - 20, "▼", {
      font: "bold 14px Arial",
      color: "#00bcd4",
    }).setOrigin(0.5)

    this.tweens.add({
      targets: this.continueIndicator,
      y: boxY + boxHeight - 16,
      duration: 400,
      yoyo: true,
      repeat: -1,
    })

    // ─── CHOICES CONTAINER ───
    this.choicesContainer = this.add.container(0, 0)

    // Show first line
    this.showLine(0)

    // Keyboard controls
    this.input.keyboard.on("keydown-SPACE", () => this.handleAdvance())
    this.input.keyboard.on("keydown-ENTER", () => this.handleAdvance())
    this.input.keyboard.on("keydown-ONE", () => this.selectChoice(0))
    this.input.keyboard.on("keydown-TWO", () => this.selectChoice(1))
    this.input.keyboard.on("keydown-THREE", () => this.selectChoice(2))
    this.input.keyboard.on("keydown-FOUR", () => this.selectChoice(3))
    this.input.keyboard.on("keydown-UP", () => this.moveChoice(-1))
    this.input.keyboard.on("keydown-DOWN", () => this.moveChoice(1))
  }

  showLine(index) {
    const lines = this.dialogueData.lines
    if (index >= lines.length) {
      // End of dialogue - show choices if available
      this.showChoices()
      return
    }

    this.currentLineIndex = index
    const line = lines[index]

    // Update portrait
    this.updatePortrait(line.speaker, line.emotion)

    // Update name
    this.nameText.setText(line.speaker || "")

    // Typewriter text
    this.typewriterText(line.text)

    // Show continue indicator
    this.continueIndicator.setVisible(true)
  }

  updatePortrait(speaker, emotion) {
    // Color based on speaker role
    const colors = {
      "Player": 0x27ae60,
      "U Kyaw Win": 0x8b6914,
      "Ma Thida": 0x4a90d9,
      "Sgt. Aung": 0x1a237e,
      "Ko Min Htike": 0xff6600,
      "Daw Thin Thin": 0x9c27b0,
      "Shady Guy": 0x8b0000,
    }

    const emojis = {
      "Player": "👓",
      "U Kyaw Win": "👴",
      "Ma Thida": "👩",
      "Sgt. Aung": "👮",
      "Ko Min Htike": "🧑",
      "Daw Thin Thin": "👵",
      "Shady Guy": "🎭",
      "concerned": "😟",
      "angry": "😠",
      "serious": "😐",
      "curious": "🤔",
      "happy": "😊",
      "worried": "😰",
      "confused": "😕",
      "neutral": "😐",
      "relieved": "😌",
      "sad": "😢",
      "suspicious": "🤨",
    }

    // Update portrait color
    this.portrait.clear()
    this.portrait.fillStyle(colors[speaker] || 0x4a90d9, 1)
    this.portrait.fillCircle(50, 100, 30)

    // Update emoji
    this.portraitEmoji.setText(emojis[speaker] || emojis[emotion] || "👤")
  }

  typewriterText(fullText) {
    // Clear previous
    if (this.typewriterTimer) {
      this.typewriterTimer.remove()
    }

    this.dialogueText.setText("")
    this.isTyping = true
    let charIndex = 0

    this.typewriterTimer = this.time.addEvent({
      delay: 30,
      callback: () => {
        charIndex++
        this.dialogueText.setText(fullText.substring(0, charIndex))

        if (charIndex >= fullText.length) {
          this.isTyping = false
          this.typewriterTimer.remove()
        }
      },
      repeat: fullText.length - 1,
    })

    // Click to skip typewriter
    this.input.once("pointerdown", () => {
      if (this.isTyping && this.typewriterTimer) {
        this.typewriterTimer.remove()
        this.dialogueText.setText(fullText)
        this.isTyping = false
      }
    })
  }

  handleAdvance() {
    if (this.isTyping) {
      // Skip typewriter
      if (this.typewriterTimer) this.typewriterTimer.remove()
      this.dialogueText.setText(this.dialogueData.lines[this.currentLineIndex].text)
      this.isTyping = false
      return
    }

    // Check if we're showing choices
    if (this.choiceContainers.length > 0) return

    // Advance to next line
    this.showLine(this.currentLineIndex + 1)
  }

  showChoices() {
    const choices = this.dialogueData.choices
    if (!choices || choices.length === 0) {
      this.close()
      return
    }

    // Hide continue indicator
    this.continueIndicator.setVisible(false)

    // Clear old choices
    this.choicesContainer.removeAll(true)
    this.choiceContainers = []

    const { width } = this.cameras.main
    const startY = 200
    const choiceHeight = 36
    const choiceWidth = width - 60

    choices.forEach((choice, index) => {
      const cy = startY + index * (choiceHeight + 8)

      // Choice background
      const choiceBg = this.add.graphics()
      choiceBg.fillStyle(index === this.selectedChoice ? 0x00bcd4 : 0x333333, 0.9)
      choiceBg.fillRoundedRect(30, cy, choiceWidth, choiceHeight, 8)
      choiceBg.lineStyle(2, index === this.selectedChoice ? 0x00bcd4 : 0x555555)
      choiceBg.strokeRoundedRect(30, cy, choiceWidth, choiceHeight, 8)

      // Key number badge
      const badge = this.add.graphics()
      badge.fillStyle(0x00bcd4, 1)
      badge.fillCircle(50, cy + choiceHeight / 2, 12)
      const badgeText = this.add.text(50, cy + choiceHeight / 2, `${index + 1}`, {
        font: "bold 12px Arial",
        color: "#ffffff",
      }).setOrigin(0.5)

      // Choice text
      const text = this.add.text(70, cy + choiceHeight / 2, choice.text, {
        font: "13px Arial",
        color: index === this.selectedChoice ? "#ffffff" : "#cccccc",
        wordWrap: { width: choiceWidth - 60 },
      }).setOrigin(0, 0.5)

      // Trust change indicator
      if (choice.trust_change) {
        const trustColor = choice.trust_change > 0 ? "#4caf50" : "#ff4444"
        const trustSign = choice.trust_change > 0 ? "+" : ""
        const trustText = this.add.text(width - 50, cy + choiceHeight / 2, `${trustSign}${choice.trust_change} ❤️`, {
          font: "bold 11px Arial",
          color: trustColor,
        }).setOrigin(1, 0.5)
        this.choicesContainer.add(trustText)
      }

      // Make interactive
      const hitArea = this.add.rectangle(width / 2, cy + choiceHeight / 2, choiceWidth, choiceHeight, 0x000000, 0)
      hitArea.setInteractive({ useHandCursor: true })
      hitArea.on("pointerover", () => {
        this.selectedChoice = index
        this.updateChoiceHighlight()
      })
      hitArea.on("pointerdown", () => {
        this.selectChoice(index)
      })

      this.choicesContainer.add([choiceBg, badge, badgeText, text, hitArea])
      this.choiceContainers.push({ bg: choiceBg, text, hitArea, choice })
    })
  }

  updateChoiceHighlight() {
    this.choiceContainers.forEach((item, index) => {
      item.bg.clear()
      item.bg.fillStyle(index === this.selectedChoice ? 0x00bcd4 : 0x333333, 0.9)
      item.bg.fillRoundedRect(30, 200 + index * 44, this.cameras.main.width - 60, 36, 8)
      item.bg.lineStyle(2, index === this.selectedChoice ? 0x00bcd4 : 0x555555)
      item.bg.strokeRoundedRect(30, 200 + index * 44, this.cameras.main.width - 60, 36, 8)
      item.text.setColor(index === this.selectedChoice ? "#ffffff" : "#cccccc")
    })
  }

  moveChoice(dir) {
    if (this.choiceContainers.length === 0) return
    this.selectedChoice = Phaser.Math.Wrap(
      this.selectedChoice + dir,
      0,
      this.choiceContainers.length
    )
    this.updateChoiceHighlight()
  }

  selectChoice(index) {
    if (index >= this.choiceContainers.length) return
    const choice = this.choiceContainers[index].choice

    // Record the talk event via callback
    if (this.onComplete) {
      this.onComplete({
        choiceIndex: index,
        trustChange: choice.trust_change || 0,
        nextDialogueId: choice.next_dialogue_id,
        choiceText: choice.text,
      })
    }

    this.close()
  }

  close() {
    if (this.typewriterTimer) this.typewriterTimer.remove()
    this.scene.stop("DialogueUI")
    // Resume the world scene
    if (this.scene.isActive("WorldScene")) {
      this.scene.resume("WorldScene")
    }
  }
}
