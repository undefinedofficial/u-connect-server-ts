import type { ServerCallContextSource } from "./ServerCallContext";
import {
  type IServerStreamWriter,
  type IClientStreamReader,
  PackageType,
  TransformerFn,
} from "./types";

export class ClientStreamReader<T> implements IClientStreamReader<T> {
  private readonly _buffer: T[] = [];
  private _current: T | undefined;
  private _finished: boolean = false;
  private _nextPromise: { resolve: (v: boolean) => void } | null = null;
  private _isSuspended: boolean = false;

  constructor(
    private readonly _context: ServerCallContextSource,
    private readonly _transformer?: TransformerFn,
    private readonly _bufferLimit: number = 16
  ) {}

  get Current(): T {
    return this._current as T;
  }

  private async setCurrent(data: unknown) {
    if (this._transformer) {
      data = this._transformer(data);
      if (data instanceof Promise) data = await data;
    }
    this._current = data as T;
  }

  private updateFlowControl() {
    const isFull = this._buffer.length >= this._bufferLimit;

    if (isFull && !this._isSuspended) {
      this._isSuspended = true;
      this._context.Send(PackageType.STREAM_SUSPEND);
    } else if (!isFull && this._isSuspended) {
      this._isSuspended = false;
      this._context.Send(PackageType.STREAM_RESUME);
    }
  }

  async MoveNext(): Promise<boolean> {
    if (this._buffer.length > 0) {
      await this.setCurrent(this._buffer.shift());
      this.updateFlowControl();
      return true;
    }

    if (this._finished) return false;

    const arrived = await new Promise<boolean>((resolve) => {
      this._nextPromise = { resolve };
    });

    if (arrived && this._buffer.length > 0) {
      await this.setCurrent(this._buffer.shift());
      this.updateFlowControl();
      return true;
    }

    return false;
  }

  Receive(message: T): void {
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

  Finish(): void {
    this._finished = true;
    if (this._nextPromise) {
      const res = this._nextPromise.resolve;
      this._nextPromise = null;
      res(false);
    }
  }

  public [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: async () =>
        (await this.MoveNext())
          ? { done: false, value: this.Current }
          : { done: true, value: undefined },
    };
  }
}

export class ServerStreamWriter<T> implements IServerStreamWriter<T> {
  constructor(private readonly _context: ServerCallContextSource) {}

  Write(message: T): Promise<boolean> {
    return this._context.Send<T>(PackageType.STREAM_SERVER, message);
  }
}
