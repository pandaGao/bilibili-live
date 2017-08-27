const { User, API } = require('../dist/bilibili-live.js')

new User({
  cookie: "",
  roomId: 92052,
  danmakuColor: 'green',
  danmakuLimit: 30,
  useInfoService: true
}).connect().then(user => {
  if (!user) {
    console.log('Cookie不正确或已过期')
    return
  }
  user
    .on('info.user', (info) => {
      console.log('用户信息')
      console.log(info)
    })
    .on('info.room', (info) => {
      console.log('直播间信息')
      console.log(info)
    })
    .on('heartbeat', () => {
      console.log('发送心跳包')
    })
    .on('send.success', (danmaku) => {
      console.log('弹幕发送成功')
      console.log('弹幕内容', danmaku)
    })
    .on('send.failed', (danmaku, msg) => {
      console.log('弹幕发送失败')
      console.log('原因:', msg)
    })
  setTimeout(() => {
    user.sendMessage('测试弹幕测试弹幕测试弹幕测试弹幕测试弹幕弹幕测试弹幕测试弹幕测试弹幕测试弹幕测试弹幕测试')
  }, 3000)
  setTimeout(() => {
    console.log('disconnect')
    user.disconnect()
  },10000)
})
