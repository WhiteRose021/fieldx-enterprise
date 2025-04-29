"use client"

import React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress: React.FC<ProgressProps> = ({ 
  value = 0, 
  className = "", 
  ...props 
}) => {
  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      {...props}
    >
      <div
        className="h-full bg-blue-500 rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

Progress.displayName = "Progress"

export { Progress }