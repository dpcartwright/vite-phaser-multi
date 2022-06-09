export default class Block extends Phaser.Physics.Arcade.Sprite {
  constructor(data) {
    let { scene, x, y, frame, serverMode, blockType, blockID } = data

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

    if (serverMode) {
      super(scene, x, y, '')
    } else {
      super(scene, x, y, frame)
    }

    this.blockType = blockType
    this.blockID = blockID
    this.processingDamage = false

    scene.add.existing(this)
    scene.physicsBlocks.add(this)
    this.body.setSize(64,64)
    this.setImmovable()

  }
  
  hitWithExplosion() {
    this.processingDamage = true
    // only actually do anything if it's a "b" breakable block
    if (this.blockType === 'b') {
      this.destroy()
    }
  }
}