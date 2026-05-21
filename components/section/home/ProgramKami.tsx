'use client'
import Image from 'next/image'
import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { motion } from 'motion/react'

export default function ProgramKami() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="container mx-auto flex flex-col lg:flex-row gap-8 px-4 py-14 md:py-20">
        {/* Image */}
        <div className="flex-1 flex justify-center items-center">
          <div className="relative w-65 h-65 sm:w-90 sm:h-90 lg:w-115 lg:h-115">
            <Image
              src="/images/hero-2.svg"
              alt="Hero Image"
              width={460}
              height={460}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 flex flex-col gap-5">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-green-600">
              Tentang Kami
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl">
              Program Kami
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-gray-600 md:text-base">
            Belajar Al-Qur&#39;an adalah investasi akhirat. Di RTQ Al-Hikmah, setiap santri
            diajarkan membaca ayat suci dan menghidupkan nilai-nilai Islam dalam kehidupan
            sehari-hari.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-white rounded-xl p-4 bg-green-500">
            {[
              { number: '17+', title: 'Tahun Lebih', subtitle: 'Pengalaman' },
              { number: '24+', title: 'Santri Baru', subtitle: 'Setiap Tahun' },
              { number: '15+', title: 'Santri Meraih', subtitle: 'Juara Lomba' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-xl font-bold md:text-2xl">{stat.number}</p>
                <p className="text-xs mt-0.5 md:text-sm">{stat.title}</p>
                <p className="text-xs md:text-sm">{stat.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3">
            {['Kami membantu mencapai yang terbaik.', 'Mencetak generasi islami sejak dini.'].map(
              (text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Image
                    src="/images/chev.svg"
                    alt="Icon"
                    width={20}
                    height={20}
                    className="shrink-0"
                  />
                  <p className="text-sm text-gray-700 md:text-base">{text}</p>
                </div>
              )
            )}
          </div>

          {/* Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-yellow-400 py-2.5 text-sm px-6 rounded-full text-white font-medium w-fit hover:bg-yellow-500 transition-colors"
          >
            Lihat Detail
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-3 md:text-xl">Detail Program Kami</h3>
            <p className="text-sm leading-relaxed text-gray-600 md:text-base">
              Belajar Al-Qur&#39;an di RTQ Al-Hikmah tidak hanya tentang membaca, tapi juga tentang{' '}
              <span className="font-semibold">memahami nilai-nilai Islam</span> yang bisa diterapkan
              sehari-hari. Kami percaya bahwa{' '}
              <span className="font-semibold">setiap santri istimewa</span>, dan kami siap membantu
              mereka mencapai potensi terbaik.
            </p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <IconX size={20} stroke={2} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
