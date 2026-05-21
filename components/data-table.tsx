'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconSelector,
  IconTrash,
  IconRefresh,
  IconFilter,
} from '@tabler/icons-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'
/** null = default (not set by user), 'asc' | 'desc' = user-chosen */
export type SortState = null | 'asc' | 'desc'

export interface DefaultSort {
  key: string
  direction: SortDirection
}

export interface ColumnDef<T> {
  key: keyof T | string
  header: string
  cell?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableFilter<T> {
  key: keyof T | string
  label: string
  options: { label: string; value: string }[]
}

export type PageSizeOption = 10 | 25 | 50 | 100

export interface DataTableProps<T extends object> {
  data: T[]
  columns: ColumnDef<T>[]
  rowKey: keyof T
  /** Default sort applied on load — does NOT trigger reset button */
  defaultSort?: DefaultSort
  pageSize?: PageSizeOption
  pageSizeOptions?: PageSizeOption[]
  searchFields?: (keyof T)[]
  searchPlaceholder?: string
  filters?: DataTableFilter<T>[]
  selectable?: boolean
  onBulkDelete?: (keys: unknown[]) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  toolbarExtra?: React.ReactNode
  emptyMessage?: string
  onRowClick?: (row: T) => void
  externalFilter?: Record<string, string>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue<T>(row: T, key: string): unknown {
  return key.split('.').reduce<unknown>((obj, k) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k]
    return undefined
  }, row)
}

/**
 * 3-state sort icon:
 *  - neutral (not active): selector icon
 *  - active asc: up arrow
 *  - active desc: down arrow
 */
