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
  'orange': 0xff9800
}

const DANMAKU_MODE = {
  'scroll': 1,
  'top': 5
}

const MESSAGE_SEND_DELAY = 1500
const HEARTBEAT_DELAY = 3e5

class UserService extends EventEmitter {
  constructor (config = {}) {
    super()
    this.cookie = config.cookie || ''
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

  init () {
    return this.checkLogin().then(login => {
      if (login) {
        return this.getInfo()
      }
      return false
    })
  }

  checkLogin () {
    return Util.checkUserLogin(this.cookie).then(res => {
      return res.login
    })
  }

  getInfo () {
    return Util.getUserLiveInfo(this.cookie).then(res => {
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
    return Util.sendHeartbeat(this.cookie, this.room)
  }

  dailySign () {
    return Util.dailySign(this.cookie)
  }

  joinSmallTV (roomId, tvId) {
    return Util.joinSmallTV(this.cookie, {
      roomId: roomId,
      id: tvId,
      _: new Date().getTime()
    })
  }

  getSmallTVReward (tvId) {
    return Util.getSmallTVReward(this.cookie, {
      id: tvId,
      _: new Date().getTime()
    })
  }

  sendMessage (msg) {
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

  startLiving () {
    if (!this.userRoom.id) return false
    return Util.toggleLiveRoom(this.cookie, 1, this.userRoom.id)
  }

  getRTMP () {
    if (!this.userRoom.id) return false
    return Util.getLiveRoomRTMP(this.cookie, this.userRoom.id)
  }

  endLiving () {
    if (!this.userRoom.id) return false
    return Util.toggleLiveRoom(this.cookie, 0, this.userRoom.id)
  }

  getBlockList (page) {
    if (!this.userRoom.id) return false
    return Util.getRoomBlockList(this.cookie, this.userRoom.id, page)
  }

  blockUser (userId, hour) {
    return Util.blockUser(this.cookie, {
      roomid: this.room,
      content: userId,
      type: 1,
      hour: hour
    })
  }

  deleteBlockUser (blockId) {
    return Util.deleteBlockUser(this.cookie, {
      roomid: this.room,
      id: blockId
    })
  }

  addAdmin (userId) {
    return Util.setAdmin(this.cookie, {
      content: userId,
      roomid: this.room,
      type: 'add'
    })
  }

  deleteAdmin (userId) {
    return Util.setAdmin(this.cookie, {
      content: userId,
      roomid: this.room,
      type: 'del'
    })
  }

}

export default UserService
