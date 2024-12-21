"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

export default function SafeImage({
  src,
  fallbackSrc = "/default-avatar.png",
  alt,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);

  // List of known safe domains that work with Next.js Image optimization
  const safeDomains = [
    "res.cloudinary.com",
    "i.imgur.com",
    "avatar.vercel.sh",
    "avatars.githubusercontent.com",
  ];

  // Check if the image URL is from a safe domain
  const isSafeDomain = safeDomains.some(
    (domain) => typeof src === "string" && src.includes(domain)
  );

  // Convert src to string for img tag
  const imgSrc = error 
    ? fallbackSrc 
    : (typeof src === 'string' 
      ? src 
      : typeof src === 'object' && 'default' in src 
        ? src.default.src 
        : fallbackSrc)

  if (error || !isSafeDomain) {
    // Use a regular img tag for unsafe domains or errors
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        alt={alt}
        className={props.className}
        style={props.style}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <Image {...props} src={src} alt={alt} onError={() => setError(true)} />
  );
}
