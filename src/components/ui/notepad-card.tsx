"use client";

import { cn } from "@/lib/utils";
import { motion, Variants } from "motion/react";
import React, { useState } from "react";

type NotepadCardProps = {
  cardTitle?: string;
  cardDescription?: string;
};

const NotepadCard = ({
  cardTitle = "Note It Down",
  cardDescription = "Quick and Easy",
}: NotepadCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardVariant: Variants = {
    open: {
      transform: "translateY(-8px)",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    close: {
      transform: "translateY(0px)",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

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
            d="M14.06 9.02L14.98 9.94L5.92 19H5V18.08L14.06 9.02ZM17.66 3C17.41 3 17.15 3.1 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C18.17 3.1 17.92 3 17.66 3ZM14.06 6.19L3 17.25V21H6.75L17.81 9.94L14.06 6.19Z"
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

export default NotepadCard;
