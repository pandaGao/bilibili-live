const { DanmakuService } = require('../dist/bilibili-live.min')

function initRoom (auth) {
  new DanmakuService({
    customAuth: auth
  }).connect()
    .on('open', () => {
      console.log('正在连接至弹幕服务器')
    })
    .on('data', (msg) => {
      if (msg.op === 'AUTH_REPLY') {
        console.log('成功连接至弹幕服务器')
      } else {
        console.log(msg)
      }
    })
    .on('close', () => {
      console.log('已断开与弹幕服务器的连接')
    })
    .on('error', () => {
      console.log('与弹幕服务器的连接出现错误')
    })
}

initRoom({
  roomid: 7688602,
  uid: 269415357,
  protover: 3
})
