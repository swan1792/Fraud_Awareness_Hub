import Phaser from "phaser"

/**
 * Game configuration for Scam Buster
 */
export const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 500,
  parent: "game-container",
  backgroundColor: "#1a1a2e",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}
