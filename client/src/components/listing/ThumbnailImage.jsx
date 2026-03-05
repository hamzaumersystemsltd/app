import React from "react";

const PLACEHOLDER_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>
      <rect width='100%' height='100%' fill='#f0f0f0'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#bbb' font-size='10' font-family='sans-serif'>No Image</text>
    </svg>`
  );

export default function ThumbnailImage({ src, alt = "image", className = "thumb" }) {
  const handleError = (e) => {
    e.currentTarget.src = PLACEHOLDER_DATA_URL;
  };
  return (
    <div className="thumb-cell">
      <img
        src={src || PLACEHOLDER_DATA_URL}
        alt={alt}
        className={className}
        loading="lazy"
        onError={handleError}
      />
    </div>
  );
}