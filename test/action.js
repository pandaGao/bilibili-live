const Live = require('../dist/bilibili-live.js')

async function action() {
  try {
    let user = await Live.initUser({
      cookie: 'sid=bhyh4e41;fts=1494528159;buvid3=16E960BA-F27F-4395-96B6-E5D9FFEA25C942883infoc;DedeUserID=1326986;DedeUserID__ckMd5=2da27d1b24d0c127;SESSDATA=74a486f7%2C1497702766%2C71339732;bili_jct=d2e886ab45d08d94e871ad16b4670ad8'
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
