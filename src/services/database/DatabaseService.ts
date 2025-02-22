import odbc from "odbc";
import { DebugLogger } from "../../helpers/DebugLogger";
import { FormatDateToSQL } from "../../helpers/SQLDate";

/**
 * Para o ser que vai ler isso depois, essa classe é apenas para encapsular todos os helpers e funções relacionadas ao banco de dados
 */
export class DatabaseService {
  private static _connection: odbc.Connection;

  public static get connection() {
    return this._connection;
  }
  /**
   * Isso é um jeito meio "diferenciado" para conseguir transformar os caracteres de placeholder (?) em uma query em valores, já que o ODBC não tem suporte...
   */
  public static ParseWildcard(
    query: string,
    values: (
      | string
      | (string | number)[]
      | number
      | undefined
      | boolean
      | Date
      | null
    )[]
  ) {
    for (let i = 0; i < values.length; i++) {
      let valueToReplace = values[i];
      let sanitizedValue = valueToReplace;

      if (
        valueToReplace == undefined ||
        valueToReplace == null ||
        !valueToReplace
      ) {
        sanitizedValue = "NULL";
      }

      if (valueToReplace instanceof Date) {
        sanitizedValue = `'${FormatDateToSQL(valueToReplace)}'`;
      }

      if (Array.isArray(valueToReplace)) {
        sanitizedValue = valueToReplace
          .map((value) => {
            if (typeof value == "number") return value;

            return `'${value}'`;
          })
          .join(",");
      }

      if (typeof valueToReplace == "number") {
        sanitizedValue = valueToReplace;
      }

      if (typeof valueToReplace == "string") {
        if (!valueToReplace) {
          sanitizedValue = "NULL";
        } else {
          sanitizedValue = `'${valueToReplace}'`;
        }
      }

      if (typeof valueToReplace == "boolean") {
        sanitizedValue = valueToReplace ? "-1" : "0";
      }

      query = query.replace("?", String(sanitizedValue));
    }

    return query;
  }

  public static async connect() {
    try {
      // banco local GPRS_LOGISTICA_LOCAL e BANCO_GPRS_LOGISTICA_DE_POS prod BANCO_GPRS_LOGISTICA_BACKUP
      this._connection = await odbc.connect(`DSN=BANCO_GPRS_LOGISTICA_BACKUP`);

      DebugLogger.Sucess("Conectado ao banco de dados!");
    } catch (error) {
      DebugLogger.Error(
        `Não foi possível se conectar ao banco de dados: ${error}`
      );
    }
  }
}
