'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('events'));
var WebSocket = _interopDefault(require('ws'));
var net = _interopDefault(require('net'));
var _ = _interopDefault(require('lodash'));
var string_decoder = require('string_decoder');
var qs = _interopDefault(require('querystring'));
var http = _interopDefault(require('http'));
var https = _interopDefault(require('https'));
var url = _interopDefault(require('url'));

const WS_OP_HEARTBEAT = 2;
const WS_OP_HEARTBEAT_REPLY = 3;
const WS_OP_MESSAGE = 5;
const WS_OP_USER_AUTHENTICATION = 7;
const WS_OP_CONNECT_SUCCESS = 8;
const WS_PACKAGE_OFFSET = 0;
const WS_HEADER_OFFSET = 4;
const WS_VERSION_OFFSET = 6;
const WS_OPERATION_OFFSET = 8;
const WS_SEQUENCE_OFFSET = 12;
const WS_PACKAGE_HEADER_TOTAL_LENGTH = 16;
const WS_HEADER_DEFAULT_VERSION = 1;
const WS_HEADER_DEFAULT_OPERATION = 1;
const WS_HEADER_DEFAULT_SEQUENCE = 1;

var Consts = {
  version: 1,
  magic: 16,
  magicParam: 1,
  headerLength: 16,
  actions: {
    heartbeat: 2,
    joinChannel: 7,
  },
  WS_OP_HEARTBEAT,
  WS_OP_HEARTBEAT_REPLY,
  WS_OP_MESSAGE,
  WS_OP_USER_AUTHENTICATION,
  WS_OP_CONNECT_SUCCESS,
  WS_PACKAGE_OFFSET,
  WS_HEADER_OFFSET,
  WS_VERSION_OFFSET,
  WS_OPERATION_OFFSET,
  WS_SEQUENCE_OFFSET,
  WS_PACKAGE_HEADER_TOTAL_LENGTH,
  WS_HEADER_DEFAULT_VERSION,
  WS_HEADER_DEFAULT_OPERATION,
  WS_HEADER_DEFAULT_SEQUENCE,
  dataStruct: [{
      name: "Header Length",
      key: "headerLen",
      bytes: 2,
      offset: WS_HEADER_OFFSET,
      value: WS_PACKAGE_HEADER_TOTAL_LENGTH
  }, {
      name: "Protocol Version",
      key: "ver",
      bytes: 2,
      offset: WS_VERSION_OFFSET,
      value: WS_HEADER_DEFAULT_VERSION
  }, {
      name: "Operation",
      key: "op",
      bytes: 4,
      offset: WS_OPERATION_OFFSET,
      value: WS_HEADER_DEFAULT_OPERATION
  }, {
      name: "Sequence Id",
      key: "seq",
      bytes: 4,
      offset: WS_SEQUENCE_OFFSET,
      value: WS_HEADER_DEFAULT_SEQUENCE
  }]
};

const textDecoder = new string_decoder.StringDecoder('utf8');

function decodeBuffer (buff) {
  let data = {};
  data.packetLen = buff.readInt32BE(Consts.WS_PACKAGE_OFFSET);
  Consts.dataStruct.forEach((struct) => {
    if (struct.bytes === 4) {
      data[struct.key] = buff.readInt32BE(struct.offset);
    } else if (struct.bytes === 2) {
      data[struct.key] = buff.readInt16BE(struct.offset);
    }
  });
  if (data.op && data.op === Consts.WS_OP_MESSAGE) {
    data.body = [];
    let packetLen = data.packetLen;
    let headerLen = 0;
    for (let offset = Consts.WS_PACKAGE_OFFSET; offset < buff.byteLength; offset += packetLen) {
      packetLen = buff.readInt32BE(offset);
      headerLen = buff.readInt16BE(offset + Consts.WS_HEADER_OFFSET);
      try {
        let body = JSON.parse(textDecoder.write(buff.slice(offset + headerLen, offset + packetLen)));
        data.body.push(body);
      } catch (e) {
        console.log("decode body error:", textDecoder.write(buff.slice(offset + headerLen, offset + packetLen)), data);
      }
    }
  } else if (data.op && data.op === Consts.WS_OP_HEARTBEAT_REPLY) {
    data.body = {
      number: buff.readInt32BE(Consts.WS_PACKAGE_HEADER_TOTAL_LENGTH)
    };
  }
  return data
}

