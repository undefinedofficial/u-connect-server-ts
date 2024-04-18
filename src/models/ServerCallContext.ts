import { RecognizedString } from "uWebSockets.js";
import { DataType, Status, TransportOptions } from "../enums";
import {
  IClientStreamReader,
  IRequest,
  IResponse,
  IServerStreamWriter,
  ITransporter,
  IWebSocket,
  RequestMetadata,
  ResponseMetadata,
} from "../interfaces";
import { CancellationToken, CancellationTokenSource } from "./CancellationToken";
import { MessagePackTransporter } from "../middleware/MessagePackTransporter";

export abstract class ServerCallContext {
  constructor(
    id: number,
    method: string,
    cancellationTokenSource: CancellationTokenSource,
    requestMeta?: RequestMetadata | null,
    deadline?: number
  ) {
    this.Id = id;
    this.Method = method;
    this.Deadline = deadline;
    this.RequestMeta = requestMeta;
    this.CancellationToken = cancellationTokenSource.Token;
  }
  //   public get UserState() {}

  /**
   * Unique for the socket identifier of this task.
   */
  public readonly Id: number;

  /**
   * Full name of method called in this task.
   */
  public readonly Method: string;

  /**
   * Deadline for this task. The call will be automatically cancelled once the deadline is exceeded.
   */
  public readonly Deadline?: number;

  /**
   * Initial metadata sent by client.
   */
  public readonly RequestMeta?: RequestMetadata | null;

  /**
   * Cancellation token signals when call is cancelled. It is also triggered when the deadline is exceeded or there was some other error (e.g. network problem).
   */
  public CancellationToken: CancellationToken;

  /**
   * Trailers to send back to client after finishes.
   */
  public ResponseMeta?: ResponseMetadata | null;

  /**
   * Status to send back to client after finishes.
   */
  public Status = Status.OK;

  /**
   *  Disconnect the current client from the service and sever all ties with him
   */
  public abstract Kill(): Promise<void>;

  /**
   * Write Rules
   */
  //   public WriteOptions?: TransportOptions;
}

export class ClientStreamReader<T> implements IClientStreamReader<T> {
  private _buffer: T[] = [];
  private _current: T;
  private _finished: boolean = false;
  private _resolve: () => void;

  constructor(private readonly _context: ServerCallContextSource) {}

  private Continue() {
    /**
     * Send message to client continue stream.
     */
    this._context.Send({
      id: this._context.Id,
      method: this._context.Method,
      type: DataType.STREAM_CLIENT,
    });
  }

  get Current(): T {
    return this._current;
  }
  MoveNext(): Promise<boolean> {
    return new Promise((resolve) => {
      const next = () => {
        if (this._finished) return resolve(false);

        if (this._buffer.length > 0) {
          this._current = this._buffer.shift()!;
          return resolve(true);
        }

        this.Continue();
      };
      this._resolve = next;
      next();
    });
  }

  /**
   * Accept message and push to queue for processing.
   */
  Receive(message: T): void {
    this._buffer.push(message);
    this._resolve?.();
  }

  Finish(): void {
    this._finished = true;
    this._resolve();
  }
}

export class ServerStreamWriter<T> implements IServerStreamWriter<T> {
  constructor(private readonly _context: ServerCallContextSource) {}
  Write(message: T): Promise<void> {
    return this._context.Send<T>({
      id: this._context.Id,
      method: this._context.Method,
      type: DataType.STREAM_SERVER,
      response: message,
    });
  }
}

export class ServerCallContextSource extends ServerCallContext {
  /**
   * Creates a new instance of ServerCallContext on every request for controlling current call.
   *
   * @param {IWebSocket} webSocket - The web socket object.
   * @param {IRequest<any>} request - The request object.
   * @param {number} [deadline] - The deadline for the operation (optional).
   */
  constructor(webSocket: IWebSocket, request: IRequest<any>, deadline?: number) {
    const cancellationTokenSource = new CancellationTokenSource(deadline);
    super(request.id, request.method, cancellationTokenSource, request.meta, deadline);
    this._cancellationTokenCore = cancellationTokenSource;
    this._webSocketCore = webSocket;
  }

  /**
   * Returns the current instance of ServerCallContext.
   *
   * @return {ServerCallContext} The current instance of ServerCallContext.
   */
  get ServerCallContext(): ServerCallContext {
    return this;
  }

  /**
   * Cancels the asynchronous operation.
   *
   * @return {Promise<void>} A promise that resolves when the cancellation is complete.
   */
  async Cancel(): Promise<void> {
    this._clientStreamCore?.Finish();
    return this._cancellationTokenCore.Cancel();
  }

  _clientStreamCore?: ClientStreamReader<any>;

  /**
   * Receives a request and forwards it to the client stream if it exists.
   * @param {IRequest<T>} request - The request to be received.
   */
  Receive<T>(request: IRequest<T>) {
    this._clientStreamCore?.Receive(request.request);
  }
  /**
   * Creates a new instance of ClientStreamReader and returns it.
   *
   * @template T - The type of data that will be read from the client stream.
   * @returns {IClientStreamReader<T>} - The newly created client stream reader.
   */
  CreateClientStreamReader<T>(): IClientStreamReader<T> {
    if (!this._clientStreamCore) this._clientStreamCore = new ClientStreamReader<T>(this);
    return this._clientStreamCore;
  }

  /**
   * Creates a new instance of ServerStreamWriter and returns it.
   *
   * @template T - The type of data that will be written by the server stream writer.
   * @returns {IServerStreamWriter<T>} - The newly created server stream writer.
   */
  CreateServerStreamWriter<T>(): IServerStreamWriter<T> {
    return new ServerStreamWriter<T>(this);
  }

  /**
   * CancellationTokenSource for controlling current call cancellation.
   */
  private _cancellationTokenCore: CancellationTokenSource = new CancellationTokenSource();

  /**
   * The web socket connection.
   */
  private _webSocketCore: IWebSocket;

  /**
   * Kills all active tasks and close the connection.
   *
   * @return {Promise<void>} A promise that resolves when the process is killed.
   */
  public Kill(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._webSocketCore.getUserData().islive == false)
        return reject("Connection is not live");

      this._webSocketCore.close();
      resolve();
    });
  }

  /**
   * Sends the response based on the provided input.
   * @param {IResponse<T>} response - The response to be sent.
   * @return {Promise<void>} A promise that resolves when the response is sent.
   */
  Send<T>(response: IResponse<T>): Promise<void> {
    if (this._cancellationTokenCore.IsCancellationRequested) {
      console.log(`Cancelling call ${response.method} with id ${response.id}`);
      return Promise.resolve();
    }
    return ServerCallContextSource.Send(response, this._webSocketCore);
  }

  public static transporter: ITransporter = MessagePackTransporter;

  public static Send<T>(response: IResponse<T>, webSocket: IWebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      if (webSocket.getUserData().islive == false) return reject("Connection is not live");

      webSocket.send(ServerCallContextSource.transporter.serialize(response), true);
      resolve();
    });
  }
}
