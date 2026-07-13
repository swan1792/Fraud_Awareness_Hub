import Phaser from "phaser"

/**
 * GameScene - Action shooter with pixel art sprites and parallax scrolling
 * Arrow keys to move, SPACE to shoot, 1-3 to select intervention
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" })
    this.stageData = null
    this.onComplete = null

    // Characters
    this.scammer = null
    this.target = null
    this.goodFriend = null

    // State
    this.scammerHealth = 3
    this.maxHealth = 3
    this.currentTargetLine = 0
    this.chipsEnabled = false
    this.gameOver = false
    this.score = 0
    this.startTime = 0
    this.selectedChip = 0

    // Groups
    this.projectiles = null

    // Input
    this.cursors = null
    this.spaceKey = null
    this.key1 = null
    this.key2 = null
    this.key3 = null

    // UI
    this.healthBar = null
    this.timerBar = null
    this.scoreText = null
    this.timerText = null
    this.selectedChipText = null

    // Parallax layers
    this.farBuildings = null
    this.nearBuildings = null
    this.treesLayer = null
    this.roadLayer = null
    this.scrollSpeeds = { far: 0.3, near: 0.7, trees: 1.2, road: 1.5 }

    // Cleanup references
    this.hitAreas = []
    this.playerPulseTween = null
  }

  init(data) {
    this.stageData = window.__GAME_STAGE_DATA || data?.stage
    this.onComplete = window.__GAME_ON_COMPLETE || data?.onComplete
    this.t = (key) => window.__GAME_TRANSLATIONS?.[key] || key
    this.currentTargetLine = 0
    this.chipsEnabled = false
    this.gameOver = false
    this.score = 0
    this.selectedChip = 0
    this.scammerHealth = 3
    this.maxHealth = 3
  }

  create() {
    const { width, height } = this.cameras.main
    this.startTime = Date.now()

    // Create parallax background
    this.createBackground(width, height)

    // Create groups
    this.projectiles = this.physics.add.group()

    // Create characters
    this.createCharacters(width, height)

    // Create health bar
    this.createHealthBar(width)

    // Create timer bar
    this.createTimerBar(width)

    // Create HUD
    this.createHUD(width)

    // Create intervention chips
    this.chipContainers = []
    this.createInterventionChips(width)

    // Setup keyboard controls
    this.setupKeyboard()

    // Cleanup on scene shutdown
    this.events.on("shutdown", () => {
      this.hitAreas.forEach((h) => h.destroy())
      this.hitAreas = []
      if (this.playerPulseTween) this.playerPulseTween.stop()
    })

    // Start game sequence
    this.time.delayedCall(800, () => {
      this.startGame()
    })
  }

  createBackground(width, height) {
    // Layer 0: Sky gradient (static, drawn once)
    const sky = this.add.graphics()
    sky.fillGradientStyle(0x0a0a1a, 0x0f1530, 0x1a1a3e, 0x2d1b4e, 1)
    sky.fillRect(0, 0, width, height * 0.65)
    // Stars
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * width
      const sy = Math.random() * height * 0.4
      const size = Math.random() > 0.8 ? 2 : 1
      sky.fillStyle(0xffffff, 0.4 + Math.random() * 0.6)
      sky.fillRect(sx, sy, size, size)
    }
    // Moon (pixel art style - blocky)
    sky.fillStyle(0xeeeedd, 0.9)
    sky.fillRect(width - 88, 38, 16, 16)
    sky.fillRect(width - 80, 34, 16, 16)
    sky.fillRect(width - 92, 42, 4, 8)
    sky.fillRect(width - 72, 34, 4, 8)
    sky.fillStyle(0x0a0a1a, 1)
    sky.fillRect(width - 82, 40, 12, 12)
    sky.fillRect(width - 76, 36, 8, 4)

    // Layer 1: Far buildings (slowest scroll) - positioned higher for depth
    this.farBuildings = this.add.tileSprite(0, height * 0.28, width, 120, "far_buildings")
    this.farBuildings.setOrigin(0, 0)
    this.farBuildings.setAlpha(0.5)

    // Layer 2: Near buildings (medium scroll) - positioned lower than far
    this.nearBuildings = this.add.tileSprite(0, height * 0.38, width, 160, "near_buildings")
    this.nearBuildings.setOrigin(0, 0)
    this.nearBuildings.setAlpha(0.85)

    // Layer 3: Trees/bushes (faster scroll) - just above ground
    this.treesLayer = this.add.tileSprite(0, height * 0.58, width, 40, "trees")
    this.treesLayer.setOrigin(0, 0)

    // Layer 4: Ground
    const ground = this.add.graphics()
    ground.fillStyle(0x1a4d0a, 1)
    ground.fillRect(0, height * 0.65, width, height * 0.35)
    // Ground texture details
    ground.fillStyle(0x1a5a0a, 1)
    for (let i = 0; i < 30; i++) {
      ground.fillRect(Math.random() * width, height * 0.66 + Math.random() * 20, 2 + Math.random() * 4, 2)
    }

    // Layer 5: Road (fastest scroll)
    this.roadLayer = this.add.tileSprite(0, height * 0.72, width, 40, "road")
    this.roadLayer.setOrigin(0, 0)
  }

  createCharacters(width, height) {
    const groundY = height * 0.67
    const spriteScale = 4

    // Scammer (left side)
    this.scammer = this.physics.add.sprite(120, groundY, "scammer")
    this.scammer.setScale(spriteScale)
    this.scammer.body.setVelocityX(25)
    this.scammer.body.setCollideWorldBounds(true)
    this.scammer.setOrigin(0.5, 1)

    // Scammer shadow
    this.scammerShadow = this.add.ellipse(120, groundY + 2, 30, 8, 0x000000, 0.3)

    // Scammer label
    this.scammerLabel = this.add.text(120, groundY + 8, this.t("scammer"), {
      font: "bold 11px Arial",
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5, 0)

    // Target (center)
    this.target = this.physics.add.sprite(width / 2, groundY, "target")
    this.target.setScale(spriteScale)
    this.target.body.setImmovable(true)
    this.target.setOrigin(0.5, 1)

    // Target shadow
    this.targetShadow = this.add.ellipse(width / 2, groundY + 2, 30, 8, 0x000000, 0.3)

    // Target label
    this.targetLabel = this.add.text(width / 2, groundY + 8, this.t("target"), {
      font: "bold 11px Arial",
      color: "#4ecdc4",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5, 0)

    // Question marks above target
    this.questionMarks = this.add.text(width / 2, groundY - 70, "❓", {
      font: "16px Arial",
    }).setOrigin(0.5)
    this.tweens.add({
      targets: this.questionMarks,
      y: groundY - 80,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
    })

    // Good Friend / Player (right side)
    this.goodFriend = this.physics.add.sprite(width - 120, groundY, "good_friend")
    this.goodFriend.setScale(spriteScale)
    this.goodFriend.setFlipX(true)
    this.goodFriend.body.setImmovable(true)
    this.goodFriend.body.setCollideWorldBounds(true)
    this.goodFriend.setOrigin(0.5, 1)

    // Player shadow
    this.goodFriendShadow = this.add.ellipse(width - 120, groundY + 2, 30, 8, 0x000000, 0.3)

    // Player label
    this.goodFriendLabel = this.add.text(width - 120, groundY + 8, this.t("you"), {
      font: "bold 11px Arial",
      color: "#2ecc71",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5, 0)

    // Pulsing glow on player
    this.playerPulseTween = this.tweens.add({
      targets: this.goodFriend,
      scaleX: spriteScale + 0.15,
      scaleY: spriteScale + 0.15,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })

    // Danger zone
    this.dangerZone = this.add.rectangle(width / 2 - 80, groundY - 30, 50, 80, 0xff0000, 0)
    this.dangerZone.setStrokeStyle(2, 0xff0000, 0.3)
    this.tweens.add({
      targets: this.dangerZone,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
  }

  createHealthBar(width) {
    const barWidth = 200
    const barHeight = 24
    const x = width / 2 - barWidth / 2
    const y = 15

    this.add.text(x - 10, y + barHeight / 2, "❤️", { font: "16px Arial" }).setOrigin(1, 0.5)

    this.healthBarBg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333, 0.8)
    this.healthBarBg.setOrigin(0, 0)

    this.healthBar = this.add.rectangle(x + 2, y + 2, barWidth - 4, barHeight - 4, 0xff4444)
    this.healthBar.setOrigin(0, 0)

    this.healthText = this.add.text(x + barWidth / 2, y + barHeight / 2, `${this.t("hp")}: 3/3`, {
      font: "bold 12px Arial",
      color: "#ffffff",
    }).setOrigin(0.5)
  }

  createTimerBar(width) {
    const barWidth = 250
    const barHeight = 12
    const x = width / 2 - barWidth / 2
    const y = 48

    this.timerBarBg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333, 0.8)
    this.timerBarBg.setOrigin(0, 0)

    this.timerBar = this.add.rectangle(x + 1, y + 1, barWidth - 2, barHeight - 2, 0x22cc22)
    this.timerBar.setOrigin(0, 0)

    this.timerText = this.add.text(x + barWidth + 8, y + barHeight / 2, "15s", {
      font: "bold 12px Arial",
      color: "#333333",
    }).setOrigin(0, 0.5)
  }

  createHUD(width) {
    // Score
    this.scoreText = this.add.text(20, 15, `${this.t("score")}: 0`, {
      font: "bold 18px Arial",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 3,
    })

    // Controls hint (replaced by on-screen buttons)
    this.add.text(width / 2, 75, this.t("controls"), {
      font: "11px Arial",
      color: "#888888",
    }).setOrigin(0.5)

    // Selected chip indicator
    this.selectedChipText = this.add.text(width - 20, 15, `${this.t("selected")}: 1`, {
      font: "bold 14px Arial",
      color: "#00bcd4",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(1, 0)

    // ─── SCAMMER BUBBLE (improved visibility) ───
    this.scammerBubble = this.add.container(120, 100)
    const bShadow = this.add.graphics()
    bShadow.fillStyle(0x000000, 0.3)
    bShadow.fillRoundedRect(-108, -33, 224, 74, 16)
    const bubbleBg = this.add.graphics()
    bubbleBg.fillStyle(0xffdddd, 1)
    bubbleBg.fillRoundedRect(-112, -37, 224, 74, 14)
    bubbleBg.lineStyle(3, 0xff4444)
    bubbleBg.strokeRoundedRect(-112, -37, 224, 74, 14)
    bubbleBg.fillStyle(0xffdddd, 1)
    bubbleBg.fillTriangle(-10, 37, 10, 37, 0, 52)
    this.scammerBubbleText = this.add.text(0, -5, "", {
      font: "bold 13px Arial",
      color: "#cc0000",
      wordWrap: { width: 200 },
      align: "center",
    }).setOrigin(0.5)
    this.scammerBubble.add([bShadow, bubbleBg, this.scammerBubbleText])
    this.scammerBubble.setAlpha(0)

    // ─── TARGET BUBBLE (improved visibility) ───
    this.targetBubble = this.add.container(width / 2, 100)
    const tShadow = this.add.graphics()
    tShadow.fillStyle(0x000000, 0.3)
    tShadow.fillRoundedRect(-108, -33, 224, 74, 16)
    const tBubbleBg = this.add.graphics()
    tBubbleBg.fillStyle(0xddf4ff, 1)
    tBubbleBg.fillRoundedRect(-112, -37, 224, 74, 14)
    tBubbleBg.lineStyle(3, 0x00aacc)
    tBubbleBg.strokeRoundedRect(-112, -37, 224, 74, 14)
    tBubbleBg.fillStyle(0xddf4ff, 1)
    tBubbleBg.fillTriangle(-10, 37, 10, 37, 0, 52)
    this.targetBubbleText = this.add.text(0, -5, "", {
      font: "bold 13px Arial",
      color: "#005577",
      wordWrap: { width: 200 },
      align: "center",
    }).setOrigin(0.5)
    this.targetBubble.add([tShadow, tBubbleBg, this.targetBubbleText])
    this.targetBubble.setAlpha(0)

    // ─── ON-SCREEN CONTROLS ───
    this.createOnScreenControls(width)
  }

  createOnScreenControls(width) {
    const btnSize = 44
    const bottomY = 475
    const ctrlAlpha = 0.7

    // ─── LEFT BUTTON ───
    const leftBtn = this.add.container(50, bottomY)
    const lBg = this.add.graphics()
    lBg.fillStyle(0xffffff, ctrlAlpha)
    lBg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 10)
    lBg.lineStyle(2, 0x00bcd4)
    lBg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 10)
    const lArrow = this.add.text(0, 0, "◀", {
      font: "bold 20px Arial",
      color: "#00bcd4",
    }).setOrigin(0.5)
    leftBtn.add([lBg, lArrow])
    leftBtn.setInteractive(
      new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize),
      Phaser.Geom.Rectangle.Contains
    )
    leftBtn.on("pointerdown", () => { this._leftDown = true })
    leftBtn.on("pointerup", () => { this._leftDown = false })
    leftBtn.on("pointerout", () => { this._leftDown = false })

    // ─── RIGHT BUTTON ───
    const rightBtn = this.add.container(120, bottomY)
    const rBg = this.add.graphics()
    rBg.fillStyle(0xffffff, ctrlAlpha)
    rBg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 10)
    rBg.lineStyle(2, 0x00bcd4)
    rBg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 10)
    const rArrow = this.add.text(0, 0, "▶", {
      font: "bold 20px Arial",
      color: "#00bcd4",
    }).setOrigin(0.5)
    rightBtn.add([rBg, rArrow])
    rightBtn.setInteractive(
      new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize),
      Phaser.Geom.Rectangle.Contains
    )
    rightBtn.on("pointerdown", () => { this._rightDown = true })
    rightBtn.on("pointerup", () => { this._rightDown = false })
    rightBtn.on("pointerout", () => { this._rightDown = false })

    // ─── SHOOT BUTTON ───
    const shootBtn = this.add.container(width - 60, bottomY)
    const sBg = this.add.graphics()
    sBg.fillStyle(0xff4444, 0.85)
    sBg.fillCircle(0, 0, btnSize / 2 + 4)
    sBg.lineStyle(3, 0xff6666)
    sBg.strokeCircle(0, 0, btnSize / 2 + 4)
    const sText = this.add.text(0, 0, "🎯", {
      font: "22px Arial",
    }).setOrigin(0.5)
    shootBtn.add([sBg, sText])
    shootBtn.setInteractive(
      new Phaser.Geom.Circle(0, 0, btnSize / 2 + 4),
      Phaser.Geom.Circle.Contains
    )
    shootBtn.on("pointerdown", () => {
      if (this.chipsEnabled && !this.gameOver) this.shootIntervention()
    })

    // ─── CHIP SELECT BUTTONS (1, 2, 3) ───
    const chipBtnY = bottomY
    const chipBtnStartX = width / 2 - 60
    for (let i = 0; i < 3; i++) {
      const cx = chipBtnStartX + i * 50
      const chipBtn = this.add.container(cx, chipBtnY)
      const cBg = this.add.graphics()
      cBg.fillStyle(0x00bcd4, 0.85)
      cBg.fillRoundedRect(-18, -18, 36, 36, 8)
      const cText = this.add.text(0, 0, `${i + 1}`, {
        font: "bold 16px Arial",
        color: "#ffffff",
      }).setOrigin(0.5)
      chipBtn.add([cBg, cText])
      chipBtn.setInteractive(
        new Phaser.Geom.Rectangle(-18, -18, 36, 36),
        Phaser.Geom.Rectangle.Contains
      )
      const idx = i
      chipBtn.on("pointerdown", () => {
        if (!this.gameOver) {
          this.selectChip(idx)
          if (this.chipsEnabled) this.shootIntervention()
        }
      })
    }

    // Init touch state
    this._leftDown = false
    this._rightDown = false
  }

  createInterventionChips(width) {
    const interventions = this.stageData?.interventions || []
    const chipY = 430
    const chipSpacing = 200
    const startX = width / 2 - ((interventions.length - 1) * chipSpacing) / 2

    interventions.forEach((intervention, index) => {
      const chipX = startX + index * chipSpacing

      const container = this.add.container(chipX, chipY)

      // Chip background
      const chipBg = this.add.graphics()
      chipBg.fillStyle(0xffffff, 1)
      chipBg.fillRoundedRect(-90, -25, 180, 50, 25)
      chipBg.lineStyle(3, 0x00bcd4)
      chipBg.strokeRoundedRect(-90, -25, 180, 50, 25)

      // Key number badge
      const keyBadge = this.add.graphics()
      keyBadge.fillStyle(0x00bcd4, 1)
      keyBadge.fillCircle(-75, -15, 12)
      const keyText = this.add.text(-75, -15, `${index + 1}`, {
        font: "bold 12px Arial",
        color: "#ffffff",
      }).setOrigin(0.5)

      // Chip text
      const chipText = this.add.text(5, 0, intervention.interventionText, {
        font: "11px Arial",
        color: "#333333",
        wordWrap: { width: 140 },
        align: "center",
      }).setOrigin(0.5)

      container.add([chipBg, keyBadge, keyText, chipText])
      container.setVisible(false)
      container.setAlpha(0)

      container.chipBg = chipBg
      container.chipText = chipText
      container.interventionData = intervention
      container.chipIndex = index

      // Make interactive
      const hitArea = this.add.rectangle(chipX, chipY, 180, 50, 0x000000, 0)
      hitArea.setInteractive({ useHandCursor: true })

      hitArea.on("pointerover", () => {
        if (!this.gameOver) this.selectChip(index)
      })

      hitArea.on("pointerdown", () => {
        if (this.chipsEnabled && !this.gameOver) {
          this.selectChip(index)
          this.shootIntervention()
        }
      })

      container.hitArea = hitArea
      this.hitAreas.push(hitArea)
      this.chipContainers.push(container)
    })

    if (this.chipContainers.length > 0) {
      this.highlightChip(0)
    }
  }

  setupKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
    this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)

    this.spaceKey.on("down", () => {
      if (this.chipsEnabled && !this.gameOver) this.shootIntervention()
    })

    this.key1.on("down", () => this.selectChip(0))
    this.key2.on("down", () => this.selectChip(1))
    this.key3.on("down", () => this.selectChip(2))

    this.input.keyboard.on("keydown-LEFT", () => this.movePlayer(-1))
    this.input.keyboard.on("keydown-RIGHT", () => this.movePlayer(1))
  }

  movePlayer(direction) {
    if (this.gameOver) return
    const newX = this.goodFriend.x + direction * 40
    const minX = 300
    const maxX = 750
    if (newX >= minX && newX <= maxX) {
      this.tweens.add({
        targets: [this.goodFriend, this.goodFriendLabel, this.goodFriendShadow],
        x: newX,
        duration: 150,
        ease: "Power2",
      })
    }
  }

  selectChip(index) {
    if (index >= this.chipContainers.length) return
    this.selectedChip = index
    this.selectedChipText.setText(`${this.t("selected")}: ${index + 1}`)
    this.highlightChip(index)
  }

  highlightChip(index) {
    this.chipContainers.forEach((container, i) => {
      const bg = container.chipBg
      bg.clear()
      if (i === index) {
        bg.fillStyle(0xe0f7fa, 1)
        bg.fillRoundedRect(-90, -25, 180, 50, 25)
        bg.lineStyle(4, 0x00bcd4)
        bg.strokeRoundedRect(-90, -25, 180, 50, 25)
      } else {
        bg.fillStyle(0xffffff, 1)
        bg.fillRoundedRect(-90, -25, 180, 50, 25)
        bg.lineStyle(2, 0xcccccc)
        bg.strokeRoundedRect(-90, -25, 180, 50, 25)
      }
    })
  }

  startGame() {
    this.showScammerBubble()
    this.startTimeProgression()

    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      repeat: 14,
    })

    this.time.delayedCall(1200, () => {
      this.showInterventionChips()
    })
  }

  showScammerBubble() {
    const line = this.stageData?.scammerLine || this.t("defaultScammerLine")
    this.scammerBubbleText.setText(line)
    this.tweens.add({
      targets: this.scammerBubble,
      alpha: 1,
      y: 85,
      duration: 400,
      ease: "Back.easeOut",
    })
  }

  showTargetLine(index) {
    const lines = this.stageData?.targetLines || []
    if (index >= lines.length) return

    const lineText = lines[index].lineText
    this.targetBubbleText.setText(lineText)

    this.tweens.add({
      targets: this.targetBubble,
      alpha: 1,
      y: 85,
      duration: 300,
      ease: "Power2",
    })

    this.questionMarks.setText(index >= lines.length - 1 ? "😰" : "❓")

    if (index >= lines.length - 1) {
      this.cameras.main.shake(300, 0.01)
    }

    // Target moves toward scammer
    this.tweens.add({
      targets: [this.target, this.targetLabel, this.targetShadow],
      x: this.target.x - 35,
      duration: 1500,
      ease: "Power1",
    })
  }

  startTimeProgression() {
    const lines = this.stageData?.targetLines || []
    if (lines.length === 0) return

    this.showTargetLine(0)

    const totalTime = 15000
    const lineDelay = totalTime / lines.length

    this.lineTimer = this.time.addEvent({
      delay: lineDelay,
      callback: () => {
        this.currentTargetLine++
        if (this.currentTargetLine < lines.length) {
          this.showTargetLine(this.currentTargetLine)
        }
      },
      repeat: lines.length - 1,
    })
  }

  updateTimer() {
    if (this.gameOver) return

    const elapsed = (Date.now() - this.startTime) / 1000
    const remaining = Math.max(0, 15 - elapsed)
    const percentage = remaining / 15

    this.timerBar.width = 248 * percentage
    this.timerText.setText(`${Math.ceil(remaining)}s`)

    if (remaining <= 5) {
      this.timerBar.fillColor = 0xff4444
      this.timerText.setColor("#ff4444")
    }

    if (remaining <= 0) {
      this.handleTimeUp()
    }
  }

  showInterventionChips() {
    this.chipContainers.forEach((container, index) => {
      this.time.delayedCall(index * 200, () => {
        container.setVisible(true)
        container.setAlpha(0)
        container.setScale(0.3)

        this.tweens.add({
          targets: container,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 300,
          ease: "Back.easeOut",
          onComplete: () => {
            if (index === this.chipContainers.length - 1) {
              this.chipsEnabled = true
            }
          },
        })
      })
    })
  }

  shootIntervention() {
    if (!this.chipsEnabled || this.gameOver) return
    this.chipsEnabled = false

    const intervention = this.chipContainers[this.selectedChip]?.interventionData
    if (!intervention) {
      this.chipsEnabled = true
      return
    }

    const startX = this.goodFriend.x - 40
    const startY = this.goodFriend.y - 40

    const projectile = this.physics.add.sprite(startX, startY, "projectile")
    projectile.setScale(2)
    projectile.body.setAllowGravity(false)

    const targetX = this.scammer.x
    const targetY = this.scammer.y - 20
    const dx = targetX - startX
    const dy = targetY - startY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const speed = 500

    // Guard against division by zero
    if (dist === 0) {
      this.chipsEnabled = true
      projectile.destroy()
      return
    }

    projectile.body.setVelocity((dx / dist) * speed, (dy / dist) * speed)
    projectile.rotation = Math.atan2(dy, dx)

    // Pause pulse tween during shoot animation
    if (this.playerPulseTween) this.playerPulseTween.pause()

    // Player shoot animation
    this.tweens.add({
      targets: this.goodFriend,
      scaleX: 3.8,
      scaleY: 4.2,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        // Restore scale and resume pulse
        this.goodFriend.setScale(4)
        if (this.playerPulseTween) this.playerPulseTween.resume()
      },
    })

    this.tweens.add({
      targets: this.goodFriend,
      x: this.goodFriend.x + 20,
      duration: 50,
      yoyo: true,
    })

    this.physics.add.overlap(projectile, this.scammer, () => {
      if (projectile.active) {
        projectile.destroy()
        this.handleHit(intervention)
      }
    })

    this.time.delayedCall(2000, () => {
      if (projectile.active) {
        projectile.destroy()
        if (!this.gameOver) {
          this.showMissFeedback()
          this.chipsEnabled = true
        }
      }
    })
  }

  handleHit(intervention) {
    if (this.gameOver) return

    if (intervention.isCorrect) {
      this.scammerHealth--
      this.updateHealthBar()
      this.score += 100

      this.createExplosion(this.scammer.x, this.scammer.y, 0x22cc22)

      this.tweens.add({
        targets: [this.scammer, this.scammerLabel, this.scammerShadow],
        x: this.scammer.x - 60,
        alpha: 0.3,
        duration: 150,
        yoyo: true,
        ease: "Power2",
      })

      this.cameras.main.flash(100, 34, 204, 34)
      this.showFloatingText(this.scammer.x, this.scammer.y - 60, "+100", "#22cc22")
      this.scoreText.setText(`${this.t("score")}: ${this.score}`)

      if (this.scammerHealth <= 0) {
        this.handleSuccess()
      } else {
        this.time.delayedCall(400, () => {
          this.chipsEnabled = true
        })
      }
    } else {
      this.score = Math.max(0, this.score - 50)
      this.scoreText.setText(`${this.t("score")}: ${this.score}`)

      this.createExplosion(this.scammer.x, this.scammer.y, 0xff4444)
      this.cameras.main.flash(100, 255, 68, 68)
      this.showFloatingText(this.scammer.x, this.scammer.y - 60, "-50", "#ff4444")
      this.showMissFeedback()

      this.tweens.add({
        targets: [this.target, this.targetLabel, this.targetShadow],
        x: this.target.x - 25,
        duration: 400,
      })

      this.time.delayedCall(400, () => {
        this.chipsEnabled = true
      })
    }
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2
      const particle = this.add.circle(x, y, 6, color)
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * (30 + Math.random() * 20),
        y: y + Math.sin(angle) * (30 + Math.random() * 20),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 350,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      })
    }

    const flash = this.add.circle(x, y, 20, 0xffffff)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      onComplete: () => flash.destroy(),
    })
  }

  showFloatingText(x, y, text, color) {
    const floatText = this.add.text(x, y, text, {
      font: "bold 24px Arial",
      color: color,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: floatText,
      y: y - 50,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      ease: "Power2",
      onComplete: () => floatText.destroy(),
    })
  }

  showMissFeedback() {
    const { width, height } = this.cameras.main
    const missText = this.add.text(width / 2, height / 2 - 50, this.t("wrong"), {
      font: "bold 28px Arial",
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: missText,
      alpha: 1,
      y: height / 2 - 70,
      duration: 250,
      yoyo: true,
      onComplete: () => missText.destroy(),
    })
  }

  updateHealthBar() {
    const percentage = this.scammerHealth / this.maxHealth
    const barWidth = 196
    this.healthBar.width = barWidth * percentage
    this.healthText.setText(`${this.t("hp")}: ${this.scammerHealth}/${this.maxHealth}`)

    if (percentage <= 0.33) {
      this.healthBar.fillColor = 0xff2222
    } else if (percentage <= 0.66) {
      this.healthBar.fillColor = 0xffaa22
    }
  }

  handleSuccess() {
    if (this.gameOver) return
    this.gameOver = true

    if (this.lineTimer) this.lineTimer.remove()
    if (this.gameTimer) this.gameTimer.remove()
    this.chipsEnabled = false

    this.tweens.add({
      targets: this.scammer,
      alpha: 0,
      y: this.scammer.y + 60,
      scaleX: 0.3,
      scaleY: 0.3,
      angle: 360,
      duration: 800,
    })

    this.createExplosion(this.scammer.x, this.scammer.y, 0x22cc22)
    this.time.delayedCall(150, () => this.createExplosion(this.scammer.x - 30, this.scammer.y + 10, 0xffd700))
    this.time.delayedCall(300, () => this.createExplosion(this.scammer.x + 30, this.scammer.y - 10, 0x22cc22))

    const { width, height } = this.cameras.main
    const successText = this.add.text(width / 2, height / 2, this.t("defeated"), {
      font: "bold 32px Arial",
      color: "#22cc22",
      backgroundColor: "#ffffff",
      padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5)

    this.tweens.add({
      targets: successText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: "Back.easeOut",
    })

    const elapsed = (Date.now() - this.startTime) / 1000
    const timeBonus = Math.round((15 - elapsed) * 10)
    this.score += timeBonus
    this.scoreText.setText(`${this.t("score")}: ${this.score}`)

    if (timeBonus > 0) {
      this.showFloatingText(width / 2, height / 2 + 40, `+${timeBonus} ${this.t("timeBonus")}`, "#ffd700")
    }

    this.time.delayedCall(2500, () => {
      if (this.onComplete) {
        this.onComplete({
          success: true,
          score: this.score,
          reactionTime: elapsed,
        })
      }
    })
  }

  handleTimeUp() {
    if (this.gameOver) return
    this.gameOver = true

    if (this.lineTimer) this.lineTimer.remove()
    this.chipsEnabled = false

    this.cameras.main.flash(500, 255, 0, 0)
    this.cameras.main.shake(500, 0.02)

    this.tweens.add({
      targets: [this.target, this.targetLabel, this.targetShadow],
      x: this.scammer.x,
      duration: 800,
    })

    const { width, height } = this.cameras.main
    const failText = this.add.text(width / 2, height / 2, this.t("gameOver"), {
      font: "bold 36px Arial",
      color: "#ff4444",
      backgroundColor: "#ffffff",
      padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setAlpha(0).setScale(0.5)

    this.tweens.add({
      targets: failText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: "Back.easeOut",
    })

    this.time.delayedCall(2500, () => {
      if (this.onComplete) {
        this.onComplete({
          success: false,
          score: this.score,
          reactionTime: 15,
        })
      }
    })
  }

  update() {
    // Parallax scrolling (continues even after game over for visual polish)
    if (this.farBuildings) this.farBuildings.tilePositionX += this.scrollSpeeds.far
    if (this.nearBuildings) this.nearBuildings.tilePositionX += this.scrollSpeeds.near
    if (this.treesLayer) this.treesLayer.tilePositionX += this.scrollSpeeds.trees
    if (this.roadLayer) this.roadLayer.tilePositionX += this.scrollSpeeds.road

    // Game logic only runs while game is active
    if (!this.gameOver) {
      // Keep scammer walking slowly
      if (this.scammer && this.scammer.x < this.target.x - 100) {
        this.scammer.body.setVelocityX(20)
      } else {
        this.scammer.body.setVelocityX(0)
      }

      // Move with arrow keys OR on-screen touch buttons
      if (this.cursors.left.isDown || this._leftDown) {
        this.goodFriend.x -= 3
      } else if (this.cursors.right.isDown || this._rightDown) {
        this.goodFriend.x += 3
      }

      this.goodFriend.x = Phaser.Math.Clamp(this.goodFriend.x, 300, 760)
    }

    // Update labels with characters (always, for smooth animations)
    if (this.scammerLabel) this.scammerLabel.x = this.scammer.x
    if (this.scammerShadow) this.scammerShadow.x = this.scammer.x
    if (this.targetLabel) this.targetLabel.x = this.target.x
    if (this.targetShadow) this.targetShadow.x = this.target.x
    if (this.goodFriendLabel) this.goodFriendLabel.x = this.goodFriend.x
    if (this.goodFriendShadow) this.goodFriendShadow.x = this.goodFriend.x
    if (this.dangerZone) this.dangerZone.x = this.target.x - 80
  }
}
