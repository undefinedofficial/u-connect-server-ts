"use strict";
/**
 * @u-connect/server-ts v2.0.0
 * https://github.com/undefinedofficial/u-connect-server-ts.git
 *
 * Copyright (c) 2024 https://github.com/undefinedofficial
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UConnectHubSource = exports.UConnectHub = void 0;
const models_1 = require("./models");
class UConnectHub {
    constructor() {
        this.services = new Map();
        this.methods = new Map();
    }
    GetMethods(service) {
        const localMethods = service.prototype
            .Methods;
        if (!localMethods)
            throw new Error(`Service ${service.name} has no Methods`);
        return localMethods;
    }
    AddService(service, ...args) {
        const serviceName = service.serviceName || service.name;
        if (this.services.has(serviceName))
            throw new Error(`Service ${serviceName} already exists`);
        const localMethods = this.GetMethods(service);
        for (const [methodName, { type, handler }] of localMethods) {
            let method;
            switch (type) {
                case models_1.MethodType.Unary:
                    method = new models_1.UnaryMethod(serviceName, methodName, (...parameters) => handler.call(new service(...args), ...parameters));
                    break;
                case models_1.MethodType.ClientStreaming:
                    method = new models_1.ClientStreamingMethod(serviceName, methodName, (...parameters) => handler.call(new service(...args), ...parameters));
                    break;
                case models_1.MethodType.ServerStreaming:
                    method = new models_1.ServerStreamingMethod(serviceName, methodName, (...parameters) => handler.call(new service(...args), ...parameters));
                    break;
                case models_1.MethodType.DuplexStreaming:
                    method = new models_1.DuplexStreamingMethod(serviceName, methodName, (...parameters) => handler.call(new service(...args), ...parameters));
                    break;
                default:
                    throw new Error();
            }
            this.methods.set(method.FullName, method);
        }
        this.services.set(serviceName, service);
        return this;
    }
    RemoveService(name) {
        if (!this.methods.has(name))
            throw new Error(`Service ${name} doesn't exist`);
        const service = this.services.get(name);
        const localMethods = this.GetMethods(service);
        if (!localMethods)
            throw new Error(`Service ${name} has no Methods`);
        for (const [method, _] of localMethods)
            this.methods.delete(models_1.Method.FullName(name, method));
        this.services.delete(name);
        return this;
    }
}
exports.UConnectHub = UConnectHub;
class UConnectHubSource extends UConnectHub {
    HasService(name) {
        return this.services.has(name);
    }
    GetService(name) {
        return this.services.get(name);
    }
    HasMethod(name) {
        return this.methods.has(name);
    }
    GetMethod(name) {
        return this.methods.get(name);
    }
}
exports.UConnectHubSource = UConnectHubSource;
