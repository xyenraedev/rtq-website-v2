'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconTargetArrow, IconRocket, IconQuote } from '@tabler/icons-react'

export default function VisiMisi() {
  const [data, setData] = useState<{ visi: string; misi: string[] | null }>({
    visi: '',
    misi: [],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: settings, error } = await supabase
        .from('pengaturan_website')
        .select('visi, misi')
        .single()
      if (!error && settings) {
        setData({ visi: settings.visi || '', misi: settings.misi || [] })
      }
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  return (
    <section className="relative w-full py-14 md:py-20 overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-background/95 via-background/80 to-background/95 backdrop-blur-[2px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col gap-10 md:gap-14">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <Badge
              variant="outline"
              className="text-primary border-primary/50 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest font-semibold md:text-xs"
            >
              Prinsip Dasar
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Visi & <span className="text-primary">Misi Kami</span>
            </h2>
            <div className="h-1 w-16 bg-accent mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visi */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-card/70 border-border backdrop-blur-md overflow-hidden shadow-sm">
                <CardContent className="p-6 md:p-8 relative">
                  <IconQuote className="absolute top-4 right-4 text-primary/10" size={64} />
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="p-2 bg-primary rounded-lg shadow-sm shrink-0">
                      <IconTargetArrow size={18} className="text-primary-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-card-foreground md:text-base">
                      Visi Utama
                    </h3>
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic text-muted-foreground relative z-10 md:text-base">
                    {loading ? 'Menghubungkan ke database...' : `"${data.visi}"`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Misi */}
            <motion.div
              className="lg:col-span-7 space-y-3"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent rounded-lg text-accent-foreground shadow-sm shrink-0">
                  <IconRocket size={18} />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground md:text-base">
                  Misi Pencapaian
                </h3>
              </div>

              <div className="grid gap-3">
                <AnimatePresence>
                  {data.misi?.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border hover:border-primary/50 hover:bg-card/80 hover:shadow-sm transition-all duration-300 backdrop-blur-sm"
                    >
                      <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {index + 1}
                      </span>
                      <p className="text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors md:text-sm">
                        {item}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Dekorasi */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent to-transparent opacity-50" />
    </section>
  )
}