function parseMessage (msg) {
  switch (msg.op) {
    case Consts.WS_OP_HEARTBEAT_REPLY:
      msg.body.type = 'online';
      msg.body.ts = new Date().getTime();
      return msg.body
    case Consts.WS_OP_MESSAGE:
      return msg.body.map((m) => {
        return transformMessage(m)
      })
    case Consts.WS_OP_CONNECT_SUCCESS:
      return {
        type: 'connected',
        ts: new Date().getTime()
      }
  }
}

function transformMessage (msg) {
  let message = {};
  switch (msg.cmd) {
    case 'LIVE':
      message.type = 'live';
      message.roomId = msg.roomid;
      break
    case 'PREPARING':
      message.type = 'preparing';
      message.roomId = msg.roomid;
      break
    case 'DANMU_MSG':
      message.type = 'comment';
      message.comment = msg.info[1];
      message.user = {
        id: msg.info[2][0],
        name: msg.info[2][1],
        isAdmin: !!msg.info[2][2],
        isVIP: !!msg.info[2][3],
        isSVIP: !!msg.info[2][4],
        guard: msg.info[7]
      };
      if (msg.info[3].length) {
        message.user.badge = {
          level: msg.info[3][0],
          title: msg.info[3][1],
          anchor: msg.info[3][2],
          roomURL: msg.info[3][3]
        };
      }
      if (msg.info[4].length) {
        message.user.level = msg.info[4][0];
      }
      if (msg.info[5].length) {
        message.user.title = {
          name: msg.info[5][0],
          source: msg.info[5][1]
        };
      }
      break
    case 'WELCOME':
      message.type = 'welcome';
      message.user = {
        id: msg.data.uid,
        name: msg.data.uname,
        isAdmin: !!msg.data.isadmin,
        isVIP: !!msg.data.vip,
        isSVIP: !!msg.data.svip
      };
      break
    case 'WELCOME_GUARD':
      message.type = 'welcomeGuard';
      message.user = {
        id: msg.data.uid,
        name: msg.data.username,
        guard: msg.data.guard_level
      };
      break
    case 'GUARD_BUY':
      message.type = 'guardBuy';
      message.user = {
        id: msg.data.uid,
        name: msg.data.username
      };
      message.level = msg.data.guard_level;
      message.count = msg.data.num;
      break
    case 'SEND_GIFT':
      message.type = 'gift';
      message.gift = {
        id: msg.data.giftId,
        type: msg.data.giftType,
        name: msg.data.giftName,
        count: msg.data.num,
        price: msg.data.price
      };
      message.user = {
        id: msg.data.uid,
        name: msg.data.uname
      };
      break
    case 'ROOM_BLOCK_MSG':
      message.type = 'block';
      message.user = {
        id: msg.uid,
        name: msg.uname
      };
      break
    default:
      message = msg;
      message.type = msg.cmd;
  }
  message.ts = new Date().getTime();
  return message
}

function decodeData (buff) {
  let messages = [];
  try {
    let data = parseMessage(decodeBuffer(buff));
    if (data instanceof Array) {
      data.forEach((m) => {
        messages.push(m);
      });
    } else if (data instanceof Object) {
      messages.push(data);
    }
  } catch (e) {
    console.log("Socket message error", buff, e);
  }
  return messages
}

var DMDecoder = {
  decodeData
};

function getPacketLength (payload) {
  return Buffer.byteLength(payload) + Consts.headerLength
}

function writePacketLength (buff, packetLength) {
  buff.writeInt32BE(packetLength, 0);
}

function writeConsts (buff) {
  buff.writeInt16BE(Consts.magic, 4);
  buff.writeInt16BE(Consts.version, 6);
  buff.writeInt32BE(Consts.magicParam, 12);
}

function writeAction (buff, action) {
  buff.writeInt32BE(action, 8);
}

function writePayload (buff, payload) {
  buff.write(payload, Consts.headerLength);
}

function generatePacket (action, payload) {
  payload = payload || '';
  let packetLength = getPacketLength(payload);
  let buff = new Buffer(packetLength);

  writePacketLength(buff, packetLength);
  writeConsts(buff);
  writeAction(buff, action);
  writePayload(buff, payload);

  return buff
}

function encodeHeartbeat () {
  return generatePacket(Consts.actions.heartbeat)
}

function encodeJoinRoom (rid, uid) {
  let userId = Number(uid);
  let roomId = Number(rid);
  let packet = JSON.stringify({uid: userId, roomid: roomId});
  return generatePacket(Consts.actions.joinChannel, packet)
}

var DMEncoder = {
  encodeJoinRoom,
  encodeHeartbeat,
};

const DMPORT = 2243;
const DMSERVER = 'livecmt-2.bilibili.com';

