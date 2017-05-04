const Live = require('../dist/bilibili-live.js')
const Util = Live.Util

Live.initUser({
  cookie: 'fts=1473691828; LIVE_BUVID=082c2b132c242ecf3ecdb5b0b43fb250; LIVE_BUVID__ckMd5=1057371f15333fa6; rpdid=omwwmxpsswdopmpsompww; sid=4pf6zilf; buvid3=E6B5AE12-625E-4423-96FB-D407927F9EB828553infoc; pgv_pvi=2517892096; DedeID=8950632; UM_distinctid=15ae756cd760-0eefd73483de66-396c7b07-13c680-15ae756cd779a0; finger=14bc3c4e; pgv_si=s453359616; DedeUserID=1326986; DedeUserID__ckMd5=2da27d1b24d0c127; SESSDATA=74a486f7%2C1496324169%2C4adcf7dd; bili_jct=9cc9fde2db11361bbf92203daa66245b; LIVE_LOGIN_DATA=e531f2728645a063b4ab509d9b3bdd6f86836e36; LIVE_LOGIN_DATA__ckMd5=09067e2bb9b1458d; _qddaz=QD.4vvf3n.8scy9z.iwt8svbu; _cnt_dyn=null; uTZ=-480; user_face=http%3A%2F%2Fi2.hdslb.com%2Fbfs%2Fface%2F1e7306acd1e561b74ce63b700629165c56eaedc1.gif; _cnt_pm=0; _cnt_notify=33; _dfcaptcha=62861b78291cb3b532b608b6236e91ae'
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
