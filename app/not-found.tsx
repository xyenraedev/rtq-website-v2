import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Halaman Tidak Ditemukan',
  description: 'Maaf, halaman yang Anda cari tidak ada.',
}

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <h2>404 - Not Found</h2>
      <p>Halaman tidak ditemukan.</p>
      <Link href="/">Kembali</Link>
    </div>
  )
}
