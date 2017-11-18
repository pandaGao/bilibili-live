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

// 参加丰收祭典
export function joinRaffle (roomId, raffleId) {
  return this.get({
    uri: 'activity/v1/Raffle/join',
    params: {
      roomid: roomId,
      raffleId
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 查看丰收祭典奖励
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
