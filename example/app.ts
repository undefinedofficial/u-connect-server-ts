/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
// @ts-nocheck

import {
  type IClientStreamReader,
  type IServerStreamWriter,
  ServerCallContext,
  UnaryMethod,
  ClientStreamMethod,
  ServerStreamMethod,
  DuplexStreamMethod,
  Status,
  MethodError,
  UConnectServer,
  Service,
} from "../src";

const generate = (max: number, min: number = 0) =>
  Math.floor(Math.random() * (max - min) + min);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Service()
class HelloService {
  constructor(arg1: string, arg2: number) {
    console.log("Created HelloService", arg1, arg2);
  }

  @UnaryMethod()
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

    /**
     * Example of throwing an error:
     *    throw new MethodError(Status.PERMISSION_DENIED, "Permission Denied");
     */

    return `Hello ${name} after ${sleepMs}ms`;
  }

  @ClientStreamMethod()
  public async SayHelloClientStream(
    requestStream: IClientStreamReader<string>,
    context: ServerCallContext
  ) {
    let result = "";
    console.log("Client stream method call");

    let isAborted = false;
    context.CancellationToken.Register(() => {
      console.log("Client stream method call aborted");
      isAborted = true;
    });

    while (await requestStream.MoveNext()) {
      result += requestStream.Current;
      console.log(
        "Client stream method call requestStream.Current",
        requestStream.Current
      );
    }

    if (isAborted) return;

    console.log("end Client stream method call");
    return result;
  }

  @ServerStreamMethod()
  public async SayHelloServerStream(
    request: string,
    responseStream: IServerStreamWriter<string>,
    context: ServerCallContext
  ) {
    console.log("Server stream method call request", request);

    let isAborted = false;
    context.CancellationToken.Register(() => {
      console.log("Server stream method call aborted", request);
      isAborted = true;
    });

    for (let I = 0; I < 500000; I++) {
      await responseStream.Write(request + " " + I);
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (isAborted) return;
    }
    console.log("end Server stream method call");
  }

  @DuplexStreamMethod()
  public async SayHelloDuplexStream(
    requestStream: IClientStreamReader<string>,
    responseStream: IServerStreamWriter<string>,
    context: ServerCallContext
  ) {
    console.log("Duplex method call");

    await responseStream.Write(" Hello ");
    let isAborted = false;
    context.CancellationToken.Register(() => {
      console.log("Duplex stream method call aborted");
      isAborted = true;
    });

    while (await requestStream.MoveNext()) {
      if (isAborted) return;

      console.log("Duplex method requestStream.Current", requestStream.Current);
      await responseStream.Write("Hello " + requestStream.Current);
    }
    console.log("end Duplex method call");
  }
}

// Create the server instance.
const app = new UConnectServer({});

// Create the hub instance for connecting to and interacting with it.
const hub = app.CreateHub({
  path: "/api/ws",
});

// Add the service with default name "HelloService".
hub.AddService(HelloService, "Hello", 1234);

// Run the server. After this call a prohibited creating new the hubs, the server will be ready to accept connections.
app.Run({ host: "127.0.0.1", port: 3000 });
