/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
export declare class CancellationToken {
    protected _isCancellationRequested: boolean;
    protected _onCancellationRequestedCallbacks: (() => void | Promise<void>)[];
    get IsCancellationRequested(): boolean;
    Register(callback: () => void): void;
}
export declare class CancellationTokenSource extends CancellationToken {
    constructor();
    get Token(): CancellationToken;
    Cancel(): Promise<void>;
}
//# sourceMappingURL=CancellationToken.d.ts.map