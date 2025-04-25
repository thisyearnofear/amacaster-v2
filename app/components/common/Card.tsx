import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  children: React.ReactNode
}

export function Card({ title, children, ...props }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6" {...props}>
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      {children}
    </div>
  )
}
