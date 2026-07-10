"use client";

import * as React from "react";

export function KanbanSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-5 space-y-6 animate-pulse bg-[#fbfff8]">
      <div className="flex justify-between items-center pb-4 border-b border-[#d6e7df]">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-7 w-48 bg-gray-300 rounded"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
          <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((col) => (
          <div key={col} className="rounded-lg border border-[#d6e7df] bg-white p-4 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="h-5 w-24 bg-gray-300 rounded"></div>
              <div className="h-5 w-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-3">
              {[1, 2].map((card) => (
                <div key={card} className="rounded-md border border-gray-100 p-3 space-y-3">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                  <div className="flex justify-between pt-2">
                    <div className="h-4 w-12 bg-gray-100 rounded"></div>
                    <div className="h-4 w-4 bg-gray-100 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 animate-pulse bg-[#fbfff8] grid gap-4 xl:grid-cols-[minmax(0,1fr)_292px]">
      <div className="rounded-lg border border-[#d6e7df] bg-white p-4 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-[#d6e7df]">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-7 w-40 bg-gray-300 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
            <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-5 bg-gray-100 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 min-h-[480px]">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-md p-2 min-h-[80px] bg-gray-50/50">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-[#d6e7df] bg-white p-4 space-y-4">
        <div className="h-6 w-32 bg-gray-300 rounded"></div>
        <div className="h-16 bg-gray-100 rounded-md"></div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 border border-gray-100 rounded-md bg-gray-50"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
