import { Request, Response } from "express";
import { ApiRoute } from "../../../../models/ApiRoute";
import { HTTPMethod } from "../../../../struct/HTTPMethod";
import { DebugLogger } from "../../../../helpers/DebugLogger";
import { ModeloEquipamentos } from "../../../../constants/ModeloEquipamentos";
import { GetEquipmentModel } from "../../../../helpers/GetEquipmentModel";
import { ApiServer } from "../../../../ApiServer";
import { HttpStatusCode } from "axios";
import { FormatDateToSQL } from "../../../../helpers/SQLDate";
import { GetArrayDuplicates } from "../../../../helpers/GetArrayDuplicates";

export class ApiRoute_Estoque_Compra_POS_Criar extends ApiRoute {
  public static Method = HTTPMethod.POST;
  public static Path = "/estoque/compra/pos/criar";

  public static async Handle(req: Request, res: Response) {
    try {
      if (
        !req.body ||
        !req.body.origem_insercao ||
        !["OWN", "VALECARD"].includes(req.body.origem_insercao) ||
        !Array.isArray(req.body.devices)
      )
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Invalid form body",
        };

      const origemInsercao = req.body.origem_insercao as "OWN" | "VALECARD";
      const seriaisInsercao = req.body.devices
        .map((device: any) => String(device).trim())
        .filter((device: string) =>
          ModeloEquipamentos.includes(GetEquipmentModel(device))
        ) as string[];

      if (seriaisInsercao.length != req.body.devices.length)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Há serias inválidos na lista de inserção!",
          data: req.body.devices
            .map((device: any) => String(device).trim())
            .filter(
              (device: string) =>
                !ModeloEquipamentos.includes(GetEquipmentModel(device))
            ),
        };

      const duplicatedValues = GetArrayDuplicates(seriaisInsercao);

      if (duplicatedValues.length != 0)
        throw {
          status: HttpStatusCode.Conflict,
          message:
            "Há seriais duplicados na relação! Remova-os para continuar.",
          data: duplicatedValues,
        };

      const conflictObjects =
        await ApiServer.Services.Database.connection.query<{
          NUMERO_SERIE: string;
        }>(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT NUMERO_SERIE FROM [EQUIPAMENTOS] WHERE NUMERO_SERIE IN (?)",
            [seriaisInsercao]
          )
        );

      if (conflictObjects.length != 0)
        throw {
          status: HttpStatusCode.Conflict,
          message:
            "Há seriais que já estão cadastrados! Remova-os para continuar.",
          data: conflictObjects.map((pos) => pos.NUMERO_SERIE),
        };

      const insertDate = new Date();

      await ApiServer.Services.Database.connection.beginTransaction();

      for (const serial of seriaisInsercao) {
        const insertQuery =
          "INSERT INTO [EQUIPAMENTOS] (NUMERO_SERIE, MODELO, ENDERECO_ID, DATA_REGISTRO, ORIGEM) VALUES \n".concat(
            `('${serial}', '${GetEquipmentModel(
              serial
            )}', 1, '${FormatDateToSQL(insertDate)}', '${origemInsercao}')`
          );

        await ApiServer.Services.Database.connection.query(insertQuery);
      }

      await ApiServer.Services.Database.connection.commit();

      res.status(201).send({
        status: HttpStatusCode.Created,
        message: "Created",
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
