const Live = require('../dist/bilibili-live.js')
const Util = Live.Util

Live.initUser({
  cookie: ''
}).then(user => {
  if (!user) {
    console.log('Cookie不正确或已过期')
    return
  }
  console.log(user.getUserInfo())
  console.log(user.getUserRoom())
  user.setCurrentRoom(92052)
  user.sendMessage('Test Send Message')

  user.addAdmin(101975088).then(res => {
    console.log('添加管理')
    console.log(res)
    Util.getRoomAdmin(92052).then(res => {
      console.log('房管列表')
      console.log(res)
    })
  })
  setTimeout(() => {
    user.deleteAdmin(101975088).then((res) => {
      console.log('移除管理')
      console.log(res)
      let blockId = ''
      user.blockUser(101975088, 1).then(res => {
        console.log('禁言用户')
        console.log(res)
        blockId = JSON.parse(res).data.id
        user.getBlockList(1).then(list => {
          console.log('禁言列表')
          console.log(list)
        })
      })
      setTimeout(() => {
        user.deleteBlockUser(blockId).then(res => {
          console.log('移除禁言')
          console.log(res)
        })
        user.startLiving().then(res => {
          console.log('开始直播')
          console.log(res)
          return user.getRTMP()
        }).then(res => {
          console.log('获取推流码')
          console.log(res.address+res.code)
        })
        setTimeout(() => {
          user.endLiving().then(res => {
            console.log('结束直播')
            console.log(res)
          })
        }, 3000)
      }, 3000)
    })
  }, 3000)

})
