import EventEmitter from 'events'

import DanmakuService from './danmaku/index.js'
import FansService from './fans/index.js'
import InfoService from './info/index.js'
import Api from '../../api/index.js'

export default class RoomService extends EventEmitter {
  constructor(config = {}) {
    super()

    this.roomURL = config.url || '23058'
    this.roomId = this.roomURL
    this.config = config

    this._api = new Api()
    this._danmakuService = null
    this._fansService = null
    this._infoService = null
  }

  connect() {
    // 获取直播间原始房间号
    return this._api.getRoomId(this.roomURL).then(roomId => {
      // 获取直播间基本信息
      this.roomId = roomId
      this._api.setRoomId(roomId)
      return this._api.getRoomInfo()
    }).then(info => {
      this._danmakuService = new DanmakuService({
        roomId: this.roomId,
        useWebsocket: !!this.config.useWebsocket || true,
        useWSS: !!this.config.useHttps,
        useGiftBundle: !!this.config.useGiftBundle
      })

      this.handleDanmakuEvents()

      this._fansService = new FansService({
        userId: info.anchor.id,
        useHttps: !!this.config.useHttps
      })

      this.handleFansEvents()

      this._infoService = new InfoService({
        roomId: this.roomId,
        useHttps: !!this.config.useHttps
      })

      this.handleInfoEvents()

      this._danmakuService.connect()
      this._fansService.connect()
      this._infoService.connect()

      return this
    }).catch(err => {
      console.log(err)
    })
  }

  disconnect() {
    this._danmakuService.disconnect()
    this._fansService.disconnect()
    this._infoService.disconnect()

    this._danmakuService = null
    this._fansService = null
    this._infoService = null
  }

  reconnect() {
    this.disconnect()
    this.connect()
  }

  setUseGiftBundle(use) {
    this._danmakuService.setUseGiftBundle(use)
  }

  handleDanmakuEvents() {
    this._danmakuService.on('connect', () => {
      this.emit('danmaku.connect')
    }).on('connected', () => {
      this.emit('danmaku.connected')
    }).on('data', (msg) => {
      this.emit('danmaku.message', msg)
    }).on('close', () => {
      this.emit('danmaku.close')
    }).on('error', () => {
      this.emit('danmaku.error')
    })
  }

  handleFansEvents() {
    this._fansService.on('newFans', (fans) => {
      let newFans = {
        type: 'newFans',
        user: fans,
        ts: new Date().getTime()
      }
      this.emit('newFans', newFans)
    })
  }

  handleInfoEvents() {
    this._infoService.on('info', (info) => {
      let roomInfo = Object.assign({}, info, { ts: new Date().getTime() })
      this.emit('info', roomInfo)
    })
  }
}
