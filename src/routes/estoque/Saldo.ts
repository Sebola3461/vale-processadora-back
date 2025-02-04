import { Request, Response } from "express";
import { ApiRoute } from "../../models/ApiRoute";
import { HTTPMethod } from "../../struct/HTTPMethod";
import { DebugLogger } from "../../helpers/DebugLogger";
import { Enderecamento } from "../../struct/Enderecamento";
import { ModeloEquipamentos } from "../../constants/ModeloEquipamentos";
import { ApiServer } from "../../ApiServer";
import { AllEnderecamento } from "../../constants/Enderecamento";
import { DatabasePOS } from "../../services/DatabasePOS";

enum TipoConsulta {
  POS = "pos",
  CHIP = "chip",
  TODOS = "todos",
}

export class ApiRoute_Estoque_Saldo extends ApiRoute {
  public static Method = HTTPMethod.GET;
  public static Path = "/estoque/saldo";

  public static async Handle(req: Request, res: Response) {
    try {
      const tipo = ApiRoute_Estoque_Saldo.sanitizaTipo(String(req.query.tipo));
      const endereco_id = ApiRoute_Estoque_Saldo.sanitizaEnderecoId(
        req.query.endereco_id
      );
      const modelos = ApiRoute_Estoque_Saldo.sanitizaModeloPOS(
        String(req.query.modelos)
      );

      const targetEnderecoId =
        endereco_id.length < 1 ? AllEnderecamento : endereco_id;
      const targetModelos = modelos.length == 0 ? ModeloEquipamentos : modelos;

      const resultado =
        await ApiServer.Services.Database.connection.query<DatabasePOS>(
          ApiServer.Services.Database.ParseWildcard(
            "SELECT * FROM [EQUIPAMENTOS] WHERE MODELO IN (?) AND ENDERECO_ID IN (?)",
            [targetModelos, targetEnderecoId]
          )
        );

      return res.status(200).send({
        status: 200,
        message: "Found",
        data: {
          total_all: resultado.length,
          total_endereco: targetEnderecoId.map((endereco) => {
            return {
              endereco_id: endereco,
              size: resultado.filter((pos) => pos.ENDERECO_ID == endereco)
                .length,
            };
          }),
          total_modelo: targetModelos.map((modelo) => {
            return {
              modelo: modelo,
              size: resultado.filter((pos) => pos.MODELO == modelo).length,
            };
          }),
          devices: resultado,
        },
      });
    } catch (e) {
      res.status(500).send({ status: 500, message: "Internal server error" });
      DebugLogger.Error(String(e));
    }
  }

  private static sanitizaEnderecoId(queryInput?: any): number[] {
    const enderecos = String(queryInput)
      .split(",")
      .map((input) => input.trim())
      .filter((input) => !isNaN(Number(input)) && Number(input) > 0)
      .map((input) => Number(input));

    return enderecos;
  }

  private static sanitizaModeloPOS(modelos: string) {
    return modelos
      .split(",")
      .map((modelo) => modelo.toUpperCase().trim())
      .filter((modelo) => modelo)
      .filter((modelo) => ModeloEquipamentos.includes(modelo));
  }

  private static sanitizaTipo(queryInput?: string): TipoConsulta {
    queryInput = String(queryInput?.toLowerCase().trim());

    if (!["pos", "chip", "todos"].includes(queryInput))
      return TipoConsulta.TODOS;

    if (queryInput == "pos") return TipoConsulta.POS;

    if (queryInput == "chip") return TipoConsulta.CHIP;

    return TipoConsulta.TODOS;
  }
}
