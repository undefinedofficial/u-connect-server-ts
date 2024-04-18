"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
