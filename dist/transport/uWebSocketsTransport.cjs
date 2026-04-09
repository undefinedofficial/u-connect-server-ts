'use strict';

var uWebSockets_js = require('uWebSockets.js');
var crypto = require('crypto');

const SYMBOL_CONNECTION = "_conn_";
class uWebSocketsTransport {
  constructor(_path, options = {}, app = uWebSockets_js.App()) {
    this._path = _path;
    this.options = options;
    this.app = app;
  }
  dispatcher;
  bindDispatcher(dispatcher) {
    this.dispatcher = dispatcher;
    this.app.ws(this._path, {
      idleTimeout: 32,
      maxPayloadLength: 1024 * 1024,
      ...this.options,
      upgrade: async (res, req, context) => {
        const SecWebSocketKey = req.getHeader("sec-websocket-key");
        const SecWebSocketProtocol = req.getHeader("sec-websocket-protocol");
        const SecWebSocketVersion = req.getHeader("sec-websocket-version");
        if (SecWebSocketProtocol !== "u-connect-web2") {
          res.writeStatus("423").end();
          return;
        }
        const upgradeAborted = { aborted: false };
        try {
          let userData = {};
          const upgrade = () => res.upgrade(
            { ...userData },
            SecWebSocketKey,
            SecWebSocketProtocol,
            SecWebSocketVersion,
            context
          );
          if (!this.options.upgrade) {
            upgrade();
            return;
          }
          const upgradeResult = this.options.upgrade(res, req);
          if (upgradeResult instanceof Promise) {
            res.onAborted(() => upgradeAborted.aborted = true);
            userData = await upgradeResult;
            if (upgradeAborted.aborted) return;
          } else {
            userData = upgradeResult;
          }
          if (userData === false) {
            res.close();
            return;
          }
          res.cork(upgrade);
        } catch (error) {
          if (!upgradeAborted.aborted) res.writeStatus("500").endWithoutBody();
          console.error(error);
        }
      },
      open: (ws) => {
        const conn = ws[SYMBOL_CONNECTION] = {
          id: crypto.randomUUID(),
          live: true,
          getData: () => ws.getUserData(),
          close: (code, shortMessage) => ws.end(code, shortMessage),
          send: async (payload, binary, compress) => {
            if (!conn.live) return false;
            if (conn.backpressurePromise) await conn.backpressurePromise;
            const status = ws.send(payload, binary, compress);
            if (status === 1) return true;
            if (status === 2) {
              ws.end(1011, "Stream integrity compromised due to backpressure");
              return false;
            }
            conn.backpressurePromise = new Promise((resolve) => {
              conn.backpressureResolve = resolve;
            });
            console.warn("backpressure", ws.getBufferedAmount());
            return true;
          }
        };
        this.options.open?.(ws);
      },
      drain: (ws) => {
        const conn = ws[SYMBOL_CONNECTION];
        if (conn.backpressureResolve) {
          conn.backpressureResolve();
          conn.backpressureResolve = null;
          conn.backpressurePromise.finally(() => {
            conn.backpressurePromise = null;
          });
        }
      },
      message: (ws, message, isBinary) => {
        this.dispatcher.dispatch(
          ws[SYMBOL_CONNECTION],
          message,
          isBinary
        );
      },
      close: (ws, code, message) => {
        const conn = ws[SYMBOL_CONNECTION];
        conn.live = false;
        if (conn.backpressureResolve) {
          conn.backpressureResolve();
          conn.backpressureResolve = null;
          conn.backpressurePromise.finally(() => {
            conn.backpressurePromise = null;
          });
        }
        this.dispatcher?.close(conn);
        this.options.close?.(ws, code, message);
      }
    });
  }
  listen(port) {
    return new Promise((resolve, reject) => {
      if (!this.dispatcher)
        return reject(new Error("Cannot listen without a bound dispatcher"));
      this.app.listen(port, (token) => {
        if (token) resolve();
        else reject(new Error("Failed to start listening on port " + port));
      });
    });
  }
}

exports.uWebSocketsTransport = uWebSocketsTransport;
