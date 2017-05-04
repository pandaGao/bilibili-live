import querystring from 'querystring'
import request from './request.js'

// 获取直播间真实ID
function getRoomId (roomURL) {
  return request.get('http://live.bilibili.com/' + roomURL).then(res => {
    let room = {url: roomURL}
    let data = res
    let reg = data.match(/ROOMID \= (.*?)\;/)
    if (reg && reg.length >= 2)
      room.id = reg[1]
    else
      room.id = roomURL
    reg = data.match(/DANMU_RND \= (.*?)\;/)
    if (reg && reg.length >= 2)
      room.rnd = reg[1]
    else
      room.rnd = ''
    return room
  })
}

// 直播间信息
function getRoomInfo (roomId) {
  return request.get('http://live.bilibili.com/live/getInfo', {
    params: {
      roomid: roomId
    }
  }).then(res => {
    let data = JSON.parse(res).data
    let room = {}
    room.title = data['ROOMTITLE']
    room.areaId = data['AREAID']
    room.cover = data['COVER']
    room.anchor = {
      id: data['MASTERID'],
      name: data['ANCHOR_NICK_NAME']
    }
    room.fans = data['FANS_COUNT']
    room.isLive = !!(data['_status'] == 'on')
    return room
  })
}

// 获取房间弹幕
function getRoomMessage (roomId) {
  return request.post('http://api.live.bilibili.com/ajax/msg', {
    body: querystring.stringify({
      roomid: roomId
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

// 获取直播间房管列表
function getRoomAdmin (roomId) {
  return request.post('http://api.live.bilibili.com/liveact/ajaxGetAdminList', {
    body: querystring.stringify({
      roomid: roomId
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
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

// 获取房间被禁言用户列表
function getRoomBlockList (cookie, roomId, page) {
  return request.post('http://api.live.bilibili.com/liveact/ajaxGetBlockList', {
    body: querystring.stringify({
      roomid: roomId,
      page: page
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
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
        createTime: item.ctime,
        blockEndTime: item.block_end_time
      }
    })
  })
}

// 获取弹幕池地址
function getRoomChatServer (roomId) {
  return request.get('http://live.bilibili.com/api/player', {
    params: {
      id: 'cid:' + roomId
    }
  }).then(res => {
    let data = res
    let reg = data.match(/<server>(.*?)<\/server>/)
    if (reg && reg.length >= 2)
      return reg[1]
    else
      return 'livecmt-1.bilibili.com'
  })
}

// 获取直播流地址
function getRoomLivePlaylist (roomId) {
  return request.get('http://api.live.bilibili.com/api/playurl', {
    params: {
      platform: 'h5',
      cid: roomId
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data.data
  })
}

// 获取用户粉丝信息
function getUserFans (uid, page) {
  return request.get('http://space.bilibili.com/ajax/friend/GetFansList?mid=4548018&page=1&_=1492189208778', {
    params: {
      mid: uid,
      page: page,
      _: new Date().getTime()
    }
  }).then(res => {
    let data = JSON.parse(res)
    return {
      fans: data.data.list.map(fan => {
        return {
          id: fan.fid,
          name: fan.uname
        }
      }),
      total: data.data.results
    }
  })
}

// 检查cookie是否过期
function checkUserLogin (cookie) {
  return request.get('http://live.bilibili.com/user/getuserinfo', {
    headers: {
      'Cookie': cookie
    }
  }).then(res => {
    let data = JSON.parse(res)
    if (data.code == 'REPONSE_OK') {
      return {
        login: true
      }
    }
    return {
      login: false
    }
  })
}

// 获取用户直播信息
function getUserLiveInfo (cookie) {
  return request.get('http://api.live.bilibili.com/i/api/liveinfo', {
    headers: {
      'Cookie': cookie
    }
  }).then(res => {
    let data = JSON.parse(res).data
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

// 更改直播间状态
function toggleLiveRoom (cookie, status, roomId) {
  return request.post('http://api.live.bilibili.com/liveact/live_status_mng', {
    body: querystring.stringify({
      status: status,
      roomid: roomId
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    }
  })
}

// 获取直播推流码
function getLiveRoomRTMP (cookie, roomId) {
  return request.post('http://api.live.bilibili.com/liveact/getrtmp', {
    body: querystring.stringify({
      roomid: roomId
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
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

// 发送弹幕
function sendMessage (cookie, data) {
  return request.post('http://live.bilibili.com/msg/send', {
    body: querystring.stringify(data),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    }
  })
}

// 禁言用户
function blockUser (cookie, data) {
  return request.post('http://api.live.bilibili.com/liveact/room_block_user', {
    body: querystring.stringify(data),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    }
  })
}

// 取消禁言
function deleteBlockUser (cookie, data) {
  return request.post('http://api.live.bilibili.com/liveact/del_room_block_user', {
    body: querystring.stringify(data),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    }
  })
}

// 管理房管
function setAdmin (cookie, data) {
  return request.post('http://api.live.bilibili.com/liveact/admin', {
    body: querystring.stringify(data),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    }
  })
}

export default {
  getRoomId,
  getRoomInfo,
  getRoomMessage,
  getRoomAdmin,
  getRoomBlockList,
  getRoomChatServer,
  getRoomLivePlaylist,
  checkUserLogin,
  getUserLiveInfo,
  getUserFans,
  toggleLiveRoom,
  getLiveRoomRTMP,
  sendMessage,
  blockUser,
  deleteBlockUser,
  setAdmin
}
