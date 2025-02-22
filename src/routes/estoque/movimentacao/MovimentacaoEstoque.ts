import { Request, Response } from "express";
import { ApiRoute } from "../../../models/ApiRoute";
import { HTTPMethod } from "../../../struct/HTTPMethod";
import { DebugLogger } from "../../../helpers/DebugLogger";
import { ApiServer } from "../../../ApiServer";
import { ModeloEquipamentos } from "../../../constants/ModeloEquipamentos";
import { HttpStatusCode } from "axios";
import { GetEquipmentModel } from "../../../helpers/GetEquipmentModel";
import { Enderecamento } from "../../../struct/Enderecamento";

interface EquipamentoMovimentacao {
  serial: string;
  tipo: Enderecamento;
}

export class ApiRoute_Estoque_MovimentarDispositivo extends ApiRoute {
  public static Method = HTTPMethod.POST;
  public static Path = "/estoque/movimentar";

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

      const sanitizedEquipamentos = req.body.equipamentos
        .map((equip: any) => {
          return {
            serial: String(equip.serial).trim(),
            tipo: Number(equip.tipo),
          };
        })
        .filter(
          (equip: { serial: string; tipo: number }) =>
            equip.serial &&
            !isNaN(equip.tipo) &&
            [
              Enderecamento.ESTOQUE_NOVO,
              Enderecamento.ESTOQUE_USADO,
              Enderecamento.ESTOQUE_TESTE,
              Enderecamento.CLIENTE_LOCACAO,
            ].includes(equip.tipo) &&
            ModeloEquipamentos.includes(GetEquipmentModel(equip.serial))
        ) as EquipamentoMovimentacao[];

      if (sanitizedEquipamentos.length != req.body.equipamentos.length)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Há equipamentos inválidos na lista!",
        };

      const equipamentosRegistrados =
        await ApiServer.Services.Database.connection.query<{
          NUMERO_SERIE: string;
          ID: number;
          ENDERECO_ID: number;
        }>(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT ID,NUMERO_SERIE,ENDERECO_ID FROM EQUIPAMENTOS WHERE NUMERO_SERIE IN (?)",
            [sanitizedEquipamentos.map((equip) => equip.serial)]
          )
        );

      if (equipamentosRegistrados.length != sanitizedEquipamentos.length)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Equipamento não encontrado!",
          data: sanitizedEquipamentos.filter(
            (equip) =>
              !equipamentosRegistrados.find(
                (equipamentoRegistrado) =>
                  equipamentoRegistrado.NUMERO_SERIE == equip.serial
              )
          ),
        };

      const validacaoTipoEquipamentos =
        ApiRoute_Estoque_MovimentarDispositivo.ValidateTipoMovimentacao(
          sanitizedEquipamentos,
          equipamentosRegistrados
        );

      if (validacaoTipoEquipamentos.filter((equip) => !equip.ok).length != 0)
        throw {
          status: HttpStatusCode.BadRequest,
          message: "Endereço atual não permite esta movimentação",
          data: validacaoTipoEquipamentos.filter((equip) => !equip.ok),
        };

      await ApiServer.Services.Database.connection.beginTransaction();

      for (const equipamento of sanitizedEquipamentos) {
        await ApiServer.Services.Database.connection.query(
          ApiServer.Services.Database.ParseWildcard(
            "UPDATE EQUIPAMENTOS SET ENDERECO_ID = ? WHERE NUMERO_SERIE = ?",
            [equipamento.tipo, equipamento.serial]
          )
        );
      }

      await ApiServer.Services.Database.connection.commit();

      res.status(HttpStatusCode.Ok).send({
        status: HttpStatusCode.Ok,
        message: "Equipamentos movimentados com sucesso!",
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

  private static ValidateTipoMovimentacao(
    equipamentos: EquipamentoMovimentacao[],
    baseEquipamentos: {
      NUMERO_SERIE: string;
      ID: number;
      ENDERECO_ID: number;
    }[]
  ): (EquipamentoMovimentacao & { ok: boolean })[] {
    const resultado = [] as (EquipamentoMovimentacao & { ok: boolean })[];

    for (const equipamento of equipamentos) {
      const enderecosEntradaEstoque = [
        Enderecamento.ESTOQUE_NOVO,
        Enderecamento.ESTOQUE_USADO,
        Enderecamento.ESTOQUE_TESTE,
      ];

      const enderecosSaidaEstoque = [Enderecamento.CLIENTE_LOCACAO];

      const index = baseEquipamentos.findIndex(
        (equip) => equip.NUMERO_SERIE == equipamento.serial
      );

      if (index >= 0) {
        if (
          enderecosEntradaEstoque.includes(equipamento.tipo) &&
          enderecosEntradaEstoque.includes(baseEquipamentos[index].ENDERECO_ID)
        ) {
          resultado.push({
            serial: equipamento.serial,
            ok: false,
            tipo: equipamento.tipo,
          });
        } else if (
          enderecosSaidaEstoque.includes(equipamento.tipo) &&
          !enderecosEntradaEstoque.includes(baseEquipamentos[index].ENDERECO_ID)
        )
          resultado.push({
            serial: equipamento.serial,
            ok: false,
            tipo: equipamento.tipo,
          });
      } else {
        resultado.push({
          serial: equipamento.serial,
          ok: false,
          tipo: equipamento.tipo,
        });
      }
    }

    return resultado;
  }
}
