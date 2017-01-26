const axios = require('axios')
const querystring = require('querystring')

function getRoomInfo (roomURL) {
  return axios.get('http://live.bilibili.com/' + roomURL).then(res => {
    let room = {url: roomURL}
    let data = res.data
    let reg = data.match(/ROOMID \= (.*?)\;/)
    if (reg && reg.length >= 2)
      room.id = reg[1]
    else
      room.id = liveid
    reg = data.match(/DANMU_RND \= (.*?)\;/)
    if (reg && reg.length >= 2)
      room.rnd = reg[1]
    else
      room.rnd = ''
    return room
  })
}

function getRoomMessage (roomId) {
  return axios.post('http://api.live.bilibili.com/ajax/msg', querystring.stringify({
    roomid: roomId
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

function getRoomChatServer (roomId) {
  return axios.get('http://live.bilibili.com/api/player?id=cid:' + roomId).then(res => {
    let data = res.data
    let reg = data.match(/<server>(.*?)<\/server>/)
    if (reg && reg.length >= 2)
      return reg[1]
    else
      return 'livecmt-1.bilibili.com'
  })
}

function getUserInfo (cookie) {
  return axios.get('http://live.bilibili.com/user/getuserinfo', {
    headers: {
      'Cookie': cookie
    }
  }).then(res => {
    let data = res.data
    return data
  })
}

function sendMessage (cookie, data) {
  return axios.post('http://live.bilibili.com/msg/send',  querystring.stringify(data), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie
    }
  })
}

module.exports = {
  getRoomInfo,
  getRoomMessage,
  getRoomChatServer,
  getUserInfo,
  sendMessage
}
