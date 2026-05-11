import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Package2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { coreApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { StoreStockRecord } from "@/lib/types";

type AdditiveItemAutocompleteProps = {
  selectedItem: StoreStockRecord | null;
  onSelectedItemChange: (item: StoreStockRecord | null) => void;
  error?: string;
  disabled?: boolean;
};

const unwrapStoreStockResults = (payload: StoreStockRecord[] | { data?: { results?: StoreStockRecord[] } }) =>
  Array.isArray(payload) ? payload : payload.data?.results ?? [];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightText = (text: string, query: string) => {
  if (!query.trim()) {
    return text;
  }

  const pattern = new RegExp(`(${escapeRegExp(query.trim())})`, "ig");
  const parts = text.split(pattern);

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

const formatOptionLabel = (item: StoreStockRecord) => item.item_name || item.item_code || `Item ${item.item}`;

const AdditiveItemAutocomplete = ({
  selectedItem,
  onSelectedItemChange,
  error,
  disabled = false,
}: AdditiveItemAutocompleteProps) => {
  const listboxId = useId();
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(selectedItem ? formatOptionLabel(selectedItem) : "");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm(selectedItem ? formatOptionLabel(selectedItem) : "");
  }, [selectedItem]);

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

  const suggestionsQuery = useQuery({
    queryKey: ["additive-item-suggestions", debouncedSearchTerm],
    enabled: open,
    queryFn: async () => {
      const response = await coreApi.get<StoreStockRecord[] | { data?: { results?: StoreStockRecord[] } }>(
        "/api/blending/request-stock/",
        {
          params: {
            search: debouncedSearchTerm || undefined,
            page_size: 20,
          },
        },
      );

      return unwrapStoreStockResults(response.data);
    },
  });

  const suggestions = suggestionsQuery.data ?? [];
  const hasTypedValue = searchTerm.trim().length > 0;
  const hasExactSelection =
    selectedItem !== null && searchTerm.trim().toLowerCase() === formatOptionLabel(selectedItem).trim().toLowerCase();
  const showNoResults = open && hasTypedValue && !suggestionsQuery.isLoading && suggestions.length === 0;
  const showSelectionPrompt = !open && hasTypedValue && !selectedItem;
  const helperMessage =
    error || (showNoResults ? "No matching products found" : showSelectionPrompt ? "Please select a valid additive item" : undefined);

  useEffect(() => {
    if (!open) {
      return;
    }

    setHighlightedIndex(suggestions.length ? 0 : -1);
  }, [open, suggestions.length]);

  const inputValue = selectedItem && hasExactSelection ? formatOptionLabel(selectedItem) : searchTerm;

  const canSubmitSelection = useMemo(() => selectedItem !== null && hasExactSelection, [selectedItem, hasExactSelection]);

  const handleSelect = (item: StoreStockRecord) => {
    onSelectedItemChange(item);
    setSearchTerm(formatOptionLabel(item));
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (nextValue: string) => {
    setSearchTerm(nextValue);
    setOpen(true);

    if (selectedItem && nextValue.trim() !== formatOptionLabel(selectedItem)) {
      onSelectedItemChange(null);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    onSelectedItemChange(null);
    setOpen(false);
    setHighlightedIndex(-1);
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

    if (event.key === "Enter" && open) {
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        event.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "relative rounded-md transition-all",
          open && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
      >
        <Input
          id={inputId}
          value={inputValue}
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
          placeholder="Search additive from store stock"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={helperMessage ? "true" : "false"}
          role="combobox"
          className={cn(
            "pr-20",
            helperMessage && "border-destructive focus-visible:ring-destructive",
          )}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {suggestionsQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          {inputValue ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={handleClear}
              aria-label="Clear selected additive item"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-[calc(100%+0.35rem)] z-50 w-full overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <div className="max-h-80 overflow-y-auto py-1">
            {suggestionsQuery.isLoading ? (
              <div className="flex min-h-14 items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading store stock suggestions...
              </div>
            ) : null}

            {!suggestionsQuery.isLoading && suggestions.length ? (
              suggestions.map((item, index) => {
                const isSelected = selectedItem?.item === item.item;
                const isActive = highlightedIndex === index;
                const query = debouncedSearchTerm || searchTerm;

                return (
                  <button
                    key={`${item.id}-${item.item}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(item)}
                  >
                    <Package2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{highlightText(item.item_name, query)}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        <span>{highlightText(item.item_code, query)}</span>
                        <span>
                          {item.quantity} {item.unit}
                        </span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                    {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
                  </button>
                );
              })
            ) : null}

            {!suggestionsQuery.isLoading && suggestions.length === 0 ? (
              <div className="min-h-14 px-3 py-3 text-sm text-muted-foreground">
                No matching products found
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedItem && canSubmitSelection ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selectedItem.item_name}</span> ({selectedItem.item_code}) with{" "}
          {selectedItem.quantity} {selectedItem.unit} available in store.
        </p>
      ) : null}
      {helperMessage ? <p className="mt-2 text-sm text-destructive">{helperMessage}</p> : null}
    </div>
  );
};

export default AdditiveItemAutocomplete;
