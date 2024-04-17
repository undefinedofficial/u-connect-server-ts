import { decode, encode } from "@msgpack/msgpack";
import { ITransporter } from "../interfaces/ITransporter";

export const MessagePackTransporter: ITransporter = {
  serialize(data) {
    return encode([
      data.id,
      data.method,
      data.type,
      data.response ?? null,
      data.status ?? null,
      data.meta ?? null,
      data.error ?? null,
    ]);
  },
  deserialize(message) {
    const [id, method, type, request, meta] = decode(message) as any;
    return { id, method, type, request, meta };
  },
};
