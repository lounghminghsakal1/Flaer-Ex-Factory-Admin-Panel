import Skeleton from "react-loading-skeleton";

export default function TablePageSkeleton({
  showSearch = true,
  showFilter = true,
  rows = 8,
  columns = 7
}) {
  return (
    <div className="px-2 py-4 space-y-4">

      {/* Title + Action */}
      <div className="flex items-center justify-center">
        <Skeleton width={180} height={28} />
      </div>

      {/* Filters Row */}
      <div className="flex justify-between items-center gap-3">

        <div className="flex items-center gap-2">
          {showSearch && (
            <Skeleton width={260} height={40} borderRadius={8} />
          )}

          {showFilter && (
            <Skeleton width={140} height={40} borderRadius={8} />
          )}
        </div>

        <Skeleton width={150} height={40} borderRadius={8} />
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-7 gap-4 bg-gray-100 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height={16} />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-7 gap-4 px-4 py-4 border-t border-gray-400"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height={16} />
            ))}
          </div>
        ))}

      </div>

    </div>
  );
}
