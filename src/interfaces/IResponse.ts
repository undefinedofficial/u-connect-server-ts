import { Status, DataType } from "../enums";
import { ResponseMetadata } from "./Metadata";

export interface IResponse<P> {
  id: number;
  type: DataType;
  method: string;
  response?: P | null;
  status?: Status | null;
  meta?: ResponseMetadata | null;
  error?: string | null;
}
