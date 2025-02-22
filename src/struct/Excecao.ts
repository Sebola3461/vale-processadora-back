interface EnvioExcecao {
  ID: number;
  NUMERO_SERIE: string;
  DATA_INICIO: string;
  FLAG_OWN: "0" | "1";
  DATA_FIM: string | null;
  DESCRICAO: string;
  REQUISITANTE: string;
  METODO_POSTAGEM: string;
  IDENTIFICACAO_POSTAGEM: string;
  TIPO_OBJETO: string;
}
