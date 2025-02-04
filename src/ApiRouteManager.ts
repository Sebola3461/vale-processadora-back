import { ApiRoute } from "./models/ApiRoute";

export class ApiRouteManager {
  private static Routes: (typeof ApiRoute)[] = [];

  public static GetRoute(Path: string) {
    return this.Routes.find((Route) => Route.Path == Path);
  }

  public static GetAll() {
    return this.Routes;
  }

  public static RegisterRoute(Route: typeof ApiRoute) {
    if (this.GetRoute(Route.Path)) return;

    this.Routes.push(Route);
  }
}
