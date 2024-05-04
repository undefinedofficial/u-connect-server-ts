"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportOptions = void 0;
var TransportOptions;
(function (TransportOptions) {
    /**
     * Write Message and wait confirm from client, keep the order (Slow)
     */
    TransportOptions[TransportOptions["Confirm"] = 0] = "Confirm";
    /**
     * Write Message without confirm from client, does not guarantee the order (Fast)
     */
    TransportOptions[TransportOptions["Transfer"] = 1] = "Transfer";
})(TransportOptions || (exports.TransportOptions = TransportOptions = {}));
