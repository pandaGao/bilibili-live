// 参与小电视抽奖
export function joinSmallTV(roomId, tvId) {
  return this.get({
    uri: 'SmallTV/join',
    params: {
      roomId: roomId,
      id: tvId,
      _: new Date().getTime()
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 查看小电视抽奖奖励
export function getSmallTVReward(tvId) {
  return this.get({
    uri: 'SmallTV/getReward',
    params: {
      id: tvId,
      _: new Date().getTime()
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}
