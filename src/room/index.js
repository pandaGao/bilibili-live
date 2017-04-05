const net = require('net')
const EventEmitter = require('events')
const path = require('path')
const spawn = require('child_process').spawn

const _ = require('lodash')
const DMDecoder = require('./danmaku/decoder')
const DMEncoder = require('./danmaku/encoder')
const Util = require('../util.js')

const DMSERVER = 'livecmt-2.bilibili.com'
const DMPORT = 788
const RECONNECT_DELAY = 3000
const HEARTBEAT_DELAY = 30000
const GIFT_END_DELAY = 3000

class RoomService extends EventEmitter {
  constructor (config = {}) {
    super()
    this.roomId = config.roomId
    this.roomURL = config.roomId
    this.roomRnd = config.roomRnd || ''
    this.roomTitle = ''
    this.roomAnchor = {}
    this.userId = config.userId || this.randUid()
    this.targetServer = config.server || DMSERVER
    this.targetPort = config.port || DMPORT
    this.socket = null
    this.heartbeatTimer = null
    this.giftEventQueue = []
    this.recordProcess = null
    this.forceEnd = false
  }

  getRoomId () {
    return this.roomId
  }

  getRoomRnd () {
    return this.roomRnd
  }

  getRoomInfo () {
    return {
      id: this.roomId,
      url: this.roomURL,
      rnd: this.roomRnd,
      title: this.roomTitle,
      anchor: this.roomAnchor
    }
  }

  getRoomLivePlaylist () {
    return Util.getRoomLivePlaylist(this.roomId)
  }

  init () {
    return Util.getRoomId(this.roomURL).then(room => {
      this.roomId = room.id
      this.roomRnd = room.rnd
      return Util.getRoomInfo(this.roomId)
    }).then(room => {
      this.roomTitle = room.title
      this.roomAnchor = room.anchor
      this.connect()
      return this
    })
  }

  connect () {
    this.socket = net.connect(this.targetPort, this.targetServer)
    this.handleEvents()
  }

  reconnect () {
    this.clearHeartbeat()
    setTimeout(() => {
      this.connect()
    }, RECONNECT_DELAY)
  }

  handleEvents () {
    this.socket.on('connect', (msg) => {
      this.joinRoom()
      this.setHeartbeat()
      this.emit('connected', msg)
    })

    this.socket.on('data', (msg) => {
      DMDecoder.decodeData(msg).map(m => {
        if (m.type === 'gift') {
          this.pushGiftQueue(m)
        }
        this.emit('data', m)
        this.emit(m.type, m)
      })
    })

    this.socket.on('error', (msg) => {
      this.emit('error', msg)
      this.reconnect()
    })
  }

  randUid () {
    return 1e14 + Math.ceil(2e14 * Math.random())
  }

  joinRoom () {
    this.socket.write(DMEncoder.encodeJoinRoom(this.roomId, this.userId))
  }

  setHeartbeat () {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, HEARTBEAT_DELAY)
  }

  clearHeartbeat () {
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  sendHeartbeat () {
    this.socket.write(DMEncoder.encodeHeartbeat())
  }

  pushGiftQueue (msg) {
    let giftEvent = null
    let sameGiftEvent = this.giftEventQueue.some(m => {
      if (m.msg.user.id === msg.user.id && m.msg.gift.id === msg.gift.id) {
        giftEvent = m
        return true
      }
      return false
    })
    if (sameGiftEvent) {
      giftEvent.msg.gift.count += msg.gift.count
      giftEvent.event()
    } else {
      giftEvent = {
        msg: _.merge({}, msg),
        event: _.debounce(() => {
          this.emit('giftEnd', giftEvent.msg)
          this.shiftGiftQueue(giftEvent.msg)
        }, GIFT_END_DELAY)
      }
      giftEvent.event()
      this.giftEventQueue.push(giftEvent)
    }
  }

  shiftGiftQueue (msg) {
    this.giftEventQueue.some((m, idx) => {
      if (m.msg.user.id === msg.user.id && m.msg.gift.id === msg.gift.id) {
        this.giftEventQueue.splice(idx, 1)
        return true
      }
    })
  }

  startRecordLiveStream (filePath = '', fileName = `Room${this.roomURL}_${new Date().toJSON().replace(/\:/g,'_')}`) {
    if (this.recordProcess) return
    return Util.getRoomLivePlaylist(this.roomId).then((playlist) => {
      this.recordProcess = spawn('ffmpeg', [
        '-i',
        playlist,
        '-c',
        'copy',
        '-bsf:a',
        'aac_adtstoasc',
        path.format({
          dir: filePath,
          name: fileName,
          ext: '.mp4'
        })
      ])

      this.recordProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
      })

      this.recordProcess.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
      })

      this.recordProcess.on('close', (code) => {
        console.log(`Record process exited with code ${code}`)
        this.recordProcess = null
        if (this.forceEnd) {
          this.forceEnd = false
          this.emit('recordEnd')
        } else {
          Util.getRoomInfo(this.roomId).then(room => {
            if (room.isLive) {
              this.startRecordLiveStream(filePath, fileName)
            } else {
              this.emit('recordEnd')
            }
          })
        }
      })
    })
  }

  endRecordLiveStream () {
    if (!this.recordProcess) return
    this.forceEnd = true
    this.recordProcess.stdin.write('q')
  }
}

module.exports = RoomService
