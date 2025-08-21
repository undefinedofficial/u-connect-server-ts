/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import {
  App,
  DISABLED,
  SHARED_COMPRESSOR,
  SSLApp,
  TemplatedApp,
} from "uWebSockets.js";
import { UserData } from "./interfaces";
import { DataType, Status } from "./enums";
import { ResponseError } from "./errors";
import { UConnectHub, UConnectHubOptions, UConnectHubSource } from "./Hub";
import { isPromice } from "./utils";
import {
  MethodType,
  ServerCallContextManager,
  Request,
  Response,
} from "./models";

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
      ? SSLApp({
          cert_file_name: ssl.cert,
          key_file_name: ssl.key,
          passphrase: ssl.passphrase,
        })
      : App();
  }

  /**
   * Creates a new hub endpoint. The hub is an instance for connecting to and interacting with it.
   */
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
    if (this.isRunning)
      throw new Error("Can't create hub when Server is already running");
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
      async upgrade(res, req, context) {
        const SecWebSocketKey = req.getHeader("sec-websocket-key");
        const SecWebSocketProtocol = req.getHeader("sec-websocket-protocol");
        const SecWebSocketVersion = req.getHeader("sec-websocket-version");
        // const origin = req.getHeader("origin");
        // console.log("upgrade", origin, SecWebSocketProtocol);

        if (SecWebSocketProtocol !== "u-connect-web") {
          res.writeStatus("423").end();
          return;
        }
        /* Keep track of abortions */
        const upgradeAborted = { aborted: false };
        /* User data storage for this connection */
        let userData = {};

        /* This immediately calls open handler, you must not use res after this call */
        const upgrade = () =>
          res.upgrade<UserData>(
            {
              contexts: new ServerCallContextManager(),
              ...userData,
            },
            SecWebSocketKey,
            SecWebSocketProtocol,
            SecWebSocketVersion,
            context
          );

        // default strategy.
        if (!onUpgrade) {
          upgrade();
          return;
        }

        const upgradeResult = onUpgrade(res, req);
        // sync strategy
        if (!isPromice(upgradeResult)) {
          userData = upgradeResult;

          if (userData === false) {
            res.end();
            return;
          }

          upgrade();
          return;
        }

        // async strategy
        res.onAborted(() => (upgradeAborted.aborted = true));
        userData = await upgradeResult;

        /* Handle aborts */
        if (upgradeAborted.aborted) return;

        /* Handle failures or aborts from onUpgrade */
        if (userData === false) {
          res.end();
          return;
        }

        /* Cork any async response including upgrade */
        res.cork(upgrade);
      },
      open(ws) {
        const userData = ws.getUserData();
        userData.islive = true;
        userData.contexts.SetWebSocket(ws);
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
          if (request.type === DataType.ABORT)
            return await contexts.Abort(request.id);

          const method = hub.GetMethod(request.method);

          if (!method)
            throw new ResponseError(
              request.id,
              request.method,
              Status.NOT_FOUND,
              "Service not found"
            );

          if (contexts.Has(request.id)) {
            if (
              request.type === DataType.STREAM_CLIENT &&
              (method.Type === MethodType.ClientStreaming ||
                method.Type === MethodType.DuplexStreaming)
            )
              return contexts.Get(request.id)!.Receive(request);

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

              contexts.Get(request.id)!.Finish();
              contexts.Delete(request.id);
              return;
            }

            throw new ResponseError(
              request.id,
              request.method,
              Status.ALREADY_EXISTS,
              `Request ${request.id} in processing`
            );
          }

          await method.Invoke(request, contexts.Create(request));

          // method finished successfully then delete context.
          if (!contexts.Delete(request.id))
            console.warn("context id not found", request.id);
        } catch (error) {
          const response = new Response(
            request.id,
            request.method,
            DataType.ABORT,
            null,
            Status.INTERNAL,
            null,
            "Internal server error"
          );

          let internalError = true;
          if (error instanceof ResponseError) {
            response.status = error.status;
            response.error = error.message;
            internalError = false;
          }

          // unknown origin bug, fix after throws exception `connection closed` in this line.
          if (ws.getUserData().islive)
            ws.send(Response.Serialize(response), true);

          // method finished with error then delete context.
          if (!contexts.Delete(request.id))
            console.warn("context id not found", request.id);

          // internal error? throw it up to caller.
          if (internalError) throw error;
        }
      },
      async close(ws, code, message) {
        const userData = ws.getUserData();
        userData.islive = false;
        userData.contexts.Close();

        onClose?.(ws, code, Buffer.from(message).toString("ascii"));
      },
    });

    return hub;
  }

  /**
   * Starts the server.
   */
  Run({ host = "0.0.0.0", port = 3000 }: UConnectRunOptions = {}) {
    if (this.isRunning) return;

    this.app.listen(host, port, (listenSocket) => {
      const protocol = this.isSSL ? "wss" : "ws";
      if (listenSocket) {
        console.log(`Listening on ${protocol}://${host}:${port}`);

        this.isRunning = true;
      } else {
        console.log(`Failed to listen on ${protocol}://${host}:${port}`);
      }
    });
  }
}
