import Skeleton from "react-loading-skeleton";

export default function BrandFormSkeleton() {
  return (
    <div className="space-y-6 px-2 py-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={28} />
        <Skeleton width={100} height={40} borderRadius={8} />
      </div>

      {/* BASIC INFO CARD */}
      <div className="w-[50%] bg-white border border-gray-200 rounded-xl p-5 space-y-4">

        {/* Section Title */}
        <Skeleton width={160} height={20} />

        <div className="grid grid-cols-2 gap-4">

          {/* Brand Name */}
          <div>
            <Skeleton width={120} height={14} />
            <Skeleton height={40} borderRadius={8} />
          </div>

          {/* Status */}
          <div>
            <Skeleton width={80} height={14} />
            <div className="flex gap-3 mt-2">
              <Skeleton width={100} height={36} borderRadius={8} />
              <Skeleton width={100} height={36} borderRadius={8} />
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Skeleton width={100} height={14} />
            <Skeleton height={80} borderRadius={8} />
          </div>

        </div>

      </div>

      {/* META INFO CARD */}
      <div className="w-[50%] bg-white border border-gray-200 rounded-xl p-5 space-y-4">

        {/* Section Title */}
        <Skeleton width={180} height={20} />

        <div className="grid grid-cols-2 gap-4">

          {/* Country */}
          <div>
            <Skeleton width={100} height={14} />
            <Skeleton height={40} borderRadius={8} />
          </div>

          {/* Founded */}
          <div>
            <Skeleton width={100} height={14} />
            <Skeleton height={40} borderRadius={8} />
          </div>

          {/* Specialization */}
          <div className="col-span-2">
            <Skeleton width={120} height={14} />
            <Skeleton height={40} borderRadius={8} />
          </div>

        </div>

      </div>

    </div>
  );
}
