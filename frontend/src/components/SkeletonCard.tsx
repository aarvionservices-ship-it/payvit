import { motion } from "motion/react";

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-[360px] h-[580px] rounded-3xl p-[2px] shrink-0"
    >
      <div className="h-full w-full bg-white backdrop-blur-xl rounded-[22px] overflow-hidden flex flex-col border border-slate-200 shadow-xl animate-pulse">
        {/* Header Skeleton */}
        <div className="h-52 p-6 bg-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-20 h-4 bg-slate-200 rounded" />
            <div className="w-12 h-6 bg-slate-200 rounded-full" />
          </div>
          <div>
            <div className="w-10 h-8 bg-slate-200 rounded mb-4" />
            <div className="w-48 h-6 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Body Skeleton */}
        <div className="p-6 flex-1 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <div className="w-24 h-8 bg-slate-100 rounded" />
            <div className="w-16 h-8 bg-slate-100 rounded-full" />
          </div>

          <div className="w-full h-10 bg-slate-100 rounded" />

          <div className="space-y-2.5 flex-1 mt-2">
            <div className="flex items-center gap-3 bg-slate-50/80 p-2 rounded-xl border border-slate-100/80">
              <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
              <div className="w-full h-4 bg-slate-200 rounded" />
            </div>
            <div className="flex items-center gap-3 bg-slate-50/80 p-2 rounded-xl border border-slate-100/80">
              <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
              <div className="w-5/6 h-4 bg-slate-200 rounded" />
            </div>
            <div className="flex items-center gap-3 bg-slate-50/80 p-2 rounded-xl border border-slate-100/80">
              <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
              <div className="w-4/6 h-4 bg-slate-200 rounded" />
            </div>
          </div>

          <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
            <div className="w-16 h-6 bg-slate-100 rounded" />
            <div className="w-20 h-6 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

