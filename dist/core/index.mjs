const RPC_METADATA = Symbol("rpc:metadata");
var MethodType = /* @__PURE__ */ ((MethodType2) => {
  MethodType2[MethodType2["Unary"] = 0] = "Unary";
  MethodType2[MethodType2["ClientStreaming"] = 1] = "ClientStreaming";
  MethodType2[MethodType2["ServerStreaming"] = 2] = "ServerStreaming";
  MethodType2[MethodType2["DuplexStreaming"] = 3] = "DuplexStreaming";
  return MethodType2;
})(MethodType || {});
var PackageType = /* @__PURE__ */ ((PackageType2) => {
  PackageType2[PackageType2["UNARY_CLIENT"] = 0 /* Unary */] = "UNARY_CLIENT";
  PackageType2[PackageType2["STREAM_CLIENT"] = 1 /* ClientStreaming */] = "STREAM_CLIENT";
  PackageType2[PackageType2["STREAM_SERVER"] = 2 /* ServerStreaming */] = "STREAM_SERVER";
  PackageType2[PackageType2["STREAM_DUPLEX"] = 3 /* DuplexStreaming */] = "STREAM_DUPLEX";
  PackageType2[PackageType2["STREAM_END"] = 4] = "STREAM_END";
  PackageType2[PackageType2["ABORT"] = 5] = "ABORT";
  PackageType2[PackageType2["STREAM_SUSPEND"] = 6] = "STREAM_SUSPEND";
  PackageType2[PackageType2["STREAM_RESUME"] = 7] = "STREAM_RESUME";
  return PackageType2;
})(PackageType || {});
var Status = /* @__PURE__ */ ((Status2) => {
  Status2[Status2["OK"] = 0] = "OK";
  Status2[Status2["CANCELLED"] = 1] = "CANCELLED";
  Status2[Status2["UNKNOWN"] = 2] = "UNKNOWN";
  Status2[Status2["INVALID_ARGUMENT"] = 3] = "INVALID_ARGUMENT";
  Status2[Status2["DEADLINE_EXCEEDED"] = 4] = "DEADLINE_EXCEEDED";
  Status2[Status2["NOT_FOUND"] = 5] = "NOT_FOUND";
  Status2[Status2["ALREADY_EXISTS"] = 6] = "ALREADY_EXISTS";
  Status2[Status2["PERMISSION_DENIED"] = 7] = "PERMISSION_DENIED";
  Status2[Status2["RESOURCE_EXHAUSTED"] = 8] = "RESOURCE_EXHAUSTED";
  Status2[Status2["FAILED_PRECONDITION"] = 9] = "FAILED_PRECONDITION";
  Status2[Status2["ABORTED"] = 10] = "ABORTED";
  Status2[Status2["OUT_OF_RANGE"] = 11] = "OUT_OF_RANGE";
  Status2[Status2["UNIMPLEMENTED"] = 12] = "UNIMPLEMENTED";
  Status2[Status2["INTERNAL"] = 13] = "INTERNAL";
  Status2[Status2["UNAVAILABLE"] = 14] = "UNAVAILABLE";
  Status2[Status2["DATA_LOSS"] = 15] = "DATA_LOSS";
  Status2[Status2["UNAUTHENTICATED"] = 16] = "UNAUTHENTICATED";
  return Status2;
})(Status || {});

class CancellationToken {
  _isCancelled = false;
  _callbacks = null;
  _promise = null;
  _resolve = null;
  get IsCancellationRequested() {
    return this._isCancelled;
  }
  /**
   * Register a callback (If token is already cancelled - execute immediately)
   */
  Register(callback) {
    if (this._isCancelled) {
      callback();
      return;
    }
    if (!this._callbacks) this._callbacks = /* @__PURE__ */ new Set();
    this._callbacks.add(callback);
  }
  Unregister(callback) {
    this._callbacks?.delete(callback);
  }
  get CancellationPromise() {
    if (this._isCancelled) return Promise.resolve();
    if (!this._promise) {
      this._promise = new Promise((resolve) => {
        this._resolve = resolve;
      });
    }
    return this._promise;
  }
}
class CancellationTokenSource extends CancellationToken {
  get Token() {
    return this;
  }
  async Cancel() {
    if (this._isCancelled) return;
    this._isCancelled = true;
    if (this._resolve) {
      this._resolve();
      this._resolve = null;
    }
    if (!this._callbacks) return;
    const tasks = [];
    for (const cb of this._callbacks) {
      try {
        const result = cb();
        if (result instanceof Promise) tasks.push(result);
      } catch (e) {
        console.error("CancellationToken callback error:", e);
      }
    }
    if (tasks.length > 0) await Promise.all(tasks);
    this._callbacks.clear();
    this._callbacks = null;
  }
}

