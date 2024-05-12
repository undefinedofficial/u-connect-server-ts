import {
  App,
  DISABLED,
  HttpRequest,
  HttpResponse,
  SHARED_COMPRESSOR,
  SSLApp,
} from "uWebSockets.js";
import { Method, MethodType, ServerCallContextSource } from "./models";
import { IWebSocket, UserData } from "./interfaces";
import { DataType, Status } from "./enums";
import { ResponseError } from "./errors";
import { Request } from "./models/Request";
import { Response } from "./models/Response";

interface IServiceConstructor {
  new (...args: any[]): any;
}

export interface UConnectOptions {
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
   *  What permessage-deflate compression to use.
   */
  compression?: boolean;

  /**
   *  Upgrade handler used to intercept HTTP upgrade requests and potentially upgrade to WebSocket.
   */
  onUpgrade?: (res: HttpResponse, req: HttpRequest) => false | Record<string, any>;

  /**
   *  Close handler used to intercept WebSocket close events.
   */
  onClose?: (ws: IWebSocket, code: number, message: string) => void;

  /**
   *  SSL options
   */
  ssl?: {
    key: string;
    cert: string;
    passphrase?: string;
  };
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
  onClose,
  ssl,
}: UConnectOptions = {}) {
  const methods = new Map<string, Method>();

  const app = ssl
    ? SSLApp({ cert_file_name: ssl.cert, key_file_name: ssl.key, passphrase: ssl.passphrase })
    : App();

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

        if (!methods.has(request.method))
          throw new ResponseError(
            request.id,
            request.method,
            Status.NOT_FOUND,
            "Service not found"
          );

        const method = methods.get(request.method)!;

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

  function Run() {
    app.listen(host, port, (listenSocket) => {
      const protocol = ssl ? "wss" : "ws";
      if (listenSocket) console.log(`Listening on ${protocol}://${host}:${port}${path}`);
      else console.log(`Failed to listen on ${protocol}://${host}:${port}${path}`);
    });
  }

  const services = new Map<string, IServiceConstructor>();
  function AddService<TService extends IServiceConstructor>(service: TService, name?: string) {
    if (methods.has(name || service.name))
      throw new Error(`Service ${name || service.name} already exists`);

    const localMethods = (service as any).prototype.Methods as Map<string, Method>;
    if (!localMethods) throw new Error(`Service ${name || service.name} has no Methods`);

    for (const [method, descriptor] of localMethods)
      methods.set(Method.FullName(name || service.name, method), descriptor);

    services.set(name || service.name, service);
  }

  function RemoveService(name: string) {
    if (!methods.has(name)) throw new Error(`Service ${name} doesn't exist`);

    const service = services.get(name)!;
    const localMethods = (service as any).prototype.Methods as Map<string, Method>;
    if (!localMethods) throw new Error(`Service ${name} has no Methods`);

    for (const [method, _] of localMethods) methods.delete(Method.FullName(name, method));
    services.delete(name);
  }
  return {
    Run,
    AddService,
    RemoveService,
  };
}