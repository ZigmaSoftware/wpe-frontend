import { Loader2, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentSearchOption } from "@/features/production/components/bom-variants/types";

type ComponentAutocompleteDropdownProps = {
  open: boolean;
  query: string;
  options: ComponentSearchOption[];
  highlightedIndex: number;
  isLoading: boolean;
  minimumCharacters: number;
  onSelect: (option: ComponentSearchOption) => void;
  onHighlight: (index: number) => void;
};

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

const ComponentAutocompleteDropdown = ({
  open,
  query,
  options,
  highlightedIndex,
  isLoading,
  minimumCharacters,
  onSelect,
  onHighlight,
}: ComponentAutocompleteDropdownProps) => {
  if (!open) {
    return null;
  }

  const trimmedQuery = query.trim();

  return (
    <div className="absolute top-[calc(100%+0.45rem)] z-50 w-full overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
      <div className="max-h-80 overflow-y-auto py-1">
        {isLoading ? (
          <div className="flex min-h-14 items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading subcategories...
          </div>
        ) : null}

        {!isLoading && trimmedQuery.length < minimumCharacters ? (
          <div className="min-h-14 px-3 py-3 text-sm text-muted-foreground">
            Type at least {minimumCharacters} characters to search subcategories.
          </div>
        ) : null}

        {!isLoading && trimmedQuery.length >= minimumCharacters && options.length === 0 ? (
          <div className="min-h-14 px-3 py-3 text-sm text-muted-foreground">
            No matching subcategories found.
          </div>
        ) : null}

        {!isLoading && trimmedQuery.length >= minimumCharacters && options.length > 0
          ? options.map((option, index) => {
              const isActive = highlightedIndex === index;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                    isActive && "bg-accent text-accent-foreground",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => onHighlight(index)}
                  onClick={() => onSelect(option)}
                >
                  <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{highlightText(option.name, trimmedQuery)}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                      <span>{highlightText(option.category_name, trimmedQuery)}</span>
                      <span>{highlightText(option.code, trimmedQuery)}</span>
                    </div>
                  </div>
                </button>
              );
            })
          : null}
      </div>
    </div>
  );
};

export default ComponentAutocompleteDropdown;
