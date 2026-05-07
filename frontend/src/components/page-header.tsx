import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterOption } from "@/lib/types";

interface PageHeaderProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  filterLabel?: string;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilter?: (value: string) => void;
}

export function PageHeader({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearch,
  filterLabel = "Filter",
  filterOptions,
  filterValue = "all",
  onFilter,
}: PageHeaderProps) {
  if (!onSearch && (!filterOptions || filterOptions.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {onSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
        {filterOptions && filterOptions.length > 0 && onFilter && (
          <Select value={filterValue} onValueChange={(v: string) => onFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filterLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
