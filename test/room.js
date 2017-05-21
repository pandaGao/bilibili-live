const Live = require('../dist/bilibili-live.js')

Live.initRoom({
  roomId: 92052
}).then(room => {
  room.getAdmin().then(res => {
    console.log(res)
  })
  room
    .on('data', (msg) => {
      if (msg.type != 'online' && msg.type != 'fans') {
        console.log(msg)
      }
    })
})