function SortIcon({
  active,
  dir,
  isDefault,
}: {
  active: boolean
  dir: SortState
  isDefault: boolean
}) {
  if (!active) return <IconSelector size={13} className="text-muted-foreground/40" />

  // Active but in "default" state (set by defaultSort, not by user interaction — shown dimmer)
  if (isDefault && dir === null)
    return <IconSelector size={13} className="text-muted-foreground/60" />

  if (dir === 'asc') return <IconSortAscending size={13} className="text-primary" />
  if (dir === 'desc') return <IconSortDescending size={13} className="text-primary" />
  return <IconSelector size={13} className="text-muted-foreground/40" />
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  data,
  columns,
  rowKey,
  defaultSort,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  searchFields = [],
  searchPlaceholder = 'Cari...',
  filters = [],
  selectable = false,
  onBulkDelete,
  onEdit,
  onDelete,
  toolbarExtra,
  emptyMessage = 'Tidak ada data ditemukan.',
  onRowClick,
  externalFilter,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [String(f.key), '']))
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(defaultPageSize)

  /**
   * Sort state machine:
   *  sortKey  — which column is sorted (null = defaultSort key or none)
   *  userSortKey — key the USER explicitly chose (null = not overridden)
   *  userSortDir — 'asc' | 'desc' | null (null = user hasn't touched sorting)
   *
   * Effective sort = userSort ?? defaultSort ?? none
   * Reset button only appears when userSortKey !== null
   */
  const [userSortKey, setUserSortKey] = useState<string | null>(null)
  const [userSortDir, setUserSortDir] = useState<SortState>(null)

  const [selectedKeys, setSelectedKeys] = useState<Set<unknown>>(new Set())
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  // 3-state sort cycle per column: asc → desc → reset to default
  const handleSortFinal = (key: string) => {
    if (userSortKey !== key) {
      setUserSortKey(key)
      setUserSortDir('asc')
      return
    }
    if (userSortDir === 'asc') {
      setUserSortDir('desc')
      return
    }
    // desc or null → reset user override
    setUserSortKey(null)
    setUserSortDir(null)
  }

  // ── Effective sort (user overrides default) ──
  const effectiveSortKey = userSortKey ?? defaultSort?.key ?? null
  const effectiveSortDir: SortDirection =
    userSortKey !== null
      ? ((userSortDir as SortDirection) ?? 'asc')
      : (defaultSort?.direction ?? 'asc')

  // ── Reset logic ──
  // Track which things the user has actively changed from the "initial" state
  const activeFilterCount = Object.values(filterValues).filter((v) => v !== '').length
  const isSearchActive = search.trim() !== ''
  const isSortUserOverridden = userSortKey !== null

  // Total count of active modifications (for the reset badge)
  const modificationCount =
    (isSearchActive ? 1 : 0) + activeFilterCount + (isSortUserOverridden ? 1 : 0)

  // Show reset button only when user has made modifications
  const showReset = modificationCount > 0

  const resetAll = () => {
    setSearch('')
    setFilterValues(Object.fromEntries(filters.map((f) => [String(f.key), ''])))
    setUserSortKey(null)
    setUserSortDir(null)
    setPage(1)
  }

  // ── Filtered + Sorted data ──
  const filtered = useMemo(() => {
    let result = [...data]

    if (search.trim() && searchFields.length > 0) {
      const q = search.toLowerCase()
      result = result.filter((row) =>
        searchFields.some((f) =>
          String(getNestedValue(row, String(f)) ?? '')
            .toLowerCase()
            .includes(q)
        )
      )
    }

    filters.forEach((f) => {
      const val = filterValues[String(f.key)]
      if (val)
        result = result.filter((row) => String(getNestedValue(row, String(f.key)) ?? '') === val)
    })

    if (effectiveSortKey) {
      result.sort((a, b) => {
        const av = getNestedValue(a, effectiveSortKey)
        const bv = getNestedValue(b, effectiveSortKey)
        let cmp = 0
        if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv
        } else if (av instanceof Date && bv instanceof Date) {
          cmp = av.getTime() - bv.getTime()
        } else {
          cmp = String(av ?? '').localeCompare(String(bv ?? ''))
        }
        return effectiveSortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [data, search, searchFields, filterValues, filters, effectiveSortKey, effectiveSortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  // ── Selection ──
  const allPageSelected = paged.length > 0 && paged.every((r) => selectedKeys.has(r[rowKey]))
  const somePageSelected = paged.some((r) => selectedKeys.has(r[rowKey]))

  function toggleSelectAll() {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (allPageSelected) paged.forEach((r) => next.delete(r[rowKey]))
      else paged.forEach((r) => next.add(r[rowKey]))
      return next
    })
  }

  function toggleSelectRow(key: unknown) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function handleBulkDelete() {
    onBulkDelete?.(Array.from(selectedKeys))
    setSelectedKeys(new Set())
  }

  // ── Pagination ──
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (
        idx > 0 &&
        typeof arr[idx - 1] === 'number' &&
        (p as number) - (arr[idx - 1] as number) > 1
      )
        acc.push('...')
      acc.push(p)
      return acc
    }, [])

  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }

  // ── Column sort state helpers ──
  const getColumnSortState = (
    colKey: string
  ): { isActive: boolean; dir: SortState; isDefault: boolean } => {
    if (userSortKey === colKey) {
      return { isActive: true, dir: userSortDir, isDefault: false }
    }
    if (userSortKey === null && defaultSort?.key === colKey) {
      // Active via default, but user hasn't touched it
      return { isActive: true, dir: defaultSort.direction, isDefault: true }
    }
    return { isActive: false, dir: null, isDefault: false }
  }

  useEffect(() => {
    if (externalFilter && Object.keys(externalFilter).length > 0) {
      setFilterValues((prev) => ({ ...prev, ...externalFilter }))
      setPage(1) // reset ke halaman pertama
    }
  }, [externalFilter])

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2.5 p-3.5 border-b border-border flex-wrap bg-card">
        {/* Search */}
        {searchFields.length > 0 && (
          <div className="relative flex-1 min-w-45 max-w-xs">
            <IconSearch
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>
        )}

        {/* Dropdown Filters */}
        {filters.map((f) => (
          <div key={String(f.key)} className="relative">
            <button
              onClick={() =>
                setOpenFilter((prev) => (prev === String(f.key) ? null : String(f.key)))
              }
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                filterValues[String(f.key)]
                  ? 'border-primary text-primary bg-primary/5 font-medium'
                  : 'border-input text-muted-foreground bg-background hover:border-border'
              }`}
            >
              <IconFilter size={13} />
              {filterValues[String(f.key)]
                ? (f.options.find((o) => o.value === filterValues[String(f.key)])?.label ?? f.label)
                : f.label}
              <IconChevronRight
                size={12}
                className={`transition-transform ${openFilter === String(f.key) ? 'rotate-90' : 'rotate-0'}`}
              />
            </button>
            {openFilter === String(f.key) && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)} />
                <div className="absolute top-full mt-1 left-0 z-20 bg-popover border border-border rounded-xl shadow-xl overflow-hidden min-w-35">
                  <button
                    onClick={() => {
                      setFilterValues((p) => ({ ...p, [String(f.key)]: '' }))
                      setOpenFilter(null)
                      setPage(1)
                    }}
                    className="w-full px-4 py-2.5 text-sm text-left text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Semua {f.label}
                  </button>
                  {f.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterValues((p) => ({ ...p, [String(f.key)]: opt.value }))
                        setOpenFilter(null)
                        setPage(1)
                      }}
                      className={`w-full px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors ${
                        filterValues[String(f.key)] === opt.value
                          ? 'text-primary font-semibold bg-primary/5'
                          : 'text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}

        {/* Reset button — only appears when user has made modifications */}
        {showReset && (
          <button
            onClick={resetAll}
            title="Reset semua filter & urutan"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-input text-muted-foreground hover:text-foreground hover:border-border transition-colors text-sm"
          >
            <IconRefresh size={14} />
            <span className="hidden sm:inline">Reset</span>
            {/* Badge counter */}
            <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
              {modificationCount}
            </span>
          </button>
        )}

        <div className="flex-1" />

        {/* Bulk delete */}
        {selectable && selectedKeys.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 text-sm text-muted-foreground bg-destructive/20 border border-destructive px-3 py-2 rounded-lg hover:bg-destructive/5 transition-colors font-medium"
          >
            <IconTrash size={14} className="text-foreground" />
            Hapus <span className="text-foreground">{selectedKeys.size}</span>
          </button>
        )}

        {toolbarExtra}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected
                    }}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => {
                const { isActive, dir, isDefault } = getColumnSortState(String(col.key))
                return (
                  <th
                    key={String(col.key)}
                    className={`px-4 py-3 font-semibold text-muted-foreground text-xs tracking-wide uppercase ${alignClass[col.align ?? 'left']} ${col.width ?? ''}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSortFinal(String(col.key))}
                        className={`inline-flex items-center gap-1 transition-colors ${
                          isActive && !isDefault ? 'text-primary' : 'hover:text-foreground'
                        }`}
                        title={
                          isActive && !isDefault
                            ? dir === 'asc'
                              ? 'Klik untuk urutan Z–A'
                              : 'Klik untuk reset urutan'
                            : 'Klik untuk urutan A–Z'
                        }
                      >
                        {col.header}
                        <SortIcon
                          active={isActive}
                          dir={isDefault ? defaultSort!.direction : dir}
                          isDefault={isDefault}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-16 text-center text-muted-foreground"
                >
                  <IconFilter size={36} className="mx-auto mb-3 opacity-25" />
                  <p className="font-medium text-sm">{emptyMessage}</p>
                  {showReset && (
                    <button
                      onClick={resetAll}
                      className="mt-2 text-xs text-primary underline underline-offset-2"
                    >
                      Reset filter
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const key = row[rowKey]
                const isSelected = selectedKeys.has(key)
                return (
                  <tr
                    key={String(key)}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-border/60 transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}
                    `}
                  >
                    {selectable && (
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(key)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={`px-4 py-3.5 text-foreground ${alignClass[col.align ?? 'left']}`}
                      >
                        {col.cell ? (
                          col.cell(row, idx)
                        ) : (
                          <span className="text-sm">
                            {String(getNestedValue(row, String(col.key)) ?? '-')}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer / Pagination ── */}
      <>
        {/* ── Mobile Layout (2 Rows) ── */}
        <div className="flex md:hidden flex-col gap-3 w-full px-4 py-3 border-t border-border bg-card">
          {/* Row 1: Rows Selector (Left) & Pagination (Right) */}
          <div className="flex items-center justify-between w-full">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs text-muted-foreground">Baris:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val) as PageSizeOption)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-17.5 bg-background border border-border rounded-md text-xs">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  side="top"
                  className="rounded-xl border border-border bg-popover shadow-lg"
                >
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)} className="cursor-pointer">
                      <span className="text-foreground font-medium">{size}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-md border border-input disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-accent transition-colors"
                aria-label="Previous page"
              >
                <IconChevronLeft size={16} />
              </button>
              {pageNums.map((p, i) =>
                p === '...' ? (
                  <span key={`e${i}`} className="px-2 text-muted-foreground/50 select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-9 h-8 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      safePage === p
                        ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                        : 'border border-input text-muted-foreground hover:bg-muted hover:text-accent-foreground hover:border-accent-foreground/20'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-md border border-input disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-accent transition-colors"
                aria-label="Next page"
              >
                <IconChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Row 2: Info Text (Centered) */}
          <div className="flex items-center justify-center w-full text-xs text-muted-foreground">
            <span className="whitespace-nowrap">
              Menampilkan{' '}
              <span className="text-foreground font-semibold">
                {filtered.length === 0
                  ? '0'
                  : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`}
              </span>{' '}
              dari <span className="text-foreground font-semibold">{filtered.length}</span>
            </span>
          </div>
        </div>

        {/* ── Desktop Layout (1 Row) ── */}
        <div className="hidden md:flex items-center justify-between w-full px-6 py-3 border-t border-border bg-card text-sm">
          {/* Left: Rows Selector & Info */}
          <div className="flex items-center gap-6 text-muted-foreground">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">Baris per halaman:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val) as PageSizeOption)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-9 w-27.5 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-ring">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  side="top"
                  className="rounded-xl border border-border bg-popover shadow-lg"
                >
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)} className="cursor-pointer">
                      <span className="text-foreground font-medium">{size}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Range info */}
            <span className="whitespace-nowrap">
              <span className="text-muted-foreground">Menampilkan </span>
              <span className="text-foreground font-semibold">
                {filtered.length === 0
                  ? '0'
                  : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`}
              </span>
              <span className="text-muted-foreground"> dari </span>
              <span className="text-foreground font-semibold">{filtered.length}</span>
            </span>
          </div>

          {/* Right: Pagination with Page Numbers */}
          <div className="flex items-center gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-md border border-input disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-accent transition-colors"
              aria-label="Previous page"
            >
              <IconChevronLeft size={16} />
            </button>

            {pageNums.map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} className="px-2 text-muted-foreground/50 select-none">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`min-w-9 h-9 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    safePage === p
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : 'border border-input text-muted-foreground hover:bg-muted hover:text-accent-foreground hover:border-accent-foreground/20'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-md border border-input disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-accent transition-colors"
              aria-label="Next page"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </>
    </div>
  )
}
