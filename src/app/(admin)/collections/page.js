"use client";
import { useState, useEffect, useRef } from "react";
import CollectionsListing from "./_components/CollectionsListing";
import CollectionsListingPageHeader from "./_components/CollectionsListingPageHeader";
import { Package, SearchIcon } from "lucide-react";

export default function CollectionsPage() {

  const [collectionsListData, setCollectionsListData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreRef = useRef(null);

  const defaultFilters = {
    starts_with: "",
    active: ""
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [isSearch, setIsSearch] = useState(false);
  const hasActiveFilters = filters.starts_with || filters.active !== "";

  useEffect(() => {
    fetchCollectionsData(1);
  }, []);

  async function fetchCollectionsData(page = 1, isLoadMore = false) {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      const query = new URLSearchParams({
        ...(filters.starts_with && { starts_with: filters.starts_with }),
        ...(filters.active !== "" && {
          active: filters.active === "active" ? true : false
        })
      });
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections?page=${page}&${query}`;
      const response = await fetch(url);
      const result = await response.json();
      const newData = result.data || [];
      if (isLoadMore) {
        setCollectionsListData(prev => {
          const existingIds = new Set(prev.map(item => item.id));

          const validNew = newData.filter(
            item => item && item.id !== undefined && !existingIds.has(item.id)
          );

          return [...prev, ...validNew];
        });
        //setCollectionsListData(prev => [...prev, ...newData]);
      } else {
        setCollectionsListData(newData);
      }
      setPage(result.meta.current_page);
      setTotalPages(result.meta.total_pages);

    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch collections");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (page >= totalPages) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        const nextPage = page + 1;
        fetchCollectionsData(nextPage, true);
      }
    }, { threshold: 1 });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();

  }, [page, totalPages, loadingMore]);

  useEffect(() => {
    fetchCollectionsData(1);
  }, [isSearch]);

  return (
    <div className="p-5">
      <CollectionsListingPageHeader onCollectionCreated={fetchCollectionsData} />
      {loading && (<div className="text-center mx-auto h-screen my-auto text-blue-700 text-2xl font-bold ">Loading...</div>)}

      {/* Filters */}
      <div className="w-full mx-auto">
        <div className="flex flex-wrap items-end gap-4 mb-5 p-4 bg-white shadow-sm border border-gray-200
 rounded-lg ">
          <div className="flex justify-center items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search product by name..."
              className="border text-gray-600 text-sm border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition px-3 h-9 w-52 rounded-l"
              value={filters.starts_with}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({ ...prev, starts_with: value }));
                if (value.trim() === "") {
                  setIsSearch(!isSearch);
                }
              }
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSearch(!isSearch);
                }
              }}
            />
            <span className="h-9 px-2 py-1 rounded-r border bg-blue-500 border-gray-300 focus:border-blue-700 hover:bg-blue-700 cursor-pointer" onClick={() => setIsSearch(!isSearch)} ><SearchIcon color="white" /></span>
          </div>

          {/* Status */}
          <select
            className="border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition px-3 h-9 w-32 rounded"
            value={filters.active}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                active: e.target.value
              }));
              if (e.target.value === "") setIsSearch(!isSearch);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {hasActiveFilters && (
            <button className="h-10 px-6 bg-blue-700 text-gray-100 border rounded-md hover:bg-gray-100 hover:text-blue-600 hover:scale-110 cursor-pointer transition-all duration-200 ease-in-out"
              onClick={() => {
                setCollectionsListData([]);
                setPage(1);
                setIsSearch(prev => !prev);
              }}
            >
              Apply
            </button>
          )}

          <div>
            {hasActiveFilters && (<button className="h-10 px-4 bg-red-700 border text-gray-100 hover:bg-gray-100 hover:text-red-700 rounded cursor-pointer hover:scale-110 transition-all duration-200 ease-in-out"
              onClick={() => {
                setFilters(defaultFilters);
                setCollectionsListData([]);
                setPage(1);
                setIsSearch(prev => !prev);
              }}
            >
              Clear
            </button>)}
          </div>
        </div>
      </div>

      <CollectionsListing collectionsListData={collectionsListData} onUpdateCollection={fetchCollectionsData} />
      <div ref={loadMoreRef} className="h-40 flex justify-center items-center">
        {loadingMore && <p className="text-center text-2xl text-blue-800 m-20 font-bold ">Loading more ...</p>}
        {page >= totalPages && <p className="flex justify-center items-center text-2xl text-blue-800 gap-4 font-bold m-20"><Package /> No more collections</p>}
      </div>
    </div>
  )
}