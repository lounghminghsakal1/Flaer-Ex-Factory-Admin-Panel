import { Edit2,Package,Tag,ArrowRight } from "lucide-react";

export default function ShimmerUi() {
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="p-5">
      <div className="w-full mx-auto ">

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,0.4fr))] gap-5">
          {array.map((collection, index) => (
            <div key={index}>
              <div
                className="group bg-white rounded-xl border border-gray-200 p-4 transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 cursor-pointer relative"
              >
                {/* Edit Button - Top Right */}
                <button
                  className="edit-button absolute top-3 right-3 p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                >
                  <Edit2 size={16} />
                </button>

                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 pr-10">
                  
                </h3>

                {/* Collection Type */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200 capitalize">
                    <Package size={12} />
                  </span>
                </div>

                {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[40px]">
                
                  </p>

                {/* Slug */}
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                  <Tag size={14} className="text-gray-400" />
                  <span className="font-mono text-gray-600">
                  </span>
                </div>

                {/* Footer - Status and Arrow */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span
                    className={`px-2.5 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200`}
                  >
              
                  </span>

                  <div className="p-2 rounded-full bg-blue-50 text-gray-600 group-hover:bg-blue-100 transition-colors">
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}