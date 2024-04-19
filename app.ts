import {
  createUConnect,
  ServerCallContext,
  IClientStreamReader,
  IServerStreamWriter,
  UnaryMethod,
  ClientStreamMethod,
  ServerStreamMethod,
  DuplexStreamMethod,
} from "./src";

const generate = (max: number, min: number = 0) => Math.floor(Math.random() * (max - min) + min);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class HelloService {
  @UnaryMethod()
  public async SayHello(name: string, context: ServerCallContext): Promise<string | void> {
    console.log("Unary method call", name);
    let isAborted = false;
    context.CancellationToken.Register(() => {
      console.log("Unary method call aborted", name);
      isAborted = true;
    });
    const sleepMs = generate(5000, 1000);
    await sleep(sleepMs);
    if (isAborted) return;

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
      console.log("Client stream method call requestStream.Current", requestStream.Current);
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

const app = createUConnect({
  host: "127.0.0.1",
  port: 3000,
  path: "/api/ws",
});

app.AddService(HelloService);
app.AddService(HelloService, "Hello");

app.Run();
