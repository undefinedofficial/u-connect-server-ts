/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import {
  // Service,
  ServerCallContext,
  UnaryMethod,
  ClientStreamMethod,
  ServerStreamMethod,
  DuplexStreamMethod,
  type IClientStreamReader,
  type IServerStreamWriter,
  Builder,
  Middleware,
  MethodError,
  Status,
  Transformer,
} from "../core";

import { MsgPackSerializer } from "../serializer/MsgPackSerializer";
import { uWebSocketsTransport } from "../transport/uWebSocketsTransport";

const generate = (max: number, min: number = 0) =>
  Math.floor(Math.random() * (max - min) + min);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// @Service()
@Middleware((ctx, next) => {
  console.log(`Service middleware`, ctx.Method);
  return next();
})
class HelloService {
  constructor(arg1: string, arg2: number) {
    console.log("Created HelloService", arg1, arg2);
  }

  @UnaryMethod()
  @Middleware((ctx, next) => {
    console.log(`Method middleware`, ctx.Method);
    return next();
  })
  @Transformer((data) => {
    console.log(data);

    return data + "unary";
  })
  public async SayHello(
    name: string,
    context: ServerCallContext
  ): Promise<string | void> {
    console.log("Unary method call", name);
    let isAborted = false;
    context.CancellationToken.Register(() => {
      console.log("Unary method call aborted", name);
      isAborted = true;
    });

    const sleepMs = generate(5000, 1000);
    await sleep(sleepMs);
    if (isAborted) return;

    context.ResponseMeta = context.RequestMeta;

    /**
     * Example of throwing an error:
     *    throw new MethodError(Status.PERMISSION_DENIED, "Permission Denied");
     */

    return `Hello ${name} after ${sleepMs}ms`;
  }

  @ClientStreamMethod()
  @Middleware((ctx, next) => {
    console.log(`Method middleware`, ctx.Method);
    return next();
  })
  @Transformer((data) => {
    console.log(data);

    throw new MethodError(Status.RESOURCE_EXHAUSTED, "This Error");
    return data + "client";
  })
  public async SayHelloClientStream(
    requestStream: IClientStreamReader<string>,
    context: ServerCallContext
  ) {
    let result = "";
    console.log("Client stream method call");

    context.CancellationToken.Register(() => {
      console.log("Client stream method call aborted");
    });

    while (await requestStream.MoveNext()) {
      result += requestStream.Current;
      console.log(
        "Client stream method call requestStream.Current",
        requestStream.Current
      );
    }

    context.ResponseMeta = context.RequestMeta;
    console.log("end Client stream method call");
    return result;
  }

  @ServerStreamMethod()
  @Middleware((ctx, next) => {
    console.log(`Method middleware`, ctx.Method);
    return next();
  })
  @Transformer((data) => {
    console.log(data);

    return data + "server";
  })
  public async SayHelloServerStream(
    request: string,
    responseStream: IServerStreamWriter<string>,
    context: ServerCallContext
  ) {
    console.log("Server stream method call request", request);

    context.ResponseMeta = context.RequestMeta;
    context.CancellationToken.Register(() => {
      console.log("Server stream method call aborted", request);
    });

    for (let I = 0; I < 500000; I++) {
      await responseStream.Write(request + " " + I);
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (context.CancellationToken.IsCancellationRequested) return;
    }
    console.log("end Server stream method call");
  }

  @DuplexStreamMethod()
  @Middleware((ctx, next) => {
    console.log(`Method middleware`, ctx.Method);
    return next();
  })
  @Transformer((data) => {
    console.log(data);

    return data + "duplex";
  })
  public async SayHelloDuplexStream(
    requestStream: IClientStreamReader<string>,
    responseStream: IServerStreamWriter<string>,
    context: ServerCallContext
  ) {
    console.log("Duplex method call");
    context.ResponseMeta = context.RequestMeta;

    await responseStream.Write(" Hello ");
    context.CancellationToken.Register(() => {
      console.log("Duplex stream method call aborted");
    });

    for await (const value of requestStream) {
      console.log("Duplex method requestStream.Current", value);
      await responseStream.Write("Hello " + requestStream.Current);
    }
    console.log("end Duplex method call");
  }
}

// // Create the server instance.
// const app = new UConnectServer({});

// // Create the hub instance for connecting to and interacting with it.
// const hub = app.CreateHub({
//   path: "/api/ws",
// });

// // Add the service with default name "HelloService".
// hub.AddService(HelloService, "Hello", 1234);

// // Run the server. After this call a prohibited creating new the hubs, the server will be ready to accept connections.
// app.Run({ host: "127.0.0.1", port: 3000 });

await new Builder()
  .withTransport(new uWebSocketsTransport("/api/ws"))
  .withSerializer(new MsgPackSerializer())
  .addService(HelloService, "", 1)
  .build()
  .listen(3000);

console.log("Listen port 3000");
