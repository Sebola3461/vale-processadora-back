import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { HttpStatusCode } from "axios";
import { Fabricantes } from "../../constants/Fabricantes";
import { ModeloEquipamentos } from "../../constants/ModeloEquipamentos";
import { GetEquipmentModel } from "../../helpers/GetEquipmentModel";
import { ApiServer } from "../../ApiServer";
import { DebugLogger } from "../../helpers/DebugLogger";

export class ApiRoute_Manutencao_CriaEntrada extends ApiRoute {
  public static Method = HTTPMethod.POST;
  public static Path = "/manutencao/entrada/criar";

  public static async Handle(req: Request, res: Response) {
    try {
      if (
        !req.body ||
        !req.body.numero_nf ||
        !req.body.numero_lote ||
        !req.body.fabricante ||
        !req.body.equipamentos ||
        isNaN(Number(req.body.numero_nf)) ||
        isNaN(Number(req.body.numero_lote)) ||
        !Fabricantes.includes(req.body.fabricante) ||
        !Array.isArray(req.body.equipamentos)
      )
        throw { status: HttpStatusCode.BadRequest, message: "Bad request" };

      const equipamentos: string[] = req.body.equipamentos.map(
        (equipamento: any) => String(equipamento).trim()
      );

      const equipamentosInvalidos = equipamentos.filter(
        (equipamento) =>
          !ModeloEquipamentos.includes(GetEquipmentModel(equipamento)) ||
          !equipamento
      );

      if (equipamentosInvalidos.length != 0)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Há equipamentos inválidos na lista",
          data: equipamentosInvalidos,
        };

      const equipamentosEmManutencao =
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT * FROM MANUTENCAO WHERE NUMERO_SERIE IN (?)",
            [equipamentos]
          )
        );

      if (equipamentosEmManutencao.length != 0)
        throw {
          status: HttpStatusCode.Conflict,
          message: "Há equipamentos que já estão em manutenção",
          data: equipamentosEmManutencao.map(
            (equip: any) => equip.NUMERO_SERIE
          ),
        };

      if (equipamentos.length < 1)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Não há equipamentos válidos na lista",
        };

      const equipamentosIds =
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT ID FROM EQUIPAMENTOS WHERE NUMERO_SERIE IN (?)",
            [equipamentos]
          )
        );

      if (equipamentosIds.length != equipamentos.length)
        throw {
          status: HttpStatusCode.Conflict,
          message: "Há equipamentos não registrados na lista",
        };

      await ApiServer.Services.Database.connection.beginTransaction();

      for (const equipamento of equipamentos) {
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "INSERT INTO MANUTENCAO (NUMERO_SERIE, STATUS_INGENICO, DATA_ENTRADA, DATA_ATUALIZACAO,NUMERO_LOTE, NUMERO_NF, FABRICANTE, USUARIO, STATUS_ID) VALUES (?,?,?,?,?,?,?,?,?)",
            [
              equipamento,
              null,
              new Date(),
              null,
              req.body.numero_lote,
              req.body.numero_nf,
              req.body.fabricante,
              process.env.USERNAME,
              1,
            ]
          )
        );
      }

      await ApiServer.Services.Database.connection.commit();

      return res.status(HttpStatusCode.Created).send({
        status: HttpStatusCode.Created,
        message: "Equipamentos adicionados com sucesso!",
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
