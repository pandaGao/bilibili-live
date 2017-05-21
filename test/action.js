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
      roomId: 92052
    })
    room.on('data', (msg) => {
      if (msg.type != 'online' && msg.type != 'fans') {
        console.log(msg)
      }
      if (msg.type == 'SYS_MSG') {
        if (msg.tv_id) {
          user.joinSmallTV(msg.real_roomid, msg.tv_id).then(res => {
            console.log(res)
          })
          setTimeout(() => {
            user.getSmallTVReward(msg.tv_id).then(res => {
              console.log(res)
            })
          }, 24e4)
        }
      }
    })
    user.setCurrentRoom(room.getInfo().id)
    user.startOnlineService()
  } catch (e) {
    console.log(e)
  }
}

action()
