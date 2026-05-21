"use client";
import { useEffect, useCallback } from "react";
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";

const ScrollToTopButton = () => {
  const progress = useMotionValue(0);
  const pathLength = useMotionTemplate`${progress}`;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  const handleScroll = useCallback(() => {
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    progress.set(window.scrollY / totalHeight);
  }, [progress]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 group z-40"
    >
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="relative p-2 sm:p-3 bg-linear-to-br from-green-600 to-emerald-500 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Scroll to top"
      >
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12 transform group-hover:scale-110 transition-transform"
          viewBox="0 0 48 48"
        >
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          <motion.circle
            cx="24"
            cy="24"
            r={radius}
            fill="transparent"
            stroke="white"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={useMotionTemplate`calc(${circumference} - ${pathLength} * ${circumference})`}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
          />
        </svg>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            y: [0, -4, 0],
            transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
          }}
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </motion.div>
      </button>
      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{
              scale: 0,
              opacity: 0,
              x: Math.random() * 20 - 10,
              y: Math.random() * 20 - 10,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.5, 0],
              transition: { duration: 1.5, repeat: Infinity, delay: i * 0.2 },
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ScrollToTopButton;
