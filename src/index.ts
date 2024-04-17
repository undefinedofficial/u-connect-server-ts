import { App, DISABLED, HttpRequest, HttpResponse, SHARED_COMPRESSOR } from "uWebSockets.js";
import { Method, MethodType, ServerCallContextSource } from "./models";
import { UserData } from "./interfaces";
import { DataType, Status } from "./enums";
import { ResponseError } from "./errors/ResponseError";

export * from "./decorators";
export { ServerCallContext } from "./models";
export { IClientStreamReader, IServerStreamWriter } from "./interfaces";

export interface IServiceConstructor {
  new (...args: any[]): any;
}

interface UConnectOptions {
  /**
   *  Path to listen on. Defaults to /api/u-connect.
   */
  path?: string;

  /**
   *  Host to listen on. Defaults to 0.0.0.0.
   */
  host?: string;

  /**
   *  Port to listen on. Defaults to 3000.
   */
  port?: number;

  /**
   *  Maximum length of received message. If a client tries to send you a message larger than this, the connection is immediately closed. Defaults to 16 * 1024.
   */
  maxPayloadLength?: number;

  /**
   *  Maximum number of minutes a WebSocket may be connected before being closed by the server. 0 disables the feature.
   */
  maxLifetime?: number;

  /**
   *  Maximum amount of seconds that may pass without sending or getting a message. Connection is closed if this timeout passes. Resolution (granularity) for timeouts are typically 4 seconds, rounded to closest.
   * Disable by using 0. Defaults to 120.
   */
  idleTimeout?: number;

  /**
   *  Maximum length of allowed backpressure per socket when publishing or sending messages. Slow receivers with too high backpressure will be skipped until they catch up or timeout. Defaults to 64 * 1024.
   */
  maxBackpressure?: number;

  /**
   *  Whether or not we should automatically send pings to uphold a stable connection given whatever idleTimeout.
   */
  sendPingsAutomatically?: boolean;

  /**
   *  What permessage-deflate compression to use. uWS.DISABLED, uWS.SHARED_COMPRESSOR or any of the uWS.DEDICATED_COMPRESSOR_xxxKB. Defaults to uWS.DISABLED.
   */
  compression?: boolean;

  /**
   *  Upgrade handler used to intercept HTTP upgrade requests and potentially upgrade to WebSocket.
   */
  onUpgrade?: (res: HttpResponse, req: HttpRequest) => boolean;
}

