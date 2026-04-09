'use strict';

var msgpackr = require('msgpackr');

class MsgPackSerializer {
  serialize(data) {
    return msgpackr.pack(data);
  }
  deserialize(data) {
    return msgpackr.unpack(data);
  }
  binary = true;
}

exports.MsgPackSerializer = MsgPackSerializer;
