import React from 'react';

export function ViewSkeleton({ title = 'Cargando...' }: { title?: string }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse space-y-6">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md"></div>
        </div>
        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      </div>

      {/* Main Content Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-48 bg-slate-200 dark:bg-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-6 w-1/3 bg-slate-300 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-2/3 bg-slate-300 dark:bg-slate-700/60 rounded"></div>
            </div>
            <div className="h-10 w-36 bg-slate-300 dark:bg-slate-700 rounded-xl"></div>
          </div>
          <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700/50 rounded"></div>
              <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
              <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <div className="h-36 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-800">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-8 w-full bg-slate-200 dark:bg-slate-700/60 rounded-lg"></div>
          </div>
          <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-800">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700/50 rounded"></div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
        {title}
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto h-[75vh] flex flex-col p-4 animate-pulse space-y-4">
      <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center px-4 justify-between border border-slate-200 dark:border-slate-800">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
      <div className="flex-1 space-y-4 p-2 overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
          <div className="h-20 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
          </div>
        </div>
        <div className="flex items-start gap-3 flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
          <div className="h-14 w-1/2 bg-blue-500/10 rounded-2xl p-4 space-y-2">
            <div className="h-3 bg-blue-500/20 rounded w-full"></div>
          </div>
        </div>
      </div>
      <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 animate-pulse space-y-4">
      <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        <div className="lg:col-span-2 bg-slate-200 dark:bg-slate-800/60 rounded-2xl flex items-center justify-center">
          <span className="text-slate-400 font-medium text-sm">Cargando mapa interactivo...</span>
        </div>
        <div className="space-y-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
