const { Room, API } = require('../dist/bilibili-live.js')

new Room({
  url: 92052
}).connect().then(room => {
  room
    .on('danmaku.connect', () => {
      console.log('正在连接至弹幕服务器')
    })
    .on('danmaku.connected', () => {
      console.log('成功连接至弹幕服务器')
    })
    .on('danmaku.message', (msg) => {
      console.log(msg)
    })
    .on('danmaku.close', () => {
      console.log('已断开与弹幕服务器的连接')
    })
    .on('danmaku.error', () => {
      console.log('与弹幕服务器的连接出现错误')
    })
    .on('newFans', (fans) => {
      console.log('有新的粉丝')
      console.log(fans)
    })
    .on('info', (info) => {
      console.log('直播间信息')
      console.log(info)
    })
})
