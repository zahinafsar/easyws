"use client";
import { ReactNode, useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  accessor: (row: T) => unknown;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

type Props<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  filterKey?: string;
  filterPlaceholder?: string;
  pageSize?: number;
};

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export function DataTable<T>({
  columns,
  data,
  filterKey,
  filterPlaceholder = "Filter...",
  pageSize = 10,
}: Props<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const filterCol = filterKey ? columns.find((c) => c.key === filterKey) : undefined;

  const filtered = useMemo(() => {
    if (!filter || !filterCol) return data;
    const q = filter.toLowerCase();
    return data.filter((row) => String(filterCol.accessor(row) ?? "").toLowerCase().includes(q));
  }, [data, filter, filterCol]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const cmp = compare(col.accessor(a), col.accessor(b));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  function toggleSort(key: string) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {filterCol && (
        <Input
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          placeholder={filterPlaceholder}
          className="max-w-sm"
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              return (
                <TableHead key={col.key}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      {!isSorted && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                      {isSorted && sort?.dir === "asc" && <ArrowUp className="h-3 w-3" />}
                      {isSorted && sort?.dir === "desc" && <ArrowDown className="h-3 w-3" />}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.cell ? col.cell(row) : (col.accessor(row) as ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {pageCount}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={currentPage >= pageCount - 1}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
