"use client";
import { useState, useEffect, useRef } from "react";
import CollectionsListing from "./_components/CollectionsListing";
import CollectionsListingPageHeader from "./_components/CollectionsListingPageHeader";
import { Package, SearchIcon } from "lucide-react";
import ShimmerUi from "./_components/ShimmerUi";
import ListingPageHeader from "../../../../components/shared/ListingPageHeader";
import CollectionsFilter from "./_components/CollectionsFilter";

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
    setIsSearch(prev => !prev);
  }, []);

  async function fetchCollectionsData(page = 1, isLoadMore = false) {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      const query = new URLSearchParams({
        ...(filters.starts_with && { starts_with: filters.starts_with.trim() }),
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
      if (entries[0].isIntersecting && !loadingMore && !loading) {
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
    setCollectionsListData([]);
    setPage(1);
    fetchCollectionsData(1);
  }, [isSearch]);


  return (
    <div className="px-2 py-4">
      <ListingPageHeader title={"Collections"} />
      <CollectionsFilter filters={filters} setFilters={setFilters} setCollectionsListData={setCollectionsListData} setIsSearch={setIsSearch} setPage={setPage} setTotalPages={setTotalPages} />
      {loading && (
        // <div className="text-center mx-auto h-screen my-auto text-blue-700 text-2xl font-bold ">Loading...</div>
        <ShimmerUi />
      )}

      <CollectionsListing collectionsListData={collectionsListData} onUpdateCollection={fetchCollectionsData} />
      <div ref={loadMoreRef} className="h-40 flex justify-center items-center">
        {loadingMore && <p className="text-center text-2xl text-blue-800 m-20 font-bold ">Loading more ...</p>}
        {page >= totalPages && <p className="flex justify-center items-center text-2xl text-blue-800 gap-3 font-bold m-20"><Package /> No more collections</p>}
      </div>
    </div>
  )
}