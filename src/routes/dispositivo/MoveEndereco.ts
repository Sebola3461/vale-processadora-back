import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { DebugLogger } from "../../helpers/DebugLogger";
import { ApiServer } from "../../ApiServer";
import { HttpStatusCode } from "axios";
import { GetEquipmentModel } from "../../helpers/GetEquipmentModel";
import { ModeloEquipamentos } from "../../constants/ModeloEquipamentos";

export class ApiRoute_Move_Endereco extends ApiRoute {
  public static Method = HTTPMethod.POST;
  public static Path = "/dispositivo/movimentar";

  public static async Handle(req: Request, res: Response) {
    try {
      if (
        !req.body ||
        !req.body.numero_serie ||
        typeof req.body.numero_serie != "string" ||
        !req.body.endereco_id ||
        typeof req.body.endereco_id != "number" ||
        isNaN(req.body.endereco_id)
      )
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Invalid form body",
        };

      const targetEndereco = req.body.endereco_id;
      const targetEquipamento = String(req.body.numero_serie).trim();
      const validEnderecos = [1, 2, 3, 5];

      if (!validEnderecos.includes(targetEndereco))
        throw {
          status: HttpStatusCode.BadRequest,
          message: `O endereco_id ${targetEndereco} não é valido!`,
        };

      if (
        !ModeloEquipamentos.includes(GetEquipmentModel(targetEquipamento)) ||
        !targetEquipamento
      )
        throw {
          status: HttpStatusCode.BadRequest,
          message: `O número de série ${targetEquipamento} não é valido!`,
        };

      await ApiServer.Services.Database.connection.beginTransaction();
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
