import { AllEnderecamento } from "../constants/Enderecamento";
import { ModeloEquipamentos } from "../constants/ModeloEquipamentos";

export interface DatabasePOS {
  ID: number;
  NUMERO_SERIE: string;
  MODELO: keyof typeof ModeloEquipamentos;
  ENDERECO_ID: keyof typeof AllEnderecamento;
  STATUS_RECOLHA: null;
  DATA_MODIFICACAO: string | null;
  DATA_REGISTRO: string | null;
  ORIGEM: "OWN" | "VALECARD";
}
