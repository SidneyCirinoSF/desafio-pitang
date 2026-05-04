const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export type DateInput = Date | string;

export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

export function isDateOnlyString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD");
  }

  return new Date(year, month - 1, day); // LOCAL TIME
}

export function toSafeDate(input: DateInput): Date {
  if (isDate(input)) return input;

  if (isDateOnlyString(input)) {
    return parseDateOnly(input);
  }

  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return date;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: DEFAULT_TIMEZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: DEFAULT_TIMEZONE,
});

export function formatDate(input: DateInput): string {
  const date = toSafeDate(input);
  return dateFormatter.format(date);
}

export function formatDateTime(input: DateInput): string {
  const date = toSafeDate(input);
  return dateTimeFormatter.format(date);
}

export function normalizeDateOnlyToUTC(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized;
}

export function toDatabaseDate(input: DateInput): Date {
  const date = toSafeDate(input);
  return normalizeDateOnlyToUTC(date);
}

export function serializeDates(data: unknown): unknown {
  if (isDate(data)) {
    return formatDateTime(data);
  }

  if (Array.isArray(data)) {
    return data.map(serializeDates);
  }

  if (data !== null && typeof data === "object") {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(data as Record<string, unknown>)) {
      result[key] = serializeDates((data as Record<string, unknown>)[key]);
    }

    return result;
  }

  return data;
}
