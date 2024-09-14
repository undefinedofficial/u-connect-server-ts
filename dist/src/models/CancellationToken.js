"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    Cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            this._isCancellationRequested = true;
            for (const callback of this._onCancellationRequestedCallbacks) {
                if ((0, isPromice_1.isPromice)(callback))
                    yield callback();
                else
                    callback();
            }
        });
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
