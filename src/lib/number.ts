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
  const [head, ...rest] = value.replace(/[^\d.,]/g, "").split(/[.,]/);
  const integer = toDigits(head ?? "", maxInteger);

  if (rest.length === 0 || maxFraction === 0) return integer;

  const fraction = rest.join("").slice(0, maxFraction);

  return `${integer || "0"}.${fraction}`;
};
