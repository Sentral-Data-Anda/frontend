// Telepon, rekening, dan hitungan boleh diawali nol, jadi bukan toDigits yang
// membuang nol depan. Urutan toDigits dijaga: nol depan dibuang SEBELUM slice,
// supaya "0012345" dengan maxLength 5 tetap "12345", bukan "123".
export const keepDigits = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

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

const PLAIN_DECIMAL = /^(\d*)(?:\.(\d*))?$/;

const scaledOf = (value: string) => {
  const match = PLAIN_DECIMAL.exec(value);

  if (!match || !(match[1] || match[2])) return null;

  const fraction = match[2] ?? "";

  return {
    digits: BigInt(`${match[1] ?? ""}${fraction}` || "0"),
    scale: fraction.length,
  };
};

/**
 * Jumlah x harga sebagai string desimal, dihitung dengan BigInt (float rusak di
 * atas 15 digit). Dibulatkan setengah-naik ke sen; kosong/nol/bukan angka -> null.
 */
export const lineAmountText = (quantity: string, price: string) => {
  const a = scaledOf(quantity);
  const b = scaledOf(price);

  if (!a || !b) return null;

  const product = a.digits * b.digits;
  const excess = a.scale + b.scale - 2;
  const divisor = BigInt(10) ** BigInt(Math.max(excess, 0));
  const cents =
    excess > 0
      ? (product + divisor / BigInt(2)) / divisor
      : product * BigInt(10) ** BigInt(-excess);

  return cents > ZERO ? fromCents(cents) : null;
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

/**
 * By how much `spent` plus `draft` goes past `ceiling`, or null when it does
 * not.
 *
 * Cents throughout, like everything else in this file: all three are Decimal
 * strings, two from the API and one summed out of form fields, and a float
 * comparison would report an overrun on a disbursement that lands exactly on
 * the ceiling.
 *
 * Exactly on the ceiling is NOT an overrun, which is the server's own rule in
 * `withinCeiling` — `committed.plus(proposed).lessThanOrEqualTo(ceiling)`.
 * Two answers to one question is the thing worth avoiding here: the screen
 * only warns, so a screen that disagreed would be warning about nothing.
 */
export const overBy = (
  ceiling: string,
  spent: string,
  draft: string,
): string | null => {
  const excess = toCents(spent) + toCents(draft) - toCents(ceiling);

  return excess > ZERO ? fromCents(excess) : null;
};
