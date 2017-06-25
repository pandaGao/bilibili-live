import EventEmitter from 'events'
import Util from '../util.js'

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
const HEARTBEAT_DELAY = 3e5

class UserService extends EventEmitter {
  constructor (config = {}) {
    super()
    this.cookie = config.cookie || ''
    Util.setCookie(this.cookie)
    this.danmakuColor = config.danmakuColor || 'white'
    this.danmakuMode = config.danmakuMode || 'scroll'
    this.danmakuLimit = config.danmakuLimit || 20
    this.room = ''
    this.userRoom = {}
    this.userInfo = {}
    this.messageQueue = []
    this.sendingMessage = false
    this.onlineService = null
  }

  useHttps (use) {
    Util.useHttps(use)
  }

  setDanmakuConfig (config) {
    this.danmakuMode = config.danmakuMode || this.danmakuMode
    this.danmakuColor = config.danmakuColor || this.danmakuColor
    this.danmakuLimit = config.danmakuLimit || this.danmakuLimit
  }

  init () {
    return this.checkLogin().then(login => {
      if (login) {
        return this.getInfo()
      }
      return false
    })
  }

  checkLogin () {
    return Util.checkUserLogin().then(res => {
      return res.login
    })
  }

  getInfo () {
    return Util.getUserLiveInfo().then(res => {
      this.userInfo = res.user
      this.userRoom = res.room
      return this
    })
  }

  getUserInfo () {
    return this.userInfo
  }

  getUserRoom () {
    return this.userRoom
  }

  setCurrentRoom (roomId) {
    this.room = roomId
  }

  startOnlineService () {
    this.sendHeartbeat()
    this.sendEventHeartbeat()
    this.emit('heartbeat')
    this.onlineService = setTimeout(() => {
      this.startOnlineService()
    }, HEARTBEAT_DELAY)
  }

  stopOnlineService () {
    clearTimeout(this.onlineService)
    this.onlineService = null
  }

  sendHeartbeat () {
    return Util.sendHeartbeat(this.room)
  }

  sendEventHeartbeat () {
    return Util.sendEventHeartbeat(this.room)
  }

  dailySign () {
    return Util.dailySign()
  }

  joinSmallTV (roomId, tvId) {
    return Util.joinSmallTV({
      roomId: roomId,
      id: tvId,
      _: new Date().getTime()
    })
  }

  getSmallTVReward (tvId) {
    return Util.getSmallTVReward({
      id: tvId,
      _: new Date().getTime()
    })
  }

  joinLighten (roomId, lightenId) {
    return Util.joinLighten({
      roomid: roomId,
      lightenId: lightenId
    })
  }

  sendMessage (msg) {
    let message = ''+msg
    return Util.sendMessage({
      color: Number(Number(DANMAKU_COLOR[this.danmakuColor]).toString(10)),
      mode: DANMAKU_MODE[this.danmakuMode],
      msg: message,
      rnd: Math.floor(new Date().getTime()/1000),
      roomid: this.room
    })
  }

  asyncSendMessage (msg) {
    let message = ''+msg
    while (message.length) {
      this.messageQueue.push({
        color: Number(Number(DANMAKU_COLOR[this.danmakuColor]).toString(10)),
        mode: DANMAKU_MODE[this.danmakuMode],
        msg: message.slice(0, this.danmakuLimit),
        rnd: Math.floor(new Date().getTime()/1000),
        roomid: this.room
      })
      message = message.slice(this.danmakuLimit)
    }
    if (!this.sendingMessage) {
      this.sendMessageFromQueue()
    }
  }

  sendMessageFromQueue () {
    if (this.messageQueue.length) {
      this.sendingMessage = true
      Util.sendMessage(this.messageQueue.shift()).then(res => {
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

  startLiving () {
    if (!this.userRoom.id) return false
    return Util.toggleLiveRoom(1, this.userRoom.id)
  }

  getRTMP () {
    if (!this.userRoom.id) return false
    return Util.getLiveRoomRTMP(this.userRoom.id)
  }

  endLiving () {
    if (!this.userRoom.id) return false
    return Util.toggleLiveRoom(0, this.userRoom.id)
  }

  getBlockList (page) {
    if (!this.userRoom.id) return false
    return Util.getRoomBlockList(this.userRoom.id, page)
  }

  blockUser (userId, hour) {
    return Util.blockUser({
      roomid: this.room,
      content: userId,
      type: 1,
      hour: hour
    })
  }

  deleteBlockUser (blockId) {
    return Util.deleteBlockUser({
      roomid: this.room,
      id: blockId
    })
  }

  addAdmin (userId) {
    return Util.setAdmin({
      content: userId,
      roomid: this.room,
      type: 'add'
    })
  }

  deleteAdmin (userId) {
    return Util.setAdmin({
      content: userId,
      roomid: this.room,
      type: 'del'
    })
  }

}

export default UserService
