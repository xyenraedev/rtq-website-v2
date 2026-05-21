'use client'
import { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import Image from 'next/image'
import { motion } from 'motion/react'

const sectionVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function KenaliKami() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const items = [
    {
      title: "Membangun Generasi Qur'ani Sejak Dini",
      content:
        "Di RTQ Al-Hikmah, kami percaya setiap anak punya potensi besar. Kami bimbing mereka dengan kasih sayang agar bisa mengenal dan mencintai Al-Qur'an sejak kecil. Belajar jadi lebih menyenangkan dengan cara yang mudah dimengerti.",
    },
    {
      title: "Pendidikan dengan Metode Yanbu'a",
      content:
        "Kami menggunakan metode Yanbu'a untuk mengajarkan Al-Qur'an. Anak-anak belajar secara bertahap sesuai usia mereka. Cara ini membuat mereka semakin percaya diri dan semangat dalam belajar.",
    },
    {
      title: 'Mengasah Potensi Anak dengan Kurikulum Islami Terbaik',
      content:
        'Setiap anak berhak mendapatkan pendidikan terbaik. Di RTQ Al-Hikmah, kami menggabungkan kurikulum islami dengan cara belajar yang seru. Anak-anak tidak hanya pintar, tapi juga punya akhlak yang baik.',
    },
  ]

  return (
    <motion.div
      className="container mx-auto flex flex-col lg:flex-row w-full gap-8 px-4 py-14 md:py-20"
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Text Section */}
      <div className="flex-1 flex flex-col gap-5">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-green-600">
            Profil Lembaga
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl">
            Kenali Kami Lebih Dekat
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className={`w-full flex justify-between items-center p-4 transition-colors ${
                  activeIndex === index ? 'bg-yellow-400' : 'hover:bg-gray-50'
                }`}
              >
                <h3
                  className={`text-sm font-semibold text-start md:text-base ${
                    activeIndex === index ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {item.title}
                </h3>
                <IconChevronDown
                  className={`shrink-0 ml-3 text-gray-600 transition-transform duration-300 ${
                    activeIndex === index ? 'rotate-180' : ''
                  }`}
                  size={18}
                  stroke={2}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeIndex === index ? 'max-h-125' : 'max-h-0'
                }`}
              >
                <div className="p-4">
                  <p className="text-xs leading-relaxed text-gray-600 md:text-sm">{item.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Section */}
      <div className="flex-1 order-1 lg:order-2 flex justify-center items-center">
        <div className="relative w-65 h-65 sm:w-90 sm:h-90 lg:w-115 lg:h-115">
          <Image
            src="/images/hero-3.svg"
            alt="Hero Image"
            width={460}
            height={460}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      </div>
    </motion.div>
  )
}
