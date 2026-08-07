import {
  type ServiceMetadata,
  type MiddlewareFn,
  MethodType,
  RPC_METADATA,
  TransformerFn,
} from "./types";
import {
  type Method,
  ClientStreamingMethod,
  DuplexStreamingMethod,
  ServerStreamingMethod,
  UnaryMethod,
} from "./Method";
import type { MethodRegistry } from "./MethodRegistry";
import type { ServerCallContext } from "./ServerCallContext";

export class Processor {
  public configureMethods<TService extends new (...args: any[]) => any>(
    registry: MethodRegistry,
    hubClass: TService,
    args: ConstructorParameters<TService>,
  ) {
    const metadata = hubClass.prototype[RPC_METADATA] as ServiceMetadata;
    const className = metadata.name || hubClass.name;

    if (!metadata) return;

    const classMiddlewares = metadata.middlewares ?? [];

    for (const [methodName, methodMeta] of metadata.methods) {
      const methodType = methodMeta.type;
      const callName = methodMeta.name;
      if (methodType === undefined || !callName)
        throw new Error(
          `Middleware can only be applied to RPC methods. ` +
            `Method '${className}.${String(
              methodName,
            )}' is not registered as an RPC method. ` +
            `Make sure to declare it with a method decorator like @UnaryMethod, @ClientStreamMethod, @ServerStreamMethod or @DuplexStreamMethod.`,
        );

      // Определяем, есть ли исходящий поток
      const isStreamingOut =
        methodMeta.type === MethodType.ServerStreaming ||
        methodMeta.type === MethodType.DuplexStreaming;

      const methodMiddlewares = methodMeta.middlewares ?? [];
      // Итоговая цепочка: [Class MW] -> [Method MW]
      const fullChain = [...classMiddlewares, ...methodMiddlewares];
      // Обертываем оригинальный хендлер в цепочку Middleware
      const pipeline = this.wrapHandler(methodName, fullChain, isStreamingOut);
      // Финальный обработчик: создает инстанс через фабрику и запускает пайплайн
      const finalHandler = async (
        req: unknown,
        resOrCtx: unknown | ServerCallContext,
        ctx?: ServerCallContext,
      ) => {
        const instance = Reflect.construct(hubClass, args);
        return pipeline(instance, req, resOrCtx, ctx);
      };
      const methodInstance = this.createMethodInstance(
        methodType,
        className,
        callName,
        finalHandler,
        methodMeta.transformer,
      );
      registry.add(methodInstance);
    }
  }

  private wrapHandler<T extends Record<string | symbol, Function>>(
    methodName: string | symbol,
    middlewares: MiddlewareFn[],
    isStreamingOut = false,
  ): (
    instance: T,
    req: unknown,
    resOrCtx: unknown,
    ctx?: ServerCallContext,
  ) => Promise<any> {
    const mwCount = middlewares.length;
    if (mwCount === 0)
      return (instance, req, resOrCtx, context) =>
        instance[methodName](req, resOrCtx, context);

    return async function (instance, req, resOrCtx, ctx) {
      let index = -1;

      const context = isStreamingOut ? ctx! : (resOrCtx as ServerCallContext);

      const dispatch = async (i: number): Promise<any> => {
        index = i;
        const fn = middlewares[i];

        if (i === mwCount) return instance[methodName](req, resOrCtx, context);

        return fn(context, () => dispatch(i + 1));
      };

      return dispatch(0);
    };
  }

  private createMethodInstance(
    type: MethodType,
    serviceName: string,
    methodName: string,
    pipeline: (...args: any[]) => Promise<any>,
    transformer?: TransformerFn,
  ): Method {
    // Выбираем класс реализации в зависимости от типа метода
    switch (type) {
      case MethodType.Unary:
        return new UnaryMethod(serviceName, methodName, pipeline, transformer);

      case MethodType.ClientStreaming:
        return new ClientStreamingMethod(
          serviceName,
          methodName,
          pipeline,
          transformer,
        );

      case MethodType.ServerStreaming:
        return new ServerStreamingMethod(
          serviceName,
          methodName,
          pipeline,
          transformer,
        );

      case MethodType.DuplexStreaming:
        return new DuplexStreamingMethod(
          serviceName,
          methodName,
          pipeline,
          transformer,
        );

      default:
        throw new Error(
          `Unsupported method type: ${type} for ${serviceName}.${methodName}`,
        );
    }
  }
}
