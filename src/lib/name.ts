const capitalizeWord = (word: string) =>
  /\p{Lu}/u.test(word)
    ? word
    : word.replace(
        /(^|[/\-(])(\p{Ll})/gu,
        (_, before: string, letter: string) => before + letter.toUpperCase(),
      );

// Harus identik dengan normalisasi nama master di be-sada (docs/design/kejemaatan/master-tambah-baru.md).
export const normalizeName = (text: string): string =>
  text.trim().split(/\s+/).map(capitalizeWord).join(" ");

const keyOf = (text: string) =>
  text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const distance = (a: string, b: string) => {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }

    previous = current;
  }

  return previous[b.length];
};

const similarityOf = (a: string, b: string): number | null => {
  const shorter = Math.min(a.length, b.length);

  if (a === b) return 0;
  if (shorter >= 3 && (a.includes(b) || b.includes(a))) return 1;
  if (shorter >= 4 && distance(a, b) <= 2) return 2;

  return null;
};

export function findSimilar<T extends { label: string }>(
  options: readonly T[],
  text: string,
): T[] {
  const key = keyOf(text);

  if (!key) return [];

  return options
    .map((option) => ({
      option,
      score: similarityOf(keyOf(option.label), key),
    }))
    .filter((match) => match.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 3)
    .map((match) => match.option);
}
