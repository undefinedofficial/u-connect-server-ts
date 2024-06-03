/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { App, DISABLED, SHARED_COMPRESSOR, SSLApp, TemplatedApp } from "uWebSockets.js";
import { MethodType, ServerCallContextSource } from "./models";
import { UserData } from "./interfaces";
import { DataType, Status } from "./enums";
import { ResponseError } from "./errors";
import { Request } from "./models/Request";
import { Response } from "./models/Response";
import { UConnectHub, UConnectHubOptions, UConnectHubSource } from "./Hub";

export interface UConnectOptions {
  /**
   *  SSL options
   */
  ssl?: {
    key: string;
    cert: string;
    passphrase?: string;
  };
}

export interface UConnectRunOptions {
  /**
   *  Host to listen on. Defaults to 0.0.0.0.
   */
  host?: string;
  /**
   *  Port to listen on. Defaults to 3000.
   */
  port?: number;
}
export class UConnectServer {
  private isRunning: boolean;
  public readonly isSSL: boolean;
  public readonly app: TemplatedApp;

  constructor({ ssl }: UConnectOptions = {}) {
    this.isRunning = false;
    this.isSSL = ssl ? true : false;
    this.app = ssl
      ? SSLApp({ cert_file_name: ssl.cert, key_file_name: ssl.key, passphrase: ssl.passphrase })
      : App();
  }

  CreateHub({
    path,
    sendPingsAutomatically = true,
    compression = false,
    idleTimeout,
    maxBackpressure,
    maxLifetime,
    maxPayloadLength,
    onUpgrade,
    onClose,
  }: UConnectHubOptions): UConnectHub {
    if (this.isRunning) throw new Error("Can't create hub when Server is already running");
    const hub = new UConnectHubSource();
    this.app.ws<UserData>(path, {
      compression: compression ? SHARED_COMPRESSOR : DISABLED,
      idleTimeout,
      maxBackpressure,
      sendPingsAutomatically,
      maxPayloadLength,
      maxLifetime,

      /**
       * Upgrades the connection to WebSocket if the Origin header is present.
       */
      upgrade(res, req, context) {
        const SecWebSocketKey = req.getHeader("sec-websocket-key");
        const SecWebSocketProtocol = req.getHeader("sec-websocket-protocol");
        const SecWebSocketVersion = req.getHeader("sec-websocket-version");
        // const origin = req.getHeader("origin");
        // console.log("upgrade", origin, SecWebSocketProtocol);

        if (SecWebSocketProtocol !== "u-connect-web") {
          res.writeStatus("423").end();
          return;
        }

        let userData = {};
        if (onUpgrade) {
          userData = onUpgrade(res, req);
          if (userData === false) {
            res.end();
            return;
          }
        }

        res.upgrade<UserData>(
          {
            contexts: new Map(),
            ...userData,
          },
          SecWebSocketKey,
          SecWebSocketProtocol,
          SecWebSocketVersion,
          context
        );
      },
      open(ws) {
        ws.getUserData().islive = true;
      },
      async message(ws, message, isBinary) {
        if (!isBinary) return ws.end(1005, "Message is not binary");

        const { contexts } = ws.getUserData();
        let request: Request<unknown>;
        try {
          request = Request.Deserialize(message);
        } catch (error) {
          console.warn(error);
          return ws.end(1007, "Invalid message");
        }
        try {
          if (request.type === DataType.ABORT) {
            if (contexts.has(request.id)) {
              await contexts.get(request.id)!.Cancel();
              contexts.delete(request.id);
            }
            return;
          }

          const method = hub.GetMethod(request.method);

          if (!method)
            throw new ResponseError(
              request.id,
              request.method,
              Status.NOT_FOUND,
              "Service not found"
            );

          if (contexts.has(request.id)) {
            if (
              request.type === DataType.STREAM_CLIENT &&
              (method.Type === MethodType.ClientStreaming ||
                method.Type === MethodType.DuplexStreaming)
            ) {
              contexts.get(request.id)!.Receive(request);
              return;
            }
            if (request.type === DataType.STREAM_END) {
              if (
                method.Type !== MethodType.ClientStreaming &&
                method.Type !== MethodType.DuplexStreaming
              )
                throw new ResponseError(
                  request.id,
                  request.method,
                  Status.UNIMPLEMENTED,
                  `Method ${request.method} is not input stream`
                );

              contexts.get(request.id)!.Finish();
              contexts.delete(request.id);
              return;
            }

            throw new ResponseError(
              request.id,
              request.method,
              Status.ALREADY_EXISTS,
              `Request ${request.id} in processing`
            );
          }

          const context = new ServerCallContextSource(ws, request);
          contexts.set(request.id, context);
          await method.Invoke(request, context);
          contexts.delete(request.id);
        } catch (error) {
          contexts.delete(request.id);
          const response = new Response(
            request.id,
            request.method,
            DataType.ABORT,
            null,
            Status.INTERNAL,
            null,
            "Internal server error"
          );

          if (error instanceof ResponseError) {
            response.status = error.status;
            response.error = error.message;
            ws.send(Response.Serialize(response), true);

            console.error(error);
          } else {
            ws.send(Response.Serialize(response), true);
            throw error;
          }
        }
      },
      async close(ws, code, message) {
        console.log("Connection close", code, Buffer.from(message).toString("ascii"));

        const userData = ws.getUserData();
        userData.islive = false;
        for (const context of userData.contexts.values()) await context.Cancel();

        userData.contexts.clear();

        onClose?.(ws, code, Buffer.from(message).toString("ascii"));
      },
    });

    return hub;
  }

  Run({ host = "0.0.0.0", port = 3000 }: UConnectRunOptions = {}) {
    this.app.listen(host, port, (listenSocket) => {
      const protocol = this.isSSL ? "wss" : "ws";
      if (listenSocket) console.log(`Listening on ${protocol}://${host}:${port}`);
      else console.log(`Failed to listen on ${protocol}://${host}:${port}`);

      this.isRunning = true;
    });
  }
}
