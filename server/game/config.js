import '@geckos.io/phaser-on-nodejs'

import Phaser from 'phaser'
import { GameScene } from './scenes/gameScene.js'

export const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-game',
  width: 1024,
  height: 832,
  zoom: 1,
  banner: false,
  audio: false,
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }
    }
  }
}