export function createUConnect({
  host = "0.0.0.0",
  port = 3000,
  path = "/api/u-connect",
  sendPingsAutomatically = true,
  compression = false,
  idleTimeout,
  maxBackpressure,
  maxLifetime,
  maxPayloadLength,
  onUpgrade,
}: UConnectOptions = {}) {
  const methods = new Map<string, Method>();

  const app = App();

  app.ws<UserData>(path, {
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
      const origin = req.getHeader("origin");
      const SecWebSocketKey = req.getHeader("sec-websocket-key");
      const SecWebSocketProtocol = req.getHeader("sec-websocket-protocol");
      const SecWebSocketVersion = req.getHeader("sec-websocket-version");
      console.log("upgrade", origin, SecWebSocketProtocol);

      if (SecWebSocketProtocol !== "u-connect-web") {
        res.writeStatus("423").end();
        return;
      }

      if (onUpgrade?.(res, req) === false) {
        res.end();
        return;
      }

      res.upgrade<UserData>(
        {
          contexts: new Map(),
        },
        SecWebSocketKey,
        SecWebSocketProtocol,
        SecWebSocketVersion,
        context
      );
    },
    open(ws) {
      ws.getUserData().islive = true;
      console.log("Connection open");
    },
    async message(ws, message, isBinary) {
      try {
        if (!isBinary) throw new ResponseError(0, "", Status.INVALID_ARGUMENT, "Not binary");

        const request = ServerCallContextSource.transporter.deserialize(message);

        if (!methods.has(request.method)) {
          ws.send(
            ServerCallContextSource.transporter.serialize({
              id: request.id,
              type: request.type,
              method: request.method,
              status: Status.NOT_FOUND,
              error: "Service not found",
            }),
            true
          );
          return;
        }

        const { contexts } = ws.getUserData();
        switch (request.type) {
          case DataType.ABORT: {
            if (contexts.has(request.id)) {
              await contexts.get(request.id)!.Cancel();
              contexts.delete(request.id);
            }
            break;
          }

          case DataType.UNARY_CLIENT: {
            if (contexts.has(request.id)) break;

            const method = methods.get(request.method)!;
            if (method.Type !== MethodType.Unary)
              throw new ResponseError(
                request.id,
                request.method,
                Status.UNIMPLEMENTED,
                `Method ${request.method} is not unary`
              );

            const context = new ServerCallContextSource(ws, request);
            contexts.set(request.id, context);
            await method.Invoke(request, context);
            break;
          }

          case DataType.STREAM_CLIENT: {
            const method = methods.get(request.method)!;
            if (
              method.Type !== MethodType.ClientStreaming &&
              method.Type !== MethodType.DuplexStreaming
            ) {
              throw new ResponseError(
                request.id,
                request.method,
                Status.UNIMPLEMENTED,
                `Method ${request.method} is not input streaming`
              );
            }

            if (!contexts.has(request.id) && method.Type === MethodType.ClientStreaming) {
              const context = new ServerCallContextSource(ws, request);
              contexts.set(request.id, context);
              await method.Invoke(request, context);
              contexts.delete(request.id);
            } else {
              contexts.get(request.id)!.Receive(request);
            }
            break;
          }
          case DataType.STREAM_SERVER:
            {
              if (contexts.has(request.id))
                throw new ResponseError(
                  request.id,
                  request.method,
                  Status.UNAVAILABLE,
                  `Method ${request.method} is already streaming`
                );
              const method = methods.get(request.method)!;
              if (
                method.Type !== MethodType.ServerStreaming &&
                method.Type !== MethodType.DuplexStreaming
              )
                throw new ResponseError(
                  request.id,
                  request.method,
                  Status.UNIMPLEMENTED,
                  `Method ${request.method} is not output streaming`
                );

              const context = new ServerCallContextSource(ws, request);
              contexts.set(request.id, context);
              await method.Invoke(request, context);
            }
            break;

          case DataType.STREAM_DUPLEX: {
            if (contexts.has(request.id)) break;

            const method = methods.get(request.method)!;
            if (method.Type !== MethodType.DuplexStreaming)
              throw new ResponseError(
                request.id,
                request.method,
                Status.UNIMPLEMENTED,
                `Method ${request.method} is not duplex streaming`
              );
            const context = new ServerCallContextSource(ws, request);
            contexts.set(request.id, context);
            await method.Invoke(request, context);
            contexts.delete(request.id);
            break;
          }

          case DataType.STREAM_END: {
            if (!contexts.has(request.id)) break;

            const method = methods.get(request.method)!;
            if (
              method.Type !== MethodType.ClientStreaming &&
              method.Type !== MethodType.DuplexStreaming
            )
              throw new ResponseError(
                request.id,
                request.method,
                Status.UNIMPLEMENTED,
                `Method ${request.method} is not stream`
              );

            contexts.get(request.id)!._clientStreamCore?.Finish();
            contexts.delete(request.id);
            break;
          }

          default:
            throw new ResponseError(
              request.id,
              request.method,
              Status.UNIMPLEMENTED,
              "Not implemented"
            );
        }
      } catch (error) {
        if (error instanceof ResponseError) {
          ws.send(
            ServerCallContextSource.transporter.serialize({
              id: error.id,
              type: DataType.ABORT,
              method: error.method,
              status: error.status,
              error: error.message,
            }),
            true
          );
        } else {
          ws.send(
            ServerCallContextSource.transporter.serialize({
              id: 0,
              type: DataType.ABORT,
              method: "",
              status: Status.INTERNAL,
              error: "Internal server error",
            }),
            true
          );
          console.error("Internal Server Error", error);
        }
      }
    },
    async close(ws, code, message) {
      console.log("Connection close", code, Buffer.from(message).toString("ascii"));

      const userData = ws.getUserData();
      userData.islive = false;
      for (const context of userData.contexts.values()) await context.Cancel();

      userData.contexts.clear();
    },
  });

  function Run() {
    app.listen(host, port, (listenSocket) => {
      if (listenSocket) console.log(`Listening on ws://${host}:${port}${path}`);
      else console.log(`Failed to listen on port ws://${host}:${port}${path}`);
    });
  }

  function AddService<TService extends IServiceConstructor>(service: TService, name?: string) {
    if (methods.has(name || service.name))
      throw new Error(`Service ${name || service.name} already exists`);

    const localMethods = (service as any).prototype.Methods as Map<string, Method>;
    for (const [method, descriptor] of localMethods)
      methods.set(Method.FullName(name || service.name, method), descriptor);
  }

  return {
    Run,
    AddService,
  };
}
