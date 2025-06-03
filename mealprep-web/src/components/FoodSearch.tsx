// calls api to search for foods in USDA database.
// removed: suggestion dropdown upon search. costs api searches and not really useful but its there if needed

import { useRef, useState } from 'react';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoodResultCard } from "@/components/FoodResultCard";
import type { Food } from "@/types/food";
import { Input } from "@/components/ui/input";
import { useFoodSearchCacheStore } from '@/stores/foodSearchCacheStore';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";


const API_BASE = import.meta.env.VITE_API_BASE;

// function to search foods using the USDA API
// makes call to backend and retrieves the result for the food search 
export function FoodSearch({
  multiAdd,
  onClose,
}: {
  multiAdd: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([
    "Foundation",
    "SR Legacy"
  ]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);

  const toggleDataType = (type: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // handles the search and loading of results
  const handleSearch = async (overrideQuery?: string, page = 1) => {
    const searchTerm = overrideQuery || query;
    const cacheKey = `${searchTerm.toLowerCase()}|${page}|${selectedDataTypes.sort().join(",")}`;

    const { getCache, setCache } = useFoodSearchCacheStore.getState();
    const cached = getCache(cacheKey);

    setLoading(true);
    setError("");
    setResults([]);

    if (cached) {
      setResults(cached.foods ?? []);
      setTotalPages(Math.ceil((cached.totalHits ?? 0) / 12));
      setCurrentPage(page);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/food/SearchFoodUSDA`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchTerm,
          dataType: selectedDataTypes,
          pageSize: 12,
          pageNumber: page,
        }),
      });

      const data = await res.json();

      setResults(data.foods ?? []);
      setTotalPages(Math.ceil((data.totalHits ?? 0) / 12));
      setCurrentPage(page);
      setCache(cacheKey, data);
    } catch (err) {
      console.error("Error fetching:", err);
      setError("Failed to fetch results.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col items-center w-full">

      <h2 className="text-xl font-semibold mb-2 mt-[-8px]">Search for Food</h2>
        {/* filtering options */}
  <div className="flex flex-wrap gap-4 text-sm mb-4">
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectedDataTypes.includes("Foundation")}
        onChange={() => toggleDataType("Foundation")}
      />
      Foundation
    </label>
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectedDataTypes.includes("SR Legacy")}
        onChange={() => toggleDataType("SR Legacy")}
      />
      SR Legacy
    </label>
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectedDataTypes.includes("Branded")}
        onChange={() => toggleDataType("Branded")}
      />
      Branded
    </label>
  </div>

        {/* search form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative flex flex-col gap-2 w-full max-w-md"
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for food..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>

        </form>

        {/* feedback */}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground mt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
        {error && !loading && (
          <p className="text-sm text-destructive mt-4">{error}</p>
        )}

        {/* results */}
        {!loading && !error && results.length > 0 && (
          <>

            {/* pagination controls */}
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handleSearch(undefined, currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handleSearch(undefined, currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4 justify-items-center">
              {results.map((food) => (
                <FoodResultCard
                  key={food.fdcId ?? food.description}
                  food={food}
                  multiAdd={multiAdd}
                  onClose={onClose}
                />
              ))}
            </div>

            {/* pagination controls */}
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handleSearch(undefined, currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handleSearch(undefined, currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </>
        )}


      </div>
    </div>
  );
}