import Room from './room'
import User from './user'

function initRoom (config) {
  return new Room(config).init()
}

function initUser (config) {
  return new User(config).init()
}

export default {
  initRoom,
  initUser
}
