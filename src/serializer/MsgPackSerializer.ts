import { unpack, pack } from "msgpackr";
import {
  ISerializer,
  type PackageID,
  type PackageType,
  type Status,
} from "../core/types.js";

export class MsgPackSerializer implements ISerializer<true> {
  serialize<T>(
    data: [
      id: PackageID,
      fullMethod: string,
      type: PackageType,
      payload: T,
      status?: Status,
      meta?: Readonly<{ [x: string]: string }> | null | undefined,
      error?: string | undefined
    ]
  ): Uint8Array<ArrayBuffer> {
    return pack(data) as Uint8Array<ArrayBuffer>;
  }
  deserialize<T>(
    data: Uint8Array<ArrayBuffer>
  ): [PackageID, string, PackageType, T, Readonly<{ [x: string]: string }>] {
    return unpack(data) as any;
  }
  readonly binary: true = true;
}
