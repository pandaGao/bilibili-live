import WebSocket from 'ws'
import EventEmitter from 'events'
import net from 'net'

import _ from 'lodash'
import DMDecoder from './danmaku/decoder'
import DMEncoder from './danmaku/encoder'
import Util from '../util.js'

const DMPORT = 2243
const DMSERVER = 'livecmt-2.bilibili.com'

const WSDMPROTOCOL = 'ws'
const WSSDMPROTOCOL = 'wss'
const WSDMSERVER = 'broadcastlv.chat.bilibili.com'
const WSDMPORT = 2244
const WSSDMPORT = 2245
const WSDMPATH = 'sub'

const HEARTBEAT_DELAY = 30000
const GIFT_END_DELAY = 3000
const FETCH_FANS_DELAY = 5000

export default class RoomService extends EventEmitter {
  constructor (config = {}) {
    super()
    this.info = {
      id: config.roomId+'' || '23058',
      url: config.roomId+'' || '23058'
    }
    this.userId = config.userId || this.randUid()
    this.useFansService = config.useFansService === false ? false : true
    this.useWebsocket = config.useWebsocket === false ? false : true
    this.useWSS = config.useWSS || false
    Util.useHttps(this.useWSS)

    this.socket = null
    this.heartbeatService = null
    this.fansService = null
    this.checkService = _.debounce(() => {
      this.emit('error')
    }, HEARTBEAT_DELAY)

    this.giftMap = new Map()
    this.fansSet = new Set()
  }

  getInfo () {
    return this.info
  }

  init () {
    let realID = null
    if (this.info.url.length < 5) {
      realID = Util.getRoomId(this.info.url)
    } else {
      realID = Promise.resolve({
        id: this.info.id
      })
    }
    if (this.useFansService) {
      return realID.then((room) => {
        this.info.id = room.id+''
        return Util.getRoomInfo(this.info.id)
      }).then(room => {
        this.info.title = room.title
        this.info.anchor = room.anchor
        this.connect()
        return this
      })
    } else {
      return realID.then((room) => {
        this.info.id = room.id+''
        this.connect()
        return this
      })
    }

  }

  randUid () {
    return 1E15 + Math.floor(2E15 * Math.random())
  }

  connect () {
    if (this.useWebsocket) {
      if (this.useWSS) {
        this.socket = new WebSocket(`${WSSDMPROTOCOL}://${WSDMSERVER}:${WSSDMPORT}/${WSDMPATH}`)
      } else {
        this.socket = new WebSocket(`${WSDMPROTOCOL}://${WSDMSERVER}:${WSDMPORT}/${WSDMPATH}`)
      }
    } else {
      this.socket = net.connect(DMPORT, DMSERVER)
    }
    this.handleEvents()
    if (this.useFansService) {
      this.fetchFans()
    }
  }

  disconnect () {
    clearTimeout(this.heartbeatService)
    clearTimeout(this.fansService)
    if (this.useWebsocket) {
      this.socket.close()
    } else {
      this.socket.end()
    }
  }

  handleEvents () {
    if (this.useWebsocket) {
      this.socket.on('open', () => {
        this.sendJoinRoom()
        this.emit('connect')
      })

      this.socket.on('message', (msg) => {
        this.checkService()
        DMDecoder.decodeData(msg).map(m => {
          if (m.type == 'connected') {
            this.sendHeartbeat()
          } else {
            if (m.type === 'gift') {
              this.packageGift(m)
            }
            this.emit('data', m)
          }
          this.emit(m.type, m)
        })
      })

      this.socket.on('close', () => {
        this.emit('close')
      })

      this.socket.on('error', (err) => {
        this.emit('error', err)
      })
    } else {
      this.socket.on('connect', (msg) => {
        this.sendJoinRoom()
        this.emit('connect')
      })

      this.socket.on('data', (msg) => {
        this.checkService()
        DMDecoder.decodeData(msg).map(m => {
          if (m.type == 'connected') {
            this.sendHeartbeat()
          } else {
            if (m.type === 'gift') {
              this.packageGift(m)
            }
            this.emit('data', m)
          }
          this.emit(m.type, m)
        })
      })

      this.socket.on('close', () => {
        this.emit('close')
      })

      this.socket.on('error', (err) => {
        this.emit('error', err)
      })
    }
  }

  sendJoinRoom () {
    if (this.useWebsocket) {
      this.socket.send(DMEncoder.encodeJoinRoom(this.info.id, this.userId))
    } else {
      this.socket.write(DMEncoder.encodeJoinRoom(this.info.id, this.userId))
    }
  }

  sendHeartbeat () {
    if (this.useWebsocket) {
      this.socket.send(DMEncoder.encodeHeartbeat())
    } else {
      this.socket.write(DMEncoder.encodeHeartbeat())
    }
    this.heartbeatService = setTimeout(() => {
      this.sendHeartbeat()
    }, HEARTBEAT_DELAY)
  }

  fetchFans () {
    Util.getUserFans(this.info.anchor.id, 1).then(res => {
      let newFans = []
      if (this.fansSet.size) {
        newFans = res.fans.filter((fan) => {
          if (this.fansSet.has(fan.id)) {
            return false
          } else {
            this.fansSet.add(fan.id)
            return true
          }
        })
      } else {
        res.fans.forEach((fan) => {
          this.fansSet.add(fan.id)
        })
      }
      this.fansService = setTimeout(() => {
        this.fetchFans()
      }, FETCH_FANS_DELAY)
      let msg = {
        type: 'fans',
        ts: new Date().getTime(),
        total: res.total,
        newFans: newFans
      }
      this.emit('data', msg)
      this.emit('fans', msg)
    }).catch(res => {
      this.fansService = setTimeout(() => {
        this.fetchFans()
      }, FETCH_FANS_DELAY)
    })
  }

  packageGift (msg) {
    let key = `${msg.user.id}.${msg.gift.id}`
    let sameGiftEvent = this.giftMap.has(key)
    if (sameGiftEvent) {
      let giftEvent = this.giftMap.get(key)
      giftEvent.msg.gift.count = Number(giftEvent.msg.gift.count) + Number(msg.gift.count)
      giftEvent.event()
    } else {
      let giftEvent = {
        msg: _.merge({}, msg),
        event: _.debounce(() => {
          this.emit('giftBundle', giftEvent.msg)
          this.giftMap.delete(key)
        }, GIFT_END_DELAY)
      }
      giftEvent.event()
      this.giftMap.set(key, giftEvent)
    }
  }
}
