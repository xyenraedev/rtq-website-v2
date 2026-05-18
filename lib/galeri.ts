import { createClient } from '@/lib/supabase/client'

export interface GaleriImage {
  url: string
  width: number | null
  height: number | null
}

export interface Galeri {
  id: string
  galeri_kategori_id: string | null
  judul: string | null
  deskripsi: string | null
  images: GaleriImage[]
  created_at: string | null
}

export interface GaleriWithKategori extends Galeri {
  galeri_kategori: {
    id: string
    nama: string
  } | null
}

type RawGaleri = Galeri & {
  galeri_kategori:
    | {
        id: string
        nama: string
      }[]
    | null
}

export interface InsertGaleriInput {
  galeri_kategori_id?: string | null
  judul?: string | null
  deskripsi?: string | null
  created_at?: string | null
}

export interface UpdateGaleriInput {
  galeri_kategori_id?: string | null
  judul?: string | null
  deskripsi?: string | null
  created_at?: string | null
}

const BUCKET = 'galeri_images'

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient() {
  return createClient()
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

function getStoragePathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)

    const marker = `/storage/v1/object/public/${BUCKET}/`

    const index = parsed.pathname.indexOf(marker)

    if (index === -1) return null

    return parsed.pathname.slice(index + marker.length)
  } catch {
    return null
  }
}

// ─── Transform ────────────────────────────────────────────────────────────────

function transformRelasi(data: RawGaleri[]): GaleriWithKategori[] {
  return data.map((item) => ({
    id: item.id,
    galeri_kategori_id: item.galeri_kategori_id,
    judul: item.judul,
    deskripsi: item.deskripsi,
    images: item.images ?? [],
    created_at: item.created_at,
    galeri_kategori: item.galeri_kategori?.[0] ?? null,
  }))
}

// ─── Query Fields ─────────────────────────────────────────────────────────────

const SELECT_FIELDS = `
  id,
  galeri_kategori_id,
  judul,
  deskripsi,
  images,
  created_at,
  galeri_kategori:galeri_kategori_id (
    id,
    nama
  )
`

// ─── Upload Helpers ───────────────────────────────────────────────────────────

async function uploadSingleImage(galeriId: string, file: File): Promise<GaleriImage> {
  const supabase = getClient()

  const ext = file.name.split('.').pop() ?? 'jpg'

  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`

  const path = `public/${galeriId}/${fileName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const dimensions = await getImageDimensions(file)

  return {
    url: data.publicUrl,
    width: dimensions.width,
    height: dimensions.height,
  }
}

async function getImageDimensions(
  file: File
): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      })
    }

    img.onerror = () => {
      resolve({
        width: null,
        height: null,
      })
    }

    img.src = URL.createObjectURL(file)
  })
}

export async function uploadImages(galeriId: string, files: File[]): Promise<GaleriImage[]> {
  const uploaded = await Promise.all(files.map((file) => uploadSingleImage(galeriId, file)))

  return uploaded
}

