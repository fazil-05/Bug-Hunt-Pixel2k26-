import { BugDefinition, Team, ShopProduct } from '../types';

export const DEFAULT_BUGS: BugDefinition[] = [
  {
    id: 'bug-1',
    bugKey: 'BUG-1',
    bugNumber: 1,
    title: 'Search Functionality Inversion / Empty Results',
    category: 'search',
    targetComponent: 'Header Search Bar',
    targetElementSelector: '#shop-search-input',
    severity: 'critical',
    points: 20,
    description: 'Searching for existing valid products returns empty results or "No products found".',
    expectedBehavior: 'Typing valid keywords like "AirPro", "Headphones", "Watch", or "Charger" should filter and display matching products.',
    actualBehavior: 'The search filter logic contains an inverted condition, causing legitimate products to disappear and returning "No products found for query".',
    reproductionSteps: [
      'Navigate to the top navigation header.',
      'Click the Search bar input field.',
      'Type any valid product name from the catalog, such as "AirPro" or "Watch".',
      'Press Enter or observe the filtered list.',
      'Observe that 0 results are returned and a "No products found" placeholder appears despite matching items existing.'
    ],
    matchingKeywords: [
      'search', 'query', 'empty', 'no results', 'filter', 'input', 'find', 'zero', 'missing', 'airpro', 'keyword'
    ],
    explanationPostRound: 'In `ShopEasy.tsx`, the search filter predicate had an inverted condition (`!product.name.toLowerCase().includes(query)`), which filtered out exact matches.'
  },
  {
    id: 'bug-2',
    bugKey: 'BUG-2',
    bugNumber: 2,
    title: 'Add to Cart State Mutation Failure on Featured Item',
    category: 'cart',
    targetComponent: 'Product Card Add to Cart Button',
    targetElementSelector: '.btn-add-to-cart[data-product-id="1"]',
    severity: 'critical',
    points: 20,
    description: 'Clicking the "Add to Cart" button on the featured flagship product does not increment the cart or add the item.',
    expectedBehavior: 'Clicking "Add to Cart" on any product should add the product to the user shopping cart and increment the cart badge count.',
    actualBehavior: 'On Product ID #1 ("AirPro Wireless ANC Headphones"), clicking "Add to Cart" triggers a visual feedback notice but fails to update the cart count or items.',
    reproductionSteps: [
      'Locate the featured product "AirPro Wireless ANC Headphones" on the homepage product grid.',
      'Click the "Add to Cart" button.',
      'Look at the shopping cart badge in the top right corner.',
      'Notice the count remains 0 and opening the cart shows "Your cart is empty".'
    ],
    matchingKeywords: [
      'add to cart', 'cart', 'not adding', 'does not update', 'counter', 'button', 'airpro', 'badge', 'empty cart', 'state'
    ],
    explanationPostRound: 'The Add to Cart handler had a condition `if (product.id === 1)` that swallowed the action without updating the cart items state.'
  },
  {
    id: 'bug-3',
    bugKey: 'BUG-3',
    bugNumber: 3,
    title: 'Shopping Cart Price Calculation Arithmetic Error (INR)',
    category: 'pricing',
    targetComponent: 'Cart Summary & Checkout Calculation',
    targetElementSelector: '#cart-total-price',
    severity: 'major',
    points: 20,
    description: 'The cart calculates an incorrect total price in Rupees (₹) by subtracting delivery fee instead of adding it.',
    expectedBehavior: 'Total price must strictly equal Subtotal + Delivery Fee (₹199) + GST (18%).',
    actualBehavior: 'The total price calculation subtracts delivery fee instead of adding it: Total = (Subtotal - Delivery Fee) + GST, resulting in an erroneous total lower than expected.',
    reproductionSteps: [
      'Add one or two eligible items to the cart (e.g. UltraFit Smartwatch for ₹8,999).',
      'Open the Cart Drawer by clicking the Cart icon.',
      'Review the Pricing Summary breakdown: Subtotal (₹8,999), Delivery Fee (₹199), GST (18% = ₹1,619.82).',
      'Inspect the computed "Estimated Total".',
      'Observe the math is incorrect (computed as ₹8,999 - ₹199 + ₹1,619.82 = ₹10,419.82 instead of ₹10,817.82).'
    ],
    matchingKeywords: [
      'price', 'total', 'calculate', 'calculation', 'subtotal', 'math', 'gst', 'tax', 'delivery', 'shipping', 'rupees', 'wrong sum', 'formula', 'inr'
    ],
    explanationPostRound: 'The Cart checkout summary function executed an incorrect arithmetic expression (`subtotal - deliveryFee + gst` instead of `subtotal + deliveryFee + gst`).'
  },
  {
    id: 'bug-4',
    bugKey: 'BUG-4',
    bugNumber: 4,
    title: 'Navigation Header Link Routing Mismatch',
    category: 'navigation',
    targetComponent: 'Top Navbar Category Navigation',
    targetElementSelector: 'nav a[data-nav="audio"]',
    severity: 'major',
    points: 20,
    description: 'Clicking the "Audio" category link in the navigation bar routes to a 404 Route Not Found error screen.',
    expectedBehavior: 'Clicking "Audio" should filter the product list to show audio gear (headphones, earbuds, soundbars).',
    actualBehavior: 'Clicking "Audio" inadvertently opens an unexpected "404 Section Not Found / Missing Route" overlay.',
    reproductionSteps: [
      'Examine the top horizontal navigation bar containing "All Products", "Electronics", "Audio", "Wearables", "Accessories".',
      'Click on "Audio".',
      'Observe that instead of displaying audio products, the page displays a "404 — Section Route Not Found" error block.'
    ],
    matchingKeywords: [
      'nav', 'navigation', 'link', 'audio', 'wrong page', 'route', 'header', 'redirect', '404', 'menu', 'category'
    ],
    explanationPostRound: 'The nav click handler had an erroneous route target mapping `audio` to an error view instead of filtering category `audio`.'
  },
  {
    id: 'bug-5',
    bugKey: 'BUG-5',
    bugNumber: 5,
    title: 'Checkout Form Email Validation Bypass',
    category: 'form_validation',
    targetComponent: 'Checkout Modal Customer Form',
    targetElementSelector: '#checkout-email-input',
    severity: 'major',
    points: 20,
    description: 'The checkout form accepts invalid email addresses without triggering validation warnings.',
    expectedBehavior: 'Submitting malformed emails like "user@", "invalid-email", or "student" should display "Please enter a valid email address" and block order completion.',
    actualBehavior: 'The checkout form accepts invalid emails such as "student@" or "bademail" as valid, enabling immediate order completion.',
    reproductionSteps: [
      'Add any product to the cart and click "Proceed to Checkout".',
      'In the Checkout modal, enter customer name "Bug Hunter".',
      'In the Email field, type an intentionally invalid email such as "user@" or "bademail".',
      'Click "Place Order".',
      'Observe that no validation error appears and the order is completed successfully.'
    ],
    matchingKeywords: [
      'email', 'validation', 'checkout', 'form', 'invalid', 'bypass', 'accepts', 'regex', 'submit', 'order'
    ],
    explanationPostRound: 'The email validation lacked RFC-compliant format verification, only checking whether length was greater than 0.'
  }
];

