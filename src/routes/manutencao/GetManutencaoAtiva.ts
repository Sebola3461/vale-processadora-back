import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { DebugLogger } from "../../helpers/DebugLogger";
import { ApiServer } from "../../ApiServer";
import { HttpStatusCode } from "axios";

export class ApiRoute_Manutencao_Status extends ApiRoute {
  public static Method = HTTPMethod.GET;
  public static Path = "/manutencao/chart/atual";

  public static async Handle(req: Request, res: Response) {
    try {
      const allManutencaoEquipamentos =
        await ApiServer.Services.Database.connection.query<EquipamentoManutencao>(
          "SELECT * FROM MANUTENCAO WHERE STATUS_ID NOT IN (4)"
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
}