export async function deleteStorageImages(images: GaleriImage[]): Promise<void> {
  const supabase = getClient()

  const paths = images
    .map((img) => getStoragePathFromUrl(img.url))
    .filter((p): p is string => p !== null)

  if (paths.length === 0) return

  await supabase.storage.from(BUCKET).remove(paths)
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchGaleri(): Promise<GaleriWithKategori[]> {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('galeri')
    .select(SELECT_FIELDS)
    .order('created_at', { ascending: false })

  if (error) throw error

  if (!data) return []

  return transformRelasi(data as RawGaleri[])
}

export async function fetchGaleriById(id: string): Promise<GaleriWithKategori | null> {
  const supabase = getClient()

  const { data, error } = await supabase.from('galeri').select(SELECT_FIELDS).eq('id', id).single()

  if (error) throw error

  if (!data) return null

  const item = data as RawGaleri

  return {
    id: item.id,
    galeri_kategori_id: item.galeri_kategori_id,
    judul: item.judul,
    deskripsi: item.deskripsi,
    images: item.images ?? [],
    created_at: item.created_at,
    galeri_kategori: item.galeri_kategori?.[0] ?? null,
  }
}

// ─── Insert ───────────────────────────────────────────────────────────────────

export async function insertGaleri(
  input: InsertGaleriInput,
  files: File[] = []
): Promise<GaleriWithKategori> {
  const supabase = getClient()

  const { data: inserted, error: insertError } = await supabase
    .from('galeri')
    .insert({
      galeri_kategori_id: input.galeri_kategori_id ?? null,
      judul: input.judul?.trim() || null,
      deskripsi: input.deskripsi?.trim() || null,
      created_at: input.created_at ?? null,
      images: [],
    })
    .select('id')
    .single()

  if (insertError) throw insertError

  if (!inserted) {
    throw new Error('Insert failed')
  }

  const galeriId = inserted.id

  let uploadedImages: GaleriImage[] = []

  if (files.length > 0) {
    uploadedImages = await uploadImages(galeriId, files)
  }

  const { data, error } = await supabase
    .from('galeri')
    .update({
      images: uploadedImages,
    })
    .eq('id', galeriId)
    .select(SELECT_FIELDS)
    .single()

  if (error) throw error

  if (!data) {
    throw new Error('Failed update images')
  }

  const item = data as RawGaleri

  return {
    id: item.id,
    galeri_kategori_id: item.galeri_kategori_id,
    judul: item.judul,
    deskripsi: item.deskripsi,
    images: item.images ?? [],
    created_at: item.created_at,
    galeri_kategori: item.galeri_kategori?.[0] ?? null,
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateGaleri(
  id: string,
  input: UpdateGaleriInput,
  newFiles?: File[],
  oldImages?: GaleriImage[]
): Promise<GaleriWithKategori> {
  const supabase = getClient()

  const payload: Record<string, unknown> = {}

  if (input.galeri_kategori_id !== undefined) {
    payload.galeri_kategori_id = input.galeri_kategori_id
  }

  if (input.judul !== undefined) {
    payload.judul = input.judul?.trim() || null
  }

  if (input.deskripsi !== undefined) {
    payload.deskripsi = input.deskripsi?.trim() || null
  }

  if (input.created_at !== undefined) {
    payload.created_at = input.created_at
  }

  if (newFiles && newFiles.length > 0) {
    const uploadedImages = await uploadImages(id, newFiles)

    payload.images = uploadedImages

    if (oldImages && oldImages.length > 0) {
      await deleteStorageImages(oldImages)
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('No fields to update')
  }

  const { data, error } = await supabase
    .from('galeri')
    .update(payload)
    .eq('id', id)
    .select(SELECT_FIELDS)
    .single()

  if (error) throw error

  if (!data) {
    throw new Error('Update failed')
  }

  const item = data as RawGaleri

  return {
    id: item.id,
    galeri_kategori_id: item.galeri_kategori_id,
    judul: item.judul,
    deskripsi: item.deskripsi,
    images: item.images ?? [],
    created_at: item.created_at,
    galeri_kategori: item.galeri_kategori?.[0] ?? null,
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteGaleri(id: string, images: GaleriImage[]): Promise<void> {
  const supabase = getClient()

  const { error } = await supabase.from('galeri').delete().eq('id', id)

  if (error) throw error

  await deleteStorageImages(images)
}

export async function deleteBulkGaleri(
  items: Array<{
    id: string
    images: GaleriImage[]
  }>
): Promise<void> {
  const supabase = getClient()

  const ids = items.map((i) => i.id)

  const { error } = await supabase.from('galeri').delete().in('id', ids)

  if (error) throw error

  const allImages = items.flatMap((item) => item.images)

  await deleteStorageImages(allImages)
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDimensions(width: number | null, height: number | null): string {
  if (!width || !height) return '-'

  return `${width} × ${height}`
}
