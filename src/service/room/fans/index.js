import EventEmitter from 'events'
import Api from '../../../api/index.js'

export default class FansService extends EventEmitter {
  constructor (config = {}) {
    super()

    this.userId = config.userId
    this.updateDelay = config.updateDelay || 5e3

    this._api = new Api()
    this._service = null
    this._lastUpdate = new Date()
    this._fansSet = new Set()

    this._api.useHttps(config.useHttps)
  }

  connect () {
    this.fetchFans()
    this._service = setInterval(() => {
      this.fetchFans()
    }, this.updateDelay)
  }

  disconnect () {
    clearInterval(this._service)
  }

  reconnect () {
    this.disconnect()
    this.connect()
  }

  fetchFans () {
    let ts = new Date()
    this._api.getAnchorFollwerList(this.userId, 1, 50).then(res => {
      this.updateFansSet(res, ts)
    }).catch(err => {
      console.log(err)
    })
    this._api.getRoomFansCount(this.userId).then(res => {
      this.emit('fansCount', res)
    })
  }

  updateFansSet (fansList, ts) {
    if (ts < this._lastUpdate) return
    if (this._fansSet.size) {
      fansList.forEach(fans => {
        if (!this._fansSet.has(fans.id)) {
          this._fansSet.add(fans.id)
          this.emit('newFans', fans)
        }
      })
    } else {
      fansList.forEach(fans => {
        this._fansSet.add(fans.id)
      })
    }
    this._lastUpdate = ts
  }
}
