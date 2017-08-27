const { API } = require('../dist/bilibili-live.js')

const TEST_ROOM_URL = 92052

async function test() {
  let api = new API({
    cookie: ""
  })

  let roomId = await api.getRoomId(TEST_ROOM_URL)
  console.log(roomId)

  console.log('直播间简介')
  let roomIntro = await api.getRoomIntro(TEST_ROOM_URL)
  console.log(roomIntro)
  api.setRoomId(roomId)

  console.log('直播间信息')
  let roomInfo = await api.getRoomInfo()
  console.log(roomInfo)
  let anchorId = roomInfo.anchor.id

  // let roomMessage = await api.getRoomMessage()
  // console.log(roomMessage)
  console.log('粉丝列表')
  let roomFans = await api.getAnchorFollwerList(anchorId)
  console.log(roomFans)

  // let areaList = await api.getAreaList()
  // areaList.forEach(area => {
  //   console.log(area.id)
  //   console.log(area.name)
  //   console.log(area.list)
  // })

  console.log('开启直播间')
  let toggleRoom = await api.toggleLiveRoom(1, 26)
  console.log(toggleRoom)
  roomInfo = await api.getRoomInfo()
  console.log(roomInfo)

  // console.log('获取推流码')
  // let roomRTMP = await api.getRoomRTMP()
  // console.log(roomRTMP)

  console.log('禁言用户')
  let blockUser = await api.blockUser('沽酒生', 1)
  console.log(blockUser)

  console.log('禁言列表')
  let roomBlock = await api.getRoomBlockList()
  console.log(roomBlock)

  console.log('取消禁言')
  let deleteBlockUser = await api.deleteBlockUser(blockUser.data.id)
  console.log(deleteBlockUser)

  console.log('任命管理员')
  let setAdmin = await api.setAdmin(101975088)
  console.log(setAdmin)

  console.log('管理员列表')
  let roomAdmin = await api.getRoomAdminList()
  console.log(roomAdmin)

  console.log('撤销管理员')
  let deleteAdmin = await api.deleteAdmin(101975088)
  console.log(deleteAdmin)

  setTimeout(async () => {
    console.log('关闭直播间')
    toggleRoom = await api.toggleLiveRoom(0)
    console.log(toggleRoom)
    roomInfo = await api.getRoomInfo()
    console.log(roomInfo)
  }, 10000)

}

test()
