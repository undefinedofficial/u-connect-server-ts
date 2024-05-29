"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UConnectHubSource = exports.UConnectHub = void 0;
const models_1 = require("./models");
class UConnectHub {
    constructor() {
        this.services = new Map();
        this.methods = new Map();
    }
    AddService(service, name) {
        if (this.methods.has(name || service.name))
            throw new Error(`Service ${name || service.name} already exists`);
        const localMethods = service.prototype.Methods;
        if (!localMethods)
            throw new Error(`Service ${name || service.name} has no Methods`);
        for (const [method, descriptor] of localMethods)
            this.methods.set(models_1.Method.FullName(name || service.name, method), descriptor);
        this.services.set(name || service.name, service);
        return this;
    }
    RemoveService(name) {
        if (!this.methods.has(name))
            throw new Error(`Service ${name} doesn't exist`);
        const service = this.services.get(name);
        const localMethods = service.prototype.Methods;
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
