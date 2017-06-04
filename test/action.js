const Live = require('../dist/bilibili-live.js')

async function action() {
  try {
    let user = await Live.initUser({
      cookie: ''
    })
    user.on('heartbeat', () => {
      user.getInfo().then((res) => {
        console.log(user.getUserInfo())
      })
    })
    let room = await Live.initRoom({
      useFansService: false,
      roomId: 1249
    })
    room.on('data', (msg) => {
      if (msg.type != 'online' && msg.type != 'fans') {
        console.log(msg)
      }
      if (msg.type == 'SYS_MSG') {
        if (msg.msg.includes('Live专场')) {
          tempLive(user,msg.url.slice(25))
        }
      }
      if (msg.type == 'SPECIAL_GIFT') {
        let data = msg.data['39']
        if (data.action == 'start') {
          user.sendMessage(data.content)
        }
      }
      // if (msg.type == 'SYS_MSG') {
      //   if (msg.tv_id) {
      //     user.joinSmallTV(msg.real_roomid, msg.tv_id).then(res => {
      //       console.log(res)
      //     })
      //     setTimeout(() => {
      //       user.getSmallTVReward(msg.tv_id).then(res => {
      //         console.log(res)
      //       })
      //     }, 24e4)
      //   }
      // }
    })
    user.setCurrentRoom(room.getInfo().id)
    // user.startOnlineService()
  } catch (e) {
    console.log(e)
  }
}

async function tempLive (user, roomId) {
  let room = await Live.initRoom({
    roomId: roomId,
    isDireact: true,
    useFansService: false
  })
  room
    .on('LIGHTEN_START', (msg) => {
      let data = msg.data
      console.log(data.lightenId)
      user.joinLighten(roomId, data.lightenId).then(res => {
        console.log('start',res)
        if (!room) return
        room.terminate()
        room = null
      })
    })
    .on('EVENT_CMD', (msg) => {
      let data = msg.data
      user.joinLighten(roomId, data.event_type.slice('3')).then(res => {
        console.log('event', res)
        if (!room) return
        room.terminate()
        room = null
      })
    })
}

action()
