'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Building2,
  Globe,
  Users,
  Share2,
  Search,
  Upload,
  Trash2,
  Save,
  Plus,
  X,
  Loader2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Link2,
  Image as ImageIcon,
} from 'lucide-react'
import {
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandWhatsapp,
} from '@tabler/icons-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

import {
  getPengaturanWebsite,
  savePengaturanWebsite,
  uploadGambar,
  deleteGambar,
  type PengaturanWebsite,
} from '@/lib/pengaturan'
import Image from 'next/image'

// ============================================================
// HELPER COMPONENTS
// ============================================================

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function ImagePreviewArea({
  value,
  shape = 'square',
  uploading,
  onClick,
  onDelete,
  label,
}: {
  value?: string | null
  shape?: 'square' | 'circle' | 'wide'
  uploading: boolean
  onClick: () => void
  onDelete: () => void
  label: string
}) {
  const previewClass =
    shape === 'circle'
      ? 'w-24 h-24 rounded-full'
      : shape === 'wide'
        ? 'w-full max-w-md aspect-[40/21] rounded-xl'
        : 'w-24 h-24 rounded-xl'

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={uploading}
        className={`group ${previewClass} border-2 border-dashed border-border bg-muted
    flex items-center justify-center overflow-hidden shrink-0
    hover:border-primary hover:bg-muted/60 transition-all cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed relative`}
      >
        {value ? (
          <Image src={value} alt={label} fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Klik untuk upload</span>
          </div>
        )}

        <div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
    transition-opacity flex items-center justify-center"
        >
          <div className="flex flex-col items-center text-white gap-1">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span className="text-xs font-medium">
              {uploading ? 'Uploading...' : 'Ubah gambar'}
            </span>
          </div>
        </div>

        {uploading && (
          <div
            className="absolute top-1 right-1 bg-primary/90 text-primary-foreground
      text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          >
            ...
          </div>
        )}
      </button>

      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground
            p-1 rounded-full shadow-md hover:bg-destructive/90 transition-colors
            opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Hapus gambar"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export function ImageUploader({
  label,
  hint,
  value,
  onChange,
  folder,
  shape = 'square',
  accept = 'image/*',
}: {
  label: string
  hint?: string
  value?: string | null
  onChange: (url: string | null) => void
  folder: 'logo' | 'favicon' | 'og-image' | 'avatar'
  shape?: 'square' | 'circle' | 'wide'
  accept?: string
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isOgImage = folder === 'og-image'

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    setUploading(true)
    const { data, error } = await uploadGambar(file, folder)
    setUploading(false)

    if (error) {
      toast.error(`Gagal upload: ${error}`)
      return
    }

    onChange(data)
    toast.success('Gambar berhasil diupload')
  }

  const handleDelete = async () => {
    if (!value) return
    const { error } = await deleteGambar(value)
    if (error) {
      toast.error(`Gagal hapus: ${error}`)
      return
    }
    onChange(null)
    toast.success('Gambar dihapus')
  }

  const triggerUpload = () => {
    if (!uploading) inputRef.current?.click()
  }

  if (isOgImage) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="space-y-2 md:space-y-0 md:flex md:items-start md:gap-4">
          <div className="min-w-md">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <ImagePreviewArea
              value={value}
              shape="wide"
              uploading={uploading}
              onClick={triggerUpload}
              onDelete={handleDelete}
              label={label}
            />
          </div>
          <div className="flex flex-col gap-0.5 pl-1 md:pl-0 md:justify-center md:min-h-24">
            {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
            <p className="text-[10px] text-muted-foreground/70">Format: JPG, PNG, GIF • Max 2MB</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-4">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <ImagePreviewArea
          value={value}
          shape={shape}
          uploading={uploading}
          onClick={triggerUpload}
          onDelete={handleDelete}
          label={label}
        />
        <div className="flex flex-col justify-center gap-1 min-h-24">
          {hint && (
            <p className="text-xs text-muted-foreground max-w-50 leading-relaxed">{hint}</p>
          )}
          <p className="text-[10px] text-muted-foreground/70">Format: JPG, PNG, GIF • Max 2MB</p>
        </div>
      </div>
    </div>
  )
}

