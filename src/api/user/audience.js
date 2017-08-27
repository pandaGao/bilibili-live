// 发送弹幕
export function sendMessage(msg, color=0xffffff, mode=1) {
  return this.post({
    url: 'live.bilibili.com/msg/send',
    body: {
      color: Number(Number(color).toString(10)),
      mode,
      msg,
      rnd: Math.floor(new Date().getTime()/1000),
      roomid: this.roomId
    }
  })
}

// 发送在线心跳
export function sendHeartbeat() {
  return this.post({
    uri: 'User/userOnlineHeart',
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Host': 'api.live.bilibili.com',
      'Origin': 'http://live.bilibili.com',
      'Referer': 'http://live.bilibili.com/'+this.roomId,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
  })
}

// 发送在线礼物心跳
export function sendEventHeartbeat() {
  return this.get({
    uri: 'eventRoom/heart',
    params: {
      roomid: this.roomId
    }
  })
}

// 每日签到
export function dailySign() {
  return this.get({
    uri: 'sign/doSign'
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}
