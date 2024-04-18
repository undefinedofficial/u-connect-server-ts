"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("./src");
const generate = (max, min = 0) => Math.floor(Math.random() * (max - min) + min);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class HelloService {
    async SayHello(name, context) {
        console.log("Unary method call", name);
        let isAborted = false;
        context.CancellationToken.Register(() => {
            console.log("Unary method call aborted", name);
            isAborted = true;
        });
        const sleepMs = generate(5000, 1000);
        await sleep(sleepMs);
        if (isAborted)
            return;
        return `Hello ${name} after ${sleepMs}ms`;
    }
    async SayHelloClientStream(requestStream, context) {
        let result = "";
        console.log("Client stream method call");
        let isAborted = false;
        context.CancellationToken.Register(() => {
            console.log("Client stream method call aborted");
            isAborted = true;
        });
        while (await requestStream.MoveNext()) {
            result += requestStream.Current;
            console.log("Client stream method call requestStream.Current", requestStream.Current);
        }
        if (isAborted)
            return;
        console.log("end Client stream method call");
        return result;
    }
    async SayHelloServerStream(request, responseStream, context) {
        console.log("Server stream method call request", request);
        let isAborted = false;
        context.CancellationToken.Register(() => {
            console.log("Server stream method call aborted", request);
            isAborted = true;
        });
        for (let I = 0; I < 500000; I++) {
            await responseStream.Write(request + " " + I);
            await new Promise((resolve) => setTimeout(resolve, 10));
            if (isAborted)
                return;
        }
        console.log("end Server stream method call");
    }
    async SayHelloDuplexStream(requestStream, responseStream, context) {
        console.log("Duplex method call");
        let isAborted = false;
        context.CancellationToken.Register(() => {
            console.log("Duplex stream method call aborted");
            isAborted = true;
        });
        while (await requestStream.MoveNext()) {
            if (isAborted)
                return;
            console.log("Duplex method requestStream.Current", requestStream.Current);
            await responseStream.Write("Hello " + requestStream.Current);
        }
        console.log("end Duplex method call");
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
const app = (0, src_1.createUConnect)({
    host: "127.0.0.1",
    port: 3000,
    path: "/api/ws",
});
app.AddService(HelloService);
app.AddService(HelloService, "Hello");
app.Run();
