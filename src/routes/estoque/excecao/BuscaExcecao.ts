import { Request, Response } from "express";
import { ApiRoute } from "../../../models/ApiRoute";
import { HTTPMethod } from "../../../struct/HTTPMethod";
import { DebugLogger } from "../../../helpers/DebugLogger";
import { ApiServer } from "../../../ApiServer";
import { HttpStatusCode } from "axios";

enum StatusExcecao {
  GENERAL = "general",
  BY_OBSERVATION = "observation",
  BY_OBSERVATION_ACTIVE = "observation_active",
}

export class ApiRoute_Excecao_Buscar extends ApiRoute {
  public static Method = HTTPMethod.GET;
  public static Path = "/excecao/buscar";

  public static async Handle(req: Request, res: Response) {
    try {
      const tipo = ApiRoute_Excecao_Buscar.SanitizeExcecao(req.query.tipo);

      if (tipo == StatusExcecao.GENERAL) {
        const excecao =
          await ApiServer.Services.Database.connection.query<EnvioExcecao>(
            `SELECT * FROM ENVIO_EXCECAO`
          );

        const result: { ativa: number; finalizada: number } = {
          ativa: 0,
          finalizada: 0,
        };

        for (const excecaoItem of excecao.values()) {
          if (!excecaoItem.DATA_FIM) result.ativa += 1;
          if (excecaoItem.DATA_FIM) result.finalizada += 1;
        }

        res.status(HttpStatusCode.Ok).send({
          status: HttpStatusCode.Ok,
          message: "Found",
          data: result,
        });
      }

      if (tipo == StatusExcecao.BY_OBSERVATION) {
        const excecao =
          await ApiServer.Services.Database.connection.query<EnvioExcecao>(
            `SELECT * FROM ENVIO_EXCECAO`
          );

        const result: { [key: string]: number } = {};

        for (const excecaoItem of excecao.values()) {
          if (!result[excecaoItem.DESCRICAO]) {
            result[excecaoItem.DESCRICAO] = 1;
          } else {
            result[excecaoItem.DESCRICAO] += 1;
          }
        }

        const sanitizedResult: { key: string; value: number }[] = [];

        Object.keys(result).forEach((acao) =>
          sanitizedResult.push({ key: acao, value: result[acao] })
        );

        res.status(HttpStatusCode.Ok).send({
          status: HttpStatusCode.Ok,
          message: "Found",
          data: sanitizedResult,
        });
      }
    } catch (e: any) {
      DebugLogger.Error(e);
      console.error(e);
      await ApiServer.Services.Database.connection.rollback();
      res.status(e?.status || 500).send({
        status: e?.status || 500,
        message: e?.message || "Internal server error",
        data: e?.data || null,
      });
    }
  }

  private static SanitizeExcecao(query: any) {
    const validTypes = [
      StatusExcecao.GENERAL,
      StatusExcecao.BY_OBSERVATION,
      StatusExcecao.BY_OBSERVATION_ACTIVE,
    ];

    query = String(query).trim().toLowerCase();

    if (!validTypes.includes(query)) return StatusExcecao.GENERAL;

    return query as StatusExcecao;
  }
}
