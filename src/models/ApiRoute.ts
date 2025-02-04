import { Request, Response } from "express";
import { HTTPMethod } from "../struct/HTTPMethod";
import { Middleware } from "./Middleware";

export class ApiRoute {
  public static Method: HTTPMethod;
  public static Path: string;
  public static Middlewares: Middleware[] = [];

  public static Handle(req: Request, res: Response): any {}
}
