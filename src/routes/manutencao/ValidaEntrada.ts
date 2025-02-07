import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { GetEquipmentModel } from "../../helpers/GetEquipmentModel";
import { ModeloEquipamentos } from "../../constants/ModeloEquipamentos";
import { ApiServer } from "../../ApiServer";
import { HttpStatusCode } from "axios";

export class ApiRoute_Manutencao_ValidaEntrada extends ApiRoute {
  public static Method = HTTPMethod.GET;
  public static Path = "/manutencao/entrada/validar";

  public static async Handle(req: Request, res: Response) {
    try {
      const serial = ApiRoute_Manutencao_ValidaEntrada.validaSerialString(
        req.query.numero_serie
      );

      if (!serial)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Número de série inválido",
        };

      const dadosEquipamento =
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT ID FROM EQUIPAMENTOS WHERE NUMERO_SERIE = ?",
            [serial]
          )
        );

      if (!dadosEquipamento[0] || !dadosEquipamento)
        throw {
          status: HttpStatusCode.Conflict,
          message: "Equipamento não registrado",
        };

      const dadosManutencao =
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT * FROM MANUTENCAO WHERE NUMERO_SERIE = ?",
            [serial]
          )
        );

      if (dadosManutencao[0])
        throw {
          status: HttpStatusCode.Conflict,
          message: "Equipamento já em manutenção",
        };

      return res.status(HttpStatusCode.Ok).send({
        status: HttpStatusCode.Ok,
        message: "Equipamento válido para manutenção",
      });
    } catch (e: any) {
      res.status(e?.status || 500).send({
        status: e?.status || 500,
        message: e?.message || "Internal server error",
        data: e?.data || null,
      });
    }
  }

  private static validaSerialString(input: any): string | undefined {
    const inputTransformed = (String(input) as string).trim();

    if (ModeloEquipamentos.includes(GetEquipmentModel(inputTransformed)))
      return inputTransformed;

    return undefined;
  }
}
