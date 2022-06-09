import geckos from '@geckos.io/server'
import { iceServers } from '@geckos.io/server'

import pkg from 'phaser'
const { Scene } = pkg

import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
const SI = new SnapshotInterpolation()

import path from 'path'
import fs from 'fs'


// dir and filenames
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// imports for components
import Player from '../components/Player.js'
import Block from '../components/Block.js'
import Bomb from '../components/Bomb.js'
import Explosion from '../components/Explosion.js'

// imports for stages
const stageBlocks = Object.values(JSON.parse(fs.readFileSync(__dirname + '/../stages/01.json', 'utf8')))

export class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.playerId = 0
    this.tick = 0
    this.blockID = 0
    this.players = new Map()
    this.blocks = new Map()
    this.bombs = new Map()
    this.spawnLocations = []
  }

  init() {
    this.io = geckos({
      iceServers: process.env.NODE_ENV === 'production' ? iceServers : []
    })
    this.io.addServer(this.game.server)
  }

  getId() {
    return ++this.playerId
  }

  getState() {
    return 'hi!'
  }

  create() {
    this.playersGroup = this.add.group()

    this.physics.world.setBounds(64, 64, 704, 768)
    // create physics groups
    this.physicsBlocks = this.physics.add.staticGroup()
    this.physicsAvatars = this.physics.add.group()
    this.physicsBombs = this.physics.add.group()
    // create stage
    let rowCount = 0
    let colCount = 0
    let blockID = 0
    stageBlocks.forEach(rows => {
      rows.forEach(colEntry => {
        // "b" breakable blocks have a tiny chance of not being created. "e" edge and "s" static always are
        if (colEntry === "e" || colEntry === "s" || (colEntry === "b" && Math.random() > 0.05)) {
          let blockEntity = new Block({scene: this, x: (colCount * 64 + 32), y: (rowCount * 64 + 32), serverMode: true, blockType: colEntry, blockID: this.blockID})
          //exit
          blockID = this.blockID
          this.blocks.set(blockID, {
            blockID, 
            blockEntity
          })
          this.blockID++
        } else if (parseInt(colEntry) >= 1 && parseInt(colEntry) < 100 ) {
          // only values of 1 to 100 will create spawn points
          this.spawnLocations.push({x: (colCount * 64), y: (rowCount * 64)})
        }
        colCount++
      })
      colCount = 0
      rowCount++
    })

    this.io.onConnection(channel => {
      channel.onDisconnect(() => {
        console.log('Disconnect user ' + channel.id)
        this.playersGroup.children.each(player => {
          if (player.playerId === channel.playerId) {
            player.kill()
          }
        })
        channel.room.emit('removePlayer', channel.playerId)
      })


      channel.on('getId', () => {
        channel.playerId = this.getId()
        channel.emit('getId', channel.playerId.toString(36))
      })

      channel.on('addPlayer', data => {
        const x = this.spawnLocations[channel.playerId - 1].x + 32
        const y = this.spawnLocations[channel.playerId - 1].y + 32
        const avatar = new Player(this, channel.playerId, x, y)
        avatar.setData({playerAnimFrame: 'p' + avatar.playerID + '_stand'})
        this.playersGroup.add(avatar)
        
        this.players.set(channel.id, {
          channel,
          avatar
        })
      })

      channel.on('playerMove', data => {
        this.players.get(channel.id).avatar.setMove(data)
      })

      channel.on('dropBomb', dropBomb => {
        const player = this.players.get(channel.id).avatar
        if (player.currentLaidBombs <= player.maxBombs ) {
          const bombEntity = new Bomb({scene: this, x: player.x, y: player.y})
          const bombID = this.bombs.size
          this.bombs.set(bombID, {
            bombID,
            bombEntity
          })
          player.addCurrentLaidBomb()
          console.log(player.currentLaidBombs)
        }
      })

      channel.emit('ready')
    })
  }

  update() {
    this.tick++

    // only send the update to the client at 15 FPS (save bandwidth)
    if (this.tick % 4 !== 0) return

    // get an array of all avatars
    const avatars = []
    this.players.forEach(player => {
      const { channel, avatar } = player
      avatars.push({ id: channel.id, x: avatar.x, y: avatar.y, playerNumber: avatar.playerID, playerAnimFrame: avatar.animFrame, bombRange: avatar.bombRange, maxBombs: avatar.maxBombs})
    })

    // get an array of all blocks
    const blocksArr = []
    this.blocks.forEach(block => {
      const { blockID, blockEntity } = block
      blocksArr.push({ id: blockID, x: blockEntity.x, y: blockEntity.y, blockType: blockEntity.blockType })
    })

    // get an array of all bombs
    const bombsArr = []
    this.bombs.forEach(bomb => {
      const { bombID, bombEntity } = bomb
      bombsArr.push({ id: bombID, x: bombEntity.x, y: bombEntity.y })
    })
        
    const worldState = {
      players: avatars,
      blocks: blocksArr,
      bombs: bombsArr
    }

    const snapshot = SI.snapshot.create(worldState)
    SI.vault.add(snapshot)

    // send all avatars and blocks to all players
    this.players.forEach(player => {
      const { channel } = player
      channel.emit('snapshot', snapshot)
    })

  }
}
