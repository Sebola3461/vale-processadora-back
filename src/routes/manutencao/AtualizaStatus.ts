import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { DebugLogger } from "../../helpers/DebugLogger";
import { ApiServer } from "../../ApiServer";
import { HttpStatusCode } from "axios";
import { ModeloEquipamentos } from "../../constants/ModeloEquipamentos";
import { GetEquipmentModel } from "../../helpers/GetEquipmentModel";

export class ApiRoute_Manutencao_Atualizar extends ApiRoute {
  public static Method = HTTPMethod.POST;
  public static Path = "/manutencao/atualizar";

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

      const bodyEquipamentos = Array.from(req.body.equipamentos)
        .filter((item) => item)
        .filter(
          (item: any) =>
            typeof item.serial == "string" &&
            typeof item.status == "string" &&
            ModeloEquipamentos.includes(GetEquipmentModel(item.serial))
        );

      if (bodyEquipamentos.length != req.body.equipamentos.length)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Há equipamentos inválidos na lista!",
          data: Array.from(req.body.equipamentos)
            .filter(
              (item: any) =>
                typeof item?.serial != "string" ||
                typeof item?.status != "string" ||
                !ModeloEquipamentos.includes(GetEquipmentModel(item.serial))
            )
            .concat(Array.from(req.body.equipamentos).filter((item) => !item)),
        };

      const sanitizedEquipamentos = bodyEquipamentos as {
        serial: string;
        status: string;
      }[];

      if (sanitizedEquipamentos.length < 1)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Não há equipamentos na lista!",
        };

      const dadosEquipamentoManutencao =
        await ApiServer.Services.Database.connection.query<{
          ID: string;
          NUMERO_SERIE: string;
        }>(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT NUMERO_SERIE,ID FROM MANUTENCAO WHERE NUMERO_SERIE IN (?)",
            sanitizedEquipamentos.map((equip) => equip.serial)
          )
        );

      if (dadosEquipamentoManutencao.length != sanitizedEquipamentos.length)
        throw {
          status: HttpStatusCode.Conflict,
          message:
            "Há equipamentos que não foram encontrados na relação geral de manutenção",
          data: sanitizedEquipamentos.filter(
            (equip) =>
              !dadosEquipamentoManutencao.find(
                (manutencaoEquip) =>
                  manutencaoEquip.NUMERO_SERIE == equip.serial
              )
          ),
        };

      await ApiServer.Services.Database.connection.beginTransaction();

      for (const equipamento of sanitizedEquipamentos) {
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "UPDATE [MANUTENCAO] SET STATUS_INGENICO = ?, DATA_ATUALIZACAO = ? WHERE NUMERO_SERIE = ?",
            [equipamento.status, new Date(), equipamento.serial]
          )
        );
      }

      await ApiServer.Services.Database.connection.commit();

      res.status(HttpStatusCode.Ok).send({
        status: HttpStatusCode.Ok,
        message: "Dados atualizados com sucesso!",
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
