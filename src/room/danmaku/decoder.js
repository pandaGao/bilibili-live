const Consts = require('./consts.js')

function getMessageType (buff) {
  return buff.readInt32BE(8) - 1
}

function getMessageLength (buff) {
  return buff.readInt32BE(0)
}

function getPayload (buff) {
  return buff.slice(Consts.headerLength)
}

function transformMessage (msg) {
  let message = {}
  switch (msg.cmd) {
    case 'LIVE':
      message.type = 'live'
      message.roomId = msg.roomid
      break
    case 'PREPARING':
      message.type = 'preparing'
      message.roomId = msg.roomid
      break
    case 'DANMU_MSG':
      message.type = 'comment'
      message.comment = msg.info[1]
      message.user = {
        id: msg.info[2][0],
        name: msg.info[2][1],
        isAdmin: !!msg.info[2][2],
        isVIP: !!msg.info[2][3],
        isSVIP: !!msg.info[2][4],
        guard: msg.info[7]
      }
      if (msg.info[3].length) {
        message.user.badge = {
          level: msg.info[3][0],
          title: msg.info[3][1],
          anchor: msg.info[3][2],
          roomURL: msg.info[3][3]
        }
      }
      if (msg.info[4].length) {
        message.user.level = msg.info[4][0]
      }
      break
    case 'WELCOME':
      message.type = 'welcome'
      message.user = {
        id: msg.data.uid,
        name: msg.data.uname,
        isAdmin: !!msg.data.isadmin,
        isVIP: !!msg.data.vip,
        isSVIP: !!msg.data.svip
      }
      break
    case 'WELCOME_GUARD':
      message.type = 'welcomeGuard'
      message.user = {
        id: msg.data.uid,
        name: msg.data.username,
        guard: msg.data.guard_level
      }
      break
    case 'GUARD_BUY':
      message.type = 'guardBuy'
      message.user = {
        id: msg.data.uid,
        name: msg.data.username
      }
      message.level = msg.data.guard_level
      message.count = msg.data.num
      break
    case 'SEND_GIFT':
      message.type = 'gift'
      message.gift = {
        id: msg.data.giftId,
        type: msg.data.giftType,
        name: msg.data.giftName,
        count: msg.data.num,
        price: msg.data.price
      }
      message.user = {
        id: msg.data.uid,
        name: msg.data.uname
      }
      break
    case 'ROOM_BLOCK_MSG':
      message.type = 'block'
      message.user = {
        id: msg.uid,
        name: msg.uname
      }
      break
    default:
      message = msg
      message.type = msg.cmd
  }
  return message
}

function parseMessage (buff) {
  let message = {}
  let type = getMessageType(buff)
  let payload = getPayload(buff)
  switch (type) {
    case 2:
      message = {
        type: 'online',
        number: payload.readUInt32BE()
      }
      break
    case 4:
      try {
        message = JSON.parse(payload)
        message = transformMessage(message)
        message.originalPayload = payload.toString('utf8')
      } catch (e) {
        message = {
          type: 'incomplete',
          msg: payload.toString('utf8')
        }
      }
      break
    default:
      message = {
        type: 'unknownType',
        originalType: type,
        msg: payload.toString('utf8')
      }
  }
  return message
}

function decodeData (buff) {
  let messages = []
  let dataBuff = buff
  let bufferLength = dataBuff.length
  let messageLength = getMessageLength(dataBuff)
  while (bufferLength >= messageLength) {
    try {
      messages.push(parseMessage(dataBuff.slice(0, messageLength)))
    } catch (e) {
      console.log('Error Message:')
      console.log(e)
      break
    }
    dataBuff = dataBuff.slice(messageLength)
    bufferLength = dataBuff.length
    if (!bufferLength)
      break
    messageLength = getMessageLength(dataBuff)
  }
  return messages
}

module.exports = {
  decodeData
}
