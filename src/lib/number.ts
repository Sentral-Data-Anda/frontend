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

// Rupiah dijumlahkan sebagai sen bulat, bukan float: 0.1 + 0.2 !== 0.3 akan
// menolak entri jurnal yang sebenarnya seimbang.
const ZERO = BigInt(0);
const HUNDRED = BigInt(100);

const toCents = (value: string) => {
  const [integer = "", fraction = ""] = value.split(".");
  const digits = integer.replace(/\D/g, "");

  return BigInt(digits || "0") * HUNDRED + BigInt(`${fraction}00`.slice(0, 2));
};

const fromCents = (cents: bigint) => {
  const digits = cents.toString().padStart(3, "0");
  const fraction = digits.slice(-2);

  return fraction === "00"
    ? digits.slice(0, -2)
    : `${digits.slice(0, -2)}.${fraction}`;
};

export type BalanceLine = { debit: string; credit: string };

export type BalanceSide = "debit" | "credit";

export const balanceOf = (lines: readonly BalanceLine[]) => {
  const sum = (pick: (line: BalanceLine) => string) =>
    lines.reduce((total, line) => total + toCents(pick(line)), ZERO);
  const debit = sum((line) => line.debit);
  const credit = sum((line) => line.credit);
  const difference = debit - credit;
  const shortSide: BalanceSide | null =
    difference === ZERO ? null : difference > ZERO ? "credit" : "debit";

  return {
    debit: fromCents(debit),
    credit: fromCents(credit),
    difference: fromCents(difference < ZERO ? -difference : difference),
    shortSide,
    isBalanced: difference === ZERO && debit > ZERO,
  };
};

export const sumAmounts = (values: readonly string[]) =>
  fromCents(values.reduce((total, value) => total + toCents(value), ZERO));