class ServerCallContext {
  constructor(id, method, requestMeta, deadline) {
    this.Id = id;
    this.Method = method;
    this.Deadline = deadline;
    this.RequestMeta = requestMeta;
    this.Status = Status.OK;
  }
  /**
   * Unique for the socket identifier of this task.
   */
  Id;
  /**
   * Full name of method called in this task.
   */
  Method;
  /**
   * Deadline for this task. The call will be automatically cancelled once the deadline is exceeded.
   */
  Deadline;
  /**
   * Initial metadata sent by client.
   */
  RequestMeta;
  /**
   * Trailers to send back to client after finishes.
   */
  ResponseMeta;
  /**
   * Status to send back to client after finishes.
   */
  Status;
  /**
   * Write Rules
   */
  //   public WriteOptions?: TransportOptions;
}
class ServerCallContextSource extends ServerCallContext {
  /**
   * Creates a new instance of ServerCallContext on every request for controlling current call.
   *
   * @param {IWebSocket} webSocket - The web socket object.
   * @param {IRequest<any>} request - The request object.
   * @param {number} [deadline] - The deadline for the operation (optional).
   */
  constructor(connection, serializer, id, method, meta) {
    let deadline;
    if (meta?.["timeout"]) deadline = parseInt(meta?.["timeout"]) || void 0;
    super(id, method, meta, deadline);
    this._connectionCore = connection;
    this._serializerCore = serializer;
    this._cancellationTokenCore = new CancellationTokenSource();
    if (deadline && deadline > 0) this._htimeout = setTimeout(() => this.Cancel(), deadline);
  }
  GetUserState() {
    return this._connectionCore.getData();
  }
  /**
   * Returns the current instance of ServerCallContext.
   *
   * @return {ServerCallContext} The current instance of ServerCallContext.
   */
  get ServerCallContext() {
    return this;
  }
  /**
   * Cancels the asynchronous operation.
   *
   * @return {Promise<void>} A promise that resolves when the cancellation is complete.
   */
  async Cancel() {
    if (this._cancellationTokenCore.IsCancellationRequested) return;
    this._clientStreamCore?.Finish();
    if (this._htimeout) {
      clearTimeout(this._htimeout);
      this._htimeout = void 0;
    }
    return this._cancellationTokenCore.Cancel();
  }
  _clientStreamCore;
  /**
   * Return instance of ClientStreamReader.
   * @template T - The type of data that will be read from the client stream.
   */
  getClientStreamReader() {
    return this._clientStreamCore;
  }
  /**
   * Save instance of ClientStreamReader.
   *
   * @template T - The type of data that will be read from the client stream.
   */
  setClientStreamReader(stream) {
    this._clientStreamCore = stream;
  }
  _htimeout;
  /**
   * CancellationTokenSource for controlling current call cancellation.
   */
  _cancellationTokenCore;
  get CancellationToken() {
    return this._cancellationTokenCore.Token;
  }
  /**
   * The connection.
   */
  _connectionCore;
  _serializerCore;
  /**
   * Kills all active tasks and close the connection.
   *
   * @return {Promise<void>} A promise that resolves when the process is killed.
   */
  Kill() {
    this._connectionCore.close();
  }
  /**
   * Sends the response based on the provided input.
   * @param {Response<T>} response - The response to be sent.
   * @return {Promise<boolean>} A promise that resolves to true if the response was sent successfully, or false if the operation was cancelled.
   */
  async Send(type, payload) {
    if (this._cancellationTokenCore.IsCancellationRequested) return Promise.resolve(false);
    return this.RawSend([this.Id, this.Method, type, payload ?? null]);
  }
  /**
   * Sends the response based on the provided input.
   * @param {Response<T>} response - The response to be sent.
   * @return {Promise<boolean>} A promise that resolves to true if the response was sent successfully, or false if the operation was cancelled.
   */
  async SendEnd(type, payload) {
    if (this._cancellationTokenCore.IsCancellationRequested) return Promise.resolve(false);
    if (this._htimeout) {
      clearTimeout(this._htimeout);
      this._htimeout = void 0;
    }
    return this.RawSend([this.Id, this.Method, type, payload ?? null, this.Status, this.ResponseMeta ?? null]);
  }
  async SendError(type, error) {
    return this.RawSend([this.Id, this.Method, type, null, this.Status, this.ResponseMeta ?? null, error]);
  }
  RawSend(data) {
    return this._connectionCore.send(this._serializerCore.serialize(data), this._serializerCore.binary);
  }
}

