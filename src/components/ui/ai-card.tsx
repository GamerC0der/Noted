"use client";

import { cn } from "@/lib/utils";
import { motion, Variants } from "motion/react";
import React from "react";

type AICardProps = {
  cardTitle?: string;
  cardDescription?: string;
};

const AICard = ({
  cardTitle = "AI Integrated",
  cardDescription = "Hyper-Fast AI",
}: AICardProps) => {

  const iconVariant: Variants = {
    open: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    close: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div
      className={cn(
        "group relative",
        "h-[16rem] w-[400px]",
        "rounded-md border border-neutral-800 bg-neutral-900",
      )}
    >
      <motion.div
        variants={iconVariant}
        className={cn(
          "absolute inset-0 mx-auto my-auto",
          "flex h-12 w-12 items-center justify-center",
          "rounded-lg bg-neutral-800 border border-neutral-600",
        )}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-neutral-300"
        >
          <path
            d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 21H5V3H13V9H19V21Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>

      <div className="absolute bottom-4 left-0 w-full px-6">
        <h3 className="text-sm font-semibold text-white">{cardTitle}</h3>
        <p className="mt-1 text-xs text-neutral-400">{cardDescription}</p>
      </div>
    </div>
  );
};

export default AICard;
