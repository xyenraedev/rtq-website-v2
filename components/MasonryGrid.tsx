'use client'

import { useState, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useResizeObserver } from '@wojtekmaj/react-hooks'

interface ImageData {
  id: string
  image_url: string
  galeri_nama: string
  width: number | null
  height: number | null
  created_at: string
}

const MasonryGrid = ({ images }: { images: ImageData[] }) => {
  const [columnCount, setColumnCount] = useState(1)
  const gridRef = useRef<HTMLDivElement>(null)

  useResizeObserver(
    gridRef.current as HTMLDivElement,
    {
      box: 'border-box',
    },
    (entries: ResizeObserverEntry[]) => {
      if (!entries || !Array.isArray(entries) || entries.length === 0) return

      const entry = entries[0]
      const width = entry.contentRect ? entry.contentRect.width : 0

      if (width === 0) return

      if (width < 640) setColumnCount(1)
      else if (width < 1024) setColumnCount(2)
      else if (width < 1536) setColumnCount(3)
      else setColumnCount(4)
    }
  )

  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => [] as ImageData[])
    images.forEach((image, index) => {
      cols[index % columnCount].push(image)
    })
    return cols
  }, [images, columnCount])

  return (
    <div ref={gridRef} className="w-full min-h-50">
      <div
        className="grid gap-6 items-start"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          display: columnCount === 0 ? 'none' : 'grid',
        }}
      >
        {columns.map((column, colIndex) => (
          <div key={`col-${colIndex}`} className="flex flex-col gap-6">
            <AnimatePresence mode="popLayout">
              {column.map((image) => (
                <GridItem key={image.id} image={image} />
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

const GridItem = ({ image }: { image: ImageData }) => {
  const aspectRatio = image.width && image.height ? image.width / image.height : 1

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg bg-muted"
      style={{
        aspectRatio: `${aspectRatio}`,
        minHeight: '150px',
      }}
    >
      <Image
        src={image.image_url}
        alt={image.galeri_nama}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        loading="lazy"
        unoptimized
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <h3 className="text-white font-bold text-sm md:text-base leading-tight line-clamp-2">
          {image.galeri_nama}
        </h3>
      </div>
    </motion.div>
  )
}

export default MasonryGrid
