import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'

export function TablePagination({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalItems,
  goToPage,
  changePageSize,
  itemLabel = 'data',
}: {
  page: number
  totalPages: number
  pageSize: number
  pageSizeOptions: readonly number[]
  totalItems: number
  goToPage: (page: number) => void
  changePageSize: (size: number) => void
  itemLabel?: string
}) {
  if (totalItems === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="px-4 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Menampilkan{' '}
          <span className="font-semibold text-foreground">
            {start}–{end}
          </span>{' '}
          dari <span className="font-semibold text-foreground">{totalItems}</span> {itemLabel}
        </span>
        <select
          value={pageSize}
          onChange={(e) => changePageSize(Number(e.target.value))}
          className="ml-2 px-2 py-1 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / halaman
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          title="Halaman pertama"
        >
          <IconChevronsLeft size={14} />
        </button>
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          title="Sebelumnya"
        >
          <IconChevronLeft size={14} />
        </button>

        {pageNumbers.map((n, i) =>
          n === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => goToPage(n)}
              className={`min-w-8 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                n === page
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {n}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          title="Berikutnya"
        >
          <IconChevronRight size={14} />
        </button>
        <button
          onClick={() => goToPage(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          title="Halaman terakhir"
        >
          <IconChevronsRight size={14} />
        </button>
      </div>
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  const delta = 1
  const range: (number | 'ellipsis')[] = []
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  range.push(1)
  if (left > 2) range.push('ellipsis')
  for (let i = left; i <= right; i++) range.push(i)
  if (right < total - 1) range.push('ellipsis')
  if (total > 1) range.push(total)

  return range
}
