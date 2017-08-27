// 检查cookie是否过期
export function checkUserLogin() {
  return this.post({
    uri: 'User/getUserInfo'
  }).then(res => {
    let data = JSON.parse(res)
    if (data.code == 'REPONSE_OK') {
      return true
    }
    return false
  })
}

// 获取用户基本信息
export function getUserInfo() {
  return this.post({
    uri: 'i/api/liveinfo'
  }).then(res => {
    let data
    try {
      data = JSON.parse(res)
    } catch(e) {
      return false
    }
    if (data.code != 0) return false
    data = data.data
    return {
      room: {
        id: data.roomid,
        level: data.master.level,
        current: data.master.current,
        next: data.master.next,
        san: data.san,
        liveTime: data.liveTime
      },
      user: {
        id: data.userInfo.uid,
        name: data.userInfo.uname,
        avatar: data.userInfo.face,
        archives: data.achieves,
        gold: data.userCoinIfo.gold,
        silver: data.userCoinIfo.silver,
        coins: data.userCoinIfo.coins,
        bcoins: data.userCoinIfo.bili_coins,
        vip: !!data.userCoinIfo.vip,
        svip: !!data.userCoinIfo.svip,
        level: data.userCoinIfo.user_level,
        levelRank: data.userCoinIfo.user_level_rank,
        current: data.userCoinIfo.user_intimacy,
        next: data.userCoinIfo.user_next_intimacy
      }
    }
  })
}