class Dispatcher {
  constructor(_registry, _serializer) {
    this._registry = _registry;
    this._serializer = _serializer;
    this._contexts = /* @__PURE__ */ new Map();
  }
  _contexts;
  async dispatch(connection, rawMessage, isBinary) {
    if (isBinary !== this._serializer.binary)
      return connection.close(1005, "Message is not binary");
    const [id, methodName, type, payload, metadata] = this._serializer.deserialize(rawMessage);
    const callId = id;
    const contextId = connection.id;
    if (type < 0 || type > 6)
      return connection.close(1005, "Message is not binary");
    if (type === PackageType.ABORT) {
      this._contexts.get(contextId)?.get(callId)?.Cancel();
      this._contexts.get(contextId)?.get(callId);
      return;
    }
    const method = this._registry.get(methodName);
    if (!method) {
      return this.sendError(
        connection,
        callId,
        methodName,
        Status.NOT_FOUND,
        "Service or Method not found"
      );
    }
    let connector = this._contexts.get(contextId);
    if (connector?.has(callId)) {
      if (method.Type !== MethodType.ClientStreaming && method.Type !== MethodType.DuplexStreaming) {
        return this.sendError(
          connection,
          callId,
          methodName,
          Status.UNIMPLEMENTED,
          `Method ${methodName} is not input stream`
        );
      }
      const reader = connector.get(callId)?.getClientStreamReader();
      if (!reader) return;
      return type === PackageType.STREAM_CLIENT ? reader.Receive(payload) : reader.Finish();
    }
    if (method.Type !== type)
      return this.sendError(
        connection,
        callId,
        methodName,
        Status.UNIMPLEMENTED,
        `Method ${methodName} is not supported for this request type : ${method.Type}, ${type}`
      );
    if (!this._contexts.has(contextId)) {
      connector = /* @__PURE__ */ new Map();
      this._contexts.set(contextId, connector);
    }
    const context = new ServerCallContextSource(
      connection,
      this._serializer,
      callId,
      methodName,
      metadata
    );
    connector.set(callId, context);
    method.Invoke(payload, context).finally(
      () => connector?.delete(callId)
      // Авто-очистка по завершении
    );
  }
  async close(connection) {
    if (!this._contexts.has(connection.id)) return;
    const ctxsForConn = this._contexts.get(connection.id);
    await Promise.all(
      Array.from(ctxsForConn.values()).map(async (ctx) => ctx.Cancel())
    );
    ctxsForConn.clear();
    this._contexts.delete(connection.id);
  }
  async sendError(connection, id, method, status, error) {
    await connection.send(
      this._serializer.serialize([
        id,
        method,
        PackageType.ABORT,
        null,
        status,
        null,
        error
      ]),
      this._serializer.binary
    );
  }
}

class MethodError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "MethodError";
  }
}

