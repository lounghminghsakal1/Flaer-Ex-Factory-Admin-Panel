export default function ShimmerUi() {
  const array = Array.from({ length: 8 });

  return (
    <div className="p-5">
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
        `}
      </style>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,0.4fr))] gap-5">

        {array.map((_, index) => (
          <div key={index}>

            <div className="bg-white rounded-xl border border-gray-200 p-4">

              {/* Name */}
              <div className="h-6 w-3/4 rounded mb-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[shimmer_1.6s_linear_infinite]" />

              {/* Type */}
              <div className="h-6 w-24 rounded-full mb-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[shimmer_1.6s_linear_infinite]" />

              {/* Description */}
              <div className="space-y-2 mb-3">
                <div className="h-4 w-full rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[shimmer_1.6s_linear_infinite]" />
                <div className="h-4 w-2/3 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[shimmer_1.6s_linear_infinite]" />
              </div>

              {/* Slug */}
              <div className="h-4 w-1/2 rounded mb-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[shimmer_1.6s_linear_infinite]" />

              {/* Footer */}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <div className="h-6 w-20 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[shimmer_1.6s_linear_infinite]" />
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:1000px_100%] animate-[shimmer_1.6s_linear_infinite]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