function MisiEditor({ value, onChange }: { value: string[]; onChange: (val: string[]) => void }) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (!newItem.trim()) return
    onChange([...value, newItem.trim()])
    setNewItem('')
  }

  const removeItem = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, val: string) => {
    const updated = [...value]
    updated[idx] = val
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {value.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-2">
            {idx + 1}
          </div>
          <Textarea
            value={item}
            onChange={(e: { target: { value: string } }) => updateItem(idx, e.target.value)}
            rows={2}
            className="flex-1 resize-none text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(idx)}
            className="shrink-0 text-destructive hover:text-destructive mt-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Tambah poin misi baru..."
          className="flex-1 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// TAB: IDENTITAS
// ============================================================

function TabIdentitas({
  data,
  onChange,
}: {
  data: Partial<PengaturanWebsite>
  onChange: (field: keyof PengaturanWebsite, val: unknown) => void
}) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            icon={Building2}
            title="Identitas Lembaga"
            description="Informasi dasar yang tampil di seluruh website"
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nama_rtq">
              Nama RTQ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nama_rtq"
              value={data.nama_rtq ?? ''}
              onChange={(e) => onChange('nama_rtq', e.target.value)}
              placeholder="RTQ AL-HIKMAH"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploader
              label="Logo Website"
              hint="Rekomendasi: PNG transparan, min. 200×200px, maks. 2MB"
              value={data.logo_url}
              onChange={(url) => onChange('logo_url', url)}
              folder="logo"
            />
            <ImageUploader
              label="Favicon"
              hint="Rekomendasi: ICO / PNG 32×32px atau 64×64px"
              value={data.favicon_url}
              onChange={(url) => onChange('favicon_url', url)}
              folder="favicon"
              accept="image/png,image/x-icon,image/vnd.microsoft.icon"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="alamat">
              <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Alamat
            </Label>
            <Textarea
              id="alamat"
              value={data.alamat ?? ''}
              onChange={(e: { target: { value: unknown } }) => onChange('alamat', e.target.value)}
              placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="no_whatsapp">
                <Phone className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                No. WhatsApp
              </Label>
              <Input
                id="no_whatsapp"
                value={data.no_whatsapp ?? ''}
                onChange={(e) => onChange('no_whatsapp', e.target.value)}
                placeholder="628xxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">Format internasional (62...)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={data.email ?? ''}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="rtqalhikmahngurensiti@gmail.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_maps_embed">
              <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Google Maps Embed
            </Label>
            <Textarea
              id="google_maps_embed"
              value={data.google_maps_embed ?? ''}
              onChange={(e: { target: { value: unknown } }) =>
                onChange('google_maps_embed', e.target.value)
              }
              placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
              rows={3}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Salin kode embed dari Google Maps → Share → Embed a map
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// TAB: TENTANG
// ============================================================

function TabTentang({
  data,
  onChange,
}: {
  data: Partial<PengaturanWebsite>
  onChange: (field: keyof PengaturanWebsite, val: unknown) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            icon={Users}
            title="Tentang Lembaga"
            description="Profil singkat yang ditampilkan di halaman tentang kami"
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="deskripsi_singkat">Deskripsi Singkat</Label>
            <Textarea
              id="deskripsi_singkat"
              value={data.deskripsi_singkat ?? ''}
              onChange={(e: { target: { value: unknown } }) =>
                onChange('deskripsi_singkat', e.target.value)
              }
              placeholder="Deskripsi singkat tentang lembaga RTQ Anda..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {(data.deskripsi_singkat ?? '').length}/500 karakter
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="visi">Visi</Label>
            <Textarea
              id="visi"
              value={data.visi ?? ''}
              onChange={(e: { target: { value: unknown } }) => onChange('visi', e.target.value)}
              placeholder="Visi lembaga RTQ Anda..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <Label>Misi</Label>
              <Badge variant="secondary" className="text-xs">
                {(data.misi ?? []).length} poin
              </Badge>
            </div>
            <MisiEditor value={data.misi ?? []} onChange={(val) => onChange('misi', val)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// TAB: KONTAK & SOSIAL
// ============================================================

function TabKontak({
  data,
  onChange,
}: {
  data: Partial<PengaturanWebsite>
  onChange: (field: keyof PengaturanWebsite, val: unknown) => void
}) {
  const socials = [
    {
      key: 'whatsapp' as keyof PengaturanWebsite,
      label: 'WhatsApp',
      icon: IconBrandWhatsapp,
      placeholder: '628xxxxxxxxxx',
      hint: 'Nomor WhatsApp bisnis (format internasional)',
      color: 'text-green-600',
    },
    {
      key: 'instagram' as keyof PengaturanWebsite,
      label: 'Instagram',
      icon: IconBrandInstagram,
      placeholder: 'https://instagram.com/namaakun',
      hint: 'URL profil Instagram',
      color: 'text-pink-600',
    },
    {
      key: 'facebook' as keyof PengaturanWebsite,
      label: 'Facebook',
      icon: IconBrandFacebook,
      placeholder: 'https://facebook.com/namahalaman',
      hint: 'URL halaman Facebook',
      color: 'text-blue-600',
    },
    {
      key: 'youtube' as keyof PengaturanWebsite,
      label: 'YouTube',
      icon: IconBrandYoutube,
      placeholder: 'https://youtube.com/@namakanal',
      hint: 'URL kanal YouTube',
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            icon={Share2}
            title="Kontak & Media Sosial"
            description="Hubungkan website dengan platform komunikasi lembaga"
          />
        </CardHeader>
        <CardContent className="space-y-5">
          {socials.map(({ key, label, icon: Icon, placeholder, hint, color }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                {label}
              </Label>
              <div className="relative">
                <Input
                  id={key}
                  value={(data[key] as string) ?? ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="pr-10"
                />
                {data[key] && (
                  <a
                    href={key === 'whatsapp' ? `https://wa.me/${data[key]}` : (data[key] as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="teks_footer">Teks Footer</Label>
            <Input
              id="teks_footer"
              value={data.teks_footer ?? ''}
              onChange={(e) => onChange('teks_footer', e.target.value)}
              placeholder="© 2026 RTQ Al-Hikmah. Semua hak dilindungi."
            />
            <p className="text-xs text-muted-foreground">
              Tampil di bagian bawah setiap halaman website
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// TAB: SEO
// ============================================================

function TabSEO({
  data,
  onChange,
}: {
  data: Partial<PengaturanWebsite>
  onChange: (field: keyof PengaturanWebsite, val: unknown) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            icon={Search}
            title="SEO Dasar"
            description="Optimasi mesin pencari agar website mudah ditemukan"
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="meta_title">
              <Link2 className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Meta Title
            </Label>
            <Input
              id="meta_title"
              value={data.meta_title ?? ''}
              onChange={(e) => onChange('meta_title', e.target.value)}
              placeholder="RTQ Al-Hikmah"
              maxLength={60}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Judul yang muncul di tab browser dan hasil pencarian</span>
              <span className={(data.meta_title ?? '').length > 55 ? 'text-destructive' : ''}>
                {(data.meta_title ?? '').length}/60
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={data.meta_description ?? ''}
              onChange={(e: { target: { value: unknown } }) =>
                onChange('meta_description', e.target.value)
              }
              placeholder="Deskripsi singkat website Anda untuk mesin pencari..."
              rows={3}
              maxLength={160}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Deskripsi yang tampil di hasil pencarian Google</span>
              <span
                className={(data.meta_description ?? '').length > 150 ? 'text-destructive' : ''}
              >
                {(data.meta_description ?? '').length}/160
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <ImageUploader
              label="Open Graph Image (OG Image)"
              hint="Gambar yang muncul saat link dibagikan di WhatsApp, Facebook, dll. Rekomendasi: 1200×630px"
              value={data.og_image_url}
              onChange={(url) => onChange('og_image_url', url)}
              folder="og-image"
              shape="wide"
            />
          </div>

          {(data.meta_title || data.meta_description) && (
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Preview hasil pencarian Google:
              </p>
              <div className="space-y-0.5">
                <p className="text-sm text-blue-600 font-medium line-clamp-1">
                  {data.meta_title || 'Judul Website'}
                </p>
                <p className="text-xs text-green-700">
                  {typeof window !== 'undefined'
                    ? window.location.origin
                    : 'https://website-anda.com'}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {data.meta_description || 'Deskripsi website...'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function PengaturanPage() {
  const [websiteData, setWebsiteData] = useState<Partial<PengaturanWebsite>>({
    nama_rtq: '',
    misi: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('identitas')

  useEffect(() => {
    const load = async () => {
      const { data, error } = await getPengaturanWebsite()
      if (error) {
        toast.error('Gagal memuat pengaturan: ' + error)
      } else if (data) {
        setWebsiteData(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleChange = useCallback((field: keyof PengaturanWebsite, val: unknown) => {
    setWebsiteData((prev) => ({ ...prev, [field]: val }))
    setHasChanges(true)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await savePengaturanWebsite(websiteData)
    setSaving(false)

    if (error) {
      toast.error('Gagal menyimpan: ' + error)
    } else {
      toast.success('Pengaturan berhasil disimpan! ✓')
      setHasChanges(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Memuat pengaturan...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'identitas', label: 'Identitas', icon: Building2 },
    { id: 'tentang', label: 'Tentang', icon: Users },
    { id: 'kontak', label: 'Kontak & Sosial', icon: Share2 },
    { id: 'seo', label: 'SEO', icon: Search },
  ]

  return (
    <div className="bg-background p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola identitas, konten, dan konfigurasi website RTQ
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2 shrink-0">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {hasChanges ? 'Simpan Perubahan' : 'Tersimpan'}
            </>
          )}
        </Button>
      </div>

      {/* Unsaved changes banner */}
      {hasChanges && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          Ada perubahan yang belum disimpan
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full h-auto flex-wrap gap-1 p-1 sm:grid sm:grid-cols-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="identitas" className="mt-0">
            <TabIdentitas data={websiteData} onChange={handleChange} />
          </TabsContent>

          <TabsContent value="tentang" className="mt-0">
            <TabTentang data={websiteData} onChange={handleChange} />
          </TabsContent>

          <TabsContent value="kontak" className="mt-0">
            <TabKontak data={websiteData} onChange={handleChange} />
          </TabsContent>

          <TabsContent value="seo" className="mt-0">
            <TabSEO data={websiteData} onChange={handleChange} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Bottom save bar (mobile sticky) */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border flex justify-end sm:hidden z-50">
          <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      )}
    </div>
  )
}
