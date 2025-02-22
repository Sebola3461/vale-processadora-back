import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { HttpStatusCode } from "axios";
import { ModeloEquipamentos } from "../../constants/ModeloEquipamentos";
import { GetEquipmentModel } from "../../helpers/GetEquipmentModel";
import { DebugLogger } from "../../helpers/DebugLogger";
import { ApiServer } from "../../ApiServer";

export class ApiRoute_Manutencao_ProcessaConferencia extends ApiRoute {
  public static Method = HTTPMethod.POST;
  public static Path = "/manutencao/conferencia";

  public static async Handle(req: Request, res: Response) {
    try {
      if (
        !req.body ||
        !req.body.equipamentos ||
        !Array.isArray(req.body.equipamentos)
      )
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Invalid form body",
        };

      const sanitizedBody = req.body.equipamentos
        .map((equipamento: any) => String(equipamento))
        .filter((equipamento: string) => equipamento.trim())
        .filter((equipamento: string) =>
          ModeloEquipamentos.includes(GetEquipmentModel(equipamento))
        );

      if (sanitizedBody.length != req.body.equipamentos.length)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Há equipamentos inválidos na lista!",
        };

      const equipamentosEmManutencao =
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT ID,NUMERO_SERIE FROM MANUTENCAO WHERE NUMERO_SERIE IN (?) AND STATUS_ID NOT IN (4)",
            [sanitizedBody]
          )
        );

      if (equipamentosEmManutencao.length != sanitizedBody.length)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Há equipamentos na lista que não estão em manutenção!",
        };

      ApiServer.Services.Database.connection.beginTransaction();

      for (const serial of sanitizedBody) {
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "UPDATE MANUTENCAO SET STATUS_ID = ?, DATA_FIM = ? WHERE NUMERO_SERIE = ?",
            [4, new Date(), serial]
          )
        );

        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "UPDATE EQUIPAMENTOS SET ENDERECO_ID = 9 WHERE NUMERO_SERIE = ?",
            [serial]
          )
        );
      }

      await ApiServer.Services.Database.connection.commit();

      res.status(HttpStatusCode.Ok).send({
        status: HttpStatusCode.Ok,
        message: "Conferência realizada com sucesso!",
      });
    } catch (e: any) {
      DebugLogger.Error(e);
      console.error(e);

      ApiServer.Services.Database.connection.rollback();

      res.status(e?.status || 500).send({
        status: e?.status || 500,
        message: e?.message || "Internal server error",
        data: e?.data || null,
      });
    }
  }
}
