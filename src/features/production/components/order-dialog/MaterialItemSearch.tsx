import { useMemo, useState, type KeyboardEventHandler } from "react";
import type { ProductTypeSubtypeLookupItem } from "@/features/wpe-masters/types";
import ComponentAutocompleteDropdown from "@/features/production/components/bom-variants/ComponentAutocompleteDropdown";
import ComponentSearchInput from "@/features/production/components/bom-variants/ComponentSearchInput";
import { useDebouncedItemSearch } from "./useDebouncedItemSearch";
import {
  productionFieldLabelClassName,
  productionHelperTextClassName,
} from "./productionOrderFormStyles";

const MINIMUM_SEARCH_LENGTH = 2;

type MaterialItemSearchProps = {
  onSelect: (item: ProductTypeSubtypeLookupItem) => void;
  existingItems: Array<{ product_subtype?: number | null; item_code: string }>;
};

const MaterialItemSearch = ({ onSelect, existingItems }: MaterialItemSearchProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchQuery = useDebouncedItemSearch(query, true);

  const existingKeys = useMemo(
    () => new Set(existingItems.map((item) => (item.product_subtype ? `PRODUCT_SUBTYPE:${item.product_subtype}` : `CODE:${item.item_code}`))),
    [existingItems],
  );

  const options = useMemo(
    () =>
      (searchQuery.data ?? []).filter(
        (item) => !existingKeys.has(`PRODUCT_SUBTYPE:${item.id}`) && !existingKeys.has(`CODE:${item.code}`),
      ),
    [existingKeys, searchQuery.data],
  );

  const handleSelect = (item: ProductTypeSubtypeLookupItem) => {
    onSelect(item);
    setQuery("");
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!open || options.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1 >= options.length ? 0 : current + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current <= 0 ? options.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0 && options[highlightedIndex]) {
      event.preventDefault();
      handleSelect(options[highlightedIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="space-y-2">
      <label className={productionFieldLabelClassName}>Add an item</label>
      <div className="relative">
        <ComponentSearchInput
          value={query}
          isLoading={searchQuery.isLoading}
          onChange={(value) => {
            setQuery(value);
            setOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
        />
        <ComponentAutocompleteDropdown
          open={open}
          query={query}
          options={options}
          highlightedIndex={highlightedIndex}
          isLoading={searchQuery.isLoading}
          minimumCharacters={MINIMUM_SEARCH_LENGTH}
          onSelect={handleSelect}
          onHighlight={setHighlightedIndex}
        />
      </div>
      <div className={productionHelperTextClassName}>
        Search WPE Product Type subcategories and append them as manual material rows without saving immediately.
      </div>
    </div>
  );
};

export default MaterialItemSearch;
