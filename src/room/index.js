const net = require('net')
const EventEmitter = require('events')
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
    this.userId = config.userId || this.randUid()
    this.targetServer = config.server || DMSERVER
    this.targetPort = config.port || DMPORT
    this.socket = null
    this.heartbeatTimer = null
    this.giftEventQueue = []
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
      rnd: this.roomRnd
    }
  }

  init () {
    return Util.getRoomInfo(this.roomURL).then(room => {
      this.roomId = room.id
      this.roomRnd = room.rnd
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
}

module.exports = RoomService
