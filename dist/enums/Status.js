"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
var Status;
(function (Status) {
    /**
     * The operation completed successfully.
     */
    Status[Status["OK"] = 0] = "OK";
    /**
     * The operation was cancelled, typically by the caller.
     */
    Status[Status["CANCELLED"] = 1] = "CANCELLED";
    /**
     * Unknown error.  An example of where this error may be returned is
     * if a Status value received from another address space belongs to
     * an error-space that is not known in this address space.  Also
     * errors raised by APIs that do not return enough error information
     * may be converted to this error.
     */
    Status[Status["UNKNOWN"] = 2] = "UNKNOWN";
    /**
     * Client specified an invalid argument.  Note that this differs
     * from INVALID_ARGUMENT and OUT_OF_RANGE in that it indicates
     * arguments that are problematic regardless of the state of the
     * system (e.g., a malformed file name).
     */
    Status[Status["INVALID_ARGUMENT"] = 3] = "INVALID_ARGUMENT";
    /**
     * Deadline expired before operation could complete.  For operations
     * that change the state of the system, this error may be returned
     * even if the operation has completed successfully.  For example, a
     * successful response from a server could have been delayed longer
     * than the deadline.
     */
    Status[Status["DEADLINE_EXCEEDED"] = 4] = "DEADLINE_EXCEEDED";
    /**
     * Some requested entity (e.g., file or directory) was not found.
     * For some entities, the error may indicate that the entity
     * does not exist or has been removed, or it may indicate that the
     * entity is not visible to the requesting user.
     */
    Status[Status["NOT_FOUND"] = 5] = "NOT_FOUND";
    /**
     * Some entity that we attempted to create (e.g., file or directory)
     * already exists.
     */
    Status[Status["ALREADY_EXISTS"] = 6] = "ALREADY_EXISTS";
    /**
     * The caller does not have permission to execute the specified
     * operation.  PERMISSION_DENIED must not be used for rejections
     * caused by exhausting some resource (use RESOURCE_EXHAUSTED instead).
     */
    Status[Status["PERMISSION_DENIED"] = 7] = "PERMISSION_DENIED";
    /**
     * Some resource has been exhausted, perhaps the entire file system is out of space.
     */
    Status[Status["RESOURCE_EXHAUSTED"] = 8] = "RESOURCE_EXHAUSTED";
    /**
     * Operation was rejected because the system is not in a state
     * required for the operation's execution.  For example, directory
     * to be deleted may be non-empty, an rmdir operation is applied to
     * a non-directory, etc.
     *
     * A litmus test that may help a service implementor in deciding
     * between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
     *  (a) Use UNAVAILABLE if the client can retry just the failing call.
     *  (b) Use ABORTED if the client should retry at a higher-level
     *      (e.g., restarting a read-modify-write sequence).
     *  (c) Use FAILED_PRECONDITION if the client should not retry
     *      until the system state has been explicitly fixed.
     *  (d) Use FAILED_PRECONDITION if the client performs conditional
     */
    Status[Status["FAILED_PRECONDITION"] = 9] = "FAILED_PRECONDITION";
    /**
     * The operation was aborted, typically due to a concurrency issue
     * such as a sequencer check failure or transaction abort.
     * See the guidelines above for deciding between FAILED_PRECONDITION,
     * ABORTED, and UNAVAILABLE.
     * ABORTED must not be used if the client can retry.
     */
    Status[Status["ABORTED"] = 10] = "ABORTED";
    /**
     * Operation was attempted past the valid range.  E.g., seeking or
     * reading past end-of-file.
     * Unlike INVALID_ARGUMENT, this error indicates a problem that may
     * be fixed if the system state changes. For example, a 32-bit file
     * system will generate INVALID_ARGUMENT if asked to read at an
     * offset that is not in the range [0,2^32-1], but it will generate
     * OUT_OF_RANGE if asked to read from an offset past the current
     * file size.
     */
    Status[Status["OUT_OF_RANGE"] = 11] = "OUT_OF_RANGE";
    /**
     * Operation is not implemented or not supported/enabled in this service.
     */
    Status[Status["UNIMPLEMENTED"] = 12] = "UNIMPLEMENTED";
    /**
     * Internal errors.  Means some invariants expected by underlying
     * system has been broken.  If you see this error,
     * something is very broken.
     */
    Status[Status["INTERNAL"] = 13] = "INTERNAL";
    /**
     * The service is currently unavailable.  This is a most likely a
     * transient condition and may be corrected by retrying with
     * a backoff.
     *
     * See the guidelines above for deciding between FAILED_PRECONDITION,
     * ABORTED, and UNAVAILABLE.
     */
    Status[Status["UNAVAILABLE"] = 14] = "UNAVAILABLE";
    /**
     * The operation was attempted past the valid range.  E.g., seeking or
     * reading past end-of-file.
     * Unlike INVALID_ARGUMENT, this error indicates a problem that may
     * be fixed if the system state changes. For example, a 32-bit file
     * system will generate INVALID_ARGUMENT if asked to read at an
     * offset that is not in the range [0,2^32-1], but it will generate
     * OUT_OF_RANGE if asked to read from an offset past the current
     * file size.
     */
    Status[Status["DATA_LOSS"] = 15] = "DATA_LOSS";
    /**
     * The request does not have valid authentication credentials for the
     * operation.
     * UNAUTHENTICATED must not be used for rejections caused by an
     * unauthenticated client.
     * This error indicates that the client must first authenticate
     * with the server.
     */
    Status[Status["UNAUTHENTICATED"] = 16] = "UNAUTHENTICATED";
})(Status || (exports.Status = Status = {}));
/**
    Client Application cancelled the request	CANCELLED	Both
    Deadline expires before server returns status	DEADLINE_EXCEEDED	Both
    Method not found at server	UNIMPLEMENTED	Server
    Server shutting down	UNAVAILABLE	Server
    Server side application throws an exception (or does something other than returning a Status code to terminate an RPC)	UNKNOWN	Server
    No response received before Deadline expires. This may occur either when the client is unable to send the request to the server or when the server fails to respond in time.	DEADLINE_EXCEEDED	Both
    Some data transmitted (e.g., request metadata written to TCP connection) before connection breaks	UNAVAILABLE	Client
    Could not decompress, but compression algorithm supported (Client -> Server)	INTERNAL	Server
    Could not decompress, but compression algorithm supported (Server -> Client)	INTERNAL	Client
    Compression mechanism used by client not supported at server	UNIMPLEMENTED	Server
    Server temporarily out of resources (e.g., Flow-control resource limits reached)	RESOURCE_EXHAUSTED	Server
    Client does not have enough memory to hold the server response	RESOURCE_EXHAUSTED	Client
    Flow-control protocol violation	INTERNAL	Both
    Error parsing returned status	UNKNOWN	Client
    Incorrect Auth metadata ( Credentials failed to get metadata, Incompatible credentials set on channel and call, Invalid host set in :authority metadata, etc.)	UNAUTHENTICATED	Both
    Request cardinality violation (method requires exactly one request but client sent some other number of requests)	UNIMPLEMENTED	Server
    Response cardinality violation (method requires exactly one response but server sent some other number of responses)	UNIMPLEMENTED	Client
    Error parsing response proto	INTERNAL	Client
    Error parsing request proto	INTERNAL	Server
    Sent or received message was larger than configured limit	RESOURCE_EXHAUSTED	Both
    Keepalive watchdog times out	UNAVAILABLE	Both
 */
