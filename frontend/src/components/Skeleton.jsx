// Skeleton loading components for better UX

// Base skeleton with shimmer animation
const SkeletonBase = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 6 }) => (
  <tr className="border-b border-slate-100">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonBase className={`h-4 ${i === 0 ? 'w-24' : i === columns - 1 ? 'w-20' : 'w-full max-w-[120px]'}`} />
      </td>
    ))}
  </tr>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
    {/* Header */}
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-5 w-32" />
        <SkeletonBase className="h-8 w-24 rounded-lg" />
      </div>
    </div>
    {/* Table */}
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/50">
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3 text-left">
              <SkeletonBase className="h-3 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// Card skeleton
export const CardSkeleton = ({ hasChart = false }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-7 w-32" />
        <SkeletonBase className="h-3 w-16" />
      </div>
      <SkeletonBase className="h-10 w-10 rounded-xl" />
    </div>
    {hasChart && (
      <div className="flex items-center justify-center h-40">
        <SkeletonBase className="h-24 w-24 rounded-full" />
      </div>
    )}
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <SkeletonBase className="h-6 w-40" />
        <SkeletonBase className="h-6 w-16 rounded-full" />
      </div>
      <SkeletonBase className="h-4 w-24" />
    </div>
    
    {/* Cards grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} hasChart />
      ))}
    </div>

    {/* Gauges */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
          <SkeletonBase className="h-4 w-24 mb-4" />
          <div className="flex items-center justify-center h-32">
            <SkeletonBase className="h-28 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Form skeleton
export const FormSkeleton = ({ fields = 6 }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-6">
    <SkeletonBase className="h-6 w-48 mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
    <div className="flex justify-end space-x-3 pt-4">
      <SkeletonBase className="h-10 w-24 rounded-lg" />
      <SkeletonBase className="h-10 w-32 rounded-lg" />
    </div>
  </div>
);

// List item skeleton
export const ListItemSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 animate-pulse">
    <SkeletonBase className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <SkeletonBase className="h-4 w-3/4" />
      <SkeletonBase className="h-3 w-1/2" />
    </div>
    <SkeletonBase className="h-6 w-16 rounded-full" />
  </div>
);

export default {
  TableSkeleton,
  TableRowSkeleton,
  CardSkeleton,
  DashboardSkeleton,
  FormSkeleton,
  ListItemSkeleton
};