class ClientStreamReader {
  constructor(_context, _transformer, _bufferLimit = 16) {
    this._context = _context;
    this._transformer = _transformer;
    this._bufferLimit = _bufferLimit;
  }
  _buffer = [];
  _current;
  _finished = false;
  _nextPromise = null;
  _isSuspended = false;
  get Current() {
    return this._current;
  }
  async setCurrent(data) {
    if (this._transformer) {
      data = this._transformer(data);
      if (data instanceof Promise) data = await data;
    }
    this._current = data;
  }
  updateFlowControl() {
    const isFull = this._buffer.length >= this._bufferLimit;
    if (isFull && !this._isSuspended) {
      this._isSuspended = true;
      this._context.Send(PackageType.STREAM_SUSPEND);
    } else if (!isFull && this._isSuspended) {
      this._isSuspended = false;
      this._context.Send(PackageType.STREAM_RESUME);
    }
  }
  async MoveNext() {
    if (this._buffer.length > 0) {
      await this.setCurrent(this._buffer.shift());
      this.updateFlowControl();
      return true;
    }
    if (this._finished) return false;
    const arrived = await new Promise((resolve) => {
      this._nextPromise = { resolve };
    });
    if (arrived && this._buffer.length > 0) {
      await this.setCurrent(this._buffer.shift());
      this.updateFlowControl();
      return true;
    }
    return false;
  }
  Receive(message) {
    if (this._finished) return;
    if (this._buffer.length >= this._bufferLimit) {
      if (!this._isSuspended) this.updateFlowControl();
      return;
    }
    this._buffer.push(message);
    this.updateFlowControl();
    if (this._nextPromise) {
      const res = this._nextPromise.resolve;
      this._nextPromise = null;
      res(true);
    }
  }
  Finish() {
    this._finished = true;
    if (this._nextPromise) {
      const res = this._nextPromise.resolve;
      this._nextPromise = null;
      res(false);
    }
  }
  [Symbol.asyncIterator]() {
    return {
      next: async () => await this.MoveNext() ? { done: false, value: this.Current } : { done: true, value: void 0 }
    };
  }
}
class ServerStreamWriter {
  constructor(_context) {
    this._context = _context;
  }
  Write(message) {
    return this._context.Send(PackageType.STREAM_SERVER, message);
  }
}

class Method {
  /**
   * Gets the type of the method.
   */
  Type;
  /**
   * Gets the name of the service to which this method belongs.
   */
  ServiceName;
  /**
   *  Gets the unqualified name of the method.
   */
  Name;
  /**
   * Gets the fully qualified name of the method. On the server side, methods are dispatched
   * based on this name.
   */
  get FullName() {
    return Method.FullName(this.ServiceName, this.Name);
  }
  constructor(type, serviceName, name) {
    this.Type = type;
    this.ServiceName = serviceName;
    this.Name = name;
  }
  async HandleError(error, type, context) {
    await context.Cancel();
    if (error instanceof MethodError) {
      const { status, message } = error;
      context.Status = status;
      context.SendError(type, message);
      return;
    }
    context.Status = Status.INTERNAL;
    context.SendError(type, "Internal Server Error");
    throw error;
  }
  /**
   * Gets the fully qualified name of the method.
   * @param serviceName - The name of the service.
   * @param name - The name of the method.
   */
  static FullName(serviceName, name) {
    return serviceName + "." + name;
  }
}
let UnaryMethod$1 = class UnaryMethod extends Method {
  constructor(serviceName, name, handler, transformer) {
    super(MethodType.Unary, serviceName, name);
    this.handler = handler;
    this.transformer = transformer;
  }
  /**
   * Invoke handler for the method.
   */
  async Invoke(request, context) {
    try {
      if (this.transformer) {
        request = this.transformer(request);
        if (request instanceof Promise) request = await request;
      }
      const response = await this.handler(request, context);
      await context.SendEnd(PackageType.UNARY_CLIENT, response ?? null);
    } catch (error) {
      await this.HandleError(error, PackageType.UNARY_CLIENT, context);
    }
  }
};
class ClientStreamingMethod extends Method {
  constructor(serviceName, name, handler, transformer) {
    super(MethodType.ClientStreaming, serviceName, name);
    this.handler = handler;
    this.transformer = transformer;
  }
  /**
   * Invoke handler for the method.
   */
  async Invoke(_, context) {
    try {
      const requestStream = new ClientStreamReader(
        context,
        this.transformer
      );
      context.setClientStreamReader(requestStream);
      const response = await this.handler(requestStream, context);
      await context.SendEnd(PackageType.STREAM_END, response ?? null);
    } catch (error) {
      await this.HandleError(error, PackageType.STREAM_END, context);
    }
  }
}
class ServerStreamingMethod extends Method {
  constructor(serviceName, name, handler, transformer) {
    super(MethodType.ServerStreaming, serviceName, name);
    this.handler = handler;
    this.transformer = transformer;
  }
  /**
   * Invoke handler for the method.
   */
  async Invoke(request, context) {
    try {
      if (this.transformer) {
        request = this.transformer(request);
        if (request instanceof Promise) request = await request;
      }
      const responseStream = new ServerStreamWriter(context);
      await this.handler(request, responseStream, context);
      await context.SendEnd(PackageType.STREAM_END);
    } catch (error) {
      await this.HandleError(error, PackageType.STREAM_END, context);
    }
  }
}
class DuplexStreamingMethod extends Method {
  constructor(serviceName, name, handler, transformer) {
    super(MethodType.DuplexStreaming, serviceName, name);
    this.handler = handler;
    this.transformer = transformer;
  }
  /**
   * Invoke handler for the method.
   *  @param request - The request object.
   */
  async Invoke(_, context) {
    try {
      const requestStream = new ClientStreamReader(
        context,
        this.transformer
      );
      context.setClientStreamReader(requestStream);
      const responseStream = new ServerStreamWriter(context);
      await this.handler(requestStream, responseStream, context);
      await context.SendEnd(PackageType.STREAM_END);
    } catch (error) {
      await this.HandleError(error, PackageType.STREAM_END, context);
    }
  }
}