const WSDMPROTOCOL = 'ws';
const WSSDMPROTOCOL = 'wss';
const WSDMSERVER = 'broadcastlv.chat.bilibili.com';
const WSDMPORT = 2244;
const WSSDMPORT = 2245;
const WSDMPATH = 'sub';

const HEARTBEAT_DELAY = 1e4;
const CHECK_ERROR_DELAY = 15e3;

class DanmakuService extends EventEmitter {

  constructor(config = {}) {
    super();

    this.roomId = config.roomId || '23058';  // 此处需要使用原始房间号
    this.userId = config.userId || this.randUid();
    this.useWebsocket = config.useWebsocket === false ? false : true;
    this.useWSS = config.useWSS || false;
    this.useGiftBundle = config.useGiftBundle || false;
    this.giftBundleDelay = config.giftBundleDelay || 3e3;

    this._socket = null;
    this._socketEvents = {
      connect: 'connect',
      data: 'data',
      close: 'close',
      error: 'error'
    };
    this._websocketEvents = {
      connect: 'open',
      data: 'message',
      close: 'close',
      error: 'error'
    };
    this._heartbeatService = null;
    this._checkErrorService =  _.debounce(() => {
      this.emit('error', 'check failed');
      this.reconnect();
    }, CHECK_ERROR_DELAY);
    this._giftBundleMap = new Map();
  }

  randUid() {
    return 1E15 + Math.floor(2E15 * Math.random())
  }

  setUseGiftBundle(use) {
    this.useGiftBundle = use;
  }

  connect() {
    if (this.useWebsocket) {
      if (this.useWSS) {
        this._socket = new WebSocket(`${WSSDMPROTOCOL}://${WSDMSERVER}:${WSSDMPORT}/${WSDMPATH}`);
      } else {
        this._socket = new WebSocket(`${WSDMPROTOCOL}://${WSDMSERVER}:${WSDMPORT}/${WSDMPATH}`);
      }
    } else {
      this._socket = net.connect(DMPORT, DMSERVER);
    }
    this.handleEvents();
  }

  disconnect() {
    clearTimeout(this._heartbeatService);
    this._checkErrorService.cancel();

    if (this.useWebsocket) {
      this._socket.close();
    } else {
      this._socket.end();
    }
    this._socket = null;
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  handleEvents() {
    let socket = this._socket;
    let events = this._socketEvents;
    if (this.useWebsocket) {
      events = this._websocketEvents;
    }

    socket.on(events.connect, () => {
      if (socket !== this._socket) return
      this.sendJoinRoom();
      this.emit('connect');
    });

    socket.on(events.data, (msg) => {
      if (socket !== this._socket) return
      this._checkErrorService();
      DMDecoder.decodeData(msg).map(m => {
        if (m.type === 'connected') {
          this.sendHeartbeat();
          this.emit(m.type, m);
        } else {
          if (m.type === 'gift' && this.useGiftBundle) {
            this.bundleGift(m);
          } else {
            this.emit('data', m);
            this.emit(m.type, m);
          }
        }
      });
    });

    socket.on(events.close, () => {
      if (socket !== this._socket) return
      this.emit('close');
    });

    socket.on(events.error, (err) => {
      if (socket !== this._socket) return
      this.emit('error', err);
      this.reconnect();
    });
  }

  sendJoinRoom() {
    if (this.useWebsocket) {
      this._socket.send(DMEncoder.encodeJoinRoom(this.roomId, this.userId));
    } else {
      this._socket.write(DMEncoder.encodeJoinRoom(this.roomId, this.userId));
    }
  }

  sendHeartbeat() {
    if (this.useWebsocket) {
      this._socket.send(DMEncoder.encodeHeartbeat());
    } else {
      this._socket.write(DMEncoder.encodeHeartbeat());
    }
    this._heartbeatService = setTimeout(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_DELAY);
  }

  bundleGift(msg) {
    let key = `${msg.user.id}.${msg.gift.id}`;

    if (this._giftBundleMap.has(key)) {
      let giftEvent = this._giftBundleMap.get(key);
      giftEvent.msg.gift.count = giftEvent.msg.gift.count*1 + msg.gift.count*1;
      giftEvent.event();
    } else {
      let giftEvent = {
        msg: _.merge({}, msg),
        event: _.debounce(() => {
          this.emit('data', giftEvent.msg);
          this.emit('gift', giftEvent.msg);
          this._giftBundleMap.delete(key);
        }, this.giftBundleDelay)
      };
      giftEvent.event();
      this._giftBundleMap.set(key, giftEvent);
    }
  }

}

function dispatchRequest(useHttps, options, postData) {
  let sender = http;
  if (useHttps) {
    sender = https;
  }
  return new Promise(function(resolve, reject) {
    let req = sender.request(options, (res) => {
      const statusCode = res.statusCode;
      if (statusCode !== 200) {
        reject(new Error(`Request failed with status code ${statusCode}`));
      }
      res.setEncoding('utf8');
      let rawData = '';
      res.on('error', (e) => reject(e));
      res.on('data', (chunk) => rawData += chunk);
      res.on('end', () => {
        resolve(rawData);
      });
    });
    req.on('error', (e) => {
      reject(e);
    });
    if (options.method === 'POST') {
      req.write(postData);
    }
    req.end();
  })
}

function get(requestUrl, config = {}) {
  let parsed = url.parse(requestUrl);
  let options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname,
    method: 'GET'
  };
  let params = qs.stringify(config.params);
  if (params) {
    options.path += '?' + params;
  }
  if (config.headers) {
    options.headers = config.headers;
  }
  if (parsed.protocol == 'https:') {
    return dispatchRequest(true, options)
  } else {
    return dispatchRequest(false, options)
  }

}

