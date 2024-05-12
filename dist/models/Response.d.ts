import { Status, DataType } from "../enums";
export declare class Response<P> {
    readonly id: number;
    readonly method: string;
    type: DataType;
    response?: P | null | undefined;
    status?: Status | null | undefined;
    meta?: {
        [x: string]: string;
    } | null | undefined;
    error?: string | null | undefined;
    /**
     *
     */
    constructor(id: number, method: string, type: DataType, response?: P | null | undefined, status?: Status | null | undefined, meta?: {
        [x: string]: string;
    } | null | undefined, error?: string | null | undefined);
    static Serialize<T>({ id, method, type, response, status, meta, error, }: Response<T>): Uint8Array;
}
//# sourceMappingURL=Response.d.ts.map