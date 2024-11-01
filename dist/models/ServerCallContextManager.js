"use strict";
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
exports.ServerCallContextManager = void 0;
const ServerCallContext_1 = require("./ServerCallContext");
class ServerCallContextManager {
    constructor() {
        this._contexts = new Map();
    }
    SetWebSocket(ws) {
        this._ws = ws;
    }
    Has(id) {
        return this._contexts.has(id);
    }
    Get(id) {
        return this._contexts.get(id);
    }
    Create(request) {
        const context = new ServerCallContext_1.ServerCallContextSource(this._ws, request);
        this._contexts.set(request.id, context);
        return context;
    }
    /**
     * Abort request and remove context from list.
     */
    Abort(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this._contexts.get(id);
            if (context) {
                yield context.Cancel();
                this._contexts.delete(id);
            }
        });
    }
    /**
     * Remove context from list.
     */
    Delete(id) {
        return this._contexts.delete(id);
    }
    /**
     * Abort all requests and Remove all contexts from list.
     */
    Close() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const context of this._contexts.values())
                yield context.Cancel();
            this._contexts.clear();
        });
    }
}
exports.ServerCallContextManager = ServerCallContextManager;
