import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function VendorDetaislSkuTabSkeleton() {
  return (
    <div className="flex flex-col gap-4">

      {/* ───── Table ───── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Table Header */}
        <div className="grid grid-cols-[80px_1.6fr_1fr_1fr_1fr_120px] px-5 py-3 border-b border-gray-200 bg-gray-50">
          <Skeleton height={12} width={40} />
          <Skeleton height={12} width={100} />
          <Skeleton height={12} width={120} />
          <Skeleton height={12} width={80} />
          <Skeleton height={12} width={60} />
          <Skeleton height={12} width={60} />
        </div>

        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[80px_1.6fr_1fr_1fr_1fr_120px] px-5 py-4 border-b border-gray-100 items-center"
          >
            {/* S.NO */}
            <Skeleton height={14} width={20} />

            {/* SKU Name */}
            <div className="flex flex-col gap-2">
              <Skeleton height={14} width="80%" />
              <Skeleton height={12} width="50%" />
            </div>

            {/* Vendor SKU Code */}
            <Skeleton height={28} width={90} />

            {/* Price */}
            <Skeleton height={14} width={70} />

            {/* Status */}
            <Skeleton height={24} width={60} borderRadius={20} />

            {/* Action */}
            <Skeleton height={34} width={70} borderRadius={8} />
          </div>
        ))}

      </div>
    </div>
  );
}