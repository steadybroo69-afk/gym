// RAZE Products - Performance Training Wear

export const products = [
  // Performance T-Shirts
  {
    id: 1,
    name: 'Performance T-Shirt',
    category: 'shirts',
    type: 'shirt',
    variant: 'Black / Cyan',
    description: 'Minimalist performance training wear engineered for gymnastics — Designed for those who value freedom of movement, in and out of training.',
    price: 45,
    color: 'Black',
    logo: 'Cyan',
    images: [
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/69vwy1yl_ee.png',
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/uut87a31_dsw1.png'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    stock: { XS: 5, S: 2, M: 8, L: 15, XL: 12 },
    featured: true,
    mostPopular: true
  },
  {
    id: 2,
    name: 'Performance T-Shirt',
    category: 'shirts',
    type: 'shirt',
    variant: 'Black / Silver',
    description: 'Minimalist performance training wear engineered for gymnastics — Designed for those who value freedom of movement, in and out of training.',
    price: 45,
    color: 'Black',
    logo: 'Silver',
    images: [
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/s3nitfxo_2.png',
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/rp49piw5_21.jpg'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    stock: { XS: 8, S: 10, M: 12, L: 18, XL: 15 },
    featured: true
  },
  {
    id: 3,
    name: 'Performance T-Shirt',
    category: 'shirts',
    type: 'shirt',
    variant: 'Grey / Cyan',
    description: 'Minimalist performance training wear engineered for gymnastics — Designed for those who value freedom of movement, in and out of training.',
    price: 45,
    color: 'Grey',
    logo: 'Cyan',
    images: [
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/jf6ahqpn_4.png',
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/h5tbyhj3_8.jpg'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    stock: { XS: 10, S: 12, M: 15, L: 20, XL: 18 },
    featured: true
  },
  {
    id: 4,
    name: 'Performance T-Shirt',
    category: 'shirts',
    type: 'shirt',
    variant: 'Grey / White',
    description: 'Minimalist performance training wear engineered for gymnastics — Designed for those who value freedom of movement, in and out of training.',
    price: 45,
    color: 'Grey',
    logo: 'White',
    images: [
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/pr4hpazn_5.png'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    stock: { XS: 6, S: 14, M: 18, L: 22, XL: 16 },
    featured: true
  },
  // Performance Shorts
  {
    id: 5,
    name: 'Performance Shorts',
    category: 'shorts',
    type: 'shorts',
    variant: 'Black / Cyan',
    description: 'Performance shorts engineered for gymnastics training. Designed to pair with Performance T-Shirts.',
    price: 55,
    color: 'Black',
    logo: 'Cyan',
    images: [
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/c4dg91vy_5.png',
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/0zp1wq7a_1.png'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    stock: { XS: 4, S: 8, M: 12, L: 15, XL: 10 },
    featured: true
  },
  {
    id: 6,
    name: 'Performance Shorts',
    category: 'shorts',
    type: 'shorts',
    variant: 'Black / Silver',
    description: 'Performance shorts engineered for gymnastics training. Designed to pair with Performance T-Shirts.',
    price: 55,
    color: 'Black',
    logo: 'Silver',
    images: [
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/lauo11fr_6.png',
      'https://customer-assets.emergentagent.com/job_c568bc3b-5c5d-4cd8-bacb-54177a8430c8/artifacts/0zp1wq7a_1.png'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    stock: { XS: 6, S: 10, M: 14, L: 18, XL: 12 },
    featured: true
  }
];


export const getProductById = (id) => {
  const numId = parseInt(id, 10);
  return products.find(p => p.id === numId);
};

export const getProductsByCategory = (category) => {
  return products.filter(p => p.category === category);
};

export const checkStock = (productId, size) => {
  const numId = typeof productId === 'string' ? parseInt(productId, 10) : productId;
  const product = getProductById(numId);
  if (!product || !product.stock) return 0;
  return product.stock[size] || 0;
};

export default products;