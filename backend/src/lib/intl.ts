const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date));
}

export function formatDateOnly(date: Date | string): string {
  return dateOnlyFormatter.format(new Date(date));
}

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

export function serializeDates(data: unknown): unknown {
  if (isDate(data)) {
    return dateTimeFormatter.format(data);
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
