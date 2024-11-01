/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { HttpRequest, HttpResponse } from "uWebSockets.js";
import { IMethod, Method, ServerCallContext } from "./models";
import { IWebSocket } from "./interfaces";

type MayBePromise<T> = T | Promise<T>;

interface IServiceConstructor {
  new (...args: any[]): any;
}
export interface UConnectHubOptions {
  /**
   *  Path to listen on.
   */
  path: string;

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
  onUpgrade?: (res: HttpResponse, req: HttpRequest) => MayBePromise<false | Record<string, any>>;

  /**
   *  Close handler used to intercept WebSocket close events.
   */
  onClose?: (ws: IWebSocket, code: number, message: string) => void;
}

export class UConnectHub {
  protected services: Map<string, IServiceConstructor>;
  protected methods: Map<string, IMethod>;

  constructor() {
    this.services = new Map<string, IServiceConstructor>();
    this.methods = new Map<string, IMethod>();
  }

  private GetMethods(service: IServiceConstructor) {
    const localMethods = (service as any).prototype.Methods as Map<string, Method>;
    if (!localMethods) throw new Error(`Service ${service.name} has no Methods`);

    return localMethods;
  }

  AddService<TService extends IServiceConstructor>(service: TService, name?: string) {
    if (this.methods.has(name || service.name))
      throw new Error(`Service ${name || service.name} already exists`);

    const localMethods = this.GetMethods(service);
    for (const [method, descriptor] of localMethods)
      this.methods.set(Method.FullName(name || service.name, method), descriptor);

    this.services.set(name || service.name, service);

    return this;
  }

  RemoveService(name: string) {
    if (!this.methods.has(name)) throw new Error(`Service ${name} doesn't exist`);

    const service = this.services.get(name)!;
    const localMethods = (service as any).prototype.Methods as Map<string, Method>;
    if (!localMethods) throw new Error(`Service ${name} has no Methods`);

    for (const [method, _] of localMethods) this.methods.delete(Method.FullName(name, method));
    this.services.delete(name);

    return this;
  }
}

export class UConnectHubSource extends UConnectHub {
  HasService(name: string) {
    return this.services.has(name);
  }

  GetService(name: string) {
    return this.services.get(name);
  }

  HasMethod(name: string) {
    return this.methods.has(name);
  }
  GetMethod(name: string) {
    return this.methods.get(name);
  }
}
