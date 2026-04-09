import { IMethod } from "./Method";

export class MethodRegistry {
  private methods = new Map<string, IMethod>();

  get(fullName: string): IMethod | undefined {
    return this.methods.get(fullName);
  }

  add(method: IMethod) {
    this.methods.set(method.FullName, method);
  }
}
