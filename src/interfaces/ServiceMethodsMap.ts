import { MethodType } from "../models";

export type ServiceMethodsMap = Map<
  string,
  { type: MethodType; handler: Function }
>;
