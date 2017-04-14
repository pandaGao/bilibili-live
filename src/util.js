import querystring from 'querystring'
import request from './request.js'

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

function getRoomInfo (roomId) {
  return request.get('http://live.bilibili.com/live/getInfo', {
    params: {
      roomid: roomId
    }
  }).then(res => {
    let data = JSON.parse(res)
    let room = {}
    room.title = data.data['ROOMTITLE']
    room.anchor = {
      id: data.data['MASTERID'],
      name: data.data['ANCHOR_NICK_NAME']
    }
    room.fans = data.data['FANS_COUNT']
    room.isLive = !!(data.data['_status'] == 'on')
    return room
  })
}

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

function getUserInfo (cookie) {
  return request.get('http://live.bilibili.com/user/getuserinfo', {
    headers: {
      'Cookie': cookie
    }
  }).then(res => {
    let data = JSON.parse(res)
    return data
  })
}

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

function sendMessage (cookie, data) {
  return request.post('http://live.bilibili.com/msg/send', {
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
  getRoomChatServer,
  getRoomLivePlaylist,
  getUserInfo,
  getUserFans,
  sendMessage
}
