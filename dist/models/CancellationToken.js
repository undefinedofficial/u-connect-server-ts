/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
import { isPromice } from "../utils/isPromice";
export class CancellationToken {
    _isCancellationRequested = false;
    _onCancellationRequestedCallbacks = [];
    get IsCancellationRequested() {
        return this._isCancellationRequested;
    }
    async Cancel() {
        this._isCancellationRequested = true;
        for (const callback of this._onCancellationRequestedCallbacks) {
            if (isPromice(callback))
                await callback();
            else
                callback();
        }
    }
    Register(callback) {
        this._onCancellationRequestedCallbacks.push(callback);
    }
}
export class CancellationTokenSource extends CancellationToken {
    constructor(deadline) {
        super();
        if (deadline)
            setTimeout(() => this.Cancel(), deadline);
    }
    get Token() {
        return this;
    }
    Cancel() {
        return super.Cancel();
    }
}
