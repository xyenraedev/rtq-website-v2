'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  IconShare,
  IconCopy,
  IconPrinter,
  IconBrandTwitter,
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconBrandLinkedin,
  IconCheck,
  IconChevronDown,
} from '@tabler/icons-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ShareDropdownProps = {
  title: string
  url?: string
}

const ShareDropdown: React.FC<ShareDropdownProps> = ({ title, url }) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      toast.success('Link berhasil disalin', {
        icon: <IconCheck size={16} className="text-green-500" />,
      })
    } catch (err) {
      toast.error('Gagal menyalin link')
      console.error(err)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const shareToSocial = (platform: string) => {
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${currentUrl}`)}`,
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="group gap-2 rounded-full border-primary/20 hover:border-primary/50 transition-all shadow-sm"
        >
          <IconShare
            size={18}
            className="text-primary group-hover:rotate-12 transition-transform"
          />
          <span className="font-medium">Bagikan</span>
          <IconChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2">
          Media Sosial
        </DropdownMenuLabel>

        <div className="grid grid-cols-2 gap-1 mb-2">
          <DropdownMenuItem
            onClick={() => shareToSocial('whatsapp')}
            className="flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-green-50 focus:bg-green-50 transition-colors rounded-lg group"
          >
            <IconBrandWhatsapp
              size={24}
              className="text-[#25D366] group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] mt-1 font-medium">WhatsApp</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => shareToSocial('twitter')}
            className="flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-lg group"
          >
            <IconBrandTwitter
              size={24}
              className="text-[#1DA1F2] group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] mt-1 font-medium">Twitter (X)</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => shareToSocial('facebook')}
            className="flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-blue-100 focus:bg-blue-100 transition-colors rounded-lg group"
          >
            <IconBrandFacebook
              size={24}
              className="text-[#1877F2] group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] mt-1 font-medium">Facebook</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => shareToSocial('linkedin')}
            className="flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-sky-50 focus:bg-sky-50 transition-colors rounded-lg group"
          >
            <IconBrandLinkedin
              size={24}
              className="text-[#0A66C2] group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] mt-1 font-medium">LinkedIn</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
          Opsi Lainnya
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={handleCopyLink}
          className="gap-3 cursor-pointer py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary"
        >
          <IconCopy size={18} />
          <span className="text-sm font-medium">Salin Tautan</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handlePrint}
          className="gap-3 cursor-pointer py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary"
        >
          <IconPrinter size={18} />
          <span className="text-sm font-medium">Cetak / PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ShareDropdown
