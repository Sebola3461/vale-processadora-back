import express, { json } from "express";
import { ApiRouteManager } from "./ApiRouteManager";
import { HTTPMethod } from "./struct/HTTPMethod";
import { ApiRoute_Estoque_Saldo } from "./routes/estoque/Saldo";
import { ServicesManager } from "./services/ServicesManager";
import cors from "cors";
import { ApiRoute_Estoque_Compra_POS_Criar } from "./routes/estoque/compra/pos/Criar";
import { ApiRoute_Manutencao_ValidaEntrada } from "./routes/manutencao/ValidaEntrada";
import { ApiRoute_Manutencao_CriaEntrada } from "./routes/manutencao/CriarEntrada";
import { ApiRoute_Manutencao_Atualizar } from "./routes/manutencao/AtualizaStatus";
import { ApiRoute_Manutencao_Status } from "./routes/manutencao/GetManutencaoAtiva";
import { ApiRoute_Manutencao_GetDados } from "./routes/manutencao/GetDados";
import { ApiRoute_Manutencao_ProcessaConferencia } from "./routes/manutencao/ProcessaConferencia";
import { ApiRoute_Estoque_MovimentarDispositivo } from "./routes/estoque/movimentacao/MovimentacaoEstoque";
import { ApiRoute_Excecao_Buscar } from "./routes/estoque/excecao/BuscaExcecao";

export class ApiServer {
  private static Server = express();
  public static Services = ServicesManager;
  public static Routes = ApiRouteManager;

  public static async Initialize() {
    this.Server.use(json());
    this.Server.use(cors());
    this.InitializeRoutes();
    await this.Services.AuthenticateAll();

    for (const Route of this.Routes.GetAll()) {
      switch (Route.Method) {
        case HTTPMethod.GET:
          this.Server.get(Route.Path, Route.Handle);
        case HTTPMethod.POST:
          this.Server.post(Route.Path, Route.Handle);
        case HTTPMethod.DELETE:
          this.Server.delete(Route.Path, Route.Handle);
      }
    }

    this.Server.listen(6969, () => console.log("paia"));
  }

  private static InitializeRoutes() {
    this.Routes.RegisterRoute(ApiRoute_Estoque_Saldo);
    this.Routes.RegisterRoute(ApiRoute_Estoque_Compra_POS_Criar);
    this.Routes.RegisterRoute(ApiRoute_Manutencao_ValidaEntrada);
    this.Routes.RegisterRoute(ApiRoute_Manutencao_CriaEntrada);
    this.Routes.RegisterRoute(ApiRoute_Manutencao_Atualizar);
    this.Routes.RegisterRoute(ApiRoute_Manutencao_Status);
    this.Routes.RegisterRoute(ApiRoute_Manutencao_GetDados);
    this.Routes.RegisterRoute(ApiRoute_Manutencao_CriaEntrada);
    this.Routes.RegisterRoute(ApiRoute_Manutencao_ProcessaConferencia);
    this.Routes.RegisterRoute(ApiRoute_Estoque_MovimentarDispositivo);
    this.Routes.RegisterRoute(ApiRoute_Excecao_Buscar);
  }
}
