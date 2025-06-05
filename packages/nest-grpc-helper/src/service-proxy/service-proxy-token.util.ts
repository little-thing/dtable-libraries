export function serviceProxyToken(packageName: string, serviceName: string) {
  return `@dtable/nest-grpc-helper/${packageName}/${serviceName}`;
}
