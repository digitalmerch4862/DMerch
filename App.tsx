
import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Sidebar } from './src/components/layout/Sidebar';
import { StoreView } from './src/components/store/StoreView';
import { AdminView } from './src/components/admin/AdminView';
import { CRMView } from './src/components/crm/CRMView';
import { SalesView } from './src/components/sales/SalesView';
import { CheckoutView } from './src/components/checkout/CheckoutView';
import { SuccessView } from './src/components/checkout/SuccessView';
import { UserOrdersView } from './src/components/store/UserOrdersView';
import { AuthPage } from './src/components/auth/AuthPage';
import { ContactAdminModal } from './src/components/modals/ContactAdminModal';
import { useSound } from './src/hooks/useSound';

import { PayMongoCheckoutModal } from './src/components/modals/PayMongoCheckoutModal';
import { CategoryType, Product, User, CartItem, Visit, Order, Customer, Lead, LeadReason } from './types';
import { supabase, signInWithGoogle } from './src/supabaseClient';

const App: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('digital_merch_user');
    return saved ? JSON.parse(saved) : { username: '', isAdmin: false, isLoggedIn: false };
  });

  const [sessionId] = useState(() => {
    let id = localStorage.getItem('digital_merch_session');
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('digital_merch_session', id);
    }
    return id;
  });

  const [view, setView] = useState<'store' | 'admin' | 'checkout' | 'sales' | 'crm' | 'success' | 'orders'>('store');

  // --- PROTECTION LOGIC ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const protectedViews = ['admin', 'sales', 'crm'];
      if (protectedViews.includes(view) && !session) {
        setAuthMode('login');
        setIsAuthOpen(true);
        setView('store');
      }
    };
    checkSession();
  }, [view]);
  const [lastOrderItems, setLastOrderItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'All' | 'Best Seller'>('Best Seller');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isProcessing, setIsProcessing] = useState(false);
  const [salesHistory, setSalesHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('digital_merch_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [isContactOpen, setIsContactOpen] = useState(false);

  const [currency, setCurrency] = useState<'PHP' | 'USD'>(() => {
    return (localStorage.getItem('dmerch_currency') as 'PHP' | 'USD') || 'PHP';
  });
  const [exchangeRate] = useState(56); // 1 USD = 56 PHP

  // CRM State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [crmStats, setCrmStats] = useState({ totalVisits: 0, uniqueVisitors: 0, totalCustomers: 0 });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingCRM, setIsLoadingCRM] = useState(false);

  // PayMongo State
  const [isPayMongoOpen, setIsPayMongoOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const { play } = useSound();

  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://jfdvbyoyvqriqhqtmyjo.supabase.co";
  const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHZieW95dnFyaXFocXRteWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTMxOTQsImV4cCI6MjA4NTY2OTE5NH0.t5-BcJx0BYAQcBBIclqTsXvoUAWUzA-rPCtEnWSiuuM";

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('digital_merch_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('digital_merch_sales', JSON.stringify(salesHistory));
  }, [salesHistory]);

  // --- DATA FETCHING ---
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category_name || CategoryType.NATIVE,
          description: p.description,
          imageUrl: p.image_url,
          fileUrl: p.file_url
        })));
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      // Silently fail - products will remain empty array
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // --- ANALYTICS ---
  useEffect(() => {
    const recordVisit = async () => {
      try {
        // Fetch public IP for fraud prevention/logs
        let publicIp = 'unknown';
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          publicIp = ipData.ip;
        } catch (ipError) { /* fail silently */ }

        await fetch(`${supabaseUrl}/rest/v1/analytics_visits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            username: user.isLoggedIn ? user.username : null,
            session_id: sessionId,
            page: `${view}${view === 'store' ? ` - ${activeCategory}` : ''}`,
            user_agent: navigator.userAgent,
            ip_address: publicIp
          })
        });
      } catch (e) { console.error(e); }
    };
    if (supabaseUrl) recordVisit();
  }, [view, activeCategory, user.username, sessionId]);

  useEffect(() => {
    const fetchCRMData = async () => {
      if (!user.isAdmin || view !== 'crm') return;
      setIsLoadingCRM(true);
      try {
        const [visitsRes, customersRes, leadsRes] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/analytics_visits?select=*&order=created_at.desc&limit=50`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }),
          fetch(`${supabaseUrl}/rest/v1/profiles?select=*&order=total_spent.desc`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }),
          fetch(`${supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          })
        ]);

        const visits = await visitsRes.json();
        const profiles = await customersRes.json();
        const leadsData = await leadsRes.json();

        setRecentVisits(visits);
        setCustomers(profiles.map((p: any) => ({
          username: p.username,
          total_spent: p.total_spent || 0,
          order_count: p.order_count || 0,
          visit_count: p.visit_count || 1
        })));
        setLeads(leadsData);
        setCrmStats({
          totalVisits: visits.length,
          uniqueVisitors: new Set(visits.map((v: any) => v.session_id)).size,
          totalCustomers: profiles.length
        });
      } catch (e) {
        console.error('Failed to fetch CRM data:', e);
      } finally {
        setIsLoadingCRM(false);
      }
    };
    fetchCRMData();
  }, [view, user.isAdmin]);

  useEffect(() => {
    localStorage.setItem('dmerch_currency', currency);
  }, [currency]);

  // Auth State Listener
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          username: profile?.username || session.user.email || 'User',
          isAdmin: profile?.role === 'admin',
          isLoggedIn: true
        });
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          username: profile?.username || session.user.email || 'User',
          isAdmin: profile?.role === 'admin',
          isLoggedIn: true
        });
        setIsAuthOpen(false);
      } else if (event === 'SIGNED_OUT') {
        setUser({ username: '', isAdmin: false, isLoggedIn: false });
        setView('store');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- ACTIONS ---
  const handleAuth = (username: string, pass: string) => {
    if (!username) return;
    if (username.toLowerCase() === 'rad' && pass === '6244') {
      setUser({ username: 'Admin Rad', isAdmin: true, isLoggedIn: true });
    } else {
      setUser({ username, isAdmin: false, isLoggedIn: true });
    }
    setIsAuthOpen(false);
    play('success');
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (e) {
      console.error('Google Auth Error:', e);
      play('error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser({ username: '', isAdmin: false, isLoggedIn: false });
    setView('store');
    play('click');
  };

  const addToCart = (product: Product) => {
    if (!user.isLoggedIn) {
      setAuthMode('login');
      setIsAuthOpen(true);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    play('click');
  };

  const finalizeCheckout = async () => {
    setIsProcessing(true);

    try {
      // Call Supabase Edge Function for PayMongo
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          items: cart.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            imageUrl: i.imageUrl
          })),
          user_id: user.username, // In a real app, this would be the actual UUID
          username: user.username,
          currency: currency,
          origin: window.location.origin
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize settlement');

      setCheckoutUrl(data.checkout_url);
      setIsPayMongoOpen(true);
      play('click');
    } catch (e) {
      console.error(e);
      play('error');
      alert(e instanceof Error ? e.message : 'Error initializing payment gateway');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPayMongoOpen(false);

    setLastOrderItems([...cart]);
    setCart([]);

    // Update Local Sales (for immediate feedback)
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      customer_username: user.username || 'Guest',
      amount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
      items: [...cart],
      status: 'completed'
    };

    setSalesHistory(prev => [newOrder, ...prev]);

    setView('success');
    play('success');
  };

  const handleDeploySingle = async (p: any) => {
    setIsProcessing(true);
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(p.name + " " + p.category + " premium software ui")}`;
    try {
      await fetch(`${supabaseUrl}/rest/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          name: p.name, price: Number(p.price), category_name: p.category,
          description: p.description || 'Premium asset.', image_url: imageUrl, file_url: p.fileUrl
        })
      });
      fetchProducts();
      play('success');
    } catch (e) { play('error'); } finally { setIsProcessing(false); }
  };

  const handleDeployBatch = async (items: any[]) => {
    setIsProcessing(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify(items.map(i => ({
          name: i.name, price: i.price, category_name: i.category_name,
          description: i.description, image_url: i.image_url, file_url: i.file_url
        })))
      });
      fetchProducts();
      play('success');
    } catch (e) { play('error'); } finally { setIsProcessing(false); }
  };

  const handleEditProduct = async (p: Product) => {
    try {
      await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ name: p.name, price: p.price, category_name: p.category, image_url: p.imageUrl })
      });
      fetchProducts();
    } catch (e) { play('error'); }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      fetchProducts();
    } catch (e) { play('error'); }
  };

  const handleContactAdmin = async (leadData: { reason: LeadReason; message: string; email?: string }) => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          username: user.username,
          email: leadData.email,
          reason: leadData.reason,
          message: leadData.message,
          status: 'new'
        })
      });
      if (!response.ok) throw new Error('Failed to submit');
      play('success');
    } catch (e) {
      play('error');
      throw e;
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: 'new' | 'contacted' | 'resolved') => {
    try {
      await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ status })
      });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      play('success');
    } catch (e) { play('error'); }
  };

  // --- RENDER ---
  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#050810] selection:bg-blue-500/30 overflow-hidden">
      <AuthPage
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onGoogleAuth={handleGoogleAuth}
      />
      <ContactAdminModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        onSubmit={handleContactAdmin}
        user={user}
      />

      <PayMongoCheckoutModal
        isOpen={isPayMongoOpen}
        checkoutUrl={checkoutUrl}
        onClose={() => setIsPayMongoOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      <div className="flex-none md:h-full z-50">
        <Sidebar
          view={view}
          setView={setView}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          user={user}
          onLogout={handleLogout}
          onLogin={() => setIsAuthOpen(true)}
          currency={currency}
          setCurrency={setCurrency}
          onOpenContact={() => setIsContactOpen(true)}
        />
      </div>

      <main className="flex-grow h-full overflow-y-auto flex flex-col min-w-0 relative custom-scrollbar">
        {view === 'store' && (
          <StoreView
            products={products}
            activeCategory={activeCategory}
            onAddToCart={addToCart}
            currency={currency}
            exchangeRate={exchangeRate}
            purchasedProductIds={salesHistory.flatMap(s => s.items.map((i: any) => i.id))}
            cartProductIds={cart.map(i => i.id)}
          />
        )}
        {view === 'admin' && (
          <AdminView
            products={products}
            onDeploySingle={handleDeploySingle}
            onDeployBatch={handleDeployBatch}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            isProcessing={isProcessing}
          />
        )}
        {view === 'sales' && <SalesView salesHistory={salesHistory} />}
        {view === 'crm' && (
          <CRMView
            isLoading={isLoadingCRM}
            stats={crmStats}
            recentVisits={recentVisits}
            customers={customers}
            leads={leads}
            onUpdateLeadStatus={handleUpdateLeadStatus}
          />
        )}
        {view === 'checkout' && (
          <CheckoutView
            cart={cart}
            onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
            onFinalize={finalizeCheckout}
            isProcessing={isProcessing}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}
        {view === 'success' && (
          <SuccessView
            orderItems={lastOrderItems}
            onBackToStore={() => setView('store')}
            onGoToDashboard={() => { setView('orders'); play('click'); }}
          />
        )}
        {view === 'orders' && (
          <UserOrdersView
            orders={salesHistory.filter(s => s.customer_username === (user.username || 'Guest') || !s.customer_username)}
            onBackToStore={() => setView('store')}
          />
        )}
      </main>

      {/* Cart Quick Access */}
      {cart.length > 0 && view !== 'checkout' && (
        <button
          onClick={() => { setView('checkout'); play('click'); }}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-500 text-white p-6 rounded-3xl shadow-2xl shadow-blue-600/40 active:scale-95 transition-all z-[60] flex items-center gap-4 group"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-blue-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          </div>
          <span className="font-bold text-sm pr-2 group-hover:block hidden transition-all">Proceed to Checkout</span>
        </button>
      )}


    </div>
  );
};

export default App;
