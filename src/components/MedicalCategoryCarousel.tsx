import React from "react";
import { motion } from "motion/react";

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
      { }
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
          const isBlueTheme = cat.id === "hospitales" || cat.id === "medicos";

          return (
            <motion.button
              key={cat.id}
              id={`btn-category-${cat.id}`}
              onClick={() => onCategorySelected(cat.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 h-[52px] px-5 rounded-[24px] border-[1.5px] cursor-pointer shrink-0 outline-none backdrop-blur-md transition-all duration-200 ${isSelected
                  ? isBlueTheme
                    ? "bg-blue-600 border-blue-600 dark:bg-blue-600 dark:border-blue-600 shadow-[0_4px_16px_rgba(37,99,235,0.4)]"
                    : "bg-emerald-600 border-emerald-600 dark:bg-emerald-600 dark:border-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.4)]"
                  : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                }`}
            >
              { }
              <span
                className={`flex items-center justify-center w-5 h-5 shrink-0 transition-colors duration-200 ${isSelected
                    ? "text-white"
                    : "text-slate-400 dark:text-white"
                  }`}
              >
                {cat.icon}
              </span>

              { }
              <span
                className={`text-[13.5px] font-semibold tracking-tight whitespace-nowrap font-sans transition-colors duration-200 ${isSelected
                    ? "text-white"
                    : "text-slate-700 dark:text-white"
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
