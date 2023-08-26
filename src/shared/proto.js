import { StringDecoder } from 'string_decoder'
import { inflateSync } from 'zlib'

const textDecoder = new StringDecoder('utf8')

const HEADER_LENGTH = 16
const OP_HEARTBEAT = 2
const OP_HEARTBEAT_REPLY = 3
const OP_SEND_SMS_REPLY = 5
const OP_AUTH = 7
const OP_AUTH_REPLY = 8
const JSON_PROTOVER = 0
const ZLIB_PROTOVER = 2
const SEQUENCE_ID = 0
const PLATFORM = '3rd_party'

/**
 *
 * │--------│--------│--------│--------│
 * ┌───────────────────────────────────┐
 * │           Packet Length           │
 * ├─────────────────┬─────────────────┤
 * │  Header Length  │     Version     │
 * ├─────────────────┴─────────────────┤
 * │              Operation            │
 * ├───────────────────────────────────┤
 * │             Sequence ID           │
 * ├───────────────────────────────────┤
 * │                                   │
 * │                Body               │
 * │                                   │
 * └───────────────────────────────────┘
 *
 */

function createProto (action, payload = '') {
  const packetLength = Buffer.byteLength(payload) + HEADER_LENGTH
  const buff = Buffer.alloc(packetLength)

  // Packet Length
  buff.writeInt32BE(packetLength, 0)
  // Header Length
  buff.writeInt16BE(HEADER_LENGTH, 4)
  // Version
  buff.writeInt16BE(JSON_PROTOVER, 6)
  // Operation
  buff.writeInt32BE(action, 8)
  // Sequence ID
  buff.writeInt32BE(SEQUENCE_ID, 12)
  // Body
  buff.write(payload, HEADER_LENGTH)

  return buff
}

function encodeJoinRoom (roomid, uid, platform = PLATFORM, protover = ZLIB_PROTOVER) {
  const payload = JSON.stringify({
    uid: uid * 1,
    roomid: roomid * 1,
    protover,
    platform
  })
  return createProto(OP_AUTH, payload)
}

function encodeJoinRoomCustom (custom) {
  const payload = JSON.stringify(custom)
  return createProto(OP_AUTH, payload)
}

function encodeHeartbeat () {
  return createProto(OP_HEARTBEAT)
}

function decodeProto (buffer) {
  let offset = 0
  const bufferLength = buffer.byteLength
  const protos = []
  while (offset < bufferLength) {
    const packetLength = buffer.readInt32BE(offset + 0)
    const headerLength = buffer.readInt16BE(offset + 4)
    const version = buffer.readInt16BE(offset + 6)
    const operation = buffer.readInt32BE(offset + 8)
    const sequence = buffer.readInt32BE(offset + 12)

    let body = ''
    if (operation === OP_AUTH_REPLY) {
      body = ''
    } else if (operation === OP_HEARTBEAT_REPLY) {
      body = buffer.readInt32BE(offset + headerLength)
    } else {
      const bodyBuffer = buffer.slice(offset + headerLength, offset + packetLength)
      if (version === ZLIB_PROTOVER) {
        body = inflateSync(bodyBuffer)
      } else if (version === JSON_PROTOVER) {
        body = JSON.parse(textDecoder.write(bodyBuffer))
      }
    }
    offset += packetLength
    protos.push({
      packetLength,
      headerLength,
      version,
      operation,
      sequence,
      body
    })
  }
  return protos
}

function parseMessage (msg) {
  switch (msg.operation) {
    case OP_HEARTBEAT_REPLY: {
      return {
        op: 'HEARTBEAT_REPLY',
        online: msg.body
      }
    }
    case OP_SEND_SMS_REPLY: {
      const list = []
      msg.body.op = 'SEND_SMS_REPLY'
      list.push(msg.body)
      return list
    }
    case OP_AUTH_REPLY: {
      return {
        op: 'AUTH_REPLY'
      }
    }
  }
}

function decodeData (buff) {
  const messages = []
  try {
    const protos = decodeProto(buff)
    protos.forEach(proto => {
      if (proto.version === ZLIB_PROTOVER) {
        const bodyProtos = decodeProto(proto.body)
        bodyProtos.forEach(p => {
          messages.push(p)
        })
      } else {
        messages.push(proto)
      }
    })
  } catch (e) {
    console.error('[bilibili-live]: Socket message error', buff, e)
  }
  return messages.reduce((list, cur) => {
    const data = parseMessage(cur)
    if (data instanceof Array) {
      data.forEach((m) => {
        list.push(m)
      })
    } else if (data instanceof Object) {
      list.push(data)
    }
    return list
  }, [])
}

export {
  encodeJoinRoom,
  encodeJoinRoomCustom,
  encodeHeartbeat,
  decodeData
}
