import React from "react";
import { cn } from "@/lib/utils";

export function DataTable({
  columns = [],
  data = [],
  emptyMessage = "No records found",
  className = "",
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/90 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn("px-6 py-3.5 font-semibold", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={cn(
                        "px-6 py-4 text-zinc-700 dark:text-zinc-300",
                        col.className
                      )}
                    >
                      {col.accessor
                        ? typeof col.accessor === "function"
                          ? col.accessor(row)
                          : row[col.accessor]
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
