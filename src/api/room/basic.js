// 获取直播间基本信息
export function getRoomBaseInfo (roomUrl) {
  return this.get({
    uri: `room/v1/Room/room_init`,
    params: {
      id: roomUrl
    }
  }).then(res => {
    let data = JSON.parse(res).data
    return {
      id: data['room_id'],
      shortId: data['short_id'],
      anchorId: data['uid']
    }
  })
}

// 获取直播间信息
export function getRoomInfo () {
  return this.get({
    uri: `room/v1/Room/get_info`,
    params: {
      room_id: this.roomId,
      from: 'room'
    }
  }).then(res => {
    let data = JSON.parse(res).data
    let room = {}
    room.title = data['title']
    room.areaId = data['area_id']
    room.cover = data['user_cover']
    room.liveStatus = data['live_status']
    room.liveStartTime = data['live_time']
    room.anchor = {
      id: data['uid']
    }
    return room
  })
}

// 获取直播间粉丝数
export function getRoomFansCount (anchorId) {
  return this.get({
    uri: `feed/v1/feed/GetUserFc`,
    params: {
      follow: anchorId
    }
  }).then(res => {
    let data = JSON.parse(res).data
    return data.fc
  })
}

// 获取直播间历史弹幕
export function getRoomMessage () {
  return this.post({
    uri: 'ajax/msg',
    body: {
      roomid: this.roomId
    }
  }).then(res => {
    let data = JSON.parse(res)
    if (data.code == 0) {
      return data.data.room
    }
  })
}

// 获取直播间粉丝列表
export function getAnchorFollwerList (anchorId, page = 1, pageSize = 20, order = 'desc') {
  return this.get({
    url: 'api.bilibili.com/x/relation/followers',
    params: {
      vmid: anchorId,
      pn: page,
      ps: pageSize,
      order
    }
  }).then(res => {
    let data = JSON.parse(res).data
    return data.list.map(follower => {
      return {
        id: follower.mid,
        name: follower.uname
      }
    })
  })
}

// 获取直播间房管列表
export function getRoomAdminList () {
  return this.post({
    uri: 'liveact/ajaxGetAdminList',
    body: {
      roomid: this.roomId
    }
  }).then(res => {
    let data = JSON.parse(res).data
    return data.map(admin => {
      return {
        id: admin.id,
        ctime: admin.ctime,
        admin: {
          id: admin.userinfo.uid,
          name: admin.userinfo.uname
        }
      }
    })
  })
}

// 获取被禁言用户列表
export function getRoomBlockList (page = 1) {
  return this.post({
    uri: 'liveact/ajaxGetBlockList',
    body: {
      roomid: this.roomId,
      page: page
    }
  }).then(res => {
    let data = JSON.parse(res).data
    return data.map((item) => {
      return {
        id: item.id,
        user: {
          id: item.uid,
          name: item.uname
        },
        admin: {
          id: item.adminid,
          name: item.admin_uname
        },
        ctime: item.ctime,
        etime: item.block_end_time
      }
    })
  })
}
