"use client"

import * as React from "react"

interface FeyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const WriteIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      />
    </svg>
  )
}

export function FeyButton({
  className,
  children,
  ...props
}: FeyButtonProps) {
  return (
    <button
      className={`
        group relative flex items-center justify-center gap-1
        h-8 min-w-[136px] whitespace-nowrap rounded-[28px] px-3 py-2
        text-sm font-semibold leading-tight
        text-white
        bg-[radial-gradient(61.35%_50.07%_at_48.58%_50%,rgb(0,0,0)_0%,rgba(255,255,255,0.04)_100%)]
        [box-shadow:inset_0_0_0_0.5px_rgba(134,143,151,0.2),inset_1px_1px_0_-0.5px_rgba(134,143,151,0.4),inset_-1px_-1px_0_-0.5px_rgba(134,143,151,0.4)]
        after:absolute after:inset-0 after:rounded-[28px] after:opacity-0 after:transition-opacity after:duration-200
        after:bg-[radial-gradient(61.35%_50.07%_at_48.58%_50%,rgb(0,0,0)_0%,rgb(24,24,24)_100%)]
        after:[box-shadow:inset_0_0_0_0.5px_hsl(var(--border)),inset_1px_1px_0_-0.5px_hsl(var(--border)),inset_-1px_-1px_0_-0.5px_hsl(var(--border)),0_0_3px_rgba(255,255,255,0.1)]
        hover:after:opacity-100
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className || ''}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-1">
        <WriteIcon />
        {children}
      </span>
    </button>
  )
}
