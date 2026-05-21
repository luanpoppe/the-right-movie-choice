import * as dateFns from "date-fns";

export function stringfy(obj: object) {
  return JSON.stringify(obj, null, 2);
}

export function gerarNumeroAleatorioEmIntervalo(
  numeroInicial: number,
  numeroFinal: number
) {
  return (
    Math.floor(Math.random() * (numeroFinal - numeroInicial + 1)) +
    numeroInicial
  );
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class DateUtils {
  static SPTimezone = "America/Sao_Paulo";

  static showDateInSPTime(date: Date) {
    return DateUtils.dateFormatter.format(date);
  }

  static showTimeInSPTime(date: Date): string {
    return DateUtils.timeFormatter.format(date);
  }

  static returnDateFromSPDate(dateAsInBrasil: string) {
    const hasDash = dateAsInBrasil.includes("-");
    const hasBarra = dateAsInBrasil.includes("/");
    if (!hasDash && !hasBarra)
      throw new Error("Data passada no formato errado");

    const [dia, mes, ano] = hasDash
      ? dateAsInBrasil.split("-")
      : dateAsInBrasil.split("/");

    const anoAsNumber = Number(ano);
    const mesAsNumber = Number(mes);
    const diaAsNumber = Number(dia);
    if (isNaN(anoAsNumber) || isNaN(mesAsNumber) || isNaN(diaAsNumber))
      throw new Error(
        "Algum dos valores passados como dia, mês ou ano não foi um número válido"
      );

    return new Date(anoAsNumber, mesAsNumber - 1, diaAsNumber);
  }

  static getDiaCom02Digitos(data: Date) {
    return dateFns.format(data, "dd");
  }

  private static dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: DateUtils.SPTimezone,
  });

  private static timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: DateUtils.SPTimezone,
    hour: "2-digit", // Formato da hora com 2 dígitos (ex: 09)
    minute: "2-digit", // Formato do minuto com 2 dígitos (ex: 05)
    // second: "2-digit", // Formato do segundo com 2 dígitos (ex: 01)
    hour12: false, // Usa o formato 24 horas (opcional, mas comum no Brasil)
  });
}

export class Utils {
  static Date = DateUtils;

  static async delay(segundos: number) {
    return new Promise((resolve) => setTimeout(resolve, segundos * 1000));
  }

  static gerarNumeroAleatorioEmIntervalo(
    numeroInicial: number,
    numeroFinal: number
  ) {
    return (
      Math.floor(Math.random() * (numeroFinal - numeroInicial + 1)) +
      numeroInicial
    );
  }

  static async executeAndReturnTrue(fn: CallableFunction) {
    await fn();
    return true;
  }
}

export class ErrorHandler {
  static async catchError<T>(
    promise: Promise<T>
  ): Promise<[undefined, T] | [Error]> {
    try {
      return [undefined, await promise];
    } catch (error) {
      return [error];
    }
  }

  static async catchErrorTyped<T, E extends new (message?: string) => Error>(
    promise: Promise<T>,
    errorsToCatch?: E[]
  ): Promise<[undefined, T] | [InstanceType<E>]> {
    try {
      return [undefined, await promise];
    } catch (error) {
      if (errorsToCatch === undefined) {
        return [error as InstanceType<E>];
      }
      const isExpectedError = errorsToCatch.some(
        (ExpectedError) => error instanceof ExpectedError
      );

      if (isExpectedError) {
        return [error as InstanceType<E>];
      }

      throw error;
    }
  }
}
