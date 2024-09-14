"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
const src_1 = require("../src");
const generate = (max, min = 0) => Math.floor(Math.random() * (max - min) + min);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class HelloService {
    SayHello(name, context) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Unary method call", name);
            let isAborted = false;
            context.CancellationToken.Register(() => {
                console.log("Unary method call aborted", name);
                isAborted = true;
            });
            const sleepMs = generate(5000, 1000);
            yield sleep(sleepMs);
            if (isAborted)
                return;
            /**
             * Example of throwing an error:
             *    throw new MethodError(Status.PERMISSION_DENIED, "Permission Denied");
             */
            return `Hello ${name} after ${sleepMs}ms`;
        });
    }
    SayHelloClientStream(requestStream, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = "";
            console.log("Client stream method call");
            let isAborted = false;
            context.CancellationToken.Register(() => {
                console.log("Client stream method call aborted");
                isAborted = true;
            });
            while (yield requestStream.MoveNext()) {
                result += requestStream.Current;
                console.log("Client stream method call requestStream.Current", requestStream.Current);
            }
            if (isAborted)
                return;
            console.log("end Client stream method call");
            return result;
        });
    }
    SayHelloServerStream(request, responseStream, context) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Server stream method call request", request);
            let isAborted = false;
            context.CancellationToken.Register(() => {
                console.log("Server stream method call aborted", request);
                isAborted = true;
            });
            for (let I = 0; I < 500000; I++) {
                yield responseStream.Write(request + " " + I);
                yield new Promise((resolve) => setTimeout(resolve, 10));
                if (isAborted)
                    return;
            }
            console.log("end Server stream method call");
        });
    }
    SayHelloDuplexStream(requestStream, responseStream, context) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Duplex method call");
            yield responseStream.Write(" Hello ");
            let isAborted = false;
            context.CancellationToken.Register(() => {
                console.log("Duplex stream method call aborted");
                isAborted = true;
            });
            while (yield requestStream.MoveNext()) {
                if (isAborted)
                    return;
                console.log("Duplex method requestStream.Current", requestStream.Current);
                yield responseStream.Write("Hello " + requestStream.Current);
            }
            console.log("end Duplex method call");
        });
    }
}
__decorate([
    (0, src_1.UnaryMethod)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, src_1.ServerCallContext]),
    __metadata("design:returntype", Promise)
], HelloService.prototype, "SayHello", null);
__decorate([
    (0, src_1.ClientStreamMethod)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, src_1.ServerCallContext]),
    __metadata("design:returntype", Promise)
], HelloService.prototype, "SayHelloClientStream", null);
__decorate([
    (0, src_1.ServerStreamMethod)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, src_1.ServerCallContext]),
    __metadata("design:returntype", Promise)
], HelloService.prototype, "SayHelloServerStream", null);
__decorate([
    (0, src_1.DuplexStreamMethod)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, src_1.ServerCallContext]),
    __metadata("design:returntype", Promise)
], HelloService.prototype, "SayHelloDuplexStream", null);
// Create the server instance.
const app = new src_1.UConnectServer({});
// Create the hub instance for connecting to and interacting with it.
const hub = app.CreateHub({
    path: "/api/ws",
});
// Add the service with default name "HelloService".
hub.AddService(HelloService);
// Add the service with name "Hello".
hub.AddService(HelloService, "Hello");
// Run the server. After this call a prohibited creating new the hubs, the server will be ready to accept connections.
app.Run({ host: "127.0.0.1", port: 3000 });
