"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = Service;
function Service(name) {
    return function (target) {
        target.serviceName = name;
    };
}
