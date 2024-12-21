'use client'

import Image from 'next/image'

interface IconImageProps {
  src: string
  alt: string
  className?: string
}

export default function IconImage({ src, alt, className }: IconImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className={className}
      unoptimized // Since these are SVGs, we can skip optimization
    />
  )
}
