import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { DebugLogger } from "../../helpers/DebugLogger";
import { ApiServer } from "../../ApiServer";
import { HttpStatusCode } from "axios";

export class ApiRoute_Manutencao_Status extends ApiRoute {
  public static Method = HTTPMethod.GET;
  public static Path = "/manutencao/chart/mensal";

  public static async Handle(req: Request, res: Response) {
    try {
      const timeRange = ApiRoute_Manutencao_Status.parseTimeRange(
        req.query.time_range
      );

      const queries = {
        last_months:
          "SELECT * FROM MANUTENCAO WHERE DATA_ENTRADA BETWEEN CURDATE() - INTERVAL 3 MONTH AND CURDATE()",
        this_year:
          "SELECT * FROM MANUTENCAO WHERE YEAR(DATA_ENTRADA) = YEAR(CURDATE())",
      } as { [key: string]: string };

      const allManutencaoEquipamentos =
        await ApiServer.Services.Database.connection.query<EquipamentoManutencao>(
          queries[timeRange]
        );

      const sanitizedOutput = [] as EquipamentoManutencao[];

      for (const equipamento of allManutencaoEquipamentos.values()) {
        sanitizedOutput.push(equipamento); // remove objetos de funções e adiciona apenas valores
      }

      const objectOutput = {
        equipamentos: sanitizedOutput,
      };

      res.status(HttpStatusCode.Ok).send({
        status: HttpStatusCode.Ok,
        message: "Ok",
        data: objectOutput,
      });
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

  private static parseTimeRange(input: any) {
    const validRanges = ["last_months", "this_year"];

    const inputString = String(input).trim().toLowerCase();

    if (!validRanges.includes(inputString)) return validRanges[0];

    return inputString;
  }
}
