'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  const handleScroll = (id: string) => {
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="container mx-auto px-4 pt-14 md:pt-20">
      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
        {/* Text Section */}
        <div className="flex-1 order-2 lg:order-1 relative z-10">
          <div className="max-w-2xl mx-auto lg:mx-0 sm:text-center lg:text-left">
            <div className="mb-5">
              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-semibold shadow-sm md:text-xs">
                Yanbu&#39;a Islami
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5 md:text-5xl lg:text-6xl">
              Membentuk Santri Cinta
              <span className="relative whitespace-nowrap text-green-600">
                <span className="relative z-10"> Al-Qur&#39;an </span>
              </span>
              Sejak Dini
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-8 md:text-base">
              Bersama kami, santri akan belajar membaca, menghafal, dan mengamalkan ajaran
              Al-Qur&#39;an dalam kehidupan sehari-hari.
            </p>
            <div className="flex flex-row gap-3 justify-start">
              <Link href="/pendaftaran">
                <button className="text-sm bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-medium transition-all hover:scale-105 shadow-sm hover:shadow-green-200">
                  Daftar Sekarang
                </button>
              </Link>
              <button
                onClick={() => handleScroll('program-section')}
                className="text-sm border-2 border-green-600 text-green-700 hover:bg-green-50 px-6 py-2.5 rounded-full font-medium transition-all hover:scale-105"
              >
                Info Program
              </button>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="flex-1 order-1 lg:order-2 flex justify-center items-center">
          <div className="relative w-65 h-65 sm:w-90 sm:h-90 lg:w-115 lg:h-115 ml-auto">
            <Image
              src="/images/hero-1.svg"
              alt="Hero Image"
              width={460}
              height={460}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}
