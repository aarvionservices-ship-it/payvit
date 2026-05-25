import { useRef, useState, useEffect, type ReactNode } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

interface CarouselProps {
  children: ReactNode;
}

export function Carousel({ children }: CarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === "left" ? -clientWidth / 2 : clientWidth / 2;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Navigation Buttons */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none z-20 px-2 sm:px-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={cn(
            "pointer-events-auto p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl transition-opacity",
            !canScrollLeft ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-white/20"
          )}
        >
          <ChevronLeft size={24} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={cn(
            "pointer-events-auto p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl transition-opacity",
            !canScrollRight ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-white/20"
          )}
        >
          <ChevronRight size={24} />
        </motion.button>
      </div>

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        onScroll={checkScroll}
        className="flex gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-12 pt-4 px-4 -mx-4 items-center"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
    </div>
  );
}

