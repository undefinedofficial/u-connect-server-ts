/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
export declare class CancellationToken {
    private _isCancellationRequested;
    private _onCancellationRequestedCallbacks;
    get IsCancellationRequested(): boolean;
    protected Cancel(): Promise<void>;
    Register(callback: () => void): void;
}
export declare class CancellationTokenSource extends CancellationToken {
    constructor(deadline?: number);
    get Token(): CancellationToken;
    Cancel(): Promise<void>;
}
//# sourceMappingURL=CancellationToken.d.ts.map