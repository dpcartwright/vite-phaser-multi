
import Explosion from './Explosion.js'

export default class Bomb extends Phaser.Physics.Arcade.Sprite {
  constructor(data) {
    let { scene, x, y } = data

    // align bombs to grid
    if (x % 64) x = Math.floor(x / 64) * 64 + 32
    if (y % 64) y = Math.floor(y / 64) * 64 + 32

    super(scene, x , y)

    
    scene.add.existing(this)
    scene.physicsBombs.add(this)
    this.body.setSize(64, 64)
    this.body.setImmovable()

    this.bombRange = 2

    this.isExploding = false
    // use this for triggering the explosion
    this.bombCountdown = this.scene.time.delayedCall(3000, this.explode, [], this)
  }

  explode() {
    this.isExploding = true
    if (typeof(this.bombCountdown) != 'undefined') this.bombCountdown.destroy()
    
    let checkSpriteArr = []
    let explosionNorthBlockedAt = this.bombRange + 1
    let explosionEastBlockedAt = this.bombRange + 1
    let explosionSouthBlockedAt = this.bombRange + 1
    let explosionWestBlockedAt = this.bombRange + 1
    let entitiesInExplosion = []
    for (let i = 1; i <= this.bombRange; i++) {
      // check north
      if (explosionNorthBlockedAt > this.bombRange) {
        let checkSprite = this.scene.add.sprite(this.x, this.y - 64 * i)
        this.scene.physics.add.existing(checkSprite)
        checkSprite.body.setSize(60,60)
        checkSpriteArr.push(checkSprite)
        this.scene.physics.add.overlap(checkSprite,this.scene.physicsBlocks,function(explosionCollider,hitEntity) {
          hitEntity.hitWithExplosion()
          // if we have hit a block the explosion is blocked from going further
          if (typeof hitEntity.blockType !== 'undefined') {
            explosionNorthBlockedAt = i
          }
        })
      }
      // check east
      if (explosionEastBlockedAt > this.bombRange) {
        let checkSprite = this.scene.add.sprite(this.x + 64 * i, this.y)
        this.scene.physics.add.existing(checkSprite)
        checkSprite.body.setSize(60,60)
        checkSpriteArr.push(checkSprite)
        this.scene.physics.add.overlap(checkSprite,this.scene.physicsBlocks,function(explosionCollider,hitEntity) {
          hitEntity.hitWithExplosion()
          // if we have hit a block the explosion is blocked from going further
          if (typeof hitEntity.blockType !== 'undefined') {
            explosionEastBlockedAt = i
          }
        })
      }
      // check south
      if (explosionSouthBlockedAt > this.bombRange) {
        let checkSprite = this.scene.add.sprite(this.x, this.y + 64 * i)
        this.scene.physics.add.existing(checkSprite)
        checkSprite.body.setSize(60,60)
        checkSpriteArr.push(checkSprite)
        this.scene.physics.add.overlap(checkSprite,this.scene.physicsBlocks,function(explosionCollider,hitEntity) {
          hitEntity.hitWithExplosion()
          // if we have hit a block the explosion is blocked from going further
          if (typeof hitEntity.blockType !== 'undefined') {
            explosionSouthBlockedAt = i
          }
        })
      }
      // check west
      if (explosionWestBlockedAt > this.bombRange) {
        let checkSprite = this.scene.add.sprite(this.x - 64 * i, this.y)
        this.scene.physics.add.existing(checkSprite)
        checkSprite.body.setSize(60,60)
        checkSpriteArr.push(checkSprite)
        this.scene.physics.add.overlap(checkSprite,this.scene.physicsBlocks,function(explosionCollider,hitEntity) {
          hitEntity.hitWithExplosion()
          // if we have hit a block the explosion is blocked from going further
          if (typeof hitEntity.blockType !== 'undefined') {
            explosionWestBlockedAt = i
          }
        })
      }
    }

    // explosion damage effect only lasts for 20 msec - then destroy all colliders
    setTimeout(() => {
      const _explosionCentre = new Explosion({scene: checkSpriteArr[0].scene, x: this.x, y: this.y, frame: 'explosion_centre'})
      _explosionCentre.anims.play('explosion_centre_anim', true)
      _explosionCentre.once('animationcomplete', () => {
        _explosionCentre.destroy()
      })
      for (let i = 1; i <= this.bombRange; i++) {
        //north
        if (i < explosionNorthBlockedAt) {
          let _frame = 'explosion_north_end'
          if (i < this.bombRange ) _frame = 'explosion_north'
          const _explosionNorth = new Explosion({scene: checkSpriteArr[0].scene, x: this.x, y: this.y - 64 * i, frame: _frame})
          _explosionNorth.anims.play(_frame +'_anim', true)
          _explosionNorth.once('animationcomplete', () => {
            _explosionNorth.destroy()
          })
        }
        //east
        if (i < explosionEastBlockedAt) {
          let _frame = 'explosion_east_end'
          if (i < this.bombRange ) _frame = 'explosion_east'
          const _explosionEast = new Explosion({scene: checkSpriteArr[0].scene, x: this.x + 64 * i, y: this.y, frame: _frame})
          _explosionEast.anims.play(_frame + '_anim', true)
          _explosionEast.once('animationcomplete', () => {
            _explosionEast.destroy()
          })
        }
        //south
        if (i < explosionSouthBlockedAt) {
          let _frame = 'explosion_south_end'
          if (i < this.bombRange ) _frame = 'explosion_south'
          const _explosionSouth = new Explosion({scene: checkSpriteArr[0].scene, x: this.x, y: this.y + 64 * i, frame: _frame})
          _explosionSouth.anims.play(_frame+ '_anim', true)
          _explosionSouth.once('animationcomplete', () => {
            _explosionSouth.destroy()
          })
        }
        //west
        if (i < explosionWestBlockedAt) {
          let _frame = 'explosion_west_end'
          if (i < this.bombRange ) _frame = 'explosion_west'
          const _explosionWest= new Explosion({scene: checkSpriteArr[0].scene, x: this.x - 64 * i, y: this.y, frame: _frame})
          _explosionWest.anims.play(_frame + '_anim', true)
          _explosionWest.once('animationcomplete', () => {
            _explosionWest.destroy()
          })
        }
      }
      checkSpriteArr.forEach((checkSprite) => checkSprite.destroy())
    }, 20)

    this.scene.physicsBombs.remove(this)
    this.destroy()
  }
  
}