import _ from 'lodash'
import EventEmitter from 'events'
import Api from '../../../api/index.js'

export default class InfoService extends EventEmitter {
  constructor(config = {}) {
    super()

    this.updateDelay = config.updateDelay || 5e3

    this._api = new Api()
    this._service = null
    this._lastUpdate = new Date()
    this._info = {}

    this._api.useHttps(config.useHttps)
    this._api.setRoomId(config.roomId)
  }

  connect() {
    this.fetchInfo()
    this._service = setInterval(() => {
      this.fetchInfo()
    }, this.updateDelay)
  }

  disconnect() {
    clearInterval(this._service)
  }

  reconnect() {
    this.disconnect()
    this.connect()
  }

  fetchInfo() {
    let ts = new Date()
    this._api.getRoomInfo().then(res => {
      if (ts < this._lastUpdate) return
      this._lastUpdate = ts
      if (!_.isEqual(res, this._info)) {
        this._info = res
        this.emit('info', this._info)
      }
    }).catch(err => {
      console.log(err)
    })
  }

}
