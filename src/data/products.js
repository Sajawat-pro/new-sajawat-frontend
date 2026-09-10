export const products = [
  {
    id: "1",
    slug: "monstera-3d-frame-black",
    name: "3D Aesthetic Plant Frame — Monstera / Black",
    collection: "3D Plant Frames",

    // Keep prices as numbers
    price: 39,
    oldPrice: 59,

    color: "Black",
    plantType: "Monstera",
    rating: 4.8,
    reviewCount: 214,
    sku: "PF-MON-BLK",

    description:
      "A hand-layered 3D botanical frame featuring a lifelike Monstera leaf arrangement, set in a deep matte-black shadow box. Zero maintenance, permanent green — a piece of nature that never wilts.",

    features: [
      "Multi-layer 3D depth effect, not a flat print",
      "UV-resistant and fade-proof materials",
      "Ready to hang with included wall hardware",
      "No watering, sunlight or maintenance required",
      "Handmade in limited batches",
    ],

    materials: [
      "Solid wood frame with matte-black finish",
      "Premium-grade artificial foliage",
      "Shatter-resistant acrylic front panel",
      "Reinforced hanging bracket",
    ],

    dimensions: {
      Small: '12" × 12" / 30 × 30 cm',
      Medium: '16" × 16" / 40 × 40 cm',
      Large: '20" × 20" / 50 × 50 cm',
    },

    care: [
      "Wipe gently with a dry microfiber cloth",
      "Avoid direct contact with water",
      "Keep away from prolonged heat exposure",
    ],

    sizes: ["Small", "Medium", "Large"],

    images: [
      "/images/products/monstera-3d-frame-black-1.jpg",
      "/images/products/monstera-3d-frame-black-2.jpg",
      "/images/products/monstera-3d-frame-black-3.jpg",
      "/images/products/monstera-3d-frame-black-4.jpg",
      "/images/products/monstera-3d-frame-black-5.jpg",
      "/images/products/monstera-3d-frame-black-6.jpg",
    ],

    reviews: [
      {
        name: "Ayesha K.",
        rating: 5,
        text: "Looks incredibly realistic in person. It has so much more depth than normal flat wall art.",
      },
      {
        name: "Rahul P.",
        rating: 5,
        text: "The frame and leaf detailing look genuinely premium. It completely changed my living room wall.",
      },
      {
        name: "Priya S.",
        rating: 4,
        text: "Beautiful piece and very securely packed. It looks even better after placing it on the wall.",
      },
    ],
  },

  {
    id: "2",
    slug: "monstera-3d-frame-white",
    name: "3D Aesthetic Plant Frame — Monstera / White",
    collection: "3D Plant Frames",

    price: 39,
    oldPrice: 59,

    color: "White",
    plantType: "Monstera",
    rating: 4.7,
    reviewCount: 158,
    sku: "PF-MON-WHT",

    description:
      "A layered Monstera arrangement in a clean white frame, designed for light, minimal and modern Indian interiors.",

    features: [
      "Multi-layer 3D depth effect, not a flat print",
      "UV-resistant and fade-proof materials",
      "Ready to hang with included wall hardware",
      "No watering, sunlight or maintenance required",
      "Handmade in limited batches",
    ],

    materials: [
      "Solid wood frame with matte-white finish",
      "Premium-grade artificial foliage",
      "Shatter-resistant acrylic front panel",
      "Reinforced hanging bracket",
    ],

    dimensions: {
      Small: '12" × 12" / 30 × 30 cm',
      Medium: '16" × 16" / 40 × 40 cm',
      Large: '20" × 20" / 50 × 50 cm',
    },

    care: [
      "Wipe gently with a dry microfiber cloth",
      "Avoid direct contact with water",
      "Keep away from prolonged heat exposure",
    ],

    sizes: ["Small", "Medium", "Large"],

    images: [
      "/images/products/monstera-3d-frame-white-1.jpg",
      "/images/products/monstera-3d-frame-white-2.jpg",
      "/images/products/monstera-3d-frame-white-3.jpg",
      "/images/products/monstera-3d-frame-white-4.jpg",
      "/images/products/monstera-3d-frame-white-5.jpg",
      "/images/products/monstera-3d-frame-white-6.jpg",
    ],

    reviews: [
      {
        name: "Neha T.",
        rating: 5,
        text: "Very elegant and perfect for my white living room. It does not look artificial or cheap.",
      },
      {
        name: "Manish O.",
        rating: 4,
        text: "Great texture and depth. The white frame gives it a clean and modern appearance.",
      },
    ],
  },

  {
    id: "3",
    slug: "fern-3d-frame-walnut",
    name: "3D Aesthetic Plant Frame — Fern / Walnut",
    collection: "3D Plant Frames",

    price: 42,
    oldPrice: 65,

    color: "Walnut",
    plantType: "Fern",
    rating: 4.9,
    reviewCount: 96,
    sku: "PF-FRN-WAL",

    description:
      "A delicate layered fern composition inside a warm walnut-toned frame. Soft, organic and textured — designed to bring life to any wall without requiring maintenance.",

    features: [
      "Fine layered fern leaves for realistic texture",
      "UV-resistant and fade-proof materials",
      "Ready to hang with included wall hardware",
      "No watering, sunlight or maintenance required",
      "Handmade in limited batches",
    ],

    materials: [
      "Solid wood frame with walnut finish",
      "Premium-grade artificial foliage",
      "Shatter-resistant acrylic front panel",
      "Reinforced hanging bracket",
    ],

    dimensions: {
      Small: '12" × 12" / 30 × 30 cm',
      Medium: '16" × 16" / 40 × 40 cm',
      Large: '20" × 20" / 50 × 50 cm',
    },

    care: [
      "Wipe gently with a dry microfiber cloth",
      "Avoid direct contact with water",
      "Keep away from prolonged heat exposure",
    ],

    sizes: ["Small", "Medium", "Large"],

    images: [
      "/images/products/fern-3d-frame-walnut-1.jpg",
      "/images/products/fern-3d-frame-walnut-2.jpg",
      "/images/products/fern-3d-frame-walnut-3.jpg",
      "/images/products/fern-3d-frame-walnut-4.jpg",
      "/images/products/fern-3d-frame-walnut-5.jpg",
      "/images/products/fern-3d-frame-walnut-6.jpg",
    ],

    reviews: [
      {
        name: "Sneha L.",
        rating: 5,
        text: "The foliage looks incredibly realistic and the walnut frame matches my furniture beautifully.",
      },
      {
        name: "Eshan B.",
        rating: 5,
        text: "I purchased two for my office. Everyone keeps asking where I bought them from.",
      },
    ],
  },
];

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product, limit = 3) {
  return products
    .filter((relatedProduct) => relatedProduct.id !== product.id)
    .slice(0, limit);
}