function post(requestUrl, config = {}) {
  let postData = typeof config.body == 'string'
    ? config.body
    : JSON.stringify(config.body || {});
  let parsed = url.parse(requestUrl);
  let options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.path,
    method: 'POST',
    headers: Object.assign({
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }, config.headers)
  };
  if (parsed.protocol == 'https:') {
    return dispatchRequest(true, options, postData)
  } else {
    return dispatchRequest(false, options, postData)
  }
}

// 获取直播间基本信息
function getRoomBaseInfo (roomUrl) {
  return this.get({
    uri: `room/v1/Room/room_init`,
    params: {
      id: roomUrl
    }
  }).then(res => {
    let data = JSON.parse(res).data;
    return {
      id: data['room_id'],
      shortId: data['short_id'],
      anchorId: data['uid']
    }
  })
}

// 获取直播间信息
function getRoomInfo () {
  return this.get({
    uri: `room/v1/Room/get_info`,
    params: {
      room_id: this.roomId,
      from: 'room'
    }
  }).then(res => {
    let data = JSON.parse(res).data;
    let room = {};
    room.title = data['title'];
    room.areaId = data['area_id'];
    room.cover = data['user_cover'];
    room.liveStatus = data['live_status'];
    room.liveStartTime = data['live_time'];
    room.anchor = {
      id: data['uid']
    };
    return room
  })
}

// 获取直播间礼物列表
function getRoomGiftList () {
  return this.get({
    uri: `gift/v2/live/room_gift_list`,
    params: {
      roomid: this.roomId
    }
  }).then(res => {
    let data = JSON.parse(res).data;
    return data
  })
}

// 获取直播间粉丝数
function getRoomFansCount (anchorId) {
  return this.get({
    uri: `feed/v1/feed/GetUserFc`,
    params: {
      follow: anchorId
    }
  }).then(res => {
    let data = JSON.parse(res).data;
    return data.fc
  })
}

// 获取直播间历史弹幕
function getRoomMessage () {
  return this.post({
    uri: 'ajax/msg',
    body: {
      roomid: this.roomId
    }
  }).then(res => {
    let data = JSON.parse(res);
    if (data.code == 0) {
      return data.data.room
    }
  })
}

// 获取直播间粉丝列表
function getAnchorFollwerList (anchorId, page = 1, pageSize = 20, order = 'desc') {
  return this.get({
    url: 'api.bilibili.com/x/relation/followers',
    params: {
      vmid: anchorId,
      pn: page,
      ps: pageSize,
      order
    }
  }).then(res => {
    let data = JSON.parse(res).data;
    return data.list.map(follower => {
      return {
        id: follower.mid,
        name: follower.uname
      }
    })
  })
}

// 获取直播间房管列表
function getRoomAdminList () {
  return this.post({
    uri: 'liveact/ajaxGetAdminList',
    body: {
      roomid: this.roomId
    }
  }).then(res => {
    let data = JSON.parse(res).data;
    return data.map(admin => {
      return {
        id: admin.id,
        ctime: admin.ctime,
        admin: {
          id: admin.userinfo.uid,
          name: admin.userinfo.uname
        }
      }
    })
  })
}

