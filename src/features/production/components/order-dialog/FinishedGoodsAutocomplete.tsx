import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { coreApi } from "@/lib/api";
import { normalizeListResponse } from "@/lib/api-helpers";
import { cn } from "@/lib/utils";
import type { ProductionItemOption } from "./productionOrderForm";
import {
  productionHelperTextClassName,
  productionInputClassName,
} from "./productionOrderFormStyles";

type FinishedGoodsAutocompleteProps = {
  value: ProductionItemOption | null;
  onChange: (value: ProductionItemOption | null) => void;
  error?: string;
  disabled?: boolean;
};

const formatLabel = (item: ProductionItemOption) => item.item_name || item.item_code || `Item ${item.id}`;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightText = (text: string, query: string) => {
  if (!query.trim()) {
    return text;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(query.trim())})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.trim().toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-100 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
};

const FinishedGoodsAutocomplete = ({
  value,
  onChange,
  error,
  disabled = false,
}: FinishedGoodsAutocompleteProps) => {
  const inputId = useId();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value ? formatLabel(value) : "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm.trim());
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm(value ? formatLabel(value) : "");
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const searchQuery = useQuery({
    queryKey: ["production-finished-goods-search", debouncedSearch],
    enabled: open && debouncedSearch.length >= 2,
    queryFn: async () => {
      const response = await coreApi.get<unknown>("/api/items/items/", {
        params: {
          search: debouncedSearch,
          page_size: 20,
        },
      });

      return normalizeListResponse<ProductionItemOption>(response.data);
    },
  });

  const suggestions = useMemo(() => {
    const query = debouncedSearch || searchTerm;
    if (!query.trim()) {
      return [];
    }

    return (searchQuery.data ?? []).filter((item) =>
      [item.item_name, item.item_code, item.unit]
        .filter((candidate): candidate is string => Boolean(candidate))
        .some((candidate) => candidate.toLowerCase().includes(query.trim().toLowerCase())),
    );
  }, [debouncedSearch, searchQuery.data, searchTerm]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setHighlightedIndex(suggestions.length > 0 ? 0 : -1);
  }, [open, suggestions.length]);

  useEffect(() => {
    if (highlightedIndex < 0) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const helperMessage =
    error ??
    (open && debouncedSearch.length >= 2 && !searchQuery.isLoading && suggestions.length === 0
      ? "No matching finished goods found."
      : searchTerm.trim().length > 0 && !value && !open
        ? "Select a finished goods item from the suggestion list."
        : "Search by item code or item name.");

  const handleSelect = (item: ProductionItemOption) => {
    onChange(item);
    setSearchTerm(formatLabel(item));
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (nextValue: string) => {
    setSearchTerm(nextValue);
    setOpen(true);

    if (value && nextValue.trim() !== formatLabel(value)) {
      onChange(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      setOpen(true);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!suggestions.length) {
        return;
      }
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!suggestions.length) {
        return;
      }
      setHighlightedIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && open && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      event.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={cn("relative rounded-xl", open && "ring-2 ring-[#2d6cdf]/15 ring-offset-2 ring-offset-white")}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        <Input
          id={inputId}
          value={searchTerm}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setOpen(false);
                setHighlightedIndex(-1);
              }
            }, 0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          disabled={disabled}
          placeholder="Search finished goods"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-invalid={error ? "true" : "false"}
          className={cn(productionInputClassName, "pl-10 pr-20", error && "border-destructive")}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {searchQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> : null}
          {searchTerm ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => {
                setSearchTerm("");
                onChange(null);
                setOpen(false);
                setHighlightedIndex(-1);
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.35rem)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_42px_-28px_rgba(15,23,42,0.4)]"
        >
          <div className="max-h-72 overflow-y-auto py-1">
            {debouncedSearch.length < 2 ? (
              <div className="px-3 py-3 text-sm text-slate-500">Type at least 2 characters to search finished goods.</div>
            ) : null}

            {debouncedSearch.length >= 2 && searchQuery.isLoading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching products...
              </div>
            ) : null}

            {debouncedSearch.length >= 2 && !searchQuery.isLoading && suggestions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500">No finished goods matched your search.</div>
            ) : null}

            {suggestions.map((item, index) => {
              const query = debouncedSearch || searchTerm;
              const active = index === highlightedIndex;

              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-[#f5f8ff]" : "hover:bg-slate-50",
                  )}
                  onMouseDown={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="font-medium text-slate-900">{highlightText(item.item_name, query)}</span>
                  <span className="text-xs text-slate-500">
                    {highlightText(item.item_code, query)}
                    {item.unit ? ` · ${item.unit}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={cn("mt-2", error ? "text-destructive" : productionHelperTextClassName)}>{helperMessage}</div>
    </div>
  );
};

export default FinishedGoodsAutocomplete;
