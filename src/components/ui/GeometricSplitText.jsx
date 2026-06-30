"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * @typedef {Object} GeometricSplitTextProps
 * @property {string} text
 * @property {string} [subText]
 * @property {string} [className]
 * @property {string} [textClassName]
 * @property {string} [subTextClassName]
 */

export const GeometricSplitText = ({
  text,
  subText,
  className,
  textClassName,
  subTextClassName,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn("relative flex items-center justify-center cursor-pointer group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <div className="relative">
        
        {/* Top Half of the Primary Text */}
        <motion.div
           animate={{ y: isHovered ? -20 : 0 }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
           className={cn("absolute inset-0 select-none overflow-hidden", textClassName)}
           style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
        >
           <span style={{ fontFamily: 'Georgia, serif' }} className="opacity-100">{text}</span>
        </motion.div>

        {/* Bottom Half of the Primary Text */}
        <motion.div
           animate={{ y: isHovered ? 20 : 0 }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
           className={cn("relative select-none overflow-hidden", textClassName)}
           style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}
        >
           <span style={{ fontFamily: 'Georgia, serif' }} className="opacity-100">{text}</span>
        </motion.div>

        {/* Subtext rendering inside the split void */}
        {subText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: "-50%" }}
            animate={{
               opacity: isHovered ? 1 : 0,
               scale: isHovered ? 1 : 0.8,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: isHovered ? 0.05 : 0 }}
            className={cn(
               "absolute top-1/2 left-0 right-0 flex items-center justify-center whitespace-nowrap pointer-events-none mt-[1px]",
               subTextClassName
            )}
          >
            {subText}
          </motion.div>
        )}
      </div>
    </div>
  );
};