// 获取被禁言用户列表
function getRoomBlockList (page = 1) {
  return this.post({
    uri: 'liveact/ajaxGetBlockList',
    body: {
      roomid: this.roomId,
      page: page
    }
  }).then(res => {
    let data = JSON.parse(res).data;
    return data.map((item) => {
      return {
        id: item.id,
        user: {
          id: item.uid,
          name: item.uname
        },
        admin: {
          id: item.adminid,
          name: item.admin_uname
        },
        ctime: item.ctime,
        etime: item.block_end_time
      }
    })
  })
}


var basic = Object.freeze({
	getRoomBaseInfo: getRoomBaseInfo,
	getRoomInfo: getRoomInfo,
	getRoomGiftList: getRoomGiftList,
	getRoomFansCount: getRoomFansCount,
	getRoomMessage: getRoomMessage,
	getAnchorFollwerList: getAnchorFollwerList,
	getRoomAdminList: getRoomAdminList,
	getRoomBlockList: getRoomBlockList
});

let apis = Object.assign({}, basic);

// 检查cookie是否过期
function checkUserLogin () {
  return this.post({
    uri: 'User/getUserInfo'
  }).then(res => {
    let data = JSON.parse(res);
    if (data.code == 'REPONSE_OK') {
      return true
    }
    return false
  })
}

// 获取用户基本信息
function getUserInfo () {
  return this.post({
    uri: 'i/api/liveinfo'
  }).then(res => {
    let data;
    try {
      data = JSON.parse(res);
    } catch (e) {
      return false
    }
    if (data.code != 0) return false
    data = data.data;
    return {
      room: {
        id: data.roomid,
        level: data.master.level,
        current: data.master.current,
        next: data.master.next,
        san: data.san,
        liveTime: data.liveTime
      },
      user: {
        id: data.userInfo.uid,
        name: data.userInfo.uname,
        avatar: data.userInfo.face,
        archives: data.achieves,
        gold: data.userCoinIfo.gold,
        silver: data.userCoinIfo.silver,
        coins: data.userCoinIfo.coins,
        bcoins: data.userCoinIfo.bili_coins,
        vip: !!data.userCoinIfo.vip,
        svip: !!data.userCoinIfo.svip,
        level: data.userCoinIfo.user_level,
        levelRank: data.userCoinIfo.user_level_rank,
        current: data.userCoinIfo.user_intimacy,
        next: data.userCoinIfo.user_next_intimacy
      }
    }
  })
}


var basic$1 = Object.freeze({
	checkUserLogin: checkUserLogin,
	getUserInfo: getUserInfo
});

// 发送弹幕
function sendMessage (msg, color = 0xffffff, mode = 1) {
  return this.post({
    url: 'live.bilibili.com/msg/send',
    body: {
      color: Number(Number(color).toString(10)),
      mode,
      msg,
      rnd: Math.floor(new Date().getTime() / 1000),
      roomid: this.roomId
    }
  })
}

// 发送在线心跳
function sendHeartbeat () {
  return this.post({
    uri: 'User/userOnlineHeart',
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Host': 'api.live.bilibili.com',
      'Origin': 'http://live.bilibili.com',
      'Referer': 'http://live.bilibili.com/' + this.roomId,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
  })
}

// 发送在线礼物心跳
function sendEventHeartbeat () {
  return this.get({
    uri: 'eventRoom/heart',
    params: {
      roomid: this.roomId
    }
  })
}

