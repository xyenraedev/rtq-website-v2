import Link from 'next/link'

export const metadata = {
  title: 'Halaman Tidak Ditemukan',
  description: 'Maaf, halaman yang Anda cari tidak ada.',
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-5xl font-bold">404</h1>

      <h2 className="text-xl font-semibold">Halaman Tidak Ditemukan</h2>

      <p className="max-w-md text-sm text-muted-foreground">
        Maaf, halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
      </p>

      <Link
        href="/"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}
