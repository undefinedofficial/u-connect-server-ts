import { Status } from "../enums";

export class MethodError extends Error {
  constructor(public readonly status: Status, message: string) {
    super(message);
    this.name = "MethodError";
  }
}
