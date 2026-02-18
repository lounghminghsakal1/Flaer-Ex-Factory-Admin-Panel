import Skeleton from "react-loading-skeleton";

export default function SubCategoriesTableSkeleton() {
  return (
    <div className="flex items-center justify-center mt-10 ">
      {/* <Loader2 size={24} className="animate-spin text-blue-600" /> */}
      <div className=" rounded-lg overflow-hidden">

        {/* Table header */}
        {/* <div className="grid grid-cols-6 gap-4 bg-gray-100 px-4 py-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height={16} />
                  ))}
                </div> */}

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
  );
}