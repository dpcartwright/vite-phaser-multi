//// <reference path="../phaser.d.ts" />

import Phaser, { Game } from 'phaser'

import BootScene from './scenes/bootScene.js'
import GameScene from './scenes/gameScene.js'
import FullScreenEvent from './components/fullscreenEvent.js'

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 832,
    zoom: 1
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true,
      debugBodyColor: 0xff00ff
    },
  },
  scene: [BootScene, GameScene]
}

window.addEventListener('load', () => {
  const game = new Game(config)
  FullScreenEvent(() => resize(game))
})
