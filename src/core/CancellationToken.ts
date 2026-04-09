export class CancellationToken {
  protected _isCancelled = false;
  protected _callbacks: Set<() => unknown | Promise<unknown>> | null = null;
  protected _promise: Promise<void> | null = null;
  protected _resolve: (() => void) | null = null;

  get IsCancellationRequested(): boolean {
    return this._isCancelled;
  }

  /**
   * Register a callback (If token is already cancelled - execute immediately)
   */
  Register(callback: () => unknown | Promise<unknown>): void {
    if (this._isCancelled) {
      callback();
      return;
    }
    if (!this._callbacks) this._callbacks = new Set();

    this._callbacks.add(callback);
  }

  Unregister(callback: () => void): void {
    this._callbacks?.delete(callback);
  }

  get CancellationPromise(): Promise<void> {
    if (this._isCancelled) return Promise.resolve();

    if (!this._promise) {
      this._promise = new Promise((resolve) => {
        this._resolve = resolve;
      });
    }
    return this._promise;
  }
}

export class CancellationTokenSource extends CancellationToken {
  get Token(): CancellationToken {
    return this;
  }

  async Cancel(): Promise<void> {
    if (this._isCancelled) return;

    this._isCancelled = true;

    // First resolve the promise to unblock awaits in microtasks
    if (this._resolve) {
      this._resolve();
      this._resolve = null;
    }

    if (!this._callbacks) return;

    // Execute all callbacks in parallel using Promise.all for performance
    const tasks: Promise<void>[] = [];

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
