import { MethodError } from "./MethodError";
import type {
  ServerCallContext,
  ServerCallContextSource,
} from "./ServerCallContext";
import { ClientStreamReader, ServerStreamWriter } from "./stream";
import {
  IClientStreamReader,
  IServerStreamWriter,
  MethodType,
  PackageType,
  Status,
  TransformerFn,
} from "./types";

export interface IMethod {
  Type: MethodType;
  ServiceName: string;
  Name: string;
  FullName: string;
  Invoke(request: unknown, context: ServerCallContextSource): Promise<void>;
}

/**
 * A generic representation of a remote method.
 */
export abstract class Method implements IMethod {
  /**
   * Gets the type of the method.
   */
  readonly Type: MethodType;

  /**
   * Gets the name of the service to which this method belongs.
   */
  readonly ServiceName: string;

  /**
   *  Gets the unqualified name of the method.
   */
  readonly Name: string;

  /**
   * Gets the fully qualified name of the method. On the server side, methods are dispatched
   * based on this name.
   */
  get FullName() {
    return Method.FullName(this.ServiceName, this.Name);
  }

  constructor(type: MethodType, serviceName: string, name: string) {
    this.Type = type;
    this.ServiceName = serviceName;
    this.Name = name;
  }

  abstract Invoke(
    request: unknown,
    context: ServerCallContextSource
  ): Promise<void>;

  protected async HandleError(
    error: unknown,
    type: PackageType,
    context: ServerCallContextSource
  ) {
    // Сancel execution as the request was abort before logical processing completed.
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
  static FullName(serviceName: string, name: string) {
    return serviceName + "." + name;
  }
}

/**
 * A non-generic representation of a remote unary method.
 */
export class UnaryMethod<I, O> extends Method {
  constructor(
    serviceName: string,
    name: string,
    private readonly handler: (
      request: I,
      context: ServerCallContext
    ) => O | Promise<O>,
    private readonly transformer?: TransformerFn
  ) {
    super(MethodType.Unary, serviceName, name);
  }

  /**
   * Invoke handler for the method.
   */
  async Invoke(request: I, context: ServerCallContextSource): Promise<void> {
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
}

/**
 * A non-generic representation of a remote client streaming method.
 */
export class ClientStreamingMethod<I, O> extends Method {
  constructor(
    serviceName: string,
    name: string,
    private readonly handler: (
      clientReader: IClientStreamReader<I>,
      context: ServerCallContext
    ) => O | Promise<O>,
    private readonly transformer?: TransformerFn
  ) {
    super(MethodType.ClientStreaming, serviceName, name);
  }

  /**
   * Invoke handler for the method.
   */
  async Invoke(_: never, context: ServerCallContextSource): Promise<void> {
    try {
      const requestStream = new ClientStreamReader<I>(
        context,
        this.transformer
      );
      context.setClientStreamReader<I>(requestStream);
      const response = await this.handler(requestStream, context);

      await context.SendEnd(PackageType.STREAM_END, response ?? null);
    } catch (error) {
      await this.HandleError(error, PackageType.STREAM_END, context);
    }
  }
}

/**
 * A non-generic representation of a remote server streaming method.
 */
export class ServerStreamingMethod<I, O> extends Method {
  constructor(
    serviceName: string,
    name: string,
    private readonly handler: (
      request: I | null | undefined,
      serverWriter: IServerStreamWriter<O>,
      context: ServerCallContext
    ) => any,
    private readonly transformer?: TransformerFn
  ) {
    super(MethodType.ServerStreaming, serviceName, name);
  }

  /**
   * Invoke handler for the method.
   */
  async Invoke(request: I, context: ServerCallContextSource): Promise<void> {
    try {
      if (this.transformer) {
        request = this.transformer(request);
        if (request instanceof Promise) request = await request;
      }
      const responseStream = new ServerStreamWriter<O>(context);
      await this.handler(request, responseStream, context);

      await context.SendEnd(PackageType.STREAM_END);
    } catch (error) {
      await this.HandleError(error, PackageType.STREAM_END, context);
    }
  }
}

/**
 * A non-generic representation of a remote duplex streaming method.
 */
export class DuplexStreamingMethod<I, O> extends Method {
  constructor(
    serviceName: string,
    name: string,
    private readonly handler: (
      clientReader: IClientStreamReader<I>,
      serverWriter: IServerStreamWriter<O>,
      context: ServerCallContext
    ) => any,
    private readonly transformer?: TransformerFn
  ) {
    super(MethodType.DuplexStreaming, serviceName, name);
  }

  /**
   * Invoke handler for the method.
   *  @param request - The request object.
   */

  async Invoke(_: never, context: ServerCallContextSource): Promise<void> {
    try {
      const requestStream = new ClientStreamReader<I>(
        context,
        this.transformer
      );
      context.setClientStreamReader<I>(requestStream);
      const responseStream = new ServerStreamWriter<O>(context);

      await this.handler(requestStream, responseStream, context);

      await context.SendEnd(PackageType.STREAM_END);
    } catch (error) {
      await this.HandleError(error, PackageType.STREAM_END, context);
    }
  }
}