// 每日签到
function dailySign () {
  return this.get({
    uri: 'sign/doSign'
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}


var audience = Object.freeze({
	sendMessage: sendMessage,
	sendHeartbeat: sendHeartbeat,
	sendEventHeartbeat: sendEventHeartbeat,
	dailySign: dailySign
});

// 切换直播间状态 1 -> 开启 0 -> 关闭
function toggleLiveRoom (status, area) {
  let body = {
    status,
    roomid: this.roomId
  };
  if (area) {
    body.area_v2 = area;
  }
  return this.post({
    uri: 'liveact/live_status_mng',
    body
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

// 获取直播分区列表
function getAreaList () {
  return this.get({
    uri: '/room/v1/Area/getList'
  }).then(res => {
    let data = JSON.parse(res).data;
    return data
  })
}

// 获取直播间推流码
function getRoomRTMP () {
  return this.post({
    uri: 'liveact/getrtmp',
    body: {
      roomid: this.roomId
    }
  }).then(res => {
    let data = JSON.parse(res);
    if (data.code < 0) return false
    data = data.data;
    return {
      address: data.addr,
      code: data.code
    }
  })
}

// 禁言用户
function blockUser (userId, hour) {
  return this.post({
    uri: 'liveact/room_block_user',
    body: {
      roomid: this.roomId,
      content: userId,
      type: 1,
      hour: hour
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

// 取消禁言
function deleteBlockUser (blockId) {
  return this.post({
    uri: 'liveact/del_room_block_user',
    body: {
      roomid: this.roomId,
      id: blockId
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

// 任命房管
function setAdmin (userId) {
  return this.post({
    uri: 'liveact/admin',
    body: {
      content: userId,
      roomid: this.roomId,
      type: 'add'
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

// 取消房管
function deleteAdmin (userId) {
  return this.post({
    uri: 'liveact/admin',
    body: {
      content: userId,
      roomid: this.roomId,
      type: 'del'
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}


var anchor = Object.freeze({
	toggleLiveRoom: toggleLiveRoom,
	getAreaList: getAreaList,
	getRoomRTMP: getRoomRTMP,
	blockUser: blockUser,
	deleteBlockUser: deleteBlockUser,
	setAdmin: setAdmin,
	deleteAdmin: deleteAdmin
});

// 参与小电视抽奖
function joinSmallTV (roomId, tvId) {
  return this.get({
    uri: 'gift/v2/smalltv/join',
    params: {
      roomid: roomId,
      raffleId: tvId
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

// 查看小电视抽奖奖励
function getSmallTVReward (roomId, tvId) {
  return this.get({
    uri: 'gift/v2/smalltv/notice',
    params: {
      roomid: roomId,
      raffleId: tvId
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

// 获取房间抽奖列表
function checkRaffle (roomId) {
  return this.get({
    uri: 'activity/v1/Raffle/check',
    params: {
      roomid: roomId
    },
    headers: {
      'Host': 'api.live.bilibili.com',
      'Origin': 'http://live.bilibili.com',
      'Referer': 'http://live.bilibili.com/' + roomId,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

// 参加房间抽奖
function joinRaffle (roomId, raffleId) {
  return this.get({
    uri: 'activity/v1/Raffle/join',
    params: {
      roomid: roomId,
      raffleId
    },
    headers: {
      'Host': 'api.live.bilibili.com',
      'Origin': 'http://live.bilibili.com',
      'Referer': 'http://live.bilibili.com/' + roomId,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

// 查看抽奖奖励
function getRaffleReward (roomId, raffleId) {
  return this.get({
    uri: 'activity/v1/Raffle/notice',
    params: {
      roomid: roomId,
      raffleId
    }
  }).then(res => {
    let data = JSON.parse(res);
    return data
  })
}

var activity = Object.freeze({
	joinSmallTV: joinSmallTV,
	getSmallTVReward: getSmallTVReward,
	checkRaffle: checkRaffle,
	joinRaffle: joinRaffle,
	getRaffleReward: getRaffleReward
});

let apis$1 = Object.assign({}, basic$1, audience, anchor, activity);

const BASE_URL = 'api.live.bilibili.com/';

class Api {
  constructor(config = {}) {
    this.protocol = config.useHttps ? 'https://' : 'http://';
    this.cookie = config.cookie || '';
    this.roomId = config.roomId || '23058';
  }

  useHttps(use) {
    this.protocol = use ? 'https://' : 'http://';
  }

  setCookie(cookie) {
    this.cookie = cookie;
  }

  setRoomId(roomId) {
    this.roomId = roomId;
  }

  get(options) {
    let url$$1 = this.protocol + (options.url ? options.url : BASE_URL + options.uri);
    let headers = {
      'Cookie': this.cookie
    };
    let config = {};
    if (!options.html) config.headers = Object.assign(headers, options.headers);
    if (options.params) config.params = options.params;
    return get(url$$1, config)
  }

  post(options) {
    let url$$1 = this.protocol + (options.url ? options.url : BASE_URL + options.uri);
    let headers = {
      'Cookie': this.cookie
    };
    if (!options.isJson) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    let config = {};
    config.headers = Object.assign(headers, options.headers);
    if (options.body) config.body = options.isJson ? options.body : qs.stringify(options.body);
    return post(url$$1, config)
  }

}

Object.assign(Api.prototype, apis, apis$1);

class FansService extends EventEmitter {
  constructor (config = {}) {
    super();

    this.userId = config.userId;
    this.updateDelay = config.updateDelay || 5e3;

    this._api = new Api();
    this._service = null;
    this._lastUpdate = new Date();
    this._fansSet = new Set();

    this._api.useHttps(config.useHttps);
  }

  connect () {
    this.fetchFans();
    this._service = setInterval(() => {
      this.fetchFans();
    }, this.updateDelay);
  }

  disconnect () {
    clearInterval(this._service);
  }

  reconnect () {
    this.disconnect();
    this.connect();
  }

  fetchFans () {
    let ts = new Date();
    this._api.getAnchorFollwerList(this.userId, 1, 50).then(res => {
      this.updateFansSet(res, ts);
    }).catch(err => {
      console.log(err);
    });
    this._api.getRoomFansCount(this.userId).then(res => {
      this.emit('fansCount', res);
    });
  }

  updateFansSet (fansList, ts) {
    if (ts < this._lastUpdate) return
    if (this._fansSet.size) {
      fansList.forEach(fans => {
        if (!this._fansSet.has(fans.id)) {
          this._fansSet.add(fans.id);
          this.emit('newFans', fans);
        }
      });
    } else {
      fansList.forEach(fans => {
        this._fansSet.add(fans.id);
      });
    }
    this._lastUpdate = ts;
  }
}

class InfoService extends EventEmitter {
  constructor (config = {}) {
    super();

    this.updateDelay = config.updateDelay || 5e3;

    this._api = new Api();
    this._service = null;
    this._lastUpdate = new Date();
    this._info = {};

    this._api.useHttps(config.useHttps);
    this._api.setRoomId(config.roomId);
  }

  connect () {
    this.fetchInfo();
    this._service = setInterval(() => {
      this.fetchInfo();
    }, this.updateDelay);
  }

  disconnect () {
    clearInterval(this._service);
  }

  reconnect () {
    this.disconnect();
    this.connect();
  }

  fetchInfo () {
    let ts = new Date();
    this._api.getRoomInfo().then(res => {
      if (ts < this._lastUpdate) return
      this._lastUpdate = ts;
      if (!_.isEqual(res, this._info)) {
        this._info = res;
        this.emit('info', this._info);
      }
    }).catch(err => {
      console.log(err);
    });
  }
}

class RoomService extends EventEmitter {
  constructor (config = {}) {
    super();

    this.roomURL = config.url || '23058';
    this.roomId = config.roomId || this.roomURL;
    this.config = config;

    this._api = new Api();
    this._danmakuService = null;
    this._fansService = null;
    this._infoService = null;
  }

  connect () {
    // 获取直播间原始房间号
    return this._api.getRoomBaseInfo(this.roomURL).then(info => {
      // 获取直播间基本信息
      this.roomId = info.id;
      this._api.setRoomId(info.id);
      return this._api.getRoomInfo()
    }).then(info => {
      this._danmakuService = new DanmakuService({
        roomId: this.roomId,
        useWebsocket: !!this.config.useWebsocket || true,
        useWSS: !!this.config.useHttps,
        useGiftBundle: !!this.config.useGiftBundle
      });

      this.handleDanmakuEvents();

      this._fansService = new FansService({
        userId: info.anchor.id,
        useHttps: !!this.config.useHttps
      });

      this.handleFansEvents();

      this._infoService = new InfoService({
        roomId: this.roomId,
        useHttps: !!this.config.useHttps
      });

      this.handleInfoEvents();

      this._danmakuService.connect();
      this._fansService.connect();
      this._infoService.connect();

      return this
    }).catch(err => {
      console.log(err);
    })
  }

  disconnect () {
    this._danmakuService.disconnect();
    this._fansService.disconnect();
    this._infoService.disconnect();

    this._danmakuService = null;
    this._fansService = null;
    this._infoService = null;
  }

  reconnect () {
    this.disconnect();
    this.connect();
  }

  setUseGiftBundle (use) {
    this._danmakuService.setUseGiftBundle(use);
  }

  handleDanmakuEvents () {
    this._danmakuService.on('connect', () => {
      this.emit('danmaku.connect');
    }).on('connected', () => {
      this.emit('danmaku.connected');
    }).on('data', (msg) => {
      this.emit('danmaku.message', msg);
    }).on('close', () => {
      this.emit('danmaku.close');
    }).on('error', () => {
      this.emit('danmaku.error');
    });
  }

  handleFansEvents () {
    this._fansService.on('newFans', (fans) => {
      let newFans = {
        type: 'newFans',
        user: fans,
        ts: new Date().getTime()
      };
      this.emit('newFans', newFans);
    });
    this._fansService.on('fansCount', (fansCount) => {
      this.emit('fansCount', fansCount);
    });
  }

  handleInfoEvents () {
    this._infoService.on('info', (info) => {
      let roomInfo = Object.assign({}, info, { ts: new Date().getTime() });
      this.emit('info', roomInfo);
    });
  }
}

const DANMAKU_COLOR = {
  'white': 0xffffff,
  'red': 0xff6868,
  'blue': 0x66ccff,
  'purple': 0xe33fff,
  'cyan': 0x00fffc,
  'green': 0x7eff00,
  'yellow': 0xffed4f,
  'orange': 0xff9800,
  'pink': 0xff739a
};

const DANMAKU_MODE = {
  'scroll': 1,
  'bottom': 4,
  'top': 5
};

const MESSAGE_SEND_DELAY = 1500;
const ONLINE_HEARTBEAT = 3e5;
const INFO_DELAY = 1e5;

class UserService extends EventEmitter {
  constructor(config = {}) {
    super();

    this.danmakuColor = config.danmakuColor || 'white';
    this.danmakuMode = config.danmakuMode || 'scroll';
    this.danmakuLimit = config.danmakuLimit || 20;

    this.info = {};
    this.room = {};
    this._useOnlineService = config.useOnlineService || false;
    this._useInfoService = config.useInfoService || false;
    this._sendService = null;
    this._sendQueue = [];
    this._onlineService = null;
    this._infoService = null;
    this._api = new Api();
    this.api = this._api;
    
    this._api.useHttps(config.useHttps || false);
    this._api.setCookie(config.cookie || '');
    this._api.setRoomId(config.roomId || '23058');
  }

  setRoomId(roomId) {
    this._api.setRoomId(roomId);
  }

  setUseHttps(use) {
    this._api.useHttps(use);
  }

  setCookie(cookie) {
    this._api.setCookie(cookie);
  }

  setDanmakuConfig(config) {
    this.danmakuMode = config.danmakuMode || this.danmakuMode;
    this.danmakuColor = config.danmakuColor || this.danmakuColor;
    this.danmakuLimit = config.danmakuLimit || this.danmakuLimit;
  }

  checkLogin() {
    return this._api.checkUserLogin()
  }

  getUserInfo() {
    this._api.getUserInfo().then(res => {
      if (res) {
        if (!_.isEqual(res.user, this.info)) {
          this.info = res.user;
          this.emit('info.user', this.info);
        }
        if (!_.isEqual(res.room, this.room)) {
          this.room = res.room;
          this.emit('info.room', this.room);
        }
      }
    });
  }

  connect() {
    return this.checkLogin().then(login => {
      if (!login) return false
      if (this._useOnlineService) {
        this.sendOnlineHeartbeat();
        this._onlineService = setInterval(() => {
          this.sendOnlineHeartbeat();
        }, ONLINE_HEARTBEAT);
      }
      if (this._useInfoService) {
        this.getUserInfo();
        this._infoService = setInterval(() => {
          this.getUserInfo();
        }, INFO_DELAY);
      }
      return this
    })
  }

  disconnect() {
    clearInterval(this._onlineService);
    clearInterval(this._infoService);
    clearTimeout(this._sendService);
    this._onlineService = null;
    this._infoService = null;
    this._sendService = null;
  }

  reconnect() {
    this.disconnect();
    return this.connect()
  }

  sendOnlineHeartbeat() {
    this._api.sendHeartbeat();
    this._api.sendEventHeartbeat();
    this.emit('heartbeat');
  }

  _sendMessage(message) {
    return this._api.sendMessage(message,
      Number(Number(DANMAKU_COLOR[this.danmakuColor]).toString(10)),
      DANMAKU_MODE[this.danmakuMode]).then(res => {
        let msg = JSON.parse(res);
        let success = false;
        if (msg.code == 0) {
          if (msg.msg) {
            this.emit('send.failed', message, msg.msg);
          } else {
            this.emit('send.success', message);
          }
        } else {
          this.emit('send.failed', message, msg.msg);
        }
      }, res => {
        this.emit('send.failed', message, '网络错误');
      })
  }

  _sendMessageService() {
    if (this._sendQueue.length) {
      this._sendMessage(this._sendQueue.shift()).then(res => {
        this._sendService = setTimeout(() => {
          this._sendMessageService();
        }, MESSAGE_SEND_DELAY);
      }, err => {
        this._sendService = setTimeout(() => {
          this._sendMessageService();
        }, MESSAGE_SEND_DELAY);
      });
    } else {
      this._sendService = null;
    }
  }

  sendMessage(message) {
    let msg = message + '';
    while (msg.length) {
      this._sendQueue.push(msg.slice(0, this.danmakuLimit));
      msg = msg.slice(this.danmakuLimit);
    }
    if (!this._sendService) this._sendMessageService();
  }

}

var index = {
  Room: RoomService,
  User: UserService,
  API: Api
};

module.exports = index;
