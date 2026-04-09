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

  // Флаг паузы: мы отправили лимит и ждем, пока MoveNext освободит место
  private _isWaitingForDrain: boolean = false;

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

  async MoveNext(): Promise<boolean> {
    if (this._buffer.length > 0) {
      this.setCurrent(this._buffer.shift());

      // Если мы отбрасывали данные (пауза) и теперь появилось место —
      // возобновляем поток, отправив Continue.
      if (this._isWaitingForDrain && this._buffer.length < this._bufferLimit) {
        this._isWaitingForDrain = false;
        this.Continue();
      }
      return true;
    }

    if (this._finished) return false;

    const arrived = await new Promise<boolean>((resolve) => {
      this._nextPromise = { resolve };
      // Если мы не на паузе, запрашиваем данные у клиента
      if (!this._isWaitingForDrain) {
        this.Continue();
      }
    });

    if (arrived && this._buffer.length > 0) {
      this.setCurrent(this._buffer.shift());
      return true;
    }

    return false;
  }
  public [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: async (): Promise<IteratorResult<T>> => {
        if (await this.MoveNext()) return { done: false, value: this.Current };

        return {
          done: true,
          value: undefined,
        };
      },
    };
  }

  /**
   * Прием сообщения от транспортного слоя
   */
  Receive(message: T): void {
    if (this._finished) return;

    // СТРОГАЯ ЗАЩИТА: Если лимит превышен, мы просто выбрасываем данные.
    // Это защищает Node.js от Heap Overflow при атаке или баге клиента.
    if (this._buffer.length >= this._bufferLimit) {
      this._isWaitingForDrain = true;
      // В логах Highload систем здесь обычно ставят метрику "dropped_messages_count"
      return;
    }

    this._buffer.push(message);

    // Если место еще есть — подтверждаем получение и разрешаем следующее.
    if (this._buffer.length < this._bufferLimit) {
      this.Continue();
    } else {
      this._isWaitingForDrain = true;
    }

    // Пробуждаем MoveNext, если он ждал данных
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

  private Continue() {
    return this._context.Send(PackageType.STREAM_CLIENT);
  }
}

export class ServerStreamWriter<T> implements IServerStreamWriter<T> {
  constructor(private readonly _context: ServerCallContextSource) {}

  Write(message: T): Promise<boolean> {
    return this._context.Send<T>(PackageType.STREAM_SERVER, message);
  }
}
