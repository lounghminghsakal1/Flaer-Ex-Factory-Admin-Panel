import Skeleton from "react-loading-skeleton";

export default function CollectionDetailsSkeleton() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={24} />
        <Skeleton width={100} height={40} borderRadius={8} />
      </div>

      {/* Form Card */}
      <div className="w-[50%] bg-white border border-gray-200 rounded-xl p-4 space-y-4">

        <div className="grid grid-cols-2 gap-4">

          <div>
            <Skeleton width={120} height={16} />
            <Skeleton height={40} borderRadius={8} />
          </div>

          <div>
            <Skeleton width={100} height={16} />
            <Skeleton width={60} height={24} borderRadius={999} />
          </div>

          <div>
            <Skeleton width={120} height={16} />
            <Skeleton height={80} borderRadius={8} />
          </div>

          <div>
            <Skeleton width={120} height={16} />
            <Skeleton height={40} borderRadius={8} />
          </div>

        </div>

      </div>

      {/* Products Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={150} height={24} />
        <div className="flex gap-2">
          <Skeleton width={140} height={40} borderRadius={8} />
          <Skeleton width={140} height={40} borderRadius={8} />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-3 gap-4">

        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">

            <Skeleton width={64} height={64} borderRadius={8} />

            <div className="flex-1 space-y-2">
              <Skeleton width="70%" height={16} />
              <Skeleton width="40%" height={12} />
              <Skeleton width={80} height={20} borderRadius={999} />
              <Skeleton width="60%" height={12} />
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}
