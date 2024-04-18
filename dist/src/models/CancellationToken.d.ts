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