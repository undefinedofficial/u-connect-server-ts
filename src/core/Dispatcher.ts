import type { MethodRegistry } from "./MethodRegistry";
import {
  PackageType,
  MethodType,
  Status,
  type ISerializer,
  type PackageID,
  type IConnection,
} from "./types";

import { ServerCallContextSource } from "./ServerCallContext";

export class Dispatcher {
  private readonly _contexts: Map<
    string,
    Map<PackageID, ServerCallContextSource>
  >;

  constructor(
    private readonly _registry: MethodRegistry,
    private readonly _serializer: ISerializer
  ) {
    this._contexts = new Map();
  }

  public async dispatch(
    connection: IConnection,
    rawMessage: Uint8Array<ArrayBuffer>,
    isBinary: boolean
  ) {
    if (isBinary !== this._serializer.binary)
      return connection.close(1005, "Message is not binary");

    const [id, methodName, type, payload, metadata] =
      this._serializer.deserialize(rawMessage);
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
      if (
        method.Type !== MethodType.ClientStreaming &&
        method.Type !== MethodType.DuplexStreaming
      ) {
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

      // Мы не удаляем из Map здесь, это сделает .finally() в Invoke
      return type === PackageType.STREAM_CLIENT
        ? reader.Receive(payload)
        : reader.Finish();
    }

    // @ts-ignore

    if (method.Type !== type)
      return this.sendError(
        connection,
        callId,
        methodName,
        Status.UNIMPLEMENTED,
        `Method ${methodName} is not supported for this request type : ${method.Type}, ${type}`
      );

    if (!this._contexts.has(contextId)) {
      connector = new Map();
      this._contexts.set(contextId, connector);
    }

    const context = new ServerCallContextSource(
      connection,
      this._serializer,
      callId,
      methodName,
      metadata
    );

    connector!.set(callId, context);

    // Запускаем обработку (она асинхронная, не ждем здесь)
    method.Invoke(payload, context).finally(
      () => connector?.delete(callId) // Авто-очистка по завершении
    );
  }

  public async close(connection: IConnection) {
    if (!this._contexts.has(connection.id)) return;

    const ctxsForConn = this._contexts.get(connection.id)!;

    await Promise.all(
      Array.from(ctxsForConn.values()).map(async (ctx) => ctx.Cancel())
    );
    ctxsForConn.clear();
    this._contexts.delete(connection.id);
  }

  private async sendError(
    connection: IConnection,
    id: PackageID,
    method: string,
    status: Status,
    error: string
  ) {
    await connection.send(
      this._serializer.serialize([
        id,
        method,
        PackageType.ABORT,
        null,
        status,
        null,
        error,
      ]),
      this._serializer.binary
    );
  }
}
