# Bilibili live

A Node.js Toolkit for Bilibili live service

## Installation

```bash
npm install bilibili-live --save
```

## Documentation

```javascript
var Live = require('bilibili-live').default
or
import Live from 'bilibili-live'
```
##### Live.initRoom(config)
```javascript
Live.initRoom({
  roomId: 92052 // 必填项 直播间地址中的房间号 对于短位ID会自动获取真实房间号
}).then(room => { // 返回值为Promise
  room.on('connected') // 成功和弹幕服务器建立连接时触发
  room.on('error') // 连接出错时触发
  room.on('online', (msg) => { // 当前在线人数
    console.log('当前在线人数' + msg.number)
  })
  room.on('fans', (msg) => { // 当前粉丝数 和 新关注列表
    console.log(`当前粉丝数 ${msg.total}`)
    msg.newFans.map((fan) => {
      console.log(`${fan.name} 关注了直播间`)
    })
  })
  room.on('welcome', (msg) => { // 欢迎信息
    let title = ''
    if (msg.user.isVIP) {
      title = '老爷'
    }
    if (msg.user.isSVIP) {
      title = '年费老爷'
    }
    console.log(`欢迎${title} ${msg.user.name} 进入直播间`)
  })
  room.on('comment', (msg) => { // 观众弹幕
    let comment = ''
    if (msg.user.isVIP || msg.user.isSVIP) {
      comment += '[年]'
    }
    if (msg.user.badge) { // 主播勋章
      comment += `[${msg.user.badge.title}${msg.user.badge.level}]`
    }
    if (msg.user.level) { // 用户等级
      comment += `[Lv.${msg.user.level}]`
    }
    comment += `${msg.user.name}: ${msg.comment}`
    console.log(comment)
  })
  room.on('gift', (msg) => { // 用户赠送礼物
    console.log(`感谢 ${msg.user.name} 赠送的 ${msg.gift.name} × ${msg.gift.count}`)
  })
  room.on('giftEnd', (msg) => {
    // giftEnd事件适合用于制作礼物答谢机
    // 只在用户停止刷屏(3s内不再赠送同种礼物)后触发 可以统计刷屏礼物的总数
    console.log(`感谢 ${msg.user.name} 赠送的 ${msg.gift.name} × ${msg.gift.count}`)
  })
})
```
##### Live.initUser(config)
```javascript
Live.initUser({
  cookie: 'xxxxx', // 必填项 bilibili.com cookie
  danmakuColor: 'white', // 可选项 弹幕颜色 默认值 'white' 可选值 'red','blue','purple','cyan','green','yellow','orange'
  // 需要确认自己的账号有权限发送其他颜色弹幕
  danmakuMode: 'scroll', // 可选项 弹幕模式 默认值 'scroll'-> 滚动 可选值 'top'-> 顶部
  // 这个...少年你是总督吗...
  danmakuLimit: 20 // 可选项 弹幕字数限制 默认值 20
  // 老爷可以设置为30 总督、提督可以设置为40
}).then(user => {
  Live.initRoom({
    roomId: xxx,
  }).then(room => {
    room.on('xxx', () => {
      // ...
      user.sendMessage(room.getRoomInfo(), msg) // 发送弹幕
      // 超过弹幕字数限制的文本 会自动分割成多条弹幕逐条发送
    })
  })
})

```

## License

MIT
