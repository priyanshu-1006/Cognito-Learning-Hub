import React, { useState, useEffect, useRef } from "react";

/**
 * LazyImage component for optimized image loading
 * Uses Intersection Observer API for lazy loading
 * Includes blur-up effect for better UX
 */
const LazyImage = ({
  src,
  alt,
  className = "",
  placeholderSrc = null,
  threshold = 0.1,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Intersection Observer
    if (!("IntersectionObserver" in window)) {
      // Fallback: load image immediately
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: "50px", // Start loading 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      onLoad={handleLoad}
      loading="lazy" // Native lazy loading as fallback
      {...props}
    />
  );
};

export default LazyImage;