class Processor {
  configureMethods(registry, hubClass, args) {
    const metadata = hubClass.prototype[RPC_METADATA];
    const className = metadata.name || hubClass.name;
    if (!metadata) return;
    const classMiddlewares = metadata.middlewares ?? [];
    for (const [methodName, methodMeta] of metadata.methods) {
      const methodType = methodMeta.type;
      const callName = methodMeta.name;
      if (methodType === void 0 || !callName)
        throw new Error(
          `Middleware can only be applied to RPC methods. Method '${className}.${String(
            methodName
          )}' is not registered as an RPC method. Make sure to declare it with a method decorator like @UnaryMethod, @ClientStreamMethod, @ServerStreamMethod or @DuplexStreamMethod.`
        );
      const isStreamingOut = methodMeta.type === MethodType.ServerStreaming || methodMeta.type === MethodType.DuplexStreaming;
      const methodMiddlewares = methodMeta.middlewares ?? [];
      const fullChain = [...classMiddlewares, ...methodMiddlewares];
      const pipeline = this.wrapHandler(methodName, fullChain, isStreamingOut);
      const finalHandler = async (req, resOrCtx, ctx) => {
        const instance = Reflect.construct(hubClass, args);
        return pipeline(instance, req, resOrCtx, ctx);
      };
      const methodInstance = this.createMethodInstance(
        methodType,
        className,
        callName,
        finalHandler,
        methodMeta.transformer
      );
      registry.add(methodInstance);
    }
  }
  wrapHandler(methodName, middlewares, isStreamingOut = false) {
    const mwCount = middlewares.length;
    if (mwCount === 0)
      return (instance, req, resOrCtx, context) => instance[methodName](req, resOrCtx, context);
    return async function(instance, req, resOrCtx, ctx) {
      const context = isStreamingOut ? ctx : resOrCtx;
      const dispatch = async (i) => {
        const fn = middlewares[i];
        if (i === mwCount) return instance[methodName](req, resOrCtx, context);
        return fn(context, () => dispatch(i + 1));
      };
      return dispatch(0);
    };
  }
  createMethodInstance(type, serviceName, methodName, pipeline, transformer) {
    switch (type) {
      case MethodType.Unary:
        return new UnaryMethod$1(serviceName, methodName, pipeline, transformer);
      case MethodType.ClientStreaming:
        return new ClientStreamingMethod(
          serviceName,
          methodName,
          pipeline,
          transformer
        );
      case MethodType.ServerStreaming:
        return new ServerStreamingMethod(
          serviceName,
          methodName,
          pipeline,
          transformer
        );
      case MethodType.DuplexStreaming:
        return new DuplexStreamingMethod(
          serviceName,
          methodName,
          pipeline,
          transformer
        );
      default:
        throw new Error(
          `Unsupported method type: ${type} for ${serviceName}.${methodName}`
        );
    }
  }
}

