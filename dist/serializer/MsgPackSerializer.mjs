import { pack, unpack } from 'msgpackr';

class MsgPackSerializer {
  serialize(data) {
    return pack(data);
  }
  deserialize(data) {
    return unpack(data);
  }
  binary = true;
}

export { MsgPackSerializer };
