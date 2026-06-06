// @ts-ignore: Falta @types/react en este entorno
import React from "react";
import { motion } from "motion/react";

/** Category model for the medical carousel */
export interface MedicalCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MedicalCategoryCarouselProps {
  categories: MedicalCategory[];
  selectedCategory: string;
  onCategorySelected: (category: string) => void;
}

/** Premium horizontal category carousel overlaid on the map – Apple Maps / Uber style */
export default function MedicalCategoryCarousel({
  categories,
  selectedCategory,
  onCategorySelected,
}: MedicalCategoryCarouselProps) {
  return (
    <div
      className="medical-carousel-wrapper"
      style={{
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        padding: "0 16px",
      }}
    >
      {/* Hide scrollbar for WebKit */}
      <style>{`.medical-carousel-wrapper::-webkit-scrollbar { display: none; }`}</style>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "nowrap",
          alignItems: "center",
          minWidth: "max-content",
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <motion.button
              key={cat.id}
              id={`btn-category-${cat.id}`}
              onClick={() => onCategorySelected(cat.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 h-[52px] px-5 rounded-[24px] border-[1.5px] cursor-pointer shrink-0 outline-none backdrop-blur-md transition-all duration-200 ${
                isSelected
                  ? "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-[0_4px_16px_rgba(59,130,246,0.12)]"
                  : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              }`}
            >
              {/* Icon container */}
              <span
                className={`flex items-center justify-center w-5 h-5 shrink-0 transition-colors duration-200 ${
                  isSelected ? "text-blue-600 dark:text-blue-450" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {cat.icon}
              </span>

              {/* Label */}
              <span
                className={`text-[13.5px] font-semibold tracking-tight whitespace-nowrap font-sans transition-colors duration-200 ${
                  isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-350"
                }`}
              >
                {cat.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