export const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team-aries',
    code: 'aries',
    name: 'Team Aries',
    color: '#0f172a', // Deep Obsidian Black
    accentBg: '#f1f5f9',
    avatarIcon: 'Rocket',
    score: 0,
    bugsIdentified: [],
    incorrectSubmissionsCount: 0,
    lastSubmissionTimestamp: null,
    completionTimeSeconds: null,
    isOnline: true,
    lastHeartbeat: Date.now()
  },
  {
    id: 'team-invictus',
    code: 'invictus',
    name: 'Team Invictus',
    color: '#334155', // Slate
    accentBg: '#f8fafc',
    avatarIcon: 'ShieldAlert',
    score: 0,
    bugsIdentified: [],
    incorrectSubmissionsCount: 0,
    lastSubmissionTimestamp: null,
    completionTimeSeconds: null,
    isOnline: true,
    lastHeartbeat: Date.now()
  },
  {
    id: 'team-atlas',
    code: 'atlas',
    name: 'Team Atlas',
    color: '#18181b', // Zinc Black
    accentBg: '#f4f4f5',
    avatarIcon: 'Zap',
    score: 0,
    bugsIdentified: [],
    incorrectSubmissionsCount: 0,
    lastSubmissionTimestamp: null,
    completionTimeSeconds: null,
    isOnline: true,
    lastHeartbeat: Date.now()
  },
  {
    id: 'team-phoenix',
    code: 'phoenix',
    name: 'Team Phoenix',
    color: '#27272a', // Charcoal
    accentBg: '#fafafa',
    avatarIcon: 'Flame',
    score: 0,
    bugsIdentified: [],
    incorrectSubmissionsCount: 0,
    lastSubmissionTimestamp: null,
    completionTimeSeconds: null,
    isOnline: true,
    lastHeartbeat: Date.now()
  }
];

