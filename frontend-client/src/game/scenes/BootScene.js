import Phaser from "phaser"

/**
 * BootScene - Loads assets and creates pixel art character sprites
 * All sprites are drawn on a 16×16 grid for authentic pixel art look
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" })
  }

  preload() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Loading bar
    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)

    const t = (key) => window.__GAME_TRANSLATIONS?.[key] || key
    const loadingText = this.add.text(width / 2, height / 2 - 50, t("loading"), {
      font: "20px monospace",
      fill: "#ffffff",
    })
    loadingText.setOrigin(0.5, 0.5)

    this.load.on("progress", (value) => {
      progressBar.clear()
      progressBar.fillStyle(0x00ff00, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30)
    })

    this.load.on("complete", () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })

    // Create all pixel art assets
    this.createCharacterSprites()
    this.createProjectileSprite()
    this.createExplosionSprite()
    this.createBackgroundLayers()
  }

  /**
   * Draw a pixel art sprite from a 2D color map
   * @param {Phaser.Scene} scene
   * @param {string[][]} grid - 2D array of hex color strings (null = transparent)
   * @param {number} pixelSize - Each pixel's size in the output texture
   */
  drawPixelGrid(scene, grid, pixelSize = 1) {
    const h = grid.length
    const w = grid[0].length
    const g = scene.make.graphics({ x: 0, y: 0, add: false })

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = grid[y][x]
        if (color) {
          g.fillStyle(parseInt(color.replace("#", ""), 16), 1)
          g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
        }
      }
    }
    return g
  }

  createCharacterSprites() {
    const P = 1 // pixel size (1 unit per pixel, Phaser scales via sprite.setScale)

    // ─── SCAMMER (16×16) ───
    // Dark suit, black slicked hair, evil grin, phone in hand
    const scammer = [
      [null,null,null,null,null,"#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a",null,null,null,null],
      [null,null,null,null,"#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a",null,null,null],
      [null,null,null,null,"#1a1a1a","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#1a1a1a",null,null,null,null],
      [null,null,null,null,"#f5deb3","#f5deb3","#000000","#f5deb3","#f5deb3","#000000","#f5deb3","#f5deb3",null,null,null,null],
      [null,null,null,null,"#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3",null,null,null,null],
      [null,null,null,null,"#f5deb3","#cc4444","#cc4444","#cc4444","#cc4444","#cc4444","#f5deb3","#f5deb3",null,null,null,null],
      [null,null,null,null,null,"#f5deb3","#8b0000","#8b0000","#8b0000","#8b0000",null,null,null,null,null,null],
      [null,null,null,null,"#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000",null,null,null,null,null],
      [null,null,null,"#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000",null,null,null,null],
      [null,null,null,"#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000",null,null,null,null],
      [null,null,null,"#f5deb3","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#8b0000","#f5deb3","#333333","#4488ff",null,null],
      [null,null,null,null,"#1a1a1a","#1a1a1a",null,null,null,null,"#1a1a1a","#1a1a1a",null,"#4488ff",null,null],
      [null,null,null,null,"#1a1a1a","#1a1a1a",null,null,null,null,"#1a1a1a","#1a1a1a",null,null,null,null],
      [null,null,null,null,"#1a1a1a","#1a1a1a",null,null,null,null,"#1a1a1a","#1a1a1a",null,null,null,null],
      [null,null,null,null,"#1a1a1a","#1a1a1a",null,null,null,null,"#1a1a1a","#1a1a1a",null,null,null,null],
      [null,null,null,"#111111","#111111","#111111",null,null,null,null,"#111111","#111111","#111111",null,null,null],
    ]

    // ─── TARGET (16×16) ───
    // Blue shirt, brown hair, confused expression
    const target = [
      [null,null,null,null,null,"#8b4513","#8b4513","#8b4513","#8b4513","#8b4513","#8b4513","#8b4513",null,null,null,null],
      [null,null,null,null,"#8b4513","#8b4513","#8b4513","#8b4513","#8b4513","#8b4513","#8b4513","#8b4513","#8b4513",null,null,null],
      [null,null,null,null,"#8b4513","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#8b4513",null,null,null,null],
      [null,null,null,null,"#f5deb3","#f5deb3","#000000","#f5deb3","#f5deb3","#000000","#f5deb3","#f5deb3",null,null,null,null],
      [null,null,null,null,"#f5deb3","#ffffff","#000000","#f5deb3","#f5deb3","#ffffff","#000000","#f5deb3",null,null,null,null],
      [null,null,null,null,"#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3",null,null,null,null],
      [null,null,null,null,"#f5deb3","#f5deb3","#cc6666","#f5deb3","#cc6666","#f5deb3","#f5deb3","#f5deb3",null,null,null,null],
      [null,null,null,null,null,"#f5deb3","#4a90d9","#4a90d9","#4a90d9","#4a90d9",null,null,null,null,null,null],
      [null,null,null,null,"#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9",null,null,null,null,null],
      [null,null,null,"#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9",null,null,null,null],
      [null,null,null,"#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9",null,null,null,null],
      [null,null,null,"#f5deb3","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#4a90d9","#f5deb3",null,null,null,null],
      [null,null,null,null,"#333333","#333333",null,null,null,null,"#333333","#333333",null,null,null,null],
      [null,null,null,null,"#333333","#333333",null,null,null,null,"#333333","#333333",null,null,null,null],
      [null,null,null,null,"#333333","#333333",null,null,null,null,"#333333","#333333",null,null,null,null],
      [null,null,null,"#654321","#654321","#654321",null,null,null,null,"#654321","#654321","#654321",null,null,null],
    ]

    // ─── GOOD FRIEND / PLAYER (16×16) ───
    // Green jacket, glasses, cape, gold shield emblem
    const friend = [
      [null,null,null,null,null,"#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a",null,null,null,null],
      [null,null,null,null,"#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a","#1a1a1a",null,null,null],
      [null,null,null,null,"#1a1a1a","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#f5deb3","#1a1a1a",null,null,null,null],
      [null,null,null,null,"#f5deb3","#333333","#000000","#f5deb3","#f5deb3","#333333","#000000","#f5deb3",null,null,null,null],
      [null,null,null,null,"#f5deb3","#333333","#000000","#f5deb3","#f5deb3","#333333","#000000","#f5deb3",null,null,null,null],
      [null,null,null,null,"#f5deb3","#f5deb3","#f5deb3","#222222","#f5deb3","#f5deb3","#f5deb3","#f5deb3",null,null,null,null],
      [null,null,null,null,"#f5deb3","#f5deb3","#27ae60","#27ae60","#27ae60","#f5deb3","#f5deb3","#f5deb3",null,null,null,null],
      [null,null,null,null,null,"#2ecc71","#27ae60","#27ae60","#27ae60","#27ae60",null,null,null,null,null,null],
      [null,null,null,"#2ecc71","#27ae60","#27ae60","#27ae60","#ffd700","#27ae60","#27ae60","#27ae60",null,null,null,null],
      [null,null,null,"#2ecc71","#27ae60","#27ae60","#27ae60","#ffd700","#27ae60","#27ae60","#27ae60","#2ecc71",null,null,null,null],
      [null,null,null,"#2ecc71","#27ae60","#27ae60","#27ae60","#27ae60","#27ae60","#27ae60","#27ae60","#2ecc71",null,null,null,null],
      [null,null,null,"#f5deb3","#27ae60","#27ae60","#27ae60","#27ae60","#27ae60","#27ae60","#27ae60","#f5deb3",null,null,null,null],
      [null,null,null,null,"#333333","#333333",null,null,null,null,"#333333","#333333",null,null,null,null],
      [null,null,null,null,"#333333","#333333",null,null,null,null,"#333333","#333333",null,null,null,null],
      [null,null,null,null,"#333333","#333333",null,null,null,null,"#333333","#333333",null,null,null,null],
      [null,null,null,"#ffffff","#ffffff","#ffffff",null,null,null,null,"#ffffff","#ffffff","#ffffff",null,null,null],
    ]

    // Draw and generate textures
    const scammerGfx = this.drawPixelGrid(this, scammer, P)
    scammerGfx.generateTexture("scammer", 16 * P, 16 * P)
    scammerGfx.destroy()

    const targetGfx = this.drawPixelGrid(this, target, P)
    targetGfx.generateTexture("target", 16 * P, 16 * P)
    targetGfx.destroy()

    const friendGfx = this.drawPixelGrid(this, friend, P)
    friendGfx.generateTexture("good_friend", 16 * P, 16 * P)
    friendGfx.destroy()
  }

  createProjectileSprite() {
    const grid = [
      [null,null,"#00ff88","#00ff88",null,null],
      [null,"#00ff88","#ffffff","#00ff88","#00ff88",null],
      ["#00ff88","#ffffff","#00ff88","#00ff88","#00ff88","#00ff88"],
      ["#00ff88","#00ff88","#00ff88","#00ff88","#00ff88","#00ff88"],
      [null,"#00ff88","#00ff88","#00ff88","#00ff88",null],
      [null,null,"#00ff88","#00ff88",null,null],
    ]
    const gfx = this.drawPixelGrid(this, grid, 1)
    gfx.generateTexture("projectile", 6, 6)
    gfx.destroy()
  }

  createExplosionSprite() {
    const grid = [
      [null,null,"#ffcc00","#ffcc00",null,null],
      [null,"#ffcc00","#ffffff","#ffffff","#ffcc00",null],
      ["#ffcc00","#ffffff","#ff6600","#ff6600","#ffffff","#ffcc00"],
      ["#ffcc00","#ffffff","#ff6600","#ff6600","#ffffff","#ffcc00"],
      [null,"#ffcc00","#ffffff","#ffffff","#ffcc00",null],
      [null,null,"#ffcc00","#ffcc00",null,null],
    ]
    const gfx = this.drawPixelGrid(this, grid, 1)
    gfx.generateTexture("explosion", 6, 6)
    gfx.destroy()
  }

  createBackgroundLayers() {
    // ─── FAR BUILDINGS (tileable strip) ───
    const farBuildings = []
    const bw = 200 // texture width (will be tiled)
    const bh = 120
    for (let y = 0; y < bh; y++) farBuildings[y] = new Array(bw).fill(null)

    // Draw dark building silhouettes
    const drawBldg = (x, w, h, color) => {
      for (let py = bh - h; py < bh; py++) {
        for (let px = x; px < x + w && px < bw; px++) {
          farBuildings[py][px] = color
        }
      }
      // Windows
      for (let py = bh - h + 4; py < bh - 3; py += 8) {
        for (let px = x + 3; px < x + w - 3; px += 6) {
          if (Math.random() > 0.3) farBuildings[py][px] = "#ffd700"
        }
      }
    }

    drawBldg(0, 25, 70, "#0f1b33")
    drawBldg(30, 20, 50, "#162040")
    drawBldg(55, 30, 90, "#0d1528")
    drawBldg(90, 22, 60, "#1a2545")
    drawBldg(118, 28, 80, "#0f1b33")
    drawBldg(150, 25, 55, "#162040")
    drawBldg(180, 20, 65, "#0d1528")

    const farGfx = this.drawPixelGrid(this, farBuildings, 1)
    farGfx.generateTexture("far_buildings", bw, bh)
    farGfx.destroy()

    // ─── NEAR BUILDINGS (tileable strip) ───
    const nearBuildings = []
    const nh = 160
    for (let y = 0; y < nh; y++) nearBuildings[y] = new Array(bw).fill(null)

    const drawNearBldg = (x, w, h, color) => {
      for (let py = nh - h; py < nh; py++) {
        for (let px = x; px < x + w && px < bw; px++) {
          nearBuildings[py][px] = color
        }
      }
      // Windows (larger, brighter)
      for (let py = nh - h + 6; py < nh - 4; py += 10) {
        for (let px = x + 4; px < x + w - 4; px += 8) {
          if (Math.random() > 0.25) {
            nearBuildings[py][px] = "#ffd700"
            nearBuildings[py][px + 1] = "#ffd700"
            nearBuildings[py + 1][px] = "#ffd700"
            nearBuildings[py + 1][px + 1] = "#ffd700"
          }
        }
      }
    }

    drawNearBldg(0, 35, 100, "#16213e")
    drawNearBldg(40, 28, 130, "#1a1a2e")
    drawNearBldg(75, 32, 90, "#0f3460")
    drawNearBldg(112, 30, 110, "#16213e")
    drawNearBldg(148, 28, 95, "#1a1a2e")
    drawNearBldg(180, 20, 75, "#0f3460")

    const nearGfx = this.drawPixelGrid(this, nearBuildings, 1)
    nearGfx.generateTexture("near_buildings", bw, nh)
    nearGfx.destroy()

    // ─── TREES / BUSHES (tileable strip) ───
    const trees = []
    const th = 40
    for (let y = 0; y < th; y++) trees[y] = new Array(bw).fill(null)

    const drawTree = (x, trunkW, canopyW, canopyH) => {
      // Trunk
      for (let py = th - 10; py < th; py++) {
        for (let px = x + Math.floor((canopyW - trunkW) / 2); px < x + Math.floor((canopyW - trunkW) / 2) + trunkW; px++) {
          if (px >= 0 && px < bw) trees[py][px] = "#5c3a1e"
        }
      }
      // Canopy
      for (let py = th - 10 - canopyH; py < th - 6; py++) {
        for (let px = x; px < x + canopyW && px < bw; px++) {
          if (py >= 0 && py < th) trees[py][px] = Math.random() > 0.3 ? "#1a6b1a" : "#228b22"
        }
      }
    }

    drawTree(5, 3, 14, 18)
    drawTree(25, 2, 10, 14)
    drawTree(45, 3, 16, 20)
    drawTree(70, 2, 12, 16)
    drawTree(90, 3, 14, 18)
    drawTree(115, 2, 10, 14)
    drawTree(135, 3, 16, 20)
    drawTree(160, 2, 12, 16)
    drawTree(180, 3, 14, 18)

    const treesGfx = this.drawPixelGrid(this, trees, 1)
    treesGfx.generateTexture("trees", bw, th)
    treesGfx.destroy()

    // ─── ROAD (tileable strip) ───
    const road = []
    const rh = 40
    for (let y = 0; y < rh; y++) road[y] = new Array(bw).fill(null)

    // Asphalt
    for (let y = 0; y < rh; y++) {
      for (let x = 0; x < bw; x++) {
        road[y][x] = "#3a3a3a"
      }
    }
    // Road markings (dashed center line)
    for (let x = 0; x < bw; x += 20) {
      for (let px = x; px < x + 10 && px < bw; px++) {
        road[Math.floor(rh / 2)][px] = "#ffffff"
        road[Math.floor(rh / 2) + 1][px] = "#ffffff"
      }
    }
    // Edge lines
    for (let x = 0; x < bw; x++) {
      road[1][x] = "#666666"
      road[rh - 2][x] = "#666666"
    }

    const roadGfx = this.drawPixelGrid(this, road, 1)
    roadGfx.generateTexture("road", bw, rh)
    roadGfx.destroy()
  }

  create() {
    this.scene.start("GameScene")
  }
}
