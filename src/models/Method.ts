import { DataType, Status } from "../enums";
import { MethodError } from "../errors/MethodError";
import { Request } from "./Request";
import { Response } from "./Response";
import { ServerCallContext, ServerCallContextSource } from "./ServerCallContext";

/**  Method types supported by u-connect. */
export const enum MethodType {
  /** Single request sent from client, single response received from server. */
  Unary,

  /** Stream of request sent from client, single response received from server. */
  ClientStreaming,

  /** Single request sent from client, stream of responses received from server. */
  ServerStreaming,

  /** Both server and client can stream arbitrary number of requests and responses simultaneously. */
  DuplexStreaming,
}

/**
 * A generic representation of a remote method.
 */
export abstract class Method {
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

  /**
   * handler for the method.
   */
  Handler: (...args: any[]) => Promise<any>;

  /**
   * Gets the service to which this method belongs.
   */
  service: Object;

  constructor(type: MethodType, service: Object, name: string, handler: (...args: any[]) => any) {
    this.Type = type;
    this.ServiceName = service.constructor.name;
    this.Name = name;
    this.Handler = handler;
    this.service = service;
  }

  abstract Invoke<I>(request: Request<I>, context: ServerCallContext): Promise<void>;

  protected HandleError(error: unknown, response: Response<any>, context: ServerCallContext) {
    if (error instanceof MethodError) {
      const { status, message } = error;
      response.error = message;
      response.status = status || context.Status;
      return;
    }

    response.status = Status.INTERNAL;
    response.error = "Internal Server Error";

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
export class UnaryMethod<I extends Request<any>, O extends Response<any>> extends Method {
  constructor(service: Object, name: string, handler: (...args: any[]) => any) {
    super(MethodType.Unary, service, name, handler);
  }

  /**
   * Invoke handler for the method.
   */
  async Invoke<I, O>(request: Request<I>, context: ServerCallContextSource): Promise<void> {
    const response: Response<O> = {
      id: request.id,
      method: request.method,
      type: DataType.UNARY_CLIENT,
    };
    try {
      if (request.type !== DataType.UNARY_CLIENT)
        throw new MethodError(Status.UNIMPLEMENTED, `Method ${request.method} is a unary`);

      response.response = (await this.Handler(request.request, context)) ?? null;
      response.status = context.Status;
    } catch (error) {
      this.HandleError(error, response, context);
    } finally {
      return context.Send(response);
    }
  }
}

/**
 * A non-generic representation of a remote client streaming method.
 */
export class ClientStreamingMethod<I, O> extends Method {
  constructor(service: Object, name: string, handler: (...args: any[]) => any) {
    super(MethodType.ClientStreaming, service, name, handler);
  }

  /**
   * Invoke handler for the method.
   */
  async Invoke<I, O>(request: Request<I>, context: ServerCallContextSource): Promise<void> {
    const response: Response<O> = {
      id: request.id,
      method: request.method,
      type: DataType.STREAM_END,
    };
    try {
      if (request.type !== DataType.STREAM_CLIENT)
        throw new MethodError(
          Status.UNIMPLEMENTED,
          `Method ${request.method} is a client streaming`
        );

      const requestStream = context.CreateClientStreamReader<I>();
      response.response = (await this.Handler(requestStream, context)) ?? null;
      response.status = context.Status;
    } catch (error) {
      this.HandleError(error, response, context);
    } finally {
      return context.Send(response);
    }
  }
}

/**
 * A non-generic representation of a remote server streaming method.
 */
export class ServerStreamingMethod<I, O> extends Method {
  constructor(service: Object, name: string, handler: (...args: any[]) => any) {
    super(MethodType.ServerStreaming, service, name, handler);
  }

  /**
   * Invoke handler for the method.
   */
  async Invoke<I, O>(request: Request<I>, context: ServerCallContextSource): Promise<void> {
    const response: Response<O> = {
      id: request.id,
      method: request.method,
      type: DataType.STREAM_END,
    };
    try {
      if (request.type !== DataType.STREAM_SERVER)
        throw new MethodError(
          Status.UNIMPLEMENTED,
          `Method ${request.method} is a server streaming`
        );

      const responseStream = context.CreateServerStreamWriter<O>();
      await this.Handler(request.request, responseStream, context);
      response.status = context.Status;
    } catch (error) {
      this.HandleError(error, response, context);
    } finally {
      return context.Send(response);
    }
  }
}

/**
 * A non-generic representation of a remote duplex streaming method.
 */
export class DuplexStreamingMethod<I, O> extends Method {
  constructor(service: Object, name: string, handler: (...args: any[]) => any) {
    super(MethodType.DuplexStreaming, service, name, handler);
  }

  /**
   * Invoke handler for the method.
   *  @param request - The request object.
   */

  async Invoke<I, O>(request: Request<I>, context: ServerCallContextSource): Promise<void> {
    const response: Response<O> = {
      id: request.id,
      method: request.method,
      type: DataType.STREAM_END,
    };
    try {
      if (request.type !== DataType.STREAM_DUPLEX)
        throw new MethodError(
          Status.UNIMPLEMENTED,
          `Method ${request.method} is a duplex streaming`
        );

      const requestStream = context.CreateClientStreamReader<I>();
      const responseStream = context.CreateServerStreamWriter<O>();
      await this.Handler(requestStream, responseStream, context);
      response.status = context.Status;
    } catch (error) {
      this.HandleError(error, response, context);
    } finally {
      return context.Send(response);
    }
  }
}
