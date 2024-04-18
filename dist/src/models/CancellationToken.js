"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationTokenSource = exports.CancellationToken = void 0;
const isPromice_1 = require("../utils/isPromice");
class CancellationToken {
    constructor() {
        this._isCancellationRequested = false;
        this._onCancellationRequestedCallbacks = [];
    }
    get IsCancellationRequested() {
        return this._isCancellationRequested;
    }
    async Cancel() {
        this._isCancellationRequested = true;
        for (const callback of this._onCancellationRequestedCallbacks) {
            if ((0, isPromice_1.isPromice)(callback))
                await callback();
            else
                callback();
        }
    }
    Register(callback) {
        this._onCancellationRequestedCallbacks.push(callback);
    }
}
exports.CancellationToken = CancellationToken;
class CancellationTokenSource extends CancellationToken {
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
exports.CancellationTokenSource = CancellationTokenSource;
