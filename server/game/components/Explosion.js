export default class Explosion extends Phaser.Physics.Arcade.Sprite {
  constructor(data) {
    let { scene, x, y, frame, serverMode  } = data
    
    if (serverMode) {
      super(scene, x, y, '')
    } else {
      super(scene, x, y, frame)
    }
    
    scene.add.existing(this)
    this.setScale(1.4)
  }
}