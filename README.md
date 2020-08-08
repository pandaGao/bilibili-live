# Bilibili live

[![npm version](https://badge.fury.io/js/bilibili-live.svg)](https://badge.fury.io/js/bilibili-live)
[![npm](https://img.shields.io/npm/dw/localeval.svg)](https://www.npmjs.com/package/bilibili-live)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

A Node.js Toolkit for Bilibili Live

## Install

```bash
npm install bilibili-live --save
```

## Docs

### DanmakuService

监听直播间消息的服务

```javascript
import { DanmakuService } from 'bilibili-live'
new DanmakuService({ options })
```
#### Options
| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| roomId | Number | - | `必需` 直播间真实ID (非短位ID) |
| userId | Number | 随机值 | 用户ID |

#### Usage

```javascript
  import { DanmakuService } from 'bilibili-live'

  new DanmakuService({
    roomId: 92052
  }).connect()
    .on('open', () => {
      console.log('正在连接至弹幕服务器')
    })
    .on('data', (msg) => {
      // msg结构参见下方文档说明
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
```

### 消息结构

```javascript
{
  op: '...' // 可能的取值: AUTH_REPLY, HEARTBEAT_REPLY, SEND_SMS_REPLY
  ...
}
```

#### 鉴权包回复消息

```javascript
{ op: 'AUTH_REPLY' }
```

#### 心跳包回复消息

```javascript
{ 
  op: 'HEARTBEAT_REPLY',
  online: 21066 // 房间人气值
}
```

#### 弹幕消息
```javascript
{
  op: 'SEND_SMS_REPLY',
  ...
}

// 示例消息
{
  cmd: 'INTERACT_WORD',
  data: {
    uid: 1326986,
    uname: '清古',
    uname_color: '',
    identities: [ 1 ],
    msg_type: 1,
    roomid: 92052,
    timestamp: 1596879220,
    score: 1596868220864411100
  },
  op: 'SEND_SMS_REPLY'
}
```

## License

MIT
