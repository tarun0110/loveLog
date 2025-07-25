import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, MapPin, Star } from "lucide-react";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    location?: string;
    rating?: number;
    dateFrom?: string;
    dateTo?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange
}: SearchFiltersProps) {
  const clearFilters = () => {
    onSearchChange("");
    onFiltersChange({});
  };

  const hasActiveFilters = searchQuery || Object.keys(filters).some(key => filters[key as keyof typeof filters]);

  return (
    <div className="bg-off-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 polaroid-shadow">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-warm/50 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search your memories..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.rating === 5 ? "default" : "outline"}
            size="sm"
            onClick={() => onFiltersChange({ 
              ...filters, 
              rating: filters.rating === 5 ? undefined : 5 
            })}
            className="rounded-full font-sans text-sm bg-rose-primary/20 hover:bg-rose-primary/30 border-rose-primary/30"
          >
            <Star className="w-4 h-4 mr-2" />
            5 Stars
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
              onFiltersChange({
                ...filters,
                dateFrom: filters.dateFrom === lastMonth.toISOString().split('T')[0] 
                  ? undefined 
                  : lastMonth.toISOString().split('T')[0]
              });
            }}
            className="rounded-full font-sans text-sm bg-rose-primary/20 hover:bg-rose-primary/30 border-rose-primary/30"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last Month
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="rounded-full font-sans text-sm text-chocolate hover:text-rose-primary"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-warm/50 w-4 h-4" />
            <Input
              type="text"
              placeholder="Location..."
              value={filters.location || ''}
              onChange={(e) => onFiltersChange({ ...filters, location: e.target.value || undefined })}
              className="pl-10 bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans text-sm"
            />
          </div>
          
          <Input
            type="date"
            placeholder="From date"
            value={filters.dateFrom || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
            className="bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans text-sm"
          />
          
          <Input
            type="date"
            placeholder="To date"
            value={filters.dateTo || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
            className="bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans text-sm"
          />
        </div>
      </div>
    </div>
  );
}
