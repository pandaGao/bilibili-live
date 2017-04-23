import net from 'net'
import EventEmitter from 'events'
import path from 'path'
import { spawn } from 'child_process'

import _ from 'lodash'
import DMDecoder from './danmaku/decoder'
import DMEncoder from './danmaku/encoder'
import Util from '../util.js'

const DMSERVER = 'livecmt-2.bilibili.com'
const DMPORT = 788
const RECONNECT_DELAY = 3000
const HEARTBEAT_DELAY = 30000
const GIFT_END_DELAY = 3000
const FETCH_FANS_DELAY = 5000

class RoomService extends EventEmitter {
  constructor (config = {}) {
    super()
    // 真实房间号
    this.roomId = config.roomId
    // URL中的房间号(可能为短位ID)
    this.roomURL = config.roomId
    // 房间标题
    this.roomTitle = ''
    // 播主信息
    this.roomAnchor = {}
    // 用户id
    this.userId = config.userId || this.randUid()
    // 弹幕服务器
    this.targetServer = config.server || DMSERVER
    this.targetPort = config.port || DMPORT
    // SOCKET连接
    this.socket = null
    // 录制进程
    this.recordProcess = null
    this.forceEnd = false
    // 定时事件
    this.heartbeatService = null
    this.fansService = null
    this.reconnectService = null

    this.giftEventQueue = []
    this.latestFansList = []

  }

  getRoomInfo () {
    return {
      id: this.roomId,
      url: this.roomURL,
      title: this.roomTitle,
      anchor: this.roomAnchor
    }
  }

  init () {
    return Util.getRoomId(this.roomURL).then(room => {
      this.roomId = room.id
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
    this.fetchFans()
  }

  disconnect () {
    clearTimeout(this.reconnectService)
    clearTimeout(this.heartbeatService)
    clearTimeout(this.fansService)
    this.socket.destroy()
  }

  reconnect () {
    this.disconnect()
    this.reconnectService = setTimeout(() => {
      this.connect()
    }, RECONNECT_DELAY)
  }

  handleEvents () {
    this.socket.on('connect', (msg) => {
      this.sendJoinRoom()
      this.sendHeartbeat()
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
    return 1E15 + Math.floor(2E15 * Math.random())
  }

  sendJoinRoom () {
    this.socket.write(DMEncoder.encodeJoinRoom(this.roomId, this.userId))
  }

  sendHeartbeat () {
    this.socket.write(DMEncoder.encodeHeartbeat())
    this.heartbeatService = setTimeout(() => {
      this.sendHeartbeat()
    }, HEARTBEAT_DELAY)
  }

  fetchFans () {
    Util.getUserFans(this.roomAnchor.id, 1).then(res => {
      let hash = this.latestFansList.reduce((pre,cur) => {
        pre[cur.id] = cur
        return pre
      }, {})
      let newFans = []
      if (this.latestFansList.length) {
        newFans = res.fans.reduce((pre,cur) => {
          if (!hash[cur.id]) {
            pre.push(cur)
          }
          return pre
        }, [])
      }
      this.latestFansList = res.fans
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
    let idx = -1
    let findEvent = this.giftEventQueue.some((m, i) => {
      if (m.msg.user.id === msg.user.id && m.msg.gift.id === msg.gift.id) {
        idx = i
        return true
      }
    })
    if (findEvent) {
      this.giftEventQueue.splice(idx, 1)
    }
  }

  startRecordLiveStream (filePath = '', fileName = `Room${this.roomURL}_${new Date().toJSON()}`) {
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

export default RoomService
