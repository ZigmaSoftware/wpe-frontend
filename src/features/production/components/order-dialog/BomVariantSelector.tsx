import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BOMVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  productionFieldLabelClassName,
  productionHelperTextClassName,
  productionCompactInputClassName,
} from "./productionOrderFormStyles";

type BomVariantSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  options: BOMVariant[];
  loading?: boolean;
  error?: string;
  relatedProductItemId?: number | null;
  hideHelperText?: boolean;
};

const BomVariantSelector = ({
  value,
  onChange,
  options,
  loading = false,
  error,
  relatedProductItemId = null,
  hideHelperText = false,
}: BomVariantSelectorProps) => {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.id) === value) ?? null,
    [options, value],
  );

  return (
    <FormItem>
      <FormLabel className={productionFieldLabelClassName}>BOM Variant</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(productionCompactInputClassName, "w-full justify-between px-3 font-normal")}
            >
              <span className="truncate text-left">
                {selectedOption ? `${selectedOption.variant_code} · ${selectedOption.name}` : "Search or select BOM variant"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] max-w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search BOM variants..." />
            <CommandList>
              <CommandEmpty>{loading ? "Loading BOM variants..." : "No BOM variants found."}</CommandEmpty>
              <CommandGroup>
                {loading ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching BOM variants...
                  </div>
                ) : null}
                {options.map((option) => {
                  const isRelated = relatedProductItemId !== null && option.product_item === relatedProductItemId;

                  return (
                    <CommandItem
                      key={option.id}
                      value={`${option.variant_code} ${option.name} ${option.revision}`}
                      onSelect={() => {
                        onChange(String(option.id));
                        setOpen(false);
                      }}
                      className="items-start gap-3 px-3 py-2.5"
                    >
                      <Check className={cn("mt-0.5 h-4 w-4 shrink-0", value === String(option.id) ? "opacity-100" : "opacity-0")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{option.variant_code}</span>
                          {isRelated ? (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">Related FG</span>
                          ) : null}
                        </div>
                        <div className="truncate text-sm text-slate-600">{option.name}</div>
                        <div className="text-xs text-slate-500">Revision {option.revision}</div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {!hideHelperText ? (
        relatedProductItemId === null ? (
          <div className={productionHelperTextClassName}>Showing all BOM variants. Planned production qty will be processed after selection.</div>
        ) : (
          <div className={productionHelperTextClassName}>Related BOM variants are listed first for the selected finished good.</div>
        )
      ) : null}
      {error ? <FormMessage>{error}</FormMessage> : null}
    </FormItem>
  );
};

export default BomVariantSelector;
