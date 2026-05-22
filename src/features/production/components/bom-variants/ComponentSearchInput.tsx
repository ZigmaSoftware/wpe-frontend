import type { KeyboardEventHandler } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type ComponentSearchInputProps = {
  value: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
};

const ComponentSearchInput = ({
  value,
  isLoading,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
}: ComponentSearchInputProps) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder="Search product type subcategory..."
      autoComplete="off"
      className="h-11 pl-9 pr-10"
    />
    {isLoading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
  </div>
);

export default ComponentSearchInput;
