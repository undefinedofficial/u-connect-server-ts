"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UConnectServer = exports.UConnectHub = exports.MethodError = exports.Status = exports.CancellationToken = exports.ServerCallContext = void 0;
__exportStar(require("./decorators"), exports);
var models_1 = require("./models");
Object.defineProperty(exports, "ServerCallContext", { enumerable: true, get: function () { return models_1.ServerCallContext; } });
Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function () { return models_1.CancellationToken; } });
var enums_1 = require("./enums");
Object.defineProperty(exports, "Status", { enumerable: true, get: function () { return enums_1.Status; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "MethodError", { enumerable: true, get: function () { return errors_1.MethodError; } });
var Hub_1 = require("./Hub");
Object.defineProperty(exports, "UConnectHub", { enumerable: true, get: function () { return Hub_1.UConnectHub; } });
var Server_1 = require("./Server");
Object.defineProperty(exports, "UConnectServer", { enumerable: true, get: function () { return Server_1.UConnectServer; } });
__exportStar(require("uWebSockets.js"), exports);
