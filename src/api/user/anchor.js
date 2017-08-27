// 切换直播间状态 1 -> 开启 0 -> 关闭
export function toggleLiveRoom(status, area) {
  let body = {
    status,
    roomid: this.roomId
  }
  if (area) {
    body.area_v2 = area
  }
  return this.post({
    uri: 'liveact/live_status_mng',
    body
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 获取直播分区列表
export function getAreaList() {
  return this.get({
    uri: '/room/v1/Area/getList',
  }).then(res => {
    let data = JSON.parse(res).data
    return data
  })
}

// 获取直播间推流码
export function getRoomRTMP() {
  return this.post({
    uri: 'liveact/getrtmp',
    body: {
      roomid: this.roomId
    }
  }).then(res => {
    let data = JSON.parse(res)
    if (data.code < 0) return false
    data = data.data
    return {
      address: data.addr,
      code: data.code
    }
  })
}

// 禁言用户
export function blockUser(userId, hour) {
  return this.post({
    uri: 'liveact/room_block_user',
    body: {
      roomid: this.roomId,
      content: userId,
      type: 1,
      hour: hour
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 取消禁言
export function deleteBlockUser(blockId) {
  return this.post({
    uri: 'liveact/del_room_block_user',
    body: {
      roomid: this.roomId,
      id: blockId
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 任命房管
export function setAdmin(userId) {
  return this.post({
    uri: 'liveact/admin',
    body: {
      content: userId,
      roomid: this.roomId,
      type: 'add'
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

// 取消房管
export function deleteAdmin(userId) {
  return this.post({
    uri: 'liveact/admin',
    body: {
      content: userId,
      roomid: this.roomId,
      type: 'del'
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}
