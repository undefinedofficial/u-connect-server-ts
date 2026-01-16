export function Service(name?: string) {
  return function (target: Function & { serviceName?: string }) {
    target.serviceName = name;
  };
}
