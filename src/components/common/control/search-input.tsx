"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onSearch,
  label,
  placeholder = "Cari",
  className,
}: {
  value: string;
  onSearch: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const [draftSearch, setDraftSearch] = useState(value);

  useEffect(() => {
    if (draftSearch === value) return;

    const timer = setTimeout(() => onSearch(draftSearch), 300);

    return () => clearTimeout(timer);
  }, [draftSearch, value, onSearch]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
        aria-hidden
      />

      <Input
        type="search"
        value={draftSearch}
        onChange={(event) => setDraftSearch(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        className="pl-8"
      />
    </div>
  );
}
