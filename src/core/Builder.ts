import { Dispatcher } from "./Dispatcher";
import { Processor } from "./Processor";
import { MethodRegistry } from "./MethodRegistry";
import type { ISerializer, ITransport } from "./types";

export class Builder {
  private _transport?: ITransport;
  private _serializer?: ISerializer;
  private _processor: Processor;
  private _registry: MethodRegistry;

  constructor() {
    this._processor = new Processor();
    this._registry = new MethodRegistry();
  }

  public withTransport(transport: ITransport): this {
    this._transport = transport;
    return this;
  }

  public withSerializer(serializer: ISerializer): this {
    this._serializer = serializer;
    return this;
  }

  public addService<TService extends new (...args: any[]) => any>(
    service: TService,
    ...args: ConstructorParameters<TService>
  ) {
    this._processor.configureMethods(this._registry, service, args);
    return this;
  }

  public build(): Omit<ITransport, "bindDispatcher"> {
    if (!this._transport) throw new Error("Transport is not configured");
    if (!this._serializer) throw new Error("Serializer is not configured");

    const dispatcher = new Dispatcher(this._registry, this._serializer);

    // 3. Связываем диспетчер с транспортом
    this._transport.bindDispatcher(dispatcher);

    const transport = this._transport;
    return {
      listen: (port: number, callback?: (token: any) => void) =>
        transport.listen(port, callback),
    };
  }
}
