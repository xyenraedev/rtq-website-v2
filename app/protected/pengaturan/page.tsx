import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import PengaturanPage from './pengaturan-page'

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = user?.app_metadata?.role

  if (role !== 'admin') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <CardTitle>Akses Terbatas</CardTitle>

            <CardDescription>
              Halaman Pengaturan digunakan untuk mengelola identitas lembaga, informasi kontak,
              media sosial, konfigurasi website, serta pengaturan SEO. Fitur ini hanya dapat diakses
              oleh Administrator.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Kembali ke Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <PengaturanPage />
}
