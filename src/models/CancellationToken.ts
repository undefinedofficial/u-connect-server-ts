/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */

import { isPromice } from "../utils/isPromice";

export class CancellationToken {
  private _isCancellationRequested: boolean = false;
  private _onCancellationRequestedCallbacks: (() => void | Promise<void>)[] = [];
  get IsCancellationRequested(): boolean {
    return this._isCancellationRequested;
  }

  protected async Cancel() {
    this._isCancellationRequested = true;
    for (const callback of this._onCancellationRequestedCallbacks) {
      if (isPromice(callback)) await callback();
      else callback();
    }
  }

  Register(callback: () => void) {
    this._onCancellationRequestedCallbacks.push(callback);
  }
}

export class CancellationTokenSource extends CancellationToken {
  constructor(deadline?: number) {
    super();
    if (deadline) setTimeout(() => this.Cancel(), deadline);
  }
  get Token(): CancellationToken {
    return this;
  }

  Cancel() {
    return super.Cancel();
  }
}
