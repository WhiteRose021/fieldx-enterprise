// components/search/SearchFilters.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

export interface FilterState {
  searchTerm: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status: string;
  assignee: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  initialFilters,
}) => {
  const [filters, setFilters] = React.useState<FilterState>({
    searchTerm: initialFilters?.searchTerm || '',
    dateRange: initialFilters?.dateRange || { from: undefined, to: undefined },
    status: initialFilters?.status || 'all',
    assignee: initialFilters?.assignee || 'all',
  });

  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      searchTerm: '',
      dateRange: { from: undefined, to: undefined },
      status: 'all',
      assignee: 'all',
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <div className="w-full space-y-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search autopsies..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <DatePickerWithRange
              date={filters.dateRange}
              onChange={(range) => setFilters({ ...filters, dateRange: range })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            <Select
              value={filters.assignee}
              onValueChange={(value) => setFilters({ ...filters, assignee: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="me">Assigned to me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSearch}>Apply Filters</Button>
        </div>
      )}
    </div>
  );
};