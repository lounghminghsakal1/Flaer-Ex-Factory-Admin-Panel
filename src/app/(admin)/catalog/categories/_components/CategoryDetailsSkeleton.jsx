import Skeleton from "react-loading-skeleton";

export default function CategoryDetailsSkeleton() {
  return (
    <div className="space-y-6 px-2 py-4 ">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={28} />
        <Skeleton width={100} height={40} borderRadius={8} />
      </div>

      {/* CATEGORY INFO CARD */}
      <div className="w-[50%] bg-white rounded-xl p-5 space-y-4">

        {/* Section title */}
        <Skeleton width={180} height={20} />

        <div className="grid grid-cols-2 gap-4">

          {/* Category Name */}
          <div>
            <Skeleton width={140} height={14} />
            <Skeleton height={40} borderRadius={8} />
          </div>

          {/* Display Title */}
          <div>
            <Skeleton width={140} height={14} />
            <Skeleton height={40} borderRadius={8} />
          </div>

          {/* Status */}
          <div>
            <Skeleton width={80} height={14} />
            <div className="flex gap-3 mt-2">
              <Skeleton width={120} height={36} borderRadius={8} />
              <Skeleton width={120} height={36} borderRadius={8} />
            </div>
          </div>

          {/* Spacer */}
          <div></div>

          {/* Description */}
          <div className="col-span-2">
            <Skeleton width={120} height={14} />
            <Skeleton height={80} borderRadius={8} />
          </div>

        </div>

      </div>

      {/* SUBCATEGORIES CARD */}
      <div className="bg-white rounded-xl p-5 space-y-4">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <Skeleton width={160} height={20} />
          <Skeleton width={200} height={40} borderRadius={8} />
        </div>

        {/* Table */}
        <div className=" rounded-lg overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-6 gap-4 bg-gray-100 px-4 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={16} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 4 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-6 gap-4 px-4 py-4"
            >

              {/* Name */}
              <Skeleton height={16} />

              {/* Code */}
              <Skeleton height={16} />

              {/* Slug */}
              <Skeleton height={16} />

              {/* Description */}
              <Skeleton height={16} />

              {/* Status badge */}
              <Skeleton width={80} height={24} borderRadius={999} />

              {/* Action button */}
              <Skeleton width={70} height={36} borderRadius={8} />

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}
