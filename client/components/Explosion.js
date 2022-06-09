export default class Explosion extends Phaser.Physics.Arcade.Sprite {
  constructor(data) {
    let { scene, x, y, frame, serverMode  } = data
/*
    switch (blockType) {
      case "e":
        frame = 'edge_block'
        break
      case "s":
        frame = 'static_block'
        break
      default:
        // probably a "b"
        frame = 'breakable_block'
    }
*/
    if (serverMode) {
      super(scene, x, y, '')
    } else {
      super(scene, x, y, frame)
    }
    
    scene.add.existing(this)
    this.setScale(1.4)
  }
}