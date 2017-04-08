let Live = require('../index.js')

console.log('获取房间信息...')
Live.initRoom({
  roomId: 145
}).then(room => {
  console.log('房间信息获取成功...')
  handleRoomMessage(room)
})

function handleRoomMessage (room) {
  room.on('connected', (msg) => {
    console.log('弹幕服务器连接成功...')
  }).on('data', (msg) => {
    console.log(msg)
  }).on('error', (msg) => {
    console.log('连接发生错误，3秒后自动重连...')
  }).on('online', (msg) => {
    console.log(`当前在线人数 ${msg.number}`)
  }).on('welcome', (msg) => {
    let title = ''
    if (msg.user.isVIP) {
      title = '老爷'
    }
    if (msg.user.isSVIP) {
      title = '年费老爷'
    }
    console.log(`欢迎${title} ${msg.user.name} 进入直播间`)
  }).on('comment', (msg) => {
    let comment = ''
    if (msg.user.isVIP || msg.user.isSVIP) {
      comment += '[年]'
    }
    if (msg.user.badge) {
      comment += `[${msg.user.badge.title}${msg.user.badge.level}]`
    }
    if (msg.user.level) {
      comment += `[Lv.${msg.user.level}]`
    }
    comment += `${msg.user.name}: ${msg.comment}`
    console.log(comment)
  }).on('giftEnd', (msg) => {
    console.log(`感谢 ${msg.user.name} 赠送的 ${msg.gift.name} × ${msg.gift.count}`)
  })
}
