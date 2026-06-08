'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  IconDashboard,
  IconNews,
  IconTags,
  IconPhoto,
  IconFolders,
  IconSchool,
  IconUsers,
  IconChalkboard,
  IconUser,
  IconSettings,
  IconLogout,
  IconShieldHalfFilled,
  IconUserCircle,
} from '@tabler/icons-react'

import { createClient } from '@/lib/supabase/client'
import { getPengaturanWebsite } from '@/lib/pengaturan'

import { NavMain } from '@/components/nav-main'
import { NavKonten } from '@/components/nav-konten'
import { NavAkademik } from '@/components/nav-akademik'
import { NavSistem } from '@/components/nav-sistem'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { NavUser } from './nav-user'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/protected',
      icon: IconDashboard,
    },
  ],

  navKonten: [
    {
      title: 'Berita',
      url: '/protected/berita',
      icon: IconNews,
    },
    {
      title: 'Kategori Berita',
      url: '/protected/berita/kategori',
      icon: IconTags,
    },
    {
      title: 'Galeri',
      url: '/protected/galeri',
      icon: IconPhoto,
    },
    {
      title: 'Kategori Galeri',
      url: '/protected/galeri/kategori',
      icon: IconFolders,
    },
  ],

  navAkademik: [
    {
      title: 'Monitoring Santri',
      url: '/protected/monitoring-santri',
      icon: IconSchool,
    },
    {
      title: 'Hasil Rekomendasi',
      url: '/protected/hasil-rekomendasi',
      icon: IconUsers,
    },
    {
      title: 'Aturan Capaian',
      url: '/protected/aturan-capaian',
      icon: IconChalkboard,
      adminOnly: true,
    },
    {
      title: 'Data Guru',
      url: '/protected/guru',
      icon: IconUserCircle,
    },
  ],

  navSistem: [
    {
      title: 'Akun & Profil',
      url: '/protected/akun',
      icon: IconUser,
    },
    {
      title: 'Pengaturan',
      url: '/protected/pengaturan',
      icon: IconSettings,
      adminOnly: true,
    },
    {
      title: 'Keluar Akun',
      url: '/',
      icon: IconLogout,
      isLogout: true,
    },
  ],
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [namaRTQ, setNamaRTQ] = React.useState('RTQ')
  const [logoUrl, setLogoUrl] = React.useState('')
  const [role, setRole] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadData = async () => {
      const result = await getPengaturanWebsite()

      if (result.data) {
        setNamaRTQ(result.data.nama_rtq || 'RTQ')
        setLogoUrl(result.data.logo_url || '')
      }

      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      setRole(user?.app_metadata?.role ?? null)
    }

    loadData()
  }, [])

  const navAkademik = data.navAkademik.filter((item) => !item.adminOnly || role === 'admin')

  const navSistem = data.navSistem.filter((item) => !item.adminOnly || role === 'admin')

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <a href="/protected" className="flex items-center gap-2">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={namaRTQ}
                    width={32}
                    height={32}
                    className="rounded-md object-cover"
                  />
                ) : (
                  <IconShieldHalfFilled className="size-6 text-primary" />
                )}

                <span className="text-lg font-bold tracking-tight">{namaRTQ}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />

        <NavKonten items={data.navKonten} />

        <NavAkademik items={navAkademik} />

        <div className="mt-auto">
          <NavSistem items={navSistem} />
        </div>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
