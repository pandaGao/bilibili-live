import WebSocket from 'ws'
import EventEmitter from 'eventemitter3'
import { debounce } from './shared/util.js'
import { encodeHeartbeat, encodeJoinRoom, decodeData, encodeJoinRoomCustom } from './shared/proto.js'

const WSSDMPROTOCOL = 'wss'
const WSDMSERVER = 'broadcastlv.chat.bilibili.com'
const WSSDMPORT = 2245
const WSDMPATH = 'sub'

const HEARTBEAT_DELAY = 1e4
const CHECK_ERROR_DELAY = 3e4
const RECONNECT_DELAY = 3e3

function randomMid () {
  return 1E15 + Math.floor(2E15 * Math.random())
}

export default class DanmakuService extends EventEmitter {
  constructor (options = {}) {
    super()

    this.roomId = options.roomId
    this.userId = options.userId || randomMid()

    this.customAuth = options.customAuth

    this._socket = null
    this._heartbeatService = null
    this._reconnectService = null
    this._checkErrorService = debounce(() => {
      this.emit('error', 'check failed')
      this.reconnectByError()
    }, CHECK_ERROR_DELAY)
  }

  connect () {
    this._socket = new WebSocket(`${WSSDMPROTOCOL}://${WSDMSERVER}:${WSSDMPORT}/${WSDMPATH}`)
    this.handleEvents()
    return this
  }

  disconnect () {
    clearTimeout(this._heartbeatService)
    clearTimeout(this._reconnectService)
    this._checkErrorService.cancel()
    this._socket.close()
    this._socket = null
  }

  reconnect () {
    this.disconnect()
    this.connect()
  }

  reconnectByError () {
    if (this._reconnectService) {
      clearTimeout(this._reconnectService)
    }
    this._reconnectService = setTimeout(() => {
      this.reconnect()
    }, RECONNECT_DELAY)
  }

  handleEvents () {
    const socket = this._socket

    socket.on('open', () => {
      if (socket !== this._socket) return
      this.sendJoinRoom()
      this.emit('open')
    })

    socket.on('message', (msg) => {
      if (socket !== this._socket) return
      this._checkErrorService()
      decodeData(msg).map(m => {
        if (m.op === 'AUTH_REPLY') {
          this.sendHeartbeat()
        }
        this.emit('data', m)
      })
    })

    socket.on('close', () => {
      if (socket !== this._socket) return
      this.emit('close')
    })

    socket.on('error', (err) => {
      if (socket !== this._socket) return
      this.emit('error', err)
      this.reconnectByError()
    })
  }

  sendJoinRoom () {
    if (this.customAuth) {
      this._socket.send(encodeJoinRoomCustom(this.customAuth))
    } else {
      this._socket.send(encodeJoinRoom(this.roomId, this.userId))
    }
  }

  sendHeartbeat () {
    this._socket.send(encodeHeartbeat())
    this._heartbeatService = setTimeout(() => {
      this.sendHeartbeat()
    }, HEARTBEAT_DELAY)
  }
}
