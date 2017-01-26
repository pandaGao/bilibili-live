# Bilibili live

A Node.js Toolkit for Bilbili live service

## Installation

```bash
npm install bilibili-live --save
```
## Basic Usage

```javascript
const Live = require('bilibili-live')

Live.initRoom({
  roomId: 92052
}).then(room => {
  room.on('connected', (msg) => {
    console.log('弹幕服务器连接成功...')
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
  }).on('gift', (msg) => {
    console.log(`感谢 ${msg.user.name} 赠送的 ${msg.gift.name} × ${msg.gift.count}`)
  }).on('giftEnd', (msg) => {
    // giftEnd事件适合用于制作礼物答谢机
    // 只在用户停止刷屏(3s内不再赠送同种礼物)后触发 可以统计刷屏礼物的总数
    console.log(`感谢 ${msg.user.name} 赠送的 ${msg.gift.name} × ${msg.gift.count}`)
  })
})
```
