import _ from 'lodash'
import EventEmitter from 'events'
import Api from '../../api/index.js'

const DANMAKU_COLOR = {
  'white': 0xffffff,
  'red': 0xff6868,
  'blue': 0x66ccff,
  'purple': 0xe33fff,
  'cyan': 0x00fffc,
  'green': 0x7eff00,
  'yellow': 0xffed4f,
  'orange': 0xff9800,
  'pink': 0xff739a
}

const DANMAKU_MODE = {
  'scroll': 1,
  'bottom': 4,
  'top': 5
}

const MESSAGE_SEND_DELAY = 1500
const ONLINE_HEARTBEAT = 3e5
const INFO_DELAY = 1e5

export default class UserService extends EventEmitter {
  constructor(config = {}) {
    super()

    this.danmakuColor = config.danmakuColor || 'white'
    this.danmakuMode = config.danmakuMode || 'scroll'
    this.danmakuLimit = config.danmakuLimit || 20

    this.info = {}
    this.room = {}
    this._useOnlineService = config.useOnlineService || false
    this._useInfoService = config.useInfoService || false
    this._sendService = null
    this._sendQueue = []
    this._onlineService = null
    this._infoService = null
    this._api = new Api()
    this.api = this._api
    
    this._api.useHttps(config.useHttps || false)
    this._api.setCookie(config.cookie || '')
    this._api.setRoomId(config.roomId || '23058')
  }

  setRoomId(roomId) {
    this._api.setRoomId(roomId)
  }

  setUseHttps(use) {
    this._api.useHttps(use)
  }

  setCookie(cookie) {
    this._api.setCookie(cookie)
  }

  setDanmakuConfig(config) {
    this.danmakuMode = config.danmakuMode || this.danmakuMode
    this.danmakuColor = config.danmakuColor || this.danmakuColor
    this.danmakuLimit = config.danmakuLimit || this.danmakuLimit
  }

  checkLogin() {
    return this._api.checkUserLogin()
  }

  getUserInfo() {
    this._api.getUserInfo().then(res => {
      if (res) {
        if (!_.isEqual(res.user, this.info)) {
          this.info = res.user
          this.emit('info.user', this.info)
        }
        if (!_.isEqual(res.room, this.room)) {
          this.room = res.room
          this.emit('info.room', this.room)
        }
      }
    })
  }

  connect() {
    return this.checkLogin().then(login => {
      if (!login) return false
      if (this._useOnlineService) {
        this.sendOnlineHeartbeat()
        this._onlineService = setInterval(() => {
          this.sendOnlineHeartbeat()
        }, ONLINE_HEARTBEAT)
      }
      if (this._useInfoService) {
        this.getUserInfo()
        this._infoService = setInterval(() => {
          this.getUserInfo()
        }, INFO_DELAY)
      }
      return this
    })
  }

  disconnect() {
    clearInterval(this._onlineService)
    clearInterval(this._infoService)
    clearTimeout(this._sendService)
    this._onlineService = null
    this._infoService = null
    this._sendService = null
  }

  reconnect() {
    this.disconnect()
    return this.connect()
  }

  sendOnlineHeartbeat() {
    this._api.sendHeartbeat()
    this._api.sendEventHeartbeat()
    this.emit('heartbeat')
  }

  _sendMessage(message) {
    return this._api.sendMessage(message,
      Number(Number(DANMAKU_COLOR[this.danmakuColor]).toString(10)),
      DANMAKU_MODE[this.danmakuMode]).then(res => {
        let msg = JSON.parse(res)
        let success = false
        if (msg.code == 0) {
          if (msg.msg) {
            this.emit('send.failed', message, msg.msg)
          } else {
            this.emit('send.success', message)
          }
        } else {
          this.emit('send.failed', message, msg.msg)
        }
      }, res => {
        this.emit('send.failed', message, '网络错误')
      })
  }

  _sendMessageService() {
    if (this._sendQueue.length) {
      this._sendMessage(this._sendQueue.shift()).then(res => {
        this._sendService = setTimeout(() => {
          this._sendMessageService()
        }, MESSAGE_SEND_DELAY)
      }, err => {
        this._sendService = setTimeout(() => {
          this._sendMessageService()
        }, MESSAGE_SEND_DELAY)
      })
    } else {
      this._sendService = null
    }
  }

  sendMessage(message) {
    let msg = message + ''
    while (msg.length) {
      this._sendQueue.push(msg.slice(0, this.danmakuLimit))
      msg = msg.slice(this.danmakuLimit)
    }
    if (!this._sendService) this._sendMessageService()
  }

}
