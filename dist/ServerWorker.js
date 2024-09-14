import path from "path";
import { App } from "uWebSockets.js";
import { parentPort, workerData } from "worker_threads";
require("ts-node").register();
require(path.resolve(__dirname, workerData.path));
/* Here we are inside a worker thread */
const app = /*SSL*/ App({
    key_file_name: "misc/key.pem",
    cert_file_name: "misc/cert.pem",
    passphrase: "1234",
})
    .get("/*", (res, req) => {
    res.end("Hello Worker!");
})
    .listen(4000, () => { });
/* The worker sends back its descriptor to the main acceptor */
// @ts-ignore
parentPort.postMessage(app.getDescriptor());
parentPort.addListener("message", (message) => {
    if (message === "shutdown") {
        app.close();
    }
});
