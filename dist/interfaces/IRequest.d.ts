import { DataType } from "../enums";
import { RequestMetadata } from "./Metadata";
export interface IRequest<P> {
    id: number;
    type: DataType;
    method: string;
    request?: P | null;
    meta?: RequestMetadata | null;
}
//# sourceMappingURL=IRequest.d.ts.map