import express from 'express'
import http from 'http'
import cors from 'cors'
import path from 'path'
import { PhaserGame } from './game/game.js'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const server = http.createServer(app)

const game = new PhaserGame(server)
const port = 1444

// TODO: Add helmet

app.use(cors())

app.use('/', express.static(path.join(__dirname, '../client')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'))
})

app.get('/getState', (req, res) => {
  try {
    let gameScene = game.scene.keys['GameScene']
    return res.json({ state: gameScene.getState() })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})


app.listen(process.env.PORT, () => {
  console.log(`Static server started and listening on port ${process.env.PORT}`)
})

export const viteNodeApp = app