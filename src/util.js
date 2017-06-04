import querystring from 'querystring'
import request from './request.js'

class Util {
  constructor () {
    this.https = true
    this.protocol = 'https://'
    this.cookie = ''
  }

  useHttps (use) {
    if (use) {
      this.https = true
      this.protocol = 'https://'
    } else {
      this.https = false
      this.protocol = 'http://'
    }
  }

  setCookie (cookie) {
    this.cookie = cookie
  }

  // 获取直播间真实ID
  getRoomId (roomURL) {
    return request.get(this.protocol + 'live.bilibili.com/' + roomURL).then(res => {
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
  getRoomInfo (roomId) {
    return request.get(this.protocol + 'live.bilibili.com/live/getInfo', {
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

  // 获取直播间历史弹幕
  getRoomMessage (roomId) {
    return request.post(this.protocol + 'api.live.bilibili.com/ajax/msg', {
      body: querystring.stringify({
        roomid: roomId
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }

  // 获取直播间房管列表
  getRoomAdmin (roomId) {
    return request.post(this.protocol + 'api.live.bilibili.com/liveact/ajaxGetAdminList', {
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

  // 获取直播间被禁言用户列表
  getRoomBlockList (roomId, page) {
    return request.post(this.protocol + 'api.live.bilibili.com/liveact/ajaxGetBlockList', {
      body: querystring.stringify({
        roomid: roomId,
        page: page
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': this.cookie
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

  // 获取直播间弹幕池地址
  getRoomChatServer (roomId) {
    return request.get(this.protocol + 'live.bilibili.com/api/player', {
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

  // 获取直播间直播流地址
  getRoomLivePlaylist (roomId) {
    return request.get(this.protocol + 'api.live.bilibili.com/api/playurl', {
      params: {
        platform: 'h5',
        cid: roomId
      }
    }).then(res => {
      let data = JSON.parse(res)
      return data.data
    })
  }

  // 获取主播粉丝信息
  getUserFans (uid, page) {
    return request.get(this.protocol + 'space.bilibili.com/ajax/friend/GetFansList', {
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
  checkUserLogin () {
    return request.get(this.protocol + 'live.bilibili.com/user/getuserinfo', {
      headers: {
        'Cookie': this.cookie
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

  // 获取主播直播信息
  getUserLiveInfo () {
    return request.get(this.protocol + 'api.live.bilibili.com/i/api/liveinfo', {
      headers: {
        'Cookie': this.cookie
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
  toggleLiveRoom (status, roomId) {
    return request.post(this.protocol + 'api.live.bilibili.com/liveact/live_status_mng', {
      body: querystring.stringify({
        status: status,
        roomid: roomId
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': this.cookie
      }
    })
  }

  // 获取直播推流码
  getLiveRoomRTMP (roomId) {
    return request.post(this.protocol + 'api.live.bilibili.com/liveact/getrtmp', {
      body: querystring.stringify({
        roomid: roomId
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': this.cookie
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
  sendMessage (data) {
    return request.post(this.protocol + 'live.bilibili.com/msg/send', {
      body: querystring.stringify(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': this.cookie
      }
    })
  }

  // 禁言用户
  blockUser (data) {
    return request.post(this.protocol + 'api.live.bilibili.com/liveact/room_block_user', {
      body: querystring.stringify(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': this.cookie
      }
    })
  }

  // 取消禁言
  deleteBlockUser (data) {
    return request.post(this.protocol + 'api.live.bilibili.com/liveact/del_room_block_user', {
      body: querystring.stringify(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': this.cookie
      }
    })
  }

  // 管理房管
  setAdmin (data) {
    return request.post(this.protocol + 'api.live.bilibili.com/liveact/admin', {
      body: querystring.stringify(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': this.cookie
      }
    })
  }

  // 发送在线心跳
  sendHeartbeat (room) {
    return request.post(this.protocol + 'api.live.bilibili.com/User/userOnlineHeart', {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cookie': this.cookie,
        'Host': 'api.live.bilibili.com',
        'Origin': 'http://live.bilibili.com',
        'Referer': 'http://live.bilibili.com/'+room,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    })
  }

  // 发送礼物心跳
  sendEventHeartbeat (room) {
    return request.get(this.protocol + 'api.live.bilibili.com/eventRoom/heart', {
      params: {
        roomid: room
      },
      headers: {
        'Cookie': this.cookie,
        'Host': 'api.live.bilibili.com',
        'Origin': 'http://live.bilibili.com',
        'Referer': 'http://live.bilibili.com/'+room,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    })
  }

  // 参与小电视抽奖
  joinSmallTV (data) {
    return request.get(this.protocol + 'api.live.bilibili.com/SmallTV/join', {
      params: data,
      headers: {
        'Cookie': this.cookie
      }
    }).then(res => {
      let data = JSON.parse(res)
      return data
    })
  }

  // 查看小电视抽奖奖励
  getSmallTVReward (data) {
    return request.get(this.protocol + 'api.live.bilibili.com/SmallTV/getReward', {
      params: data,
      headers: {
        'Cookie': this.cookie
      }
    }).then(res => {
      let data = JSON.parse(res)
      return data
    })
  }

  // 每日签到
  dailySign () {
    return request.get(this.protocol + 'api.live.bilibili.com/sign/doSign', {
      headers: {
        'Cookie': this.cookie
      }
    }).then(res => {
      let data = JSON.parse(res)
      return data
    })
  }
}

let util = new Util()

export default util
