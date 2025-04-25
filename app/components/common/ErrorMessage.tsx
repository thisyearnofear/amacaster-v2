import React from 'react'

interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ErrorMessage({ children, ...props }: ErrorMessageProps) {
  return (
    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg" {...props}>
      {children}
    </div>
  )
}
