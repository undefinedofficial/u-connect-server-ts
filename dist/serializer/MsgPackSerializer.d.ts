import { a as ISerializer, P as PackageID, k as PackageType, e as Status } from '../types-DvKae193.js';

declare class MsgPackSerializer implements ISerializer<true> {
    serialize<T>(data: [
        id: PackageID,
        fullMethod: string,
        type: PackageType,
        payload: T,
        status?: Status,
        meta?: Readonly<{
            [x: string]: string;
        }> | null | undefined,
        error?: string | undefined
    ]): Uint8Array<ArrayBuffer>;
    deserialize<T>(data: Uint8Array<ArrayBuffer>): [PackageID, string, PackageType, T, Readonly<{
        [x: string]: string;
    }>];
    readonly binary: true;
}

export { MsgPackSerializer };
