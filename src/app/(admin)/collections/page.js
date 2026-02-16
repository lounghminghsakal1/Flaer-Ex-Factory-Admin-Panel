"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CollectionsListing from "./_components/CollectionsListing";
import CollectionsFilter from "./_components/CollectionsFilter";
import ListingPageHeader from "../../../../components/shared/ListingPageHeader";
import ShimmerUi from "./_components/ShimmerUi";
import { Package } from "lucide-react";

export default function CollectionsPage() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreRef = useRef(null);

  const [appliedFilters, setAppliedFilters] = useState({
    starts_with: searchParams.get("starts_with") || "",
    active: searchParams.get("active") || ""
  });

  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  useEffect(() => {
    fetchCollections(1);
  }, [appliedFilters]);

  useEffect(() => {
    const query = new URLSearchParams({
      ...(appliedFilters.starts_with && { starts_with: appliedFilters.starts_with }),
      ...(appliedFilters.active && { active: appliedFilters.active })
    });

    router.replace(`?${query.toString()}`, { scroll: false });
  }, [appliedFilters]);


  const handleApply = () => {
    setData([]);
    setPage(1);
    setAppliedFilters(draftFilters);
  };

  const handleClear = () => {
    const empty = { starts_with: "", active: "" };
    setDraftFilters(empty);
    setAppliedFilters(empty);
  };

  async function fetchCollections(pageNumber, isLoadMore = false) {

    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const query = new URLSearchParams({
        ...(appliedFilters.starts_with && { starts_with: appliedFilters.starts_with.trim() }),
        ...(appliedFilters.active !== "" && {
          active: appliedFilters.active === "active"
        })
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections?page=${pageNumber}&${query}`
      );

      const result = await res.json();

      if (isLoadMore) {
        setData(prev => {
          const existingIds = new Set(prev.map(item => item.id));

          const newItems = (result.data || []).filter(
            item => item && !existingIds.has(item.id)
          );

          return [...prev, ...newItems];
        });
      } else {
        setData(result.data);
      }

      setPage(result.meta.current_page);
      setTotalPages(result.meta.total_pages);

    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // infinite scroll
  useEffect(() => {

    if (page >= totalPages) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore) {
        fetchCollections(page + 1, true);
      }
    });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => observer.disconnect();

  }, [page, totalPages, loadingMore]);

  // save scroll continuously
  useEffect(() => {
    const save = () => sessionStorage.setItem("collections_scroll", window.scrollY);
    window.addEventListener("scroll", save);
    return () => window.removeEventListener("scroll", save);
  }, []);

  // restore scroll after data loads
  useEffect(() => {
    const y = sessionStorage.getItem("collections_scroll");
    if (y) window.scrollTo(0, Number(y));
  }, [data.length]);

  return (
    <div className="px-2 py-4">

      <ListingPageHeader title="Collections" />

      <CollectionsFilter
        draftFilters={draftFilters}
        appliedFilters={appliedFilters}
        setDraftFilters={setDraftFilters}
        onApply={handleApply}
        onClear={handleClear}
      />

      {loading && <ShimmerUi />}

      <CollectionsListing collectionsListData={data} />

      <div ref={loadMoreRef} className="h-30 flex justify-center items-center">
        {loadingMore && <p className="text-primary text-2xl font-semibold">Loading more...</p>}
        {page >= totalPages && (
          <p className="flex items-center font-semibold gap-2 text-2xl text-primary"><Package /> No more collections</p>
        )}
      </div>

    </div>
  );
}
