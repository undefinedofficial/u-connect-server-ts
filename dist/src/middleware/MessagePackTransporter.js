"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagePackTransporter = void 0;
const msgpack_1 = require("@msgpack/msgpack");
exports.MessagePackTransporter = {
    serialize(data) {
        var _a, _b, _c, _d;
        return (0, msgpack_1.encode)([
            data.id,
            data.method,
            data.type,
            (_a = data.response) !== null && _a !== void 0 ? _a : null,
            (_b = data.status) !== null && _b !== void 0 ? _b : null,
            (_c = data.meta) !== null && _c !== void 0 ? _c : null,
            (_d = data.error) !== null && _d !== void 0 ? _d : null,
        ]);
    },
    deserialize(message) {
        const [id, method, type, request, meta] = (0, msgpack_1.decode)(message);
        return { id, method, type, request, meta };
    },
};
