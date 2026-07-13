import Phaser from "phaser"
import { worldApi, npcApi, missionApi, playerApi } from "@/game/lib/gameApi"

/**
 * WorldScene - Top-down exploration scene for Fraud City
 * Player walks around, talks to NPCs, investigates locations
 */
export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorldScene" })

    // World data
    this.worldData = null
    this.worldObjects = []
    this.worldNpcs = []

    // Player
    this.player = null
    this.playerDir = "down"
    this.playerMoving = false
    this.playerSpeed = 120
    this.runSpeed = 200

    // Camera
    this.cameraTarget = null

    // Controls
    this.cursors = null
    this.spaceKey = null
    this.eKey = null
    this.shiftKey = null

    // NPC references
    this.npcSprites = []
    this.interactTarget = null
    this.interactIndicator = null

    // UI
    this.hudText = null
    this.locationText = null
  }

  init(data) {
    this.worldData = data?.world || window.__WORLD_DATA
    this.worldObjects = data?.objects || window.__WORLD_OBJECTS || []
    this.worldNpcs = data?.npcs || window.__WORLD_NPCS || []
  }

  create() {
    if (!this.worldData) {
      console.error("No world data provided")
      return
    }

    const { width, height, tileSize, bgColor } = this.worldData
    const mapPixelW = width * tileSize
    const mapPixelH = height * tileSize

    // Set world bounds
    this.physics.world.setBounds(0, 0, mapPixelW, mapPixelH)

    // Background
    this.cameras.main.setBackgroundColor(bgColor || "#2d5016")

    // Draw tile map
    this.createTileMap(width, height, tileSize)

    // Draw world objects
    this.createObjects(tileSize)

    // Create player
    this.createPlayer(tileSize)

    // Create NPCs
    this.createNpcs(tileSize)

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(2.5)
    this.cameras.main.setBounds(0, 0, mapPixelW, mapPixelH)

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys()
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

    // HUD
    this.createHUD()

    // Touch controls
    this.createTouchControls()

    // Launch MissionTracker overlay
    this.missionTracker = this.scene.launch("MissionTracker")

    // Auto-accept first available mission
    this.autoAcceptMission()

    // Phone button (top-left, below location)
    this.createPhoneButton()

    // Load player stats and create progression HUD
    this.loadPlayerStats()
  }

  createTileMap(width, height, tileSize) {
    const graphics = this.add.graphics()

    // Simple procedural tilemap based on position
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.getTileType(x, y, width, height)
        let color
        switch (tile) {
          case "road":
            color = 0x555555
            break
          case "sidewalk":
            color = 0xcccccc
            break
          case "floor":
            color = 0xc4a882
            break
          case "water":
            color = 0x3377bb
            break
          default:
            color = 0x2d6b1e // grass
        }
        graphics.fillStyle(color, 1)
        graphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)

        // Grass variation
        if (tile === "grass" && Math.random() > 0.85) {
          graphics.fillStyle(0x3a7a2a, 1)
          graphics.fillRect(x * tileSize + 2, y * tileSize + 2, 2, 2)
        }

        // Road markings
        if (tile === "road" && y % 6 === 3 && x % 4 < 2) {
          graphics.fillStyle(0xffffff, 0.5)
          graphics.fillRect(x * tileSize + 2, y * tileSize + 7, tileSize - 4, 2)
        }

        // Sidewalk grid
        if (tile === "sidewalk") {
          graphics.fillStyle(0xaaaaaa, 0.3)
          graphics.fillRect(x * tileSize, y * tileSize, tileSize, 1)
          graphics.fillRect(x * tileSize, y * tileSize, 1, tileSize)
        }
      }
    }
  }

  getTileType(x, y, w, h) {
    // Road: horizontal main road
    if (y >= 12 && y <= 14) return "road"
    // Road: vertical road
    if (x >= 18 && x <= 20) return "road"
    // Sidewalk around roads
    if ((y === 11 || y === 15) && x >= 16 && x <= 22) return "sidewalk"
    if ((x === 17 || x === 21) && y >= 10 && y <= 16) return "sidewalk"
    // Sidewalk along horizontal road
    if (y === 11 || y === 15) return "sidewalk"
    // Indoor floors near buildings
    if (x >= 5 && x <= 8 && y >= 5 && y <= 7) return "floor"
    // Default: grass
    return "grass"
  }

  createObjects(tileSize) {
    this.solidBodies = this.physics.add.staticGroup()

    this.worldObjects.forEach(obj => {
      const px = obj.x * tileSize
      const py = obj.y * tileSize

      // Create sprite based on object type
      let textureKey
      switch (obj.objectType) {
        case "building":
          textureKey = obj.sprite === "house" ? "obj_house"
            : obj.sprite === "coffee_shop" ? "obj_coffee_shop"
            : obj.sprite === "school" ? "obj_school"
            : obj.sprite === "mini_mart" ? "obj_mini_mart"
            : obj.sprite === "atm" ? "obj_atm"
            : "obj_building"
          break
        case "tree": textureKey = "obj_tree"; break
        case "bench": textureKey = "obj_bench"; break
        case "light": textureKey = "obj_street_light"; break
        case "sign": textureKey = "obj_sign"; break
        default: textureKey = "obj_building"
      }

      // Draw multi-tile objects
      for (let ty = 0; ty < obj.height; ty++) {
        for (let tx = 0; tx < obj.width; tx++) {
          const sprite = this.add.image(px + tx * tileSize, py + ty * tileSize, textureKey)
          sprite.setOrigin(0, 0)
          sprite.setDisplaySize(tileSize, tileSize)
        }
      }

      // Add collision for solid objects
      if (obj.solid) {
        const body = this.add.zone(px + (obj.width * tileSize) / 2, py + (obj.height * tileSize) / 2, obj.width * tileSize, obj.height * tileSize)
        this.physics.add.existing(body, true)
        this.solidBodies.add(body)
      }

      // Store interactive objects
      if (obj.interactive) {
        obj._px = px
        obj._py = py
      }
    })
  }

  createPlayer(tileSize) {
    // Start position (near player house)
    const startX = 7 * tileSize + tileSize / 2
    const startY = 9 * tileSize + tileSize / 2

    this.player = this.physics.add.sprite(startX, startY, "player_idle")
    this.player.setScale(1.5)
    this.player.setCollideWorldBounds(true)
    this.player.body.setSize(10, 12)
    this.player.body.setOffset(3, 3)

    // Collision with solid objects
    this.physics.add.collider(this.player, this.solidBodies)

    // Interaction indicator
    this.interactIndicator = this.add.image(startX, startY - 20, "interact_indicator")
    this.interactIndicator.setScale(1.5)
    this.interactIndicator.setVisible(false)

    // Bobbing animation for indicator
    this.tweens.add({
      targets: this.interactIndicator,
      y: startY - 24,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
  }

  createNpcs(tileSize) {
    this.npcSprites = []

    this.worldNpcs.forEach(npc => {
      const px = npc.x * tileSize + tileSize / 2
      const py = npc.y * tileSize + tileSize / 2

      const sprite = this.physics.add.sprite(px, py, `npc_${npc.sprite}`)
      sprite.setScale(1.5)
      sprite.setImmovable(true)
      sprite.body.setSize(10, 12)
      sprite.body.setOffset(3, 3)

      // NPC data
      sprite.npcData = npc
      sprite.patrolX1 = (npc.patrolX1 || npc.x) * tileSize + tileSize / 2
      sprite.patrolY1 = (npc.patrolY1 || npc.y) * tileSize + tileSize / 2
      sprite.patrolX2 = (npc.patrolX2 || npc.x) * tileSize + tileSize / 2
      sprite.patrolY2 = (npc.patrolY2 || npc.y) * tileSize + tileSize / 2
      sprite.patrolTarget = 1
      sprite.isWalking = false

      // Name tag
      const nameTag = this.add.text(px, py - 16, npc.name, {
        font: "bold 6px Arial",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      }).setOrigin(0.5)
      sprite.nameTag = nameTag

      this.npcSprites.push(sprite)
    })
  }

  createHUD() {
    // Location name
    this.locationText = this.add.text(10, 10, this.worldData.displayName || "Unknown", {
      font: "bold 8px Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      backgroundColor: "#00000088",
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    // Interaction prompt
    this.hudText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 10, "", {
      font: "bold 7px Arial",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100)
  }

  createTouchControls() {
    const w = this.cameras.main.width
    const h = this.cameras.main.height
    const btnSize = 24
    const alpha = 0.6

    // D-pad: Left
    const leftBtn = this.add.container(30, h - 30).setScrollFactor(0).setDepth(100)
    const lBg = this.add.graphics()
    lBg.fillStyle(0xffffff, alpha)
    lBg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 6)
    const lArrow = this.add.text(0, 0, "◀", { font: "bold 14px Arial", color: "#333" }).setOrigin(0.5)
    leftBtn.add([lBg, lArrow])
    leftBtn.setInteractive(new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize), Phaser.Geom.Rectangle.Contains)
    leftBtn.on("pointerdown", () => { this._leftDown = true })
    leftBtn.on("pointerup", () => { this._leftDown = false })
    leftBtn.on("pointerout", () => { this._leftDown = false })

    // D-pad: Right
    const rightBtn = this.add.container(70, h - 30).setScrollFactor(0).setDepth(100)
    const rBg = this.add.graphics()
    rBg.fillStyle(0xffffff, alpha)
    rBg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 6)
    const rArrow = this.add.text(0, 0, "▶", { font: "bold 14px Arial", color: "#333" }).setOrigin(0.5)
    rightBtn.add([rBg, rArrow])
    rightBtn.setInteractive(new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize), Phaser.Geom.Rectangle.Contains)
    rightBtn.on("pointerdown", () => { this._rightDown = true })
    rightBtn.on("pointerup", () => { this._rightDown = false })
    rightBtn.on("pointerout", () => { this._rightDown = false })

    // D-pad: Up
    const upBtn = this.add.container(50, h - 50).setScrollFactor(0).setDepth(100)
    const uBg = this.add.graphics()
    uBg.fillStyle(0xffffff, alpha)
    uBg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 6)
    const uArrow = this.add.text(0, 0, "▲", { font: "bold 14px Arial", color: "#333" }).setOrigin(0.5)
    upBtn.add([uBg, uArrow])
    upBtn.setInteractive(new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize), Phaser.Geom.Rectangle.Contains)
    upBtn.on("pointerdown", () => { this._upDown = true })
    upBtn.on("pointerup", () => { this._upDown = false })
    upBtn.on("pointerout", () => { this._upDown = false })

    // D-pad: Down
    const downBtn = this.add.container(50, h - 10).setScrollFactor(0).setDepth(100)
    const dBg = this.add.graphics()
    dBg.fillStyle(0xffffff, alpha)
    dBg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 6)
    const dArrow = this.add.text(0, 0, "▼", { font: "bold 14px Arial", color: "#333" }).setOrigin(0.5)
    downBtn.add([dBg, dArrow])
    downBtn.setInteractive(new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize), Phaser.Geom.Rectangle.Contains)
    downBtn.on("pointerdown", () => { this._downDown = true })
    downBtn.on("pointerup", () => { this._downDown = false })
    downBtn.on("pointerout", () => { this._downDown = false })

    // Interact button
    const interBtn = this.add.container(w - 30, h - 30).setScrollFactor(0).setDepth(100)
    const iBg = this.add.graphics()
    iBg.fillStyle(0x00bcd4, 0.8)
    iBg.fillCircle(0, 0, btnSize / 2 + 4)
    const iText = this.add.text(0, 0, "E", { font: "bold 14px Arial", color: "#fff" }).setOrigin(0.5)
    interBtn.add([iBg, iText])
    interBtn.setInteractive(new Phaser.Geom.Circle(0, 0, btnSize / 2 + 4), Phaser.Geom.Circle.Contains)
    interBtn.on("pointerdown", () => { this._interactDown = true })
    interBtn.on("pointerup", () => { this._interactDown = false })

    this._leftDown = false
    this._rightDown = false
    this._upDown = false
    this._downDown = false
    this._interactDown = false
  }

  shutdown() {
    // Clean up event listeners and resources
    this.input.keyboard.removeAllListeners()
    if (this.gameTimer) this.gameTimer.remove()
    if (this.lineTimer) this.lineTimer.remove()
  }

  update() {
    if (!this.player || !this.worldData) return

    const speed = this.shiftKey.isDown ? this.runSpeed : this.playerSpeed
    let vx = 0
    let vy = 0

    // Movement input
    if (this.cursors.left.isDown || this._leftDown) {
      vx = -speed
      this.playerDir = "left"
    } else if (this.cursors.right.isDown || this._rightDown) {
      vx = speed
      this.playerDir = "right"
    }

    if (this.cursors.up.isDown || this._upDown) {
      vy = -speed
      this.playerDir = "up"
    } else if (this.cursors.down.isDown || this._downDown) {
      vy = speed
      this.playerDir = "down"
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707
      vy *= 0.707
    }

    this.player.body.setVelocity(vx, vy)
    this.playerMoving = vx !== 0 || vy !== 0

    // Animation
    if (this.playerMoving) {
      const frame = Math.floor(this.time.now / 150) % 4
      this.player.setTexture(`player_${this.playerDir}_${frame}`)
    } else {
      this.player.setTexture("player_idle")
    }

    // NPC updates
    this.updateNpcs()

    // Check for nearby interactables
    this.checkInteractions()

    // Handle interaction
    if (Phaser.Input.Keyboard.JustDown(this.eKey) || this._interactDown) {
      this.handleInteraction()
      this._interactDown = false
    }
  }

  updateNpcs() {
    this.npcSprites.forEach(npc => {
      if (!npc.active) return

      // Simple patrol
      const targetX = npc.patrolTarget === 1 ? npc.patrolX1 : npc.patrolX2
      const targetY = npc.patrolTarget === 1 ? npc.patrolY1 : npc.patrolY2
      const dist = Phaser.Math.Distance.Between(npc.x, npc.y, targetX, targetY)

      if (dist < 4) {
        npc.patrolTarget = npc.patrolTarget === 1 ? 2 : 1
        npc.body.setVelocity(0, 0)
        npc.isWalking = false
      } else {
        const angle = Phaser.Math.Angle.Between(npc.x, npc.y, targetX, targetY)
        npc.body.setVelocity(Math.cos(angle) * 30, Math.sin(angle) * 30)
        npc.isWalking = true
      }

      // Update name tag position
      if (npc.nameTag) {
        npc.nameTag.x = npc.x
        npc.nameTag.y = npc.y - 16
      }
    })
  }

  checkInteractions() {
    this.interactTarget = null
    let closestDist = 40

    // Check NPCs
    this.npcSprites.forEach(npc => {
      if (!npc.active) return
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y)
      if (dist < closestDist) {
        closestDist = dist
        this.interactTarget = { type: "npc", data: npc.npcData, sprite: npc }
      }
    })

    // Check interactive objects
    this.worldObjects.forEach(obj => {
      if (!obj.interactive || !obj._px) return
      const objCenterX = obj._px + (obj.width * 16) / 2
      const objCenterY = obj._py + (obj.height * 16) / 2
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, objCenterX, objCenterY)
      if (dist < closestDist) {
        closestDist = dist
        this.interactTarget = { type: "object", data: obj }
      }
    })

    // Show/hide indicator
    if (this.interactTarget) {
      this.interactIndicator.setVisible(true)
      this.interactIndicator.x = this.interactTarget.sprite?.x || this.interactTarget.data._px + 16
      this.interactIndicator.y = (this.interactTarget.sprite?.y || this.interactTarget.data._py) - 20
      this.hudText.setText(`Press E to interact with ${this.interactTarget.data.name || this.interactTarget.data.npcType || "object"}`)
    } else {
      this.interactIndicator.setVisible(false)
      this.hudText.setText("")
    }
  }

  handleInteraction() {
    if (!this.interactTarget) return

    const target = this.interactTarget

    if (target.type === "npc") {
      // Fetch dialogue from API and launch DialogueUI
      this.scene.pause()
      this.fetchAndShowDialogue(target.data)
    } else if (target.type === "object") {
      this.scene.pause()
      if (this.onObjectInteract) {
        this.onObjectInteract(target.data)
      }
      console.log("Inspect object:", target.data.name, "- Type:", target.data.interactionType)
    }
  }

  fetchAndShowDialogue(npcData) {
    npcApi.getDialogue(npcData.id)
      .then(dialogue => {
          this.scene.launch("DialogueUI", {
            dialogue,
            onComplete: (result) => {
              if (result.trustChange) {
                npcApi.talk(npcData.id, result.trustChange).catch(() => {})
              }
              this.checkMissionObjectives("talk", npcData.id)
              if (result.nextDialogueId) {
                this.checkMissionObjectives("choose", result.nextDialogueId)
              }
              if (result.nextDialogueId) {
                npcApi.getDialogue(npcData.id)
                  .then(nextDlg => {
                    this.scene.launch("DialogueUI", {
                      dialogue: nextDlg,
                      onComplete: () => this.scene.resume(),
                    })
                  })
                  .catch(() => this.scene.resume())
              } else {
                this.scene.resume()
              }
            },
          })
        })
        .catch(err => {
          console.log("No dialogue for", npcData.name, err)
          this.scene.launch("DialogueUI", {
            dialogue: {
              lines: [
                { speaker: npcData.name, text: `Hello! I am ${npcData.name}.`, emotion: "neutral" },
                { speaker: npcData.name, text: "Nice to meet you, young one!", emotion: "happy" },
              ],
              choices: [
                { text: "Nice to meet you too!", trust_change: 3 },
              ],
            },
            onComplete: (result) => {
              if (result.trustChange) {
                npcApi.talk(npcData.id, result.trustChange).catch(() => {})
              }
              this.checkMissionObjectives("talk", npcData.id)
              this.scene.resume()
            },
          })
        })
  }

  createPhoneButton() {
    const phoneBtn = this.add.container(50, 30).setScrollFactor(0).setDepth(100)
    const pBg = this.add.graphics()
    pBg.fillStyle(0x00bcd4, 0.8)
    pBg.fillRoundedRect(-16, -16, 32, 32, 8)
    const pIcon = this.add.text(0, 0, "📱", {
      font: "16px Arial",
    }).setOrigin(0.5)
    phoneBtn.add([pBg, pIcon])
    phoneBtn.setInteractive(
      new Phaser.Geom.Rectangle(-16, -16, 32, 32),
      Phaser.Geom.Rectangle.Contains
    )
    phoneBtn.on("pointerdown", () => {
      const phoneUI = this.scene.getScene("PhoneUI")
      if (phoneUI) {
        if (phoneUI.isOpen) {
          phoneUI.close()
        } else {
          phoneUI.open()
        }
      }
    })
  }

  loadPlayerStats() {
    playerApi.getStats()
      .then(stats => {
        this.playerStats = stats
        this.createProgressionHUD(stats)
      })
      .catch(err => {
        console.error("Failed to load player stats:", err)
        this.playerStats = { level: 1, xp: 0, xpToNext: 100, skillPoints: 0 }
        this.createProgressionHUD(this.playerStats)
      })
  }

  createProgressionHUD(stats) {
    const { width } = this.cameras.main

    // Level badge (top-left, below phone)
    this.levelBadge = this.add.container(50, 55).setScrollFactor(0).setDepth(100)
    const lBg = this.add.graphics()
    lBg.fillStyle(0xffd700, 0.9)
    lBg.fillCircle(0, 0, 14)
    const lText = this.add.text(0, 0, `${stats.level}`, {
      font: "bold 12px Arial",
      color: "#1a1a1a",
    }).setOrigin(0.5)
    this.levelBadge.add([lBg, lText])

    // XP bar (top-left, below level)
    this.xpBarBg = this.add.graphics().setScrollFactor(0).setDepth(100)
    this.xpBarBg.fillStyle(0x333333, 0.8)
    this.xpBarBg.fillRoundedRect(25, 72, 50, 6, 3)

    this.xpBarFill = this.add.graphics().setScrollFactor(0).setDepth(100)
    this.updateXpBar(stats.xp, stats.xpToNext)

    // XP text
    this.xpText = this.add.text(50, 82, `${stats.xp}/${stats.xpToNext}`, {
      font: "7px Arial",
      color: "#ffd700",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

    // Skill points indicator
    if (stats.skillPoints > 0) {
      this.skillPointIndicator = this.add.text(50, 92, `⭐ ${stats.skillPoints} SP`, {
        font: "bold 8px Arial",
        color: "#ffd700",
        backgroundColor: "#00000088",
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100)
    }
  }

  updateXpBar(xp, xpToNext) {
    if (!this.xpBarFill) return
    this.xpBarFill.clear()
    const percentage = Math.min(1, xp / xpToNext)
    const barColor = percentage >= 1 ? 0x4caf50 : 0x00bcd4
    this.xpBarFill.fillStyle(barColor, 1)
    this.xpBarFill.fillRoundedRect(25, 72, 50 * percentage, 6, 3)
  }

  addXp(amount) {
    if (!this.playerStats) return

    playerApi.addXp(amount)
      .then(result => {
      this.playerStats.xp = result.xp
      this.playerStats.level = result.level
      this.playerStats.xpToNext = result.xpToNext
      this.playerStats.totalXp = result.totalXp
      this.playerStats.skillPoints = result.skillPoints

      this.updateXpBar(result.xp, result.xpToNext)
      if (this.xpText) this.xpText.setText(`${result.xp}/${result.xpToNext}`)
      if (this.levelBadge) {
        this.levelBadge.getAt(1).setText(`${result.level}`)
      }

      // Level up notification
      if (result.leveledUp) {
        this.showLevelUp(result.level, result.newTitle)
      }

      // Update mission tracker
      const tracker = this.scene.getScene("MissionTracker")
      if (tracker) tracker.addXp(amount)
    })
    .catch(err => console.error("Failed to add XP:", err))
  }

  showLevelUp(newLevel, newTitle) {
    const { width, height } = this.cameras.main

    // Level up overlay
    const overlay = this.add.graphics().setScrollFactor(0).setDepth(200)
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, width, height)

    const levelText = this.add.text(width / 2, height / 2 - 30, `⬆️ LEVEL UP! ⬆️`, {
      font: "bold 24px Arial",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

    const levelNum = this.add.text(width / 2, height / 2 + 10, `Level ${newLevel}`, {
      font: "bold 18px Arial",
      color: "#ffffff",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

    const elements = [overlay, levelText, levelNum]

    if (newTitle) {
      const titleText = this.add.text(width / 2, height / 2 + 40, `New Title: "${newTitle}"`, {
        font: "12px Arial",
        color: "#00bcd4",
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
      elements.push(titleText)
    }

    // Animate and remove
    this.tweens.add({
      targets: [levelText, levelNum],
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          elements.forEach(el => el.destroy())
        })
      },
    })
  }

  autoAcceptMission() {
    missionApi.getMissions()
      .then(missions => {
        const available = missions.find(m => m.playerStatus === "available" || m.playerStatus === "locked")
        if (available) {
          missionApi.accept(available.id)
            .then(() => {
              const tracker = this.scene.getScene("MissionTracker")
              if (tracker) tracker.setMission(available, [], 0)
            })
            .catch(err => console.error("Failed to accept mission:", err))
        }
      })
      .catch(err => console.error("Failed to fetch missions:", err))
  }

  checkMissionObjectives(type, target) {
    missionApi.getMissions()
      .then(missions => {
        const active = missions.find(m => m.playerStatus === "active")
        if (!active) return

        active.objectives.forEach(obj => {
          if (active.objectivesComplete.includes(obj.id)) return
          if (obj.type === type && obj.target === target) {
            missionApi.complete(active.id, obj.id)
              .then(result => {
                const tracker = this.scene.getScene("MissionTracker")
                if (tracker) {
                  tracker.completeObjective(obj.id)
                  if (result.status === "completed") {
                    tracker.addXp(result.rewards?.xp || 0)
                  }
                }
              })
              .catch(err => console.error("Failed to complete objective:", err))
          }
        })
      })
      .catch(() => {})
  }
}
