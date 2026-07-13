import Phaser from "phaser"

/**
 * MissionTracker - Overlay scene showing current mission, objectives, and XP
 * Launched alongside WorldScene as a parallel scene
 */
export class MissionTracker extends Phaser.Scene {
  constructor() {
    super({ key: "MissionTracker" })

    this.activeMission = null
    this.objectives = []
    this.objectivesComplete = []
    this.totalXp = 0

    // UI elements
    this.container = null
    this.titleText = null
    this.objectiveTexts = []
    this.xpText = null
    this.notificationText = null
  }

  init(data) {
    this.activeMission = data?.mission || null
    this.objectives = data?.mission?.objectives || []
    this.objectivesComplete = data?.objectivesComplete || []
    this.totalXp = data?.totalXp || 0
  }

  create() {
    const { width } = this.cameras.main

    // ─── MISSION PANEL (top-right) ───
    const panelWidth = 220
    const panelX = width - panelWidth - 10
    const panelY = 10

    // Panel background
    this.panelBg = this.add.graphics()
    this.panelBg.fillStyle(0x1a1a2e, 0.85)
    this.panelBg.fillRoundedRect(panelX, panelY, panelWidth, 100, 8)
    this.panelBg.lineStyle(1, 0x00bcd4, 0.5)
    this.panelBg.strokeRoundedRect(panelX, panelY, panelWidth, 100, 8)

    // Mission title
    this.titleText = this.add.text(panelX + 10, panelY + 8, "No Active Mission", {
      font: "bold 10px Arial",
      color: "#00bcd4",
      wordWrap: { width: panelWidth - 20 },
    })

    // Objective texts
    this.objectiveTexts = []
    for (let i = 0; i < 4; i++) {
      const objText = this.add.text(panelX + 10, panelY + 26 + i * 16, "", {
        font: "9px Arial",
        color: "#cccccc",
        wordWrap: { width: panelWidth - 20 },
      })
      this.objectiveTexts.push(objText)
    }

    // XP display
    this.xpText = this.add.text(panelX + 10, panelY + 90, `XP: ${this.totalXp}`, {
      font: "bold 9px Arial",
      color: "#ffd700",
    })

    // ─── NOTIFICATION TEXT (center) ───
    this.notificationText = this.add.text(width / 2, 60, "", {
      font: "bold 12px Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      backgroundColor: "#00bcd488",
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setAlpha(0)

    // Update display
    this.updateDisplay()
  }

  setMission(mission, objectivesComplete = [], totalXp = 0) {
    this.activeMission = mission
    this.objectives = mission?.objectives || []
    this.objectivesComplete = objectivesComplete
    this.totalXp = totalXp
    this.updateDisplay()

    // Show mission accept notification
    if (mission) {
      this.showNotification(`Mission: ${mission.title}`)
    }
  }

  completeObjective(objectiveId) {
    if (!this.objectivesComplete.includes(objectiveId)) {
      this.objectivesComplete.push(objectiveId)
    }
    this.updateDisplay()

    // Find objective description
    const obj = this.objectives.find(o => o.id === objectiveId)
    if (obj) {
      this.showNotification(`✓ ${obj.description}`)
    }

    // Check if all done
    const allDone = this.objectives.every(o => this.objectivesComplete.includes(o.id))
    if (allDone) {
      this.time.delayedCall(1000, () => {
        this.showNotification("🎉 Mission Complete!")
      })
    }
  }

  addXp(amount) {
    this.totalXp += amount
    if (this.xpText) {
      this.xpText.setText(`XP: ${this.totalXp}`)
    }
    this.showNotification(`+${amount} XP`)
  }

  updateDisplay() {
    if (!this.titleText) return

    if (this.activeMission) {
      this.titleText.setText(this.activeMission.title)
      this.titleText.setColor("#00bcd4")

      // Update objectives
      this.objectives.forEach((obj, i) => {
        if (i < this.objectiveTexts.length) {
          const done = this.objectivesComplete.includes(obj.id)
          const prefix = done ? "✓" : "○"
          const color = done ? "#4caf50" : "#cccccc"
          this.objectiveTexts[i].setText(`${prefix} ${obj.description}`)
          this.objectiveTexts[i].setColor(color)
        }
      })

      // Clear unused objective slots
      for (let i = this.objectives.length; i < this.objectiveTexts.length; i++) {
        this.objectiveTexts[i].setText("")
      }

      // Update panel size
      const panelHeight = 30 + this.objectives.length * 16 + 16
      this.panelBg.clear()
      this.panelBg.fillStyle(0x1a1a2e, 0.85)
      this.panelBg.fillRoundedRect(
        this.cameras.main.width - 230, 10,
        220, panelHeight, 8
      )
      this.panelBg.lineStyle(1, 0x00bcd4, 0.5)
      this.panelBg.strokeRoundedRect(
        this.cameras.main.width - 230, 10,
        220, panelHeight, 8
      )
    } else {
      this.titleText.setText("No Active Mission")
      this.titleText.setColor("#888888")
      this.objectiveTexts.forEach(t => t.setText(""))
    }

    if (this.xpText) {
      this.xpText.setText(`XP: ${this.totalXp}`)
    }
  }

  showNotification(text) {
    if (!this.notificationText) return

    this.notificationText.setText(text)
    this.notificationText.setAlpha(1)
    this.notificationText.setY(60)

    // Fade in
    this.tweens.add({
      targets: this.notificationText,
      alpha: 1,
      y: 50,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        // Hold, then fade out
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: this.notificationText,
            alpha: 0,
            y: 40,
            duration: 500,
          })
        })
      },
    })
  }
}
