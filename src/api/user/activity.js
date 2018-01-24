// 参与小电视抽奖
export function joinSmallTV (roomId, tvId) {
  return this.get({
    uri: 'gift/v2/smalltv/join',
    params: {
      roomid: roomId,
      raffleId: tvId
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 查看小电视抽奖奖励
export function getSmallTVReward (roomId, tvId) {
  return this.get({
    uri: 'gift/v2/smalltv/notice',
    params: {
      roomid: roomId,
      raffleId: tvId
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 获取房间抽奖列表
export function checkRaffle (roomId) {
  return this.get({
    uri: 'activity/v1/Raffle/check',
    params: {
      roomid: roomId
    },
    headers: {
      'Host': 'api.live.bilibili.com',
      'Origin': 'http://live.bilibili.com',
      'Referer': 'http://live.bilibili.com/' + roomId,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 参加房间抽奖
export function joinRaffle (roomId, raffleId) {
  return this.get({
    uri: 'activity/v1/Raffle/join',
    params: {
      roomid: roomId,
      raffleId
    },
    headers: {
      'Host': 'api.live.bilibili.com',
      'Origin': 'http://live.bilibili.com',
      'Referer': 'http://live.bilibili.com/' + roomId,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 查看抽奖奖励
export function getRaffleReward (roomId, raffleId) {
  return this.get({
    uri: 'activity/v1/Raffle/notice',
    params: {
      roomid: roomId,
      raffleId
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}