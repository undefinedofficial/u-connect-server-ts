import { DataType } from "../enums";
export declare class Request<P> {
    readonly id: number;
    readonly method: string;
    readonly type: DataType;
    readonly request?: P | null | undefined;
    readonly meta?: Readonly<{
        [x: string]: string;
    }> | null | undefined;
    constructor(id: number, method: string, type: DataType, request?: P | null | undefined, meta?: Readonly<{
        [x: string]: string;
    }> | null | undefined);
    static Deserialize<T>(data: ArrayLike<number> | BufferSource): Request<T>;
}
//# sourceMappingURL=Request.d.ts.map