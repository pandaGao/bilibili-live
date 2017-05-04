const Live = require('../dist/bilibili-live.js')

Live.initRoom({
  roomId: 92052
}).then(room => {
  room.getRoomAdmin().then(res => {
    console.log(res)
  })
})
