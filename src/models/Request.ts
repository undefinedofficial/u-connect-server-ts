import { decode } from "@msgpack/msgpack";
import { DataType } from "../enums";
import { RequestMetadata } from "../interfaces/Metadata";

export class Request<P> {
  constructor(
    public readonly id: number,
    public readonly method: string,
    public readonly type: DataType,
    public readonly request?: P | null,
    public readonly meta?: RequestMetadata | null
  ) {}

  public static Deserialize<T>(data: ArrayLike<number> | BufferSource): Request<T> {
    const [id, method, type, request, meta] = decode(data) as any;
    return new Request(id, method, type, request, meta);
  }
}
