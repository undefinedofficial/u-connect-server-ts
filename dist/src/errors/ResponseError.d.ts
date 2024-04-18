import { Status } from "../enums";
export declare class ResponseError extends Error {
    id: number;
    method: string;
    status: Status;
    constructor(id: number, method: string, status: Status, message: string);
}
//# sourceMappingURL=ResponseError.d.ts.map