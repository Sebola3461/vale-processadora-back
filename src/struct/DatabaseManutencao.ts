interface EquipamentoManutencao {
  ID: number;
  NUMERO_SERIE: string;
  STATUS_INGENICO: string | null;
  DATA_ENTRADA: string; // Data e hora no formato ISO 8601
  DATA_ATUALIZACAO: string | null; // Data e hora no formato ISO 8601
  NUMERO_LOTE: string;
  NUMERO_NF: string;
  FABRICANTE: string;
  USUARIO: string;
  STATUS_ID: number;
}
