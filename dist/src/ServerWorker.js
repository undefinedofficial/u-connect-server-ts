"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var uWebSockets_js_1 = require("uWebSockets.js");
var worker_threads_1 = require("worker_threads");
require("ts-node").register();
require(path_1.default.resolve(__dirname, worker_threads_1.workerData.path));
/* Here we are inside a worker thread */
var app = /*SSL*/ (0, uWebSockets_js_1.App)({
    key_file_name: "misc/key.pem",
    cert_file_name: "misc/cert.pem",
    passphrase: "1234",
})
    .get("/*", function (res, req) {
    res.end("Hello Worker!");
})
    .listen(4000, function () { });
/* The worker sends back its descriptor to the main acceptor */
// @ts-ignore
worker_threads_1.parentPort.postMessage(app.getDescriptor());
worker_threads_1.parentPort.addListener("message", function (message) {
    if (message === "shutdown") {
        app.close();
    }
});
