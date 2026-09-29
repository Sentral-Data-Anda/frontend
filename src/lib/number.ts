export const toDigits = (value: string, maxLength: number) =>
  value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, maxLength);

export const toDecimal = (
  value: string,
  maxInteger: number,
  maxFraction: number,
) => {
  const [head, ...rest] = value.replace(/[^\d,]/g, "").split(",");
  const integer = toDigits(head ?? "", maxInteger);

  if (rest.length === 0 || maxFraction === 0) return integer;

  return `${integer || "0"}.${rest.join("").slice(0, maxFraction)}`;
};

export const groupAmount = (value: string) => {
  const [integer = "", fraction] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return fraction === undefined ? grouped : `${grouped},${fraction}`;
};

export const lineAmount = (quantity: string, price: string) => {
  const amount = Number(quantity) * Number(price);

  return quantity && price && amount > 0 ? amount : null;
};
