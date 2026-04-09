// Транспортный слой для uWebSockets.js

import { App } from "uWebSockets.js";
import type {
  HttpResponse,
  HttpRequest,
  WebSocketBehavior,
  RecognizedString,
  TemplatedApp,
} from "uWebSockets.js";
import type { Dispatcher } from "../core/Dispatcher";
import type { IConnection, ITransport } from "../core/types";
import { randomUUID } from "crypto";

const SYMBOL_CONNECTION = "_conn_";

export interface uWebSocketsTransportOptions<T extends Record<string, any>>
  extends Omit<WebSocketBehavior<T>, "upgrade" | "message"> {
  upgrade?: (
    res: HttpResponse,
    req: HttpRequest
  ) => T | false | Promise<T | false>;
}

interface WSConnection extends IConnection {
  live: boolean;
  backpressurePromise?: Promise<void> | null;
  backpressureResolve?: (() => void) | null;
}

export class uWebSocketsTransport<T extends Record<string, any>>
  implements ITransport
{
  private dispatcher?: Dispatcher;

  constructor(
    private readonly _path: string,
    private readonly options: uWebSocketsTransportOptions<T> = {},
    private readonly app: TemplatedApp = App()
  ) {}

  public bindDispatcher(dispatcher: Dispatcher): void {
    this.dispatcher = dispatcher;

    // Настраиваем роут для WebSocket только тогда, когда диспетчер готов
    this.app.ws<T>(this._path, {
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
        /* Keep track of abortions */
        const upgradeAborted = { aborted: false };
        try {
          /* User data storage for this connection */
          let userData = {};

          /* This immediately calls open handler, you must not use res after this call */
          const upgrade = () =>
            res.upgrade(
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
            res.onAborted(() => (upgradeAborted.aborted = true));
            userData = await upgradeResult;

            if (upgradeAborted.aborted) return;
          } else {
            userData = upgradeResult;
          }

          if (userData === false) {
            res.close();
            return;
          }

          /* Cork any async response including upgrade */
          res.cork(upgrade);
        } catch (error) {
          if (!upgradeAborted.aborted) res.writeStatus("500").endWithoutBody();
          console.error(error);
        }
      },
      open: (ws: any) => {
        const conn: WSConnection = (ws[SYMBOL_CONNECTION] = {
          id: randomUUID(),
          live: true,
          getData: () => ws.getUserData(),
          close: (code?: number, shortMessage?: string) =>
            ws.end(code, shortMessage),
          send: async (
            payload: RecognizedString,
            binary: boolean,
            compress: boolean
          ) => {
            if (!conn.live) return false;

            if (conn.backpressurePromise) await conn.backpressurePromise;

            const status: number = ws.send(payload, binary, compress);

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
          },
        });
        this.options.open?.(ws);
      },
      drain: (ws: any) => {
        const conn = ws[SYMBOL_CONNECTION];
        if (conn.backpressureResolve) {
          conn.backpressureResolve();
          conn.backpressureResolve = null;
          conn.backpressurePromise!.finally(() => {
            conn.backpressurePromise = null;
          });
        }
      },
      message: (ws: any, message, isBinary) => {
        this.dispatcher!.dispatch(
          ws[SYMBOL_CONNECTION],
          message as unknown as Uint8Array<ArrayBuffer>,
          isBinary
        );
      },
      close: (ws: any, code, message) => {
        const conn: WSConnection = ws[SYMBOL_CONNECTION];
        conn.live = false;
        if (conn.backpressureResolve) {
          conn.backpressureResolve();
          conn.backpressureResolve = null;
          conn.backpressurePromise!.finally(() => {
            conn.backpressurePromise = null;
          });
        }

        this.dispatcher?.close(conn);
        this.options.close?.(ws, code, message);
      },
    });
  }

  public listen(port: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.dispatcher)
        return reject(new Error("Cannot listen without a bound dispatcher"));

      this.app.listen(port, (token) => {
        if (token) resolve();
        else reject(new Error("Failed to start listening on port " + port));
      });
    });
  }
}
