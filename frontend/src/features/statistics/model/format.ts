const numberFormatter = new Intl.NumberFormat("ru-RU");

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatStatisticNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatStatisticDate(value: string | null) {
  if (!value) return "Нет данных";
  return dateFormatter.format(new Date(value));
}
