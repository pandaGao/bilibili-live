import Room from './room'
import User from './user'
import Util from './util.js'

function initRoom (config) {
  return new Room(config).init()
}

function initUser (config) {
  return new User(config).init()
}

export {
  initRoom,
  initUser,
  Util
}

export default {
  initRoom,
  initUser,
  Util
}
