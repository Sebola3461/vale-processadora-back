import "colors";

export class DebugLogger {
  public static Sucess(message: string) {
    console.log(`[Sucesso]`.bgGreen.black + " " + message.green);
  }

  public static Error(message: string) {
    console.log(`[Erro]`.bgRed.black + " " + message.red);
  }

  public static Warning(message: string) {
    console.log(`[Alerta]`.bgYellow.black + " " + message.yellow);
  }

  public static Info(message: string) {
    console.log(`[Informação]`.bgCyan.black + " " + message.cyan);
  }
}
