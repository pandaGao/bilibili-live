let Live = require('../index.js')

Live.initRoom({
  roomId: 308438
}).then(room => {
  room.on('connected', () => {
    room.startRecordLiveStream()
  })
  room.on('live', () => {
    console.log('Start Record')
    room.startRecordLiveStream('./live')
  })
  room.on('preparing', () => {
    console.log('Stop Record')
    room.endRecordLiveStream()
  })
  room.on('recordEnd', () => {
    console.log('Record End')
  })
})
