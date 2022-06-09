"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
var express = require("express");
var http = require("http");
var cors = require("cors");
var path = require("path");
require("@geckos.io/phaser-on-nodejs");
var pkg = require("phaser");
var geckos = require("@geckos.io/server");
var snapshotInterpolation = require("@geckos.io/snapshot-interpolation");
var fs = require("fs");
var url = require("url");
function _interopDefaultLegacy(e) {
  return e && typeof e === "object" && "default" in e ? e : { "default": e };
}
var express__default = /* @__PURE__ */ _interopDefaultLegacy(express);
var http__default = /* @__PURE__ */ _interopDefaultLegacy(http);
var cors__default = /* @__PURE__ */ _interopDefaultLegacy(cors);
var path__default = /* @__PURE__ */ _interopDefaultLegacy(path);
var pkg__default = /* @__PURE__ */ _interopDefaultLegacy(pkg);
var geckos__default = /* @__PURE__ */ _interopDefaultLegacy(geckos);
var fs__default = /* @__PURE__ */ _interopDefaultLegacy(fs);
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, playerID, x, y) {
    super(scene, x, y, "");
    this.setOrigin(0.7, 0.9);
    scene.add.existing(this);
    scene.physicsAvatars.add(this);
    this.body.setSize(50, 50);
    this.body.setOffset(-3, 14);
    this.body.setBounce(0);
    this.body.setCollideWorldBounds();
    this.processingDamage = false;
    this.scene = scene;
    this.bombRange = 2;
    this.maxBombs = 1;
    this.currentLaidBombs = 0;
    this.speed = 64;
    this.dead = false;
    this.playerID = playerID;
    this.move = {};
    this.animFrame = "p" + this.playerID + "_stand";
    scene.events.on("update", this.update, this);
  }
  hitWithExplosion() {
    this.processingDamage = true;
    this.kill();
    console.log("killed: " + this.playerID);
  }
  kill() {
    this.dead = true;
    this.setActive(false);
  }
  setMove(move) {
    this.move = move;
  }
  addCurrentLaidBomb() {
    this.currentLaidBombs++;
  }
  clearCurrentLaidBomb() {
    this.currentLaidBombs--;
  }
  setAnimFrame(playerAnimFrame) {
    this.animFrame = playerAnimFrame;
  }
  setMaxBombs(newMaxBombs) {
    this.maxBombs = newMaxBombs;
  }
  setBombPower(newBombPower) {
    this.bombPower = newBombPower;
  }
  update() {
    if (this.move.left)
      this.setVelocityX(-this.speed);
    else if (this.move.right)
      this.setVelocityX(this.speed);
    else
      this.setVelocityX(0);
    if (this.move.up)
      this.setVelocityY(-this.speed);
    else if (this.move.down)
      this.setVelocityY(this.speed);
    else
      this.setVelocityY(0);
    const playerPrefix = "p" + this.playerID;
    let playerAnimFrame = "";
    if (this.body.velocity.y < 0) {
      playerAnimFrame = playerPrefix + "_walk_up";
    } else if (this.body.velocity.y > 0) {
      playerAnimFrame = playerPrefix + "_walk_down";
    } else if (this.body.velocity.x < 0) {
      playerAnimFrame = playerPrefix + "_walk_left";
    } else if (this.body.velocity.x > 0) {
      playerAnimFrame = playerPrefix + "_walk_right";
    } else {
      playerAnimFrame = playerPrefix + "_stand";
    }
    this.setAnimFrame(playerAnimFrame);
  }
}
class Block extends Phaser.Physics.Arcade.Sprite {
  constructor(data) {
    let { scene, x, y, frame, serverMode, blockType, blockID } = data;
    switch (blockType) {
      case "e":
        frame = "edge_block";
        break;
      case "s":
        frame = "static_block";
        break;
      default:
        frame = "breakable_block";
    }
    if (serverMode) {
      super(scene, x, y, "");
    } else {
      super(scene, x, y, frame);
    }
    this.blockType = blockType;
    this.blockID = blockID;
    this.processingDamage = false;
    scene.add.existing(this);
    scene.physicsBlocks.add(this);
    this.body.setSize(64, 64);
    this.setImmovable();
  }
  hitWithExplosion() {
    this.processingDamage = true;
    if (this.blockType === "b") {
      this.destroy();
    }
  }
}
class Explosion extends Phaser.Physics.Arcade.Sprite {
  constructor(data) {
    let { scene, x, y, frame, serverMode } = data;
    if (serverMode) {
      super(scene, x, y, "");
    } else {
      super(scene, x, y, frame);
    }
    scene.add.existing(this);
    this.setScale(1.4);
  }
}
class Bomb extends Phaser.Physics.Arcade.Sprite {
  constructor(data) {
    let { scene, x, y } = data;
    if (x % 64)
      x = Math.floor(x / 64) * 64 + 32;
    if (y % 64)
      y = Math.floor(y / 64) * 64 + 32;
    super(scene, x, y);
    scene.add.existing(this);
    scene.physicsBombs.add(this);
    this.body.setSize(64, 64);
    this.body.setImmovable();
    this.bombRange = 2;
    this.isExploding = false;
    this.bombCountdown = this.scene.time.delayedCall(3e3, this.explode, [], this);
  }
  explode() {
    this.isExploding = true;
    if (typeof this.bombCountdown != "undefined")
      this.bombCountdown.destroy();
    let checkSpriteArr = [];
    let explosionNorthBlockedAt = this.bombRange + 1;
    let explosionEastBlockedAt = this.bombRange + 1;
    let explosionSouthBlockedAt = this.bombRange + 1;
    let explosionWestBlockedAt = this.bombRange + 1;
    for (let i = 1; i <= this.bombRange; i++) {
      if (explosionNorthBlockedAt > this.bombRange) {
        let checkSprite = this.scene.add.sprite(this.x, this.y - 64 * i);
        this.scene.physics.add.existing(checkSprite);
        checkSprite.body.setSize(60, 60);
        checkSpriteArr.push(checkSprite);
        this.scene.physics.add.overlap(checkSprite, this.scene.physicsBlocks, function(explosionCollider, hitEntity) {
          hitEntity.hitWithExplosion();
          if (typeof hitEntity.blockType !== "undefined") {
            explosionNorthBlockedAt = i;
          }
        });
      }
      if (explosionEastBlockedAt > this.bombRange) {
        let checkSprite = this.scene.add.sprite(this.x + 64 * i, this.y);
        this.scene.physics.add.existing(checkSprite);
        checkSprite.body.setSize(60, 60);
        checkSpriteArr.push(checkSprite);
        this.scene.physics.add.overlap(checkSprite, this.scene.physicsBlocks, function(explosionCollider, hitEntity) {
          hitEntity.hitWithExplosion();
          if (typeof hitEntity.blockType !== "undefined") {
            explosionEastBlockedAt = i;
          }
        });
      }
      if (explosionSouthBlockedAt > this.bombRange) {
        let checkSprite = this.scene.add.sprite(this.x, this.y + 64 * i);
        this.scene.physics.add.existing(checkSprite);
        checkSprite.body.setSize(60, 60);
        checkSpriteArr.push(checkSprite);
        this.scene.physics.add.overlap(checkSprite, this.scene.physicsBlocks, function(explosionCollider, hitEntity) {
          hitEntity.hitWithExplosion();
          if (typeof hitEntity.blockType !== "undefined") {
            explosionSouthBlockedAt = i;
          }
        });
      }
      if (explosionWestBlockedAt > this.bombRange) {
        let checkSprite = this.scene.add.sprite(this.x - 64 * i, this.y);
        this.scene.physics.add.existing(checkSprite);
        checkSprite.body.setSize(60, 60);
        checkSpriteArr.push(checkSprite);
        this.scene.physics.add.overlap(checkSprite, this.scene.physicsBlocks, function(explosionCollider, hitEntity) {
          hitEntity.hitWithExplosion();
          if (typeof hitEntity.blockType !== "undefined") {
            explosionWestBlockedAt = i;
          }
        });
      }
    }
    setTimeout(() => {
      const _explosionCentre = new Explosion({ scene: checkSpriteArr[0].scene, x: this.x, y: this.y, frame: "explosion_centre" });
      _explosionCentre.anims.play("explosion_centre_anim", true);
      _explosionCentre.once("animationcomplete", () => {
        _explosionCentre.destroy();
      });
      for (let i = 1; i <= this.bombRange; i++) {
        if (i < explosionNorthBlockedAt) {
          let _frame = "explosion_north_end";
          if (i < this.bombRange)
            _frame = "explosion_north";
          const _explosionNorth = new Explosion({ scene: checkSpriteArr[0].scene, x: this.x, y: this.y - 64 * i, frame: _frame });
          _explosionNorth.anims.play(_frame + "_anim", true);
          _explosionNorth.once("animationcomplete", () => {
            _explosionNorth.destroy();
          });
        }
        if (i < explosionEastBlockedAt) {
          let _frame = "explosion_east_end";
          if (i < this.bombRange)
            _frame = "explosion_east";
          const _explosionEast = new Explosion({ scene: checkSpriteArr[0].scene, x: this.x + 64 * i, y: this.y, frame: _frame });
          _explosionEast.anims.play(_frame + "_anim", true);
          _explosionEast.once("animationcomplete", () => {
            _explosionEast.destroy();
          });
        }
        if (i < explosionSouthBlockedAt) {
          let _frame = "explosion_south_end";
          if (i < this.bombRange)
            _frame = "explosion_south";
          const _explosionSouth = new Explosion({ scene: checkSpriteArr[0].scene, x: this.x, y: this.y + 64 * i, frame: _frame });
          _explosionSouth.anims.play(_frame + "_anim", true);
          _explosionSouth.once("animationcomplete", () => {
            _explosionSouth.destroy();
          });
        }
        if (i < explosionWestBlockedAt) {
          let _frame = "explosion_west_end";
          if (i < this.bombRange)
            _frame = "explosion_west";
          const _explosionWest = new Explosion({ scene: checkSpriteArr[0].scene, x: this.x - 64 * i, y: this.y, frame: _frame });
          _explosionWest.anims.play(_frame + "_anim", true);
          _explosionWest.once("animationcomplete", () => {
            _explosionWest.destroy();
          });
        }
      }
      checkSpriteArr.forEach((checkSprite) => checkSprite.destroy());
    }, 20);
    this.scene.physicsBombs.remove(this);
    this.destroy();
  }
}
const { Scene } = pkg__default["default"];
const SI = new snapshotInterpolation.SnapshotInterpolation();
const __filename$2 = url.fileURLToPath(typeof document === "undefined" ? new (require("url")).URL("file:" + __filename).href : document.currentScript && document.currentScript.src || new URL("server.js", document.baseURI).href);
const __dirname$2 = path.dirname(__filename$2);
const stageBlocks = Object.values(JSON.parse(fs__default["default"].readFileSync(__dirname$2 + "/../stages/01.json", "utf8")));
class GameScene extends Scene {
  constructor() {
    super({ key: "GameScene" });
    this.playerId = 0;
    this.tick = 0;
    this.blockID = 0;
    this.players = /* @__PURE__ */ new Map();
    this.blocks = /* @__PURE__ */ new Map();
    this.bombs = /* @__PURE__ */ new Map();
    this.spawnLocations = [];
  }
  init() {
    this.io = geckos__default["default"]({
      iceServers: process.env.NODE_ENV === "production" ? geckos.iceServers : []
    });
    this.io.addServer(this.game.server);
  }
  getId() {
    return ++this.playerId;
  }
  getState() {
    return "hi!";
  }
  create() {
    this.playersGroup = this.add.group();
    this.physics.world.setBounds(64, 64, 704, 768);
    this.physicsBlocks = this.physics.add.staticGroup();
    this.physicsAvatars = this.physics.add.group();
    this.physicsBombs = this.physics.add.group();
    let rowCount = 0;
    let colCount = 0;
    let blockID = 0;
    stageBlocks.forEach((rows) => {
      rows.forEach((colEntry) => {
        if (colEntry === "e" || colEntry === "s" || colEntry === "b" && Math.random() > 0.05) {
          let blockEntity = new Block({ scene: this, x: colCount * 64 + 32, y: rowCount * 64 + 32, serverMode: true, blockType: colEntry, blockID: this.blockID });
          blockID = this.blockID;
          this.blocks.set(blockID, {
            blockID,
            blockEntity
          });
          this.blockID++;
        } else if (parseInt(colEntry) >= 1 && parseInt(colEntry) < 100) {
          this.spawnLocations.push({ x: colCount * 64, y: rowCount * 64 });
        }
        colCount++;
      });
      colCount = 0;
      rowCount++;
    });
    this.io.onConnection((channel) => {
      channel.onDisconnect(() => {
        console.log("Disconnect user " + channel.id);
        this.playersGroup.children.each((player) => {
          if (player.playerId === channel.playerId) {
            player.kill();
          }
        });
        channel.room.emit("removePlayer", channel.playerId);
      });
      channel.on("getId", () => {
        channel.playerId = this.getId();
        channel.emit("getId", channel.playerId.toString(36));
      });
      channel.on("addPlayer", (data) => {
        const x = this.spawnLocations[channel.playerId - 1].x + 32;
        const y = this.spawnLocations[channel.playerId - 1].y + 32;
        const avatar = new Player(this, channel.playerId, x, y);
        avatar.setData({ playerAnimFrame: "p" + avatar.playerID + "_stand" });
        this.playersGroup.add(avatar);
        this.players.set(channel.id, {
          channel,
          avatar
        });
      });
      channel.on("playerMove", (data) => {
        this.players.get(channel.id).avatar.setMove(data);
      });
      channel.on("dropBomb", (dropBomb) => {
        const player = this.players.get(channel.id).avatar;
        if (player.currentLaidBombs <= player.maxBombs) {
          const bombEntity = new Bomb({ scene: this, x: player.x, y: player.y });
          const bombID = this.bombs.size;
          this.bombs.set(bombID, {
            bombID,
            bombEntity
          });
          player.addCurrentLaidBomb();
          console.log(player.currentLaidBombs);
        }
      });
      channel.emit("ready");
    });
  }
  update() {
    this.tick++;
    if (this.tick % 4 !== 0)
      return;
    const avatars = [];
    this.players.forEach((player) => {
      const { channel, avatar } = player;
      avatars.push({ id: channel.id, x: avatar.x, y: avatar.y, playerNumber: avatar.playerID, playerAnimFrame: avatar.animFrame, bombRange: avatar.bombRange, maxBombs: avatar.maxBombs });
    });
    const blocksArr = [];
    this.blocks.forEach((block) => {
      const { blockID, blockEntity } = block;
      blocksArr.push({ id: blockID, x: blockEntity.x, y: blockEntity.y, blockType: blockEntity.blockType });
    });
    const bombsArr = [];
    this.bombs.forEach((bomb) => {
      const { bombID, bombEntity } = bomb;
      bombsArr.push({ id: bombID, x: bombEntity.x, y: bombEntity.y });
    });
    const worldState = {
      players: avatars,
      blocks: blocksArr,
      bombs: bombsArr
    };
    const snapshot = SI.snapshot.create(worldState);
    SI.vault.add(snapshot);
    this.players.forEach((player) => {
      const { channel } = player;
      channel.emit("snapshot", snapshot);
    });
  }
}
const config = {
  type: pkg__default["default"].HEADLESS,
  parent: "phaser-game",
  width: 1024,
  height: 832,
  zoom: 1,
  banner: false,
  audio: false,
  scene: [GameScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  }
};
class PhaserGame extends Phaser.Game {
  constructor(server2) {
    super(config);
    this.server = server2;
  }
}
const __filename$1 = url.fileURLToPath(typeof document === "undefined" ? new (require("url")).URL("file:" + __filename).href : document.currentScript && document.currentScript.src || new URL("server.js", document.baseURI).href);
const __dirname$1 = path.dirname(__filename$1);
const app = express__default["default"]();
const server = http__default["default"].createServer(app);
const game = new PhaserGame(server);
app.use(cors__default["default"]());
app.use("/", express__default["default"].static(path__default["default"].join(__dirname$1, "../client")));
app.get("/", (req, res) => {
  res.sendFile(path__default["default"].join(__dirname$1, "../index.html"));
});
app.get("/getState", (req, res) => {
  try {
    let gameScene = game.scene.keys["GameScene"];
    return res.json({ state: gameScene.getState() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.listen(process.env.PORT, () => {
  console.log(`Static server started and listening on port ${process.env.PORT}`);
});
const viteNodeApp = app;
exports.viteNodeApp = viteNodeApp;
