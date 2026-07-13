import Phaser from "phaser"

/**
 * WorldBootScene - Generates pixel art tile textures for top-down world
 * Creates all tile types procedurally on a 16×16 grid
 */
export class WorldBootScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorldBootScene" })
  }

  preload() {
    const t = (key) => window.__GAME_TRANSLATIONS?.[key] || key
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)

    const loadingText = this.add.text(width / 2, height / 2 - 50, t("loading") || "Loading...", {
      font: "20px monospace",
      fill: "#ffffff",
    }).setOrigin(0.5)

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

    // Generate all tile textures
    this.createTileTextures()
    this.createPlayerTextures()
    this.createNpcTextures()
    this.createObjectTextures()
  }

  /**
   * Draw pixel grid and generate texture
   */
  drawGrid(grid) {
    const h = grid.length
    const w = grid[0].length
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = grid[y][x]
        if (c) {
          g.fillStyle(parseInt(c.replace("#", ""), 16), 1)
          g.fillRect(x, y, 1, 1)
        }
      }
    }
    return g
  }

  createTileTextures() {
    // Grass tile
    const grass = this.drawGrid(this.makeGrid(16, 16, (x, y) => {
      if (Math.random() > 0.85) return "#3a7a2a"
      if (Math.random() > 0.9) return "#4a9a3a"
      return "#2d6b1e"
    }))
    grass.generateTexture("tile_grass", 16, 16)
    grass.destroy()

    // Road tile
    const road = this.drawGrid(this.makeGrid(16, 16, () => "#555555"))
    road.generateTexture("tile_road", 16, 16)
    road.destroy()

    // Sidewalk tile
    const sidewalk = this.drawGrid(this.makeGrid(16, 16, (x, y) => {
      if (x % 8 === 0 || y % 8 === 0) return "#aaaaaa"
      return "#cccccc"
    }))
    sidewalk.generateTexture("tile_sidewalk", 16, 16)
    sidewalk.destroy()

    // Floor tile (indoor)
    const floor = this.drawGrid(this.makeGrid(16, 16, (x, y) => {
      if ((x + y) % 8 === 0) return "#b89a6a"
      return "#c4a882"
    }))
    floor.generateTexture("tile_floor", 16, 16)
    floor.destroy()

    // Water tile
    const water = this.drawGrid(this.makeGrid(16, 16, (x, y) => {
      if ((x + y) % 4 === 0) return "#4488cc"
      return "#3377bb"
    }))
    water.generateTexture("tile_water", 16, 16)
    water.destroy()

    // Wall tile
    const wall = this.drawGrid(this.makeGrid(16, 16, (x, y) => {
      if (y === 0 || y === 15) return "#666666"
      if (x % 4 === 0) return "#888888"
      return "#999999"
    }))
    wall.generateTexture("tile_wall", 16, 16)
    wall.destroy()

    // Door tile
    const door = this.drawGrid(this.makeGrid(16, 16, (x, y) => {
      if (x < 3 || x > 12) return "#553311"
      if (y < 2) return "#886633"
      if (x === 10 && y === 8) return "#ffcc00" // doorknob
      return "#774422"
    }))
    door.generateTexture("tile_door", 16, 16)
    door.destroy()
  }

  createPlayerTextures() {
    const dirs = [
      { name: "down", hairY: 2, eyeY: 5, bodyColor: "#27ae60", shoeY: 13 },
      { name: "up", hairY: 2, eyeY: 0, bodyColor: "#27ae60", shoeY: 13 },
      { name: "left", hairY: 2, eyeY: 5, bodyColor: "#27ae60", shoeY: 13 },
      { name: "right", hairY: 2, eyeY: 5, bodyColor: "#27ae60", shoeY: 13 },
    ]

    // Walk frames: 4 frames per direction
    dirs.forEach(dir => {
      for (let frame = 0; frame < 4; frame++) {
        const g = this.make.graphics({ x: 0, y: 0, add: false })

        // Body (green jacket)
        g.fillStyle(0x27ae60, 1)
        g.fillRect(4, 6, 8, 6)

        // Head
        g.fillStyle(0xf5deb3, 1)
        g.fillRect(5, 1, 6, 5)

        // Hair
        g.fillStyle(0x1a1a1a, 1)
        g.fillRect(5, 0, 6, 2)

        // Eyes
        g.fillStyle(0x000000, 1)
        if (dir.name === "down") {
          g.fillRect(6, 4, 1, 1)
          g.fillRect(9, 4, 1, 1)
        } else if (dir.name === "left") {
          g.fillRect(5, 4, 1, 1)
        } else if (dir.name === "right") {
          g.fillRect(10, 4, 1, 1)
        }

        // Legs (walk animation)
        g.fillStyle(0x333333, 1)
        if (frame === 0 || frame === 2) {
          g.fillRect(5, 12, 3, 3)
          g.fillRect(8, 12, 3, 3)
        } else if (frame === 1) {
          g.fillRect(4, 12, 3, 3)
          g.fillRect(9, 12, 3, 3)
        } else {
          g.fillRect(6, 12, 3, 3)
          g.fillRect(7, 12, 3, 3)
        }

        // Shoes
        g.fillStyle(0xffffff, 1)
        g.fillRect(5, 15, 2, 1)
        g.fillRect(9, 15, 2, 1)

        // Shield emblem on chest
        g.fillStyle(0xffd700, 1)
        g.fillRect(7, 8, 2, 2)

        g.generateTexture(`player_${dir.name}_${frame}`, 16, 16)
        g.destroy()
      }
    })

    // Idle frame (same as walk frame 0 facing down)
    const idle = this.make.graphics({ x: 0, y: 0, add: false })
    idle.fillStyle(0x27ae60, 1)
    idle.fillRect(4, 6, 8, 6)
    idle.fillStyle(0xf5deb3, 1)
    idle.fillRect(5, 1, 6, 5)
    idle.fillStyle(0x1a1a1a, 1)
    idle.fillRect(5, 0, 6, 2)
    idle.fillStyle(0x000000, 1)
    idle.fillRect(6, 4, 1, 1)
    idle.fillRect(9, 4, 1, 1)
    idle.fillStyle(0x333333, 1)
    idle.fillRect(5, 12, 3, 3)
    idle.fillRect(8, 12, 3, 3)
    idle.fillStyle(0xffffff, 1)
    idle.fillRect(5, 15, 2, 1)
    idle.fillRect(9, 15, 2, 1)
    idle.fillStyle(0xffd700, 1)
    idle.fillRect(7, 8, 2, 2)
    idle.generateTexture("player_idle", 16, 16)
    idle.destroy()
  }

  createNpcTextures() {
    const npcTypes = [
      { name: "citizen", bodyColor: 0x4a90d9, hairColor: 0x8b4513 },
      { name: "elderly", bodyColor: 0x8b6914, hairColor: 0xcccccc },
      { name: "police", bodyColor: 0x1a237e, hairColor: 0x1a1a1a },
      { name: "delivery", bodyColor: 0xff6600, hairColor: 0x1a1a1a },
      { name: "student", bodyColor: 0x00bcd4, hairColor: 0x1a1a1a },
      { name: "scammer", bodyColor: 0x8b0000, hairColor: 0x1a1a1a },
      { name: "bank_staff", bodyColor: 0x2e7d32, hairColor: 0x1a1a1a },
      { name: "teacher", bodyColor: 0x6a1b9a, hairColor: 0x3e2723 },
      { name: "business_owner", bodyColor: 0x37474f, hairColor: 0x1a1a1a },
    ]

    npcTypes.forEach(npc => {
      const g = this.make.graphics({ x: 0, y: 0, add: false })
      // Body
      g.fillStyle(npc.bodyColor, 1)
      g.fillRect(4, 6, 8, 6)
      // Head
      g.fillStyle(0xf5deb3, 1)
      g.fillRect(5, 1, 6, 5)
      // Hair
      g.fillStyle(npc.hairColor, 1)
      g.fillRect(5, 0, 6, 2)
      // Eyes
      g.fillStyle(0x000000, 1)
      g.fillRect(6, 4, 1, 1)
      g.fillRect(9, 4, 1, 1)
      // Legs
      g.fillStyle(0x333333, 1)
      g.fillRect(5, 12, 3, 3)
      g.fillRect(8, 12, 3, 3)
      // Shoes
      g.fillStyle(0x222222, 1)
      g.fillRect(5, 15, 2, 1)
      g.fillRect(9, 15, 2, 1)

      g.generateTexture(`npc_${npc.name}`, 16, 16)
      g.destroy()
    })
  }

  createObjectTextures() {
    // Tree
    const tree = this.make.graphics({ x: 0, y: 0, add: false })
    tree.fillStyle(0x5c3a1e, 1)
    tree.fillRect(6, 10, 4, 6)
    tree.fillStyle(0x228b22, 1)
    tree.fillCircle(8, 6, 6)
    tree.fillStyle(0x2ecc71, 1)
    tree.fillCircle(6, 5, 4)
    tree.generateTexture("obj_tree", 16, 16)
    tree.destroy()

    // Bush
    const bush = this.make.graphics({ x: 0, y: 0, add: false })
    bush.fillStyle(0x228b22, 1)
    bush.fillCircle(8, 10, 6)
    bush.fillStyle(0x2ecc71, 1)
    bush.fillCircle(6, 9, 4)
    bush.generateTexture("obj_bush", 16, 16)
    bush.destroy()

    // Bench
    const bench = this.make.graphics({ x: 0, y: 0, add: false })
    bench.fillStyle(0x8b6914, 1)
    bench.fillRect(1, 8, 14, 3)
    bench.fillRect(2, 11, 2, 4)
    bench.fillRect(12, 11, 2, 4)
    bench.fillStyle(0xa07818, 1)
    bench.fillRect(1, 6, 14, 2)
    bench.generateTexture("obj_bench", 16, 16)
    bench.destroy()

    // Street light
    const light = this.make.graphics({ x: 0, y: 0, add: false })
    light.fillStyle(0x666666, 1)
    light.fillRect(7, 4, 2, 12)
    light.fillStyle(0xffd700, 1)
    light.fillCircle(8, 3, 3)
    light.generateTexture("obj_street_light", 16, 16)
    light.destroy()

    // Sign
    const sign = this.make.graphics({ x: 0, y: 0, add: false })
    sign.fillStyle(0x666666, 1)
    sign.fillRect(7, 8, 2, 8)
    sign.fillStyle(0x8b6914, 1)
    sign.fillRect(2, 2, 12, 6)
    sign.fillStyle(0xffffff, 1)
    sign.fillRect(3, 3, 10, 4)
    sign.generateTexture("obj_sign", 16, 16)
    sign.destroy()

    // ATM
    const atm = this.make.graphics({ x: 0, y: 0, add: false })
    atm.fillStyle(0x555555, 1)
    atm.fillRect(2, 2, 12, 12)
    atm.fillStyle(0x0066cc, 1)
    atm.fillRect(4, 3, 8, 5)
    atm.fillStyle(0x333333, 1)
    atm.fillRect(4, 9, 8, 4)
    atm.fillStyle(0x00ff00, 1)
    atm.fillRect(9, 10, 2, 1)
    atm.generateTexture("obj_atm", 16, 16)
    atm.destroy()

    // Building (generic)
    const building = this.make.graphics({ x: 0, y: 0, add: false })
    building.fillStyle(0x8b7355, 1)
    building.fillRect(0, 0, 16, 16)
    building.fillStyle(0x6b5335, 1)
    building.fillRect(0, 0, 16, 2)
    // Windows
    building.fillStyle(0x88ccff, 0.8)
    building.fillRect(2, 4, 4, 3)
    building.fillRect(10, 4, 4, 3)
    building.fillRect(2, 10, 4, 3)
    building.fillRect(10, 10, 4, 3)
    building.generateTexture("obj_building", 16, 16)
    building.destroy()

    // House
    const house = this.make.graphics({ x: 0, y: 0, add: false })
    house.fillStyle(0xcd853f, 1)
    house.fillRect(0, 4, 16, 12)
    house.fillStyle(0x8b0000, 1)
    house.fillTriangle(0, 4, 16, 4, 8, 0)
    house.fillStyle(0x88ccff, 0.8)
    house.fillRect(3, 7, 3, 3)
    house.fillRect(10, 7, 3, 3)
    house.fillStyle(0x553311, 1)
    house.fillRect(6, 11, 4, 5)
    house.generateTexture("obj_house", 16, 16)
    house.destroy()

    // Coffee shop
    const coffee = this.make.graphics({ x: 0, y: 0, add: false })
    coffee.fillStyle(0x5d4037, 1)
    coffee.fillRect(0, 2, 16, 14)
    coffee.fillStyle(0x3e2723, 1)
    coffee.fillRect(0, 0, 16, 3)
    coffee.fillStyle(0xffcc80, 0.8)
    coffee.fillRect(2, 5, 5, 4)
    coffee.fillRect(9, 5, 5, 4)
    coffee.fillStyle(0x4e342e, 1)
    coffee.fillRect(6, 11, 4, 5)
    coffee.generateTexture("obj_coffee_shop", 16, 16)
    coffee.destroy()

    // School
    const school = this.make.graphics({ x: 0, y: 0, add: false })
    school.fillStyle(0xb0bec5, 1)
    school.fillRect(0, 2, 16, 14)
    school.fillStyle(0x78909c, 1)
    school.fillRect(0, 0, 16, 3)
    school.fillStyle(0x88ccff, 0.8)
    school.fillRect(2, 5, 4, 3)
    school.fillRect(6, 5, 4, 3)
    school.fillRect(10, 5, 4, 3)
    school.fillStyle(0xff0000, 1)
    school.fillRect(7, 10, 2, 2)
    school.generateTexture("obj_school", 16, 16)
    school.destroy()

    // Mini mart
    const mart = this.make.graphics({ x: 0, y: 0, add: false })
    mart.fillStyle(0xf5f5f5, 1)
    mart.fillRect(0, 2, 16, 14)
    mart.fillStyle(0x2196f3, 1)
    mart.fillRect(0, 0, 16, 3)
    mart.fillStyle(0x4caf50, 1)
    mart.fillRect(1, 1, 4, 1)
    mart.fillStyle(0xffeb3b, 0.8)
    mart.fillRect(2, 5, 5, 5)
    mart.fillRect(9, 5, 5, 5)
    mart.fillStyle(0x333333, 1)
    mart.fillRect(6, 11, 4, 5)
    mart.generateTexture("obj_mini_mart", 16, 16)
    mart.destroy()

    // Interaction indicator (exclamation mark)
    const interact = this.make.graphics({ x: 0, y: 0, add: false })
    interact.fillStyle(0xffd700, 1)
    interact.fillRect(3, 0, 2, 4)
    interact.fillRect(3, 5, 2, 2)
    interact.generateTexture("interact_indicator", 16, 16)
    interact.destroy()
  }

  /**
   * Helper: create a 2D grid with a fill function
   */
  makeGrid(w, h, fillFn) {
    const grid = []
    for (let y = 0; y < h; y++) {
      grid[y] = []
      for (let x = 0; x < w; x++) {
        grid[y][x] = fillFn(x, y)
      }
    }
    return grid
  }

  create() {
    this.scene.start("WorldScene")
  }
}
