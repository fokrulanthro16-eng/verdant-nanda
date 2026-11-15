/**
 * card-tilt.js - Interactive 3D Spatial Tilt & Refractive Cursor Glare
 * 
 * Provides Apple VisionOS style dynamic 3D depth and specular light reflection
 * on glass bento cards.
 */

export function initSpatialCardTilt() {
  const cards = document.querySelectorAll(".spatial-card");

  cards.forEach(card => {
    // Add specular glare overlay element if not present
    let glare = card.querySelector(".spatial-glare");
    if (!glare) {
      glare = document.createElement("div");
      glare.className = "spatial-glare";
      card.appendChild(glare);
    }

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Limit rotation to a subtle, luxurious range (-6deg to +6deg)
      const rotateX = ((centerY - y) / centerY) * 5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;

      // Move specular glare highlight
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(167, 243, 208, 0.18) 0%, rgba(16, 185, 129, 0.05) 45%, transparent 70%)`;
      glare.style.opacity = "1";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
      glare.style.opacity = "0";
    });
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSpatialCardTilt);
  } else {
    initSpatialCardTilt();
  }
}
