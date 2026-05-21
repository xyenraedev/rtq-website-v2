'use client'

import CardSliderProgram from '@/components/card/CardSliderKelas'
import { motion } from 'motion/react'

const sectionVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function KelasUnggulan() {
  return (
    <motion.div
      className="container mx-auto overflow-hidden px-4 "
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="sm:text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Kelas Unggulan</h2>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          Kelas Unggulan hadir untuk membantu santri menghafal, membaca, dan memahami Al-Qur&#39;an
          dengan cara yang menyenangkan, interaktif, serta penuh makna.
        </p>
      </div>
        <CardSliderProgram />
    </motion.div>
  )
}
