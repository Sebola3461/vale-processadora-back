import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { HttpStatusCode } from "axios";
import { ModeloEquipamentos } from "../../constants/ModeloEquipamentos";
import { GetEquipmentModel } from "../../helpers/GetEquipmentModel";
import { ApiServer } from "../../ApiServer";
import { DebugLogger } from "../../helpers/DebugLogger";

export class ApiRoute_Manutencao_GetDados extends ApiRoute {
  public static Method = HTTPMethod.GET;
  public static Path = "/manutencao/equipamento";

  public static async Handle(req: Request, res: Response) {
    try {
      const numeroSerie = String(req.query.numero_serie).trim();

      if (!numeroSerie)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Missing numero_serie query parameter",
        };

      if (!ModeloEquipamentos.includes(GetEquipmentModel(numeroSerie)))
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Número de série inválido",
        };

      const dadosManutencao =
        await ApiServer.Services.Database.connection.query<EquipamentoManutencao>(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT * FROM MANUTENCAO WHERE NUMERO_SERIE = ? AND STATUS_ID NOT IN (4)",
            [numeroSerie]
          )
        );

      if (dadosManutencao.length != 1)
        throw {
          status: HttpStatusCode.Forbidden,
          message: "Equipamento não está em manutenção",
        };

      return res.status(200).send({
        status: HttpStatusCode.Ok,
        message: "Ok",
        data: dadosManutencao[0],
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