class MethodRegistry {
  methods = /* @__PURE__ */ new Map();
  get(fullName) {
    return this.methods.get(fullName);
  }
  add(method) {
    this.methods.set(method.FullName, method);
  }
}

class Builder {
  _transport;
  _serializer;
  _processor;
  _registry;
  constructor() {
    this._processor = new Processor();
    this._registry = new MethodRegistry();
  }
  withTransport(transport) {
    this._transport = transport;
    return this;
  }
  withSerializer(serializer) {
    this._serializer = serializer;
    return this;
  }
  addService(service, ...args) {
    this._processor.configureMethods(this._registry, service, args);
    return this;
  }
  build() {
    if (!this._transport) throw new Error("Transport is not configured");
    if (!this._serializer) throw new Error("Serializer is not configured");
    const dispatcher = new Dispatcher(this._registry, this._serializer);
    this._transport.bindDispatcher(dispatcher);
    const transport = this._transport;
    return {
      listen: (port, callback) => transport.listen(port, callback)
    };
  }
}

function getOrCreateMetadata(target) {
  const prototype = typeof target === "function" ? target.prototype : target;
  if (!Object.prototype.hasOwnProperty.call(prototype, RPC_METADATA)) {
    Object.defineProperty(prototype, RPC_METADATA, {
      value: { methods: /* @__PURE__ */ new Map() },
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  return prototype[RPC_METADATA];
}
function createMethodDecorator(type, customName) {
  return function(target, propertyKey, descriptor) {
    const metadata = getOrCreateMetadata(target);
    const methodMetadata = metadata.methods.get(propertyKey) ?? {};
    methodMetadata.type = type;
    methodMetadata.name = customName ?? String(propertyKey);
    metadata.methods.set(propertyKey, methodMetadata);
    return target;
  };
}
const UnaryMethod = (name) => createMethodDecorator(MethodType.Unary, name);
const ClientStreamMethod = (name) => createMethodDecorator(MethodType.ClientStreaming, name);
const ServerStreamMethod = (name) => createMethodDecorator(MethodType.ServerStreaming, name);
const DuplexStreamMethod = (name) => createMethodDecorator(MethodType.DuplexStreaming, name);
function Service(name) {
  return function(target) {
    const metadata = getOrCreateMetadata(target);
    metadata.name = name;
  };
}
function Middleware(mw) {
  return function(target, propertyKey, descriptor) {
    const metadata = getOrCreateMetadata(target);
    if (!propertyKey) {
      metadata.middlewares ??= [];
      metadata.middlewares.push(mw);
    } else {
      const metadataMethod = metadata.methods.get(propertyKey) ?? {};
      metadataMethod.middlewares ??= [];
      metadataMethod.middlewares.push(mw);
      metadata.methods.set(propertyKey, metadataMethod);
    }
    return target;
  };
}
function Transformer(fn) {
  return function(target, propertyKey, descriptor) {
    const metadata = getOrCreateMetadata(target);
    const methodMeta = metadata.methods.get(propertyKey) ?? {
      name: propertyKey,
      type: MethodType.Unary,
      middlewares: []
    };
    if (methodMeta.transformer) {
      throw new Error(`Method ${String(propertyKey)} already has a transformer. Only one is allowed.`);
    }
    methodMeta.transformer = fn;
    metadata.methods.set(propertyKey, methodMeta);
  };
}

export { Builder, CancellationToken, CancellationTokenSource, ClientStreamMethod, ClientStreamReader, Dispatcher, DuplexStreamMethod, MethodError, MethodType, Middleware, PackageType, RPC_METADATA, ServerCallContext, ServerCallContextSource, ServerStreamMethod, ServerStreamWriter, Service, Status, Transformer, UnaryMethod, getOrCreateMetadata };
