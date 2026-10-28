import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Star, 
  Check, 
  AlertTriangle, 
  Package, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  SlidersHorizontal,
  MousePointer,
  ChevronRight,
  Info
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/initialData';
import { ShopProduct, CartItem } from '../../types';
import { useCompetition } from '../../context/CompetitionContext';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const ShopEasy: React.FC = () => {
  const { isInspectMode, openReportModal } = useCompetition();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeNavTab, setActiveNavTab] = useState<string>('all');
  const [showNavErrorView, setShowNavErrorView] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: SAMPLE_PRODUCTS[1], quantity: 1 } // UltraFit Chrono Smartwatch Pro (₹8,999)
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout form state
  const [checkoutData, setCheckoutData] = useState({
    fullName: 'Rahul Sharma',
    email: '',
    address: 'Flat 402, Tech Park Residency',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    paymentMethod: 'UPI'
  });
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [addToCartNotice, setAddToCartNotice] = useState<{ id: number; message: string; success: boolean } | null>(null);

  // Inspect mode preview highlight
  const [hoveredElement, setHoveredElement] = useState<{
    rect: DOMRect | null;
    label: string;
    selector: string;
  } | null>(null);

  const handleInspectClick = (
    e: React.MouseEvent,
    componentName: string,
    selector: string,
    category: any
  ) => {
    if (isInspectMode) {
      e.preventDefault();
      e.stopPropagation();
      openReportModal('inspect', {
        component: componentName,
        selector,
        tag: (e.currentTarget as HTMLElement).tagName.toLowerCase(),
        category
      });
      setHoveredElement(null);
    }
  };

  const handleInspectHover = (
    e: React.MouseEvent,
    label: string,
    selector: string
  ) => {
    if (!isInspectMode) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setHoveredElement({
      rect,
      label,
      selector
    });
  };

  const handleInspectLeave = () => {
    if (isInspectMode) {
      setHoveredElement(null);
    }
  };

  // ==========================================
  // BUG 1: Search Functionality Error
  // Intentionally broken: typing ANY search query fails and returns 0 results!
  // ==========================================
  const filteredProducts = useMemo(() => {
    let list = SAMPLE_PRODUCTS;

    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim().length > 0) {
      // INTENTIONAL BUG 1: Search logic is completely broken:
      // When user searches for "AirPro" or any valid item, returns 0 items!
      return [];
    }

    return list;
  }, [searchQuery, selectedCategory]);

  // ==========================================
  // BUG 2: Add to Cart State Mutation Failure
  // Product ID 1 (AirPro ANC Headphones) fails to add!
  // ==========================================
  const handleAddToCart = (product: ShopProduct, e?: React.MouseEvent) => {
    if (isInspectMode) {
      handleInspectClick(e!, `Add to Cart Button (${product.name})`, `.btn-add-to-cart[data-product-id="${product.id}"]`, 'cart');
      return;
    }

    // INTENTIONAL BUG 2: AirPro ANC Headphones (id: 1) fails to add to bag!
    if (product.id === 1) {
      setAddToCartNotice({
        id: product.id,
        message: 'Could not add "AirPro Wireless ANC Headphones" to bag. Please try again.',
        success: false
      });
      setTimeout(() => setAddToCartNotice(null), 3000);
      return;
    }

    // Normal working addition for other products
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    setAddToCartNotice({
      id: product.id,
      message: `Added "${product.name}" to cart!`,
      success: true
    });
    setTimeout(() => setAddToCartNotice(null), 2200);
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeCartItem = (productId: number) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
  };

  // ==========================================
  // BUG 3: Shopping Cart Price Calculation Arithmetic Error (in INR ₹)
  // Subtotal is correct, but Total calculates: (Subtotal - Delivery Fee) - GST
  // Producing a glaring arithmetic mismatch!
  // ==========================================
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const deliveryFee = cartItems.length > 0 ? 199.00 : 0.00;
  const estimatedGST = cartItems.length > 0 ? cartSubtotal * 0.18 : 0.00;

  // INTENTIONAL BUG 3: Subtracts delivery & GST instead of adding:
  // e.g. ₹8,999 - ₹199 - ₹1,619.82 = ₹7,180.18 (instead of ₹10,817.82)!
  const calculatedTotal = useMemo(() => {
    if (cartItems.length === 0) return 0;
    const erroneousTotal = (cartSubtotal - deliveryFee) - estimatedGST;
    return Math.max(0, erroneousTotal);
  }, [cartSubtotal, deliveryFee, estimatedGST, cartItems.length]);

  const expectedCorrectTotal = cartItems.length > 0 ? cartSubtotal + deliveryFee + estimatedGST : 0;

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // ==========================================
  // BUG 4: Navigation Category Link Routing Mismatch
  // Clicking "Audio" navigates to 404 Route Not Found error screen
  // ==========================================
  const handleNavClick = (tab: string, e: React.MouseEvent) => {
    if (isInspectMode) {
      handleInspectClick(e, `Navigation Link (${tab})`, `nav a[data-nav="${tab}"]`, 'navigation');
      return;
    }

    if (tab === 'audio') {
      setShowNavErrorView(true);
      setActiveNavTab('audio');
    } else {
      setShowNavErrorView(false);
      setActiveNavTab(tab);
      setSelectedCategory(tab);
    }
  };

  // ==========================================
  // BUG 5: Checkout Form Email Validation Bypass
  // Form accepts invalid email like "student@", "broken" without validation!
  // ==========================================
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkoutData.fullName.trim()) {
      setCheckoutError('Please enter your full delivery name.');
      return;
    }

    // INTENTIONAL BUG 5: Accepts invalid email format without RFC validation regex!
    if (!checkoutData.email || checkoutData.email.length === 0) {
      setCheckoutError('Email address is required.');
      return;
    }

    setCheckoutError(null);
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCartItems([]);
      setIsCheckoutOpen(false);
      setCheckoutSuccess(false);
    }, 4000);
  };

  return (
    <div className={`relative bg-white text-neutral-900 rounded-2xl border border-neutral-200/90 shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden font-sans ${isInspectMode ? 'inspect-mode-active' : ''}`}>
      {/* Inspect Mode Top Notification Pill */}
      {isInspectMode && (
        <div className="bg-neutral-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>INSPECT MODE ACTIVE: Hover over any defective component and click to file your report</span>
          </div>
          <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded text-[11px] font-mono">
            Click to auto-prefill
          </span>
        </div>
      )}

      {/* Floating Hover Indicator during Inspect Mode */}
      {isInspectMode && hoveredElement && (
        <div 
          className="fixed pointer-events-none z-50 border-2 border-neutral-900 bg-neutral-900/10 transition-all duration-75 rounded-lg shadow-lg"
          style={{
            top: hoveredElement.rect?.top,
            left: hoveredElement.rect?.left,
            width: hoveredElement.rect?.width,
            height: hoveredElement.rect?.height
          }}
        >
          <div className="absolute -top-7 left-0 bg-neutral-950 text-white px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap shadow-md">
            {hoveredElement.label} &bull; <span className="text-neutral-400">{hoveredElement.selector}</span>
          </div>
        </div>
      )}

      {/* Store Header & Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => { setShowNavErrorView(false); setSelectedCategory('all'); setActiveNavTab('all'); }}
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-sm">
                <Package className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-neutral-950">
                  ShopEasy
                </span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                  India Store
                </span>
              </div>
            </div>

            {/* BUG 1 ELEMENT: Search input */}
            <div className="flex-1 max-w-md mx-2 sm:mx-6">
              <div 
                className="relative cursor-pointer"
                onMouseEnter={(e) => handleInspectHover(e, 'Header Search Bar', '#shop-search-input')}
                onMouseLeave={handleInspectLeave}
                onClick={(e) => handleInspectClick(e, 'Header Search Bar', '#shop-search-input', 'search')}
              >
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  id="shop-search-input"
                  type="text"
                  placeholder="Search products (Try typing AirPro, Watch, Keyboard)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Cart Button */}
            <div className="flex items-center gap-3">
              <button
                id="header-cart-button"
                onClick={() => setIsCartOpen(true)}
                className="relative px-3.5 py-2 text-neutral-800 hover:text-black bg-neutral-100/80 hover:bg-neutral-200/80 rounded-xl border border-neutral-200/90 transition flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-sm"
                onMouseEnter={(e) => handleInspectHover(e, 'Header Shopping Cart Button', '#header-cart-button')}
                onMouseLeave={handleInspectLeave}
              >
                <ShoppingCart className="w-4 h-4 text-neutral-900" />
                <span className="hidden sm:inline">Bag</span>
                <span className="bg-neutral-900 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-5 text-center">
                  {totalCartCount}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center space-x-1 sm:space-x-6 border-t border-neutral-100 py-2.5 overflow-x-auto text-xs sm:text-sm font-medium">
            {['all', 'electronics', 'audio', 'wearables', 'accessories'].map((tab) => {
              const isAudio = tab === 'audio';
              const isActive = activeNavTab === tab && !showNavErrorView;

              return (
                <button
                  key={tab}
                  data-nav={tab}
                  onMouseEnter={(e) => isAudio ? handleInspectHover(e, 'Navigation Link (Audio)', 'nav a[data-nav="audio"]') : undefined}
                  onMouseLeave={handleInspectLeave}
                  onClick={(e) => handleNavClick(tab, e)}
                  className={`px-3 py-1.5 rounded-lg transition capitalize whitespace-nowrap ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                  }`}
                >
                  {tab === 'all' ? 'All Products' : tab}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Catalog View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Rules & Submission Guide (No spoilers / no defect locations) */}
        <div className="mb-6 bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              ⚡
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-950">
                Bug Hunt Pixel2k26 Challenge: ShopEasy India
              </h3>
              <p className="text-[11px] text-neutral-500">
                Explore the shopping website and discover 5 hidden defects. Submit your findings using the top header tools.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="text-[11px] text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200 font-mono">
              Use "Inspect Bug" (point & click) or "+ Report Bug" to submit (+20 pts each)
            </span>
          </div>
        </div>

        {/* Banner Alert for Add to Cart feedback */}
        {addToCartNotice && (
          <div className={`mb-4 px-4 py-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition-all ${
            addToCartNotice.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-neutral-100 border-neutral-200 text-neutral-800'
          }`}>
            <div className="flex items-center gap-2">
              {addToCartNotice.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-neutral-500" />}
              <span className="font-semibold">{addToCartNotice.message}</span>
            </div>
          </div>
        )}

        {/* Navigation 404 View */}
        {showNavErrorView ? (
          <div 
            className="my-12 p-8 bg-white border border-neutral-200/90 rounded-2xl text-center max-w-md mx-auto shadow-xs"
            onMouseEnter={(e) => handleInspectHover(e, 'Navigation Link (Audio)', 'nav a[data-nav="audio"]')}
            onMouseLeave={handleInspectLeave}
            onClick={(e) => handleInspectClick(e, 'Navigation Link (Audio)', 'nav a[data-nav="audio"]', 'navigation')}
            id="nav-error-container"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">404 — Page Not Found</h3>
            <p className="text-neutral-500 text-xs mb-4">
              The requested category page could not be located on the server.
            </p>
            <button
              onClick={() => { setShowNavErrorView(false); setSelectedCategory('all'); setActiveNavTab('all'); }}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              Return to Catalog
            </button>
          </div>
        ) : (
          <>
            {/* Promo Hero */}
            <div className="glass-glossy rounded-2xl p-6 sm:p-8 mb-8 border border-neutral-200/90 shadow-sm relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200 mb-2">
                  Official Store &bull; Fast Delivery Across India
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight mb-2">
                  Precision Engineering. Uncompromised Sound.
                </h1>
                <p className="text-neutral-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  Experience acoustic brilliance with our flagship AirPro ANC Wireless Headphones and next-gen wearable tech.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => { setSelectedCategory('all'); setActiveNavTab('all'); }}
                    className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1"
                  >
                    <span>Explore Products</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-semibold border border-neutral-200 transition"
                  >
                    View Bag ({totalCartCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-neutral-200/80">
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
                <span>Showing <strong>{filteredProducts.length}</strong> items in catalog</span>
                {searchQuery && (
                  <span className="text-[11px] bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded font-mono font-medium">
                    Query: "{searchQuery}"
                  </span>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['all', 'electronics', 'audio', 'wearables', 'accessories'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveNavTab(cat);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition whitespace-nowrap ${
                      selectedCategory === cat 
                        ? 'bg-neutral-900 text-white shadow-sm' 
                        : 'bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Empty State */}
            {filteredProducts.length === 0 ? (
              <div 
                className="py-14 px-4 text-center bg-white rounded-2xl border border-neutral-200/90 max-w-md mx-auto shadow-xs"
                onMouseEnter={(e) => handleInspectHover(e, 'Header Search Bar', '#shop-search-input')}
                onMouseLeave={handleInspectLeave}
                onClick={(e) => handleInspectClick(e, 'Header Search Bar', '#shop-search-input', 'search')}
                id="search-empty-results"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-neutral-900 mb-1">
                  No products found
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-4">
                  We couldn't find any products matching "{searchQuery}". Please check your spelling or try another search keyword.
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white rounded-xl shadow-xs transition"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const isFeaturedBug2Product = product.id === 1;

                  return (
                    <div
                      key={product.id}
                      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${
                        isFeaturedBug2Product ? 'border-neutral-300 ring-1 ring-neutral-200' : 'border-neutral-200/90'
                      }`}
                    >
                      <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.badge && (
                          <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/95 text-neutral-900 shadow-sm border border-neutral-200/80">
                            {product.badge}
                          </span>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-semibold text-neutral-800 flex items-center gap-1 shadow-sm border border-neutral-200/60">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{product.rating}</span>
                          <span className="text-neutral-400 text-[10px]">({product.reviewsCount})</span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                            {product.category}
                          </span>
                          <h3 className="font-bold text-sm text-neutral-950 group-hover:text-black line-clamp-1 mb-1">
                            {product.name}
                          </h3>
                          <p className="text-xs text-neutral-500 line-clamp-2 mb-3">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {product.specs.slice(0, 2).map((spec, i) => (
                              <span key={i} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md font-medium">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-base font-extrabold text-neutral-950 font-mono">
                              {formatINR(product.price)}
                            </span>
                            {product.originalPrice && (
                              <span className="ml-2 text-[11px] text-neutral-400 line-through font-mono">
                                {formatINR(product.originalPrice)}
                              </span>
                            )}
                          </div>

                          {/* BUG 2 ELEMENT: Add to Cart button */}
                          <button
                            data-product-id={product.id}
                            className={`btn-add-to-cart px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                              isFeaturedBug2Product
                                ? 'bg-neutral-900 hover:bg-neutral-800 text-white' // The defective button
                                : 'bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800 border border-neutral-200'
                            }`}
                            onMouseEnter={(e) => handleInspectHover(
                              e, 
                              `Product Add to Cart (${product.name})`, 
                              `.btn-add-to-cart[data-product-id="${product.id}"]`
                            )}
                            onMouseLeave={handleInspectLeave}
                            onClick={(e) => handleAddToCart(product, e)}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Shopping Bag Drawer with BUG 3 (in INR ₹) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-l border-neutral-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-neutral-900" />
                <h3 className="font-bold text-sm text-neutral-900">Your Shopping Bag</h3>
                <span className="bg-neutral-200 text-neutral-800 text-[11px] px-2 py-0.2 rounded-full font-bold">
                  {cartItems.length}
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-neutral-500 hover:text-black p-1 rounded-md hover:bg-neutral-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-neutral-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Your shopping bag is empty.</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div 
                    key={item.product.id}
                    className="flex gap-3 bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/80 items-center justify-between"
                  >
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="w-12 h-12 object-cover rounded-lg bg-neutral-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-neutral-900 truncate">{item.product.name}</h4>
                      <p className="text-xs text-neutral-900 font-bold font-mono">{formatINR(item.product.price)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded bg-white hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-neutral-700 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-neutral-800">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded bg-white hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-neutral-700 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCartItem(item.product.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* BUG 3 ELEMENT: Cart Summary in INR ₹ with arithmetic error */}
            {cartItems.length > 0 && (
              <div 
                id="cart-total-price"
                className="p-4 border-t border-neutral-200 bg-neutral-50/90 space-y-2"
                onMouseEnter={(e) => handleInspectHover(e, 'Cart Price Calculation & Summary', '#cart-total-price')}
                onMouseLeave={handleInspectLeave}
                onClick={(e) => handleInspectClick(e, 'Cart Price Calculation & Summary', '#cart-total-price', 'pricing')}
              >
                <div className="text-xs space-y-1.5 text-neutral-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-neutral-900 font-mono">{formatINR(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Express Delivery:</span>
                    <span className="font-semibold text-neutral-900 font-mono">{formatINR(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated GST (18%):</span>
                    <span className="font-semibold text-neutral-900 font-mono">{formatINR(estimatedGST)}</span>
                  </div>
                </div>

                {/* Total Payable Summary */}
                <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-neutral-900">Total Payable:</span>
                  <span className="text-base font-extrabold text-neutral-950 font-mono">
                    {formatINR(calculatedTotal)}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">Includes all applicable duties, delivery & taxes</p>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full mt-2 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Proceed to Checkout &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal with BUG 5 (Email Validation Bypass) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-900" />
                <h3 className="font-bold text-sm text-neutral-900">Instant Checkout</h3>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-neutral-950">Order Confirmed!</h4>
                <p className="text-xs text-neutral-600">
                  Thank you for your order! Order #IND-{Math.floor(100000 + Math.random() * 900000)} has been placed.
                </p>
                <p className="text-xs font-mono text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-lg max-w-xs mx-auto border border-neutral-200">
                  Confirmation sent to: {checkoutData.email}
                </p>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-3.5 text-xs">
                {checkoutError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={checkoutData.fullName}
                    onChange={(e) => setCheckoutData({ ...checkoutData, fullName: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
                  />
                </div>

                {/* BUG 5 ELEMENT: Email input with flawed validation */}
                <div
                  onMouseEnter={(e) => handleInspectHover(e, 'Checkout Email Input', '#checkout-email-input')}
                  onMouseLeave={handleInspectLeave}
                  onClick={(e) => handleInspectClick(e, 'Checkout Email Input', '#checkout-email-input', 'form_validation')}
                >
                  <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
                  <input
                    id="checkout-email-input"
                    type="text"
                    required
                    placeholder="e.g. rahul@example.in"
                    value={checkoutData.email}
                    onChange={(e) => setCheckoutData({ ...checkoutData, email: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Flat 402, Prestige Tower, MG Road"
                    value={checkoutData.address}
                    onChange={(e) => setCheckoutData({ ...checkoutData, address: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">City / State</label>
                    <input
                      type="text"
                      required
                      value={checkoutData.city}
                      onChange={(e) => setCheckoutData({ ...checkoutData, city: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={checkoutData.pincode}
                      onChange={(e) => setCheckoutData({ ...checkoutData, pincode: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Total Charged:</span>
                  <span className="text-sm font-bold text-neutral-950 font-mono">{formatINR(calculatedTotal)}</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl font-bold shadow-sm transition"
                >
                  Place Order
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="mt-8 border-t border-neutral-100 bg-neutral-50/70 px-4 py-4 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">ShopEasy India Platform</span>
            <span>&bull;</span>
            <span>Live Competition Challenge v1.0</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>GST Invoice Compliant</span>
            <span>Verified Secure</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