export const SAMPLE_PRODUCTS: ShopProduct[] = [
  {
    id: 1,
    name: 'AirPro Wireless ANC Headphones',
    price: 14999,
    originalPrice: 19999,
    rating: 4.8,
    reviewsCount: 1240,
    category: 'audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    badge: 'Bestseller',
    description: 'Flagship hybrid active noise cancelling over-ear headphones with 40mm titanium drivers and 45-hour battery life.',
    specs: ['40mm Drivers', '45h Battery', 'Bluetooth 5.3', 'Multipoint Pairing'],
    inStock: true,
    canAddToCart: false // Intentional Bug 2!
  },
  {
    id: 2,
    name: 'UltraFit Chrono Smartwatch Pro',
    price: 8999,
    originalPrice: 11999,
    rating: 4.6,
    reviewsCount: 890,
    category: 'wearables',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    badge: 'Trending',
    description: 'Titanium aerospace bezel smartwatch with AMOLED always-on display, ECG sensor, and GPS tracking.',
    specs: ['1.4" AMOLED', 'GPS + GLONASS', '5 ATM Water Resistant', '7-Day Battery'],
    inStock: true,
    canAddToCart: true
  },
  {
    id: 3,
    name: 'CyberAudio True Wireless Earbuds',
    price: 2999,
    originalPrice: 4499,
    rating: 4.4,
    reviewsCount: 520,
    category: 'audio',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
    badge: 'Special Deal',
    description: 'Ultra-compact in-ear wireless buds with low latency gaming mode and wireless charging case.',
    specs: ['IPX7 Waterproof', 'Wireless Charging', '32h Total Playtime', 'Touch Controls'],
    inStock: true,
    canAddToCart: true
  },
  {
    id: 4,
    name: 'VoltWave 100W GaN Fast Charger',
    price: 2499,
    originalPrice: 3299,
    rating: 4.9,
    reviewsCount: 2100,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
    badge: 'Essential',
    description: 'Multi-port Gallium Nitride wall charger with dual USB-C Power Delivery and Indian standard prongs.',
    specs: ['100W Max Output', '3x USB-C + 1x USB-A', 'GaN III Technology', 'Universal Voltage'],
    inStock: true,
    canAddToCart: true
  },
  {
    id: 5,
    name: 'NexusPad Ergonomic Mechanical Keyboard',
    price: 6999,
    originalPrice: 8999,
    rating: 4.7,
    reviewsCount: 670,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
    badge: 'Staff Pick',
    description: 'Hot-swappable wireless RGB mechanical keyboard with gasket mount and PBT doubleshot keycaps.',
    specs: ['Hot-swap PCB', 'Tri-mode Wireless', 'RGB Per-key', 'Factory Lubed Switches'],
    inStock: true,
    canAddToCart: true
  },
  {
    id: 6,
    name: 'ApexPrecision Wireless Gaming Mouse',
    price: 3499,
    originalPrice: 4999,
    rating: 4.5,
    reviewsCount: 440,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80',
    badge: 'Popular',
    description: 'Featherlight 59g optical gaming mouse with 26,000 DPI sensor and zero-lag optical switches.',
    specs: ['59g Lightweight', '26K DPI Optical', '1000Hz Polling', '80h Battery'],
    inStock: true,
    canAddToCart: true
  }
];
