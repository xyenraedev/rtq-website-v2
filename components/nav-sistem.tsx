'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Icon } from '@tabler/icons-react'
import { toast } from 'sonner'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function NavSistem({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    isLogout?: boolean
  }[]
}) {
  const pathname = usePathname()
  const router = useRouter()

  const { setOpenMobile, openMobile } = useSidebar()

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleNavigation = () => {
    if (openMobile) {
      setOpenMobile(false)
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true)

      const supabase = createClient()

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      toast.success('Berhasil keluar dari sistem')

      if (openMobile) {
        setOpenMobile(false)
      }

      router.replace('/')
      router.refresh()
    } catch (error) {
      console.error(error)

      toast.error('Gagal keluar dari sistem')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Sistem &amp; Akun</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if (item.isLogout) {
              return (
                <SidebarMenuItem key={item.title}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="min-w-8 text-destructive duration-200 ease-linear hover:bg-destructive/10 hover:text-destructive"
                      >
                        {item.icon && <item.icon size={20} />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>

                        <AlertDialogDescription>
                          Anda akan keluar dari sesi saat ini dan perlu login kembali untuk
                          mengakses dashboard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>

                        <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                          {isLoggingOut ? 'Sedang keluar...' : 'Ya, Keluar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </SidebarMenuItem>
              )
            }

            const isActive = pathname === item.url

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={
                    isActive
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear'
                      : 'min-w-8 duration-200 ease-linear'
                  }
                >
                  <Link href={item.url} onClick={handleNavigation}>
                    {item.icon && <item.icon size={20} />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
