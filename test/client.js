const { Client } = require('../dist/bilibili-live.min')

const client = new Client({
  cookie: ''
})

// client.get('https://live.bilibili.com').then(res => {
//   console.log(res)
// })

client.getJSON('https://api.bilibili.com/nav').then(res => {
  console.log(res)
})

// client.getJSON('https://api.live.bilibili.com/xlive/web-ucenter/user/get_user_info').then(res => {
//   console.log(res)
// })

// client.post('https://api.live.bilibili.com/ajax/msg', {
//   form: {
//     roomid: 92052
//   }
// }).then(res => {
//   console.log(res)
// })
