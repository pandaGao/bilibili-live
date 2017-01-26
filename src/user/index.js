const Util = require('../util.js')

const DANMAKU_COLOR = {
  'white': 0xffffff,
  'red': 0xff6868,
  'blue': 0x66ccff,
  'purple': 0xe33fff,
  'cyan': 0x00fffc,
  'green': 0x7eff00,
  'yellow': 0xffed4f,
  'orange': 0xff9800
}

const DANMAKU_MODE = {
  'scroll': 1,
  'top': 5
}

const MESSAGE_SEND_DELAY = 1500

class UserService {
  constructor (config = {}) {
    this.username = config.username || ''
    this.password = config.password || ''
    this.cookie = config.cookie || ''
    this.danmakuColor = config.danmakuColor || 'white'
    this.danmakuMode = config.danmakuMode || 'scroll'
    this.danmakuLimit = config.danmakuLimit || 20
    this.info = {}
    this.messageQueue = []
    this.sendingMessage = false
  }

  init () {
    return Util.getUserInfo(this.cookie).then(res => {
      this.info = res
      return this
    })
  }

  getInfo () {

  }

  sendMessage (room, msg) {
    let data = {
      color: Number(Number(DANMAKU_COLOR[this.danmakuColor]).toString(10)),
      mode: DANMAKU_MODE[this.danmakuMode],
      msg: msg,
      rnd: room.rnd,
      roomid: room.id
    }
    let message = ''+msg
    while (message.length) {
      this.messageQueue.push({
        color: Number(Number(DANMAKU_COLOR[this.danmakuColor]).toString(10)),
        mode: DANMAKU_MODE[this.danmakuMode],
        msg: message.slice(0, this.danmakuLimit),
        rnd: room.rnd,
        roomid: room.id
      })
      message = message.slice(this.danmakuLimit)
    }
    if (!this.sendingMessage) {
      this.sendMessageFromQueue()
    }
  }

  sendMessageFromQueue () {
    console.log('message queue:', this.messageQueue.length)
    if (this.messageQueue.length) {
      this.sendingMessage = true
      Util.sendMessage(this.cookie, this.messageQueue.shift()).then(res => {
        setTimeout(() => {
          this.sendMessageFromQueue()
        }, MESSAGE_SEND_DELAY)
      }, res => {
        this.sendingMessage = false
      })
    } else {
      this.sendingMessage = false
    }
  }
}

module.exports = UserService
