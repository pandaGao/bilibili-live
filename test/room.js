const Live = require('../dist/bilibili-live.js')

Live.initRoom({
  roomId: 39936,
}).then(room => {
  room
    .on('data', (msg) => {
      if (msg.type != 'online' && msg.type != 'fans') {
        console.log(msg)
      }
    })
    .on('error', () => {
      console.log('error')
    })
    .on('close', () => {
      console.log('close')
    })
})
