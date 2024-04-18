import { IRequest } from "./IRequest";
import { IResponse } from "./IResponse";
export interface ITransporter {
    serialize<P>(data: IResponse<P>): any;
    deserialize<P>(message: any): IRequest<P>;
}
//# sourceMappingURL=ITransporter.d.ts.map