export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, playerID, x, y) {
    super(scene, x, y, '')

    this.setOrigin(0.7,0.9)
        
    scene.add.existing(this)
    scene.physicsAvatars.add(this)
    this.body.setSize(50,50)
    this.body.setOffset(-3,14)
    this.body.setBounce(0)
    this.body.setCollideWorldBounds()
    
    this.processingDamage = false

    this.scene = scene

    this.bombRange = 2
    this.maxBombs = 1
    this.currentLaidBombs = 0

    this.speed = 64

    this.dead = false

    this.playerID = playerID
    
    this.move = {}
    this.animFrame = 'p' + this.playerID + '_stand'

    scene.events.on('update', this.update, this)
  }

  hitWithExplosion() {
    this.processingDamage = true
    this.kill()
    console.log('killed: ' + this.playerID)
  }

  kill() {
    this.dead = true
    this.setActive(false)
  }

  setMove(move) {
    this.move = move
  }

  addCurrentLaidBomb() {
    this.currentLaidBombs++
  }

  clearCurrentLaidBomb() {
    this.currentLaidBombs--
  }

  setAnimFrame(playerAnimFrame) {
    this.animFrame = playerAnimFrame
  }

  setMaxBombs(newMaxBombs) {
    this.maxBombs = newMaxBombs
  }

  setBombPower(newBombPower) {
    this.bombPower = newBombPower
  }

  update() {
    if (this.move.left) this.setVelocityX(-this.speed)
    else if (this.move.right) this.setVelocityX(this.speed)
    else this.setVelocityX(0)

    if (this.move.up) this.setVelocityY(-this.speed)
    else if (this.move.down) this.setVelocityY(this.speed)
    else this.setVelocityY(0)          
    
    const playerPrefix = 'p' + this.playerID
    
    let playerAnimFrame = ''
    if (this.body.velocity.y <  0 ) { 
      playerAnimFrame = playerPrefix + '_walk_up'
    } else if (this.body.velocity.y >  0 ) {
      playerAnimFrame = playerPrefix + '_walk_down'
    } else if (this.body.velocity.x <  0 ) {
      playerAnimFrame = playerPrefix + '_walk_left'
    } else if (this.body.velocity.x >  0 ) {
      playerAnimFrame = playerPrefix + '_walk_right'
    } else {
      playerAnimFrame = playerPrefix + '_stand'
    }
    
    this.setAnimFrame(playerAnimFrame)
  }
}
