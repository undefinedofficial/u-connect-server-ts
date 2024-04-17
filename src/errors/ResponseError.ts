import { Status } from "../enums";

export class ResponseError extends Error {
  constructor(public id: number, public method: string, public status: Status, message: string) {
    super(message);
    this.name = "ResponseError";
  }
}
