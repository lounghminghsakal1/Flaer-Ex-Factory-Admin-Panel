"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function GrnPageSkeleton() {
  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton width={240} height={26} className="mb-2" />
            <Skeleton width={80} height={18} />
          </div>

          <Skeleton width={150} height={40} borderRadius={8} />
        </div>

        {/* EXPANDED GRN CARD */}
        <div className=" rounded-xl p-5 space-y-5">

          {/* TOP ROW */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Skeleton circle width={40} height={40} />

              <Skeleton width={180} height={20} />

              <Skeleton width={80} height={26} borderRadius={20} />
            </div>

            <Skeleton width={130} height={36} borderRadius={6} />
          </div>

          {/* INFO ROW */}
          <div className="grid grid-cols-4 gap-6">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i}>
                  <Skeleton width={120} height={14} className="mb-2" />
                  <Skeleton width={160} height={18} />
                </div>
              ))}
          </div>

          {/* SUMMARY BOXES */}
          <div className="grid grid-cols-6 gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className=" rounded-lg p-4 space-y-2"
                >
                  <Skeleton width={120} height={14} />
                  <Skeleton width={40} height={18} />
                </div>
              ))}
          </div>

          {/* GRN LINE ITEMS TITLE */}
          <div className="flex justify-between items-center">
            <Skeleton width={160} height={22} />
            <Skeleton width={110} height={36} />
          </div>

          {/* TABLE HEADER */}
          <div className="grid grid-cols-8 gap-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} height={18} />
              ))}
          </div>

          {/* TABLE ROW */}
          <div className="grid grid-cols-8 gap-4 items-center rounded-lg p-4">
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
          </div>

          {/* CTA BUTTON */}
          <div className="flex justify-end">
            <Skeleton width={180} height={44} borderRadius={8} />
          </div>

        </div>

        {/* COLLAPSED GRN CARDS */}
        {Array(2)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center rounded-xl p-4"
            >
              <div className="flex items-center gap-4">
                <Skeleton circle width={36} height={36} />
                <Skeleton width={200} height={18} />
                <Skeleton width={90} height={24} borderRadius={20} />
              </div>

              <Skeleton circle width={24} height={24} />
            </div>
          ))}

      </div>
    </SkeletonTheme>
  );
}