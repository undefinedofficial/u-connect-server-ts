/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
export var DataType;
(function (DataType) {
    /** Received */
    DataType[DataType["CONNECT"] = 1] = "CONNECT";
    /** Received */
    DataType[DataType["DISCONNECT"] = 2] = "DISCONNECT";
    /**
     * Unary request sent from client, single response received from server.
     */
    DataType[DataType["UNARY_CLIENT"] = 3] = "UNARY_CLIENT";
    /** Received */
    DataType[DataType["UNARY_SERVER"] = 4] = "UNARY_SERVER";
    /**
     * Request sent from client for creating a stream or sending data in stream.
     */
    DataType[DataType["STREAM_CLIENT"] = 5] = "STREAM_CLIENT";
    /**
     * Response received from server for creating a stream or receiving data in stream.
     */
    DataType[DataType["STREAM_SERVER"] = 6] = "STREAM_SERVER";
    /**
     * Request sent to the server for creating a full duplex stream.
     */
    DataType[DataType["STREAM_DUPLEX"] = 7] = "STREAM_DUPLEX";
    /**
     * Notifies Stream data end of sent from client or server.
     */
    DataType[DataType["STREAM_END"] = 8] = "STREAM_END";
    /**
     * Abort any pending request or stream.
     */
    DataType[DataType["ABORT"] = 9] = "ABORT";
})(DataType || (DataType = {}));
