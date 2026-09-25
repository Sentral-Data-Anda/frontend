import { isSafeRedirectPath } from "./redirect";

const returnKey = (listPath: string) => `list-return:${listPath}`;

const focusKey = (listPath: string) => `list-focus:${listPath}`;

const read = (key: string): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage melempar di jendela privat.
  }
};

const remove = (key: string) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // sessionStorage melempar di jendela privat.
  }
};

export const saveListReturn = (listPath: string, url: string) =>
  write(returnKey(listPath), url);

export function readListReturn(listPath: string): string {
  const saved = read(returnKey(listPath));

  return isSafeRedirectPath(saved) &&
    (saved === listPath || saved.startsWith(`${listPath}?`))
    ? saved
    : listPath;
}

export const saveListFocus = (listPath: string, id: string) =>
  write(focusKey(listPath), id);

export const readListFocus = (listPath: string): string | null =>
  read(focusKey(listPath));

export const clearListFocus = (listPath: string) => remove(focusKey(listPath));
