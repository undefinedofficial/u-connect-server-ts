/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { isPromice } from "../utils";

export class CancellationToken {
  protected _isCancellationRequested: boolean = false;
  protected _onCancellationRequestedCallbacks: (() => void | Promise<void>)[] =
    [];

  get IsCancellationRequested(): boolean {
    return this._isCancellationRequested;
  }

  Register(callback: () => void) {
    this._onCancellationRequestedCallbacks.push(callback);
  }
}

export class CancellationTokenSource extends CancellationToken {
  constructor() {
    super();
  }
  get Token(): CancellationToken {
    return this;
  }

  async Cancel() {
    this._isCancellationRequested = true;
    for (const callback of this._onCancellationRequestedCallbacks) {
      const result = callback();
      if (isPromice(result)) await result;
    }
  }
}
