import { Link, useRouter, type LinkProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";

// Skema (https:, mailto:) atau protocol-relative: bukan rute aplikasi ini.
const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

const ACTIVE_OPTIONS = { exact: true, includeSearch: false } as const;

interface PropTypes extends Omit<ComponentProps<"a">, "href"> {
  href: string;
}

export const AppLink = (props: PropTypes) => {
  const { href, ...rest } = props;

  const router = useRouter({ warn: false });

  // Di luar RouterProvider (test komponen, layar galat akar) tautan biasa cukup.
  if (!router || EXTERNAL.test(href)) return <a href={href} {...rest} />;

  // `to` bertipe ketat per rute; menu dan layar masih menyusun href string.
  // Router mengurai `href` lewat parseSearch, jadi query string-nya utuh.
  const target = { href } as unknown as LinkProps;

  return (
    <Link
      {...rest}
      {...target}
      activeProps={{}}
      activeOptions={ACTIVE_OPTIONS}
    />
  );
};
