import {
  CancellationTokenSource,
  type CancellationToken,
} from "./CancellationToken";
import type { ClientStreamReader } from "./stream";
import {
  type PackageID,
  type PackageType,
  type IConnection,
  type RequestMetadata,
  type ResponseMetadata,
  Status,
  type ISerializer,
} from "./types";

export abstract class ServerCallContext {
  constructor(
    id: PackageID,
    method: string,
    requestMeta?: RequestMetadata | null,
    deadline?: number
  ) {
    this.Id = id;
    this.Method = method;
    this.Deadline = deadline;
    this.RequestMeta = requestMeta;
    this.Status = Status.OK;
  }
  public abstract GetUserState<T>(): T;

  /**
   * Unique for the socket identifier of this task.
   */
  public readonly Id: PackageID;

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
  public abstract readonly CancellationToken: CancellationToken;

  /**
   * Trailers to send back to client after finishes.
   */
  public ResponseMeta?: ResponseMetadata | null;

  /**
   * Status to send back to client after finishes.
   */
  public Status: Status;

  /**
   *  Disconnect the current client from the service and sever all ties with him
   */
  public abstract Kill(): void;

  /**
   * Write Rules
   */
  //   public WriteOptions?: TransportOptions;
}

export class ServerCallContextSource extends ServerCallContext {
  /**
   * Creates a new instance of ServerCallContext on every request for controlling current call.
   *
   * @param {IWebSocket} webSocket - The web socket object.
   * @param {IRequest<any>} request - The request object.
   * @param {number} [deadline] - The deadline for the operation (optional).
   */
  constructor(
    connection: IConnection,
    serializer: ISerializer,
    id: PackageID,
    method: string,
    meta: RequestMetadata
  ) {
    let deadline;
    if (meta?.["timeout"]) deadline = parseInt(meta?.["timeout"]) || undefined;

    super(id, method, meta, deadline);

    this._connectionCore = connection;
    this._serializerCore = serializer;
    this._cancellationTokenCore = new CancellationTokenSource();

    if (deadline && deadline > 0)
      this._htimeout = setTimeout(() => this.Cancel(), deadline);
  }

  public GetUserState<T>(): T {
    return this._connectionCore.getData() as T;
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
    if (this._cancellationTokenCore.IsCancellationRequested) return;

    this._clientStreamCore?.Finish();

    if (this._htimeout) {
      clearTimeout(this._htimeout);
      this._htimeout = undefined;
    }

    return this._cancellationTokenCore.Cancel();
  }

  private _clientStreamCore?: ClientStreamReader<unknown>;

  /**
   * Return instance of ClientStreamReader.
   * @template T - The type of data that will be read from the client stream.
   */
  getClientStreamReader<T>() {
    return this._clientStreamCore as ClientStreamReader<T> | undefined;
  }
  /**
   * Save instance of ClientStreamReader.
   *
   * @template T - The type of data that will be read from the client stream.
   */
  setClientStreamReader<T>(stream: ClientStreamReader<T>) {
    this._clientStreamCore = stream;
  }

  private _htimeout?: NodeJS.Timeout;

  /**
   * CancellationTokenSource for controlling current call cancellation.
   */
  private readonly _cancellationTokenCore: CancellationTokenSource;

  public get CancellationToken(): CancellationToken {
    return this._cancellationTokenCore.Token;
  }

  /**
   * The connection.
   */
  private readonly _connectionCore: IConnection;

  private readonly _serializerCore: ISerializer;

  /**
   * Kills all active tasks and close the connection.
   *
   * @return {Promise<void>} A promise that resolves when the process is killed.
   */
  public Kill(): void {
    this._connectionCore.close();
  }

  /**
   * Sends the response based on the provided input.
   * @param {Response<T>} response - The response to be sent.
   * @return {Promise<boolean>} A promise that resolves to true if the response was sent successfully, or false if the operation was cancelled.
   */
  async Send<T>(type: PackageType, payload?: T): Promise<boolean> {
    if (this._cancellationTokenCore.IsCancellationRequested)
      return Promise.resolve(false);

    return this.RawSend([this.Id, this.Method, type, payload]);
  }

  /**
   * Sends the response based on the provided input.
   * @param {Response<T>} response - The response to be sent.
   * @return {Promise<boolean>} A promise that resolves to true if the response was sent successfully, or false if the operation was cancelled.
   */
  async SendEnd<T>(type: PackageType, payload?: T): Promise<boolean> {
    if (this._cancellationTokenCore.IsCancellationRequested)
      return Promise.resolve(false);

    if (this._htimeout) {
      clearTimeout(this._htimeout);
      this._htimeout = undefined;
    }
    return this.RawSend([
      this.Id,
      this.Method,
      type,
      payload,
      this.Status,
      this.ResponseMeta ?? null,
    ]);
  }

  async SendError(type: PackageType, error: string) {
    return this.RawSend([
      this.Id,
      this.Method,
      type,
      null,
      this.Status,
      this.ResponseMeta ?? null,
      error,
    ]);
  }

  private RawSend(data: Parameters<ISerializer["serialize"]>[0]) {
    return this._connectionCore.send(
      this._serializerCore.serialize(data),
      this._serializerCore.binary
    );
  }
}
