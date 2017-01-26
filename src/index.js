const Room = require('./room')
const User = require('./user')

function initRoom (config) {
  return new Room(config).init()
}

function initUser (config) {
  return new User(config).init()
}

module.exports = {
  initRoom,
  initUser
}
