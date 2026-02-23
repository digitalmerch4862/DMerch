
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
import { ProfileSettingsView } from './src/components/profile/ProfileSettingsView';
import { AuthPage } from './src/components/auth/AuthPage';
import { ContactAdminModal } from './src/components/modals/ContactAdminModal';
import { useSound } from './src/hooks/useSound';

import { PayMongoCheckoutModal } from './src/components/modals/PayMongoCheckoutModal';
import { CategoryType, Product, User, CartItem, Visit, Customer, Lead, LeadReason } from './types';
import { supabase, signInWithGoogle } from './src/supabaseClient';

const App: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('digital_merch_user');
    return saved ? JSON.parse(saved) : { username: '', isAdmin: false, isLoggedIn: false };
  });
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const [sessionId] = useState(() => {
    let id = localStorage.getItem('digital_merch_session');
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('digital_merch_session', id);
    }
    return id;
  });

  const [view, setView] = useState<'store' | 'admin' | 'checkout' | 'sales' | 'crm' | 'success' | 'orders' | 'settings'>('store');

  // --- PROTECTION LOGIC ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const protectedViews = ['admin', 'sales', 'crm', 'settings'];
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
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

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

  const extractPreferredCurrency = (profile: any): 'PHP' | 'USD' | null => {
    const value = profile?.payment_info?.preferred_currency;
    if (value === 'PHP' || value === 'USD') return value;
    return null;
  };

  const { play } = useSound();

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('digital_merch_user', JSON.stringify(user));
  }, [user]);

  // --- DATA FETCHING ---
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalesHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setSalesHistory([]);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (!authUserId) {
      setSalesHistory([]);
      return;
    }
    fetchOrders(authUserId);
  }, [authUserId]);

  // --- ANALYTICS ---
  useEffect(() => {
    const recordVisit = async () => {
      try {
        if (!authUserId) return;

        // Fetch public IP for fraud prevention/logs
        let publicIp = 'unknown';
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          publicIp = ipData.ip;
        } catch (ipError) { /* fail silently */ }

        await supabase.from('analytics_visits').insert({
          user_id: authUserId,
          username: user.isLoggedIn ? user.username : null,
          session_id: sessionId,
          page: `${view}${view === 'store' ? ` - ${activeCategory}` : ''}`,
          user_agent: navigator.userAgent,
          ip_address: publicIp
        });
      } catch (e) { console.error(e); }
    };
    recordVisit();
  }, [view, activeCategory, user.username, sessionId, authUserId]);

  useEffect(() => {
    const fetchCRMData = async () => {
      if (!user.isLoggedIn || view !== 'crm') return;
      setIsLoadingCRM(true);
      try {
        const [visitsResult, customersResult, leadsResult] = await Promise.all([
          supabase.from('analytics_visits').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('profiles').select('*').order('total_spent', { ascending: false }),
          supabase.from('leads').select('*').order('created_at', { ascending: false })
        ]);

        const visits = visitsResult.data || [];
        const profiles = customersResult.data || [];
        const leadsData = leadsResult.data || [];

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
  }, [view, user.isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('dmerch_currency', currency);
  }, [currency]);

  // Auth State Listener
  useEffect(() => {
    const syncUserFromSession = async (session: any) => {
      if (!session) {
        setAuthUserId(null);
        setUser({ username: '', isAdmin: false, isLoggedIn: false });
        setSalesHistory([]);
        return;
      }

      setAuthUserId(session.user.id);

      const fallbackUsername = session.user.email?.split('@')[0] || 'User';
      let profile: any = null;

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { data: createdProfile } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            email: session.user.email,
            username: fallbackUsername,
            role: 'user'
          })
          .select('*')
          .single();
        profile = createdProfile;
      } else {
        profile = existingProfile;
      }

      setUser({
        username: profile?.username || session.user.email || 'User',
        fullName: profile?.full_name || '',
        avatarUrl: profile?.avatar_url || '',
        isAdmin: profile?.role === 'admin',
        isLoggedIn: true
      });

      const preferredCurrency = extractPreferredCurrency(profile);
      if (preferredCurrency) {
        setCurrency(preferredCurrency);
      }
    };

    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await syncUserFromSession(session);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        await syncUserFromSession(session);
        setIsAuthOpen(false);
      } else if (event === 'SIGNED_OUT') {
        setAuthUserId(null);
        setUser({ username: '', isAdmin: false, isLoggedIn: false });
        setSalesHistory([]);
        setView('store');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- ACTIONS ---
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
      if (!authUserId) {
        throw new Error('Please log in before checkout');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items: cart.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            imageUrl: i.imageUrl,
            fileUrl: i.fileUrl,
            category: i.category
          })),
          user_id: authUserId,
          username: user.username,
          currency,
          origin: window.location.origin
        }
      });

      if (error) throw error;
      if (!data?.checkout_url) throw new Error('Failed to initialize settlement');

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

  const handlePaymentSuccess = async () => {
    setIsPayMongoOpen(false);

    const completedItems = [...cart];
    const totalAmount = completedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    setLastOrderItems(completedItems);
    setCart([]);

    try {
      if (authUserId) {
        const { error } = await supabase
          .from('orders')
          .insert({
            user_id: authUserId,
            customer_username: user.username || 'User',
            amount: totalAmount,
            items: completedItems,
            status: 'completed'
          });

        if (error) throw error;
        await fetchOrders(authUserId);
      }
    } catch (e) {
      console.error('Failed to persist order:', e);
    }

    setView('success');
    play('success');
  };

  const handleDeploySingle = async (p: any) => {
    setIsProcessing(true);
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(p.name + " " + p.category + " premium software ui")}`;
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: p.name,
          price: Number(p.price),
          category_name: p.category,
          description: p.description || 'Premium asset.',
          image_url: imageUrl,
          file_url: p.fileUrl
        });

      if (error) throw error;
      await fetchProducts();
      play('success');
    } catch (e) {
      console.error(e);
      play('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeployBatch = async (items: any[]) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert(items.map(i => ({
          name: i.name,
          price: i.price,
          category_name: i.category_name,
          description: i.description,
          image_url: i.image_url,
          file_url: i.file_url
        })));

      if (error) throw error;
      await fetchProducts();
      play('success');
    } catch (e) {
      console.error(e);
      play('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditProduct = async (p: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: p.name,
          price: p.price,
          category_name: p.category,
          image_url: p.imageUrl
        })
        .eq('id', p.id);

      if (error) throw error;
      await fetchProducts();
    } catch (e) {
      console.error(e);
      play('error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (e) {
      console.error(e);
      play('error');
    }
  };

  const handleContactAdmin = async (leadData: { reason: LeadReason; message: string; email?: string }) => {
    try {
      if (!authUserId) throw new Error('Please log in before submitting a message');

      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: authUserId,
          username: user.username,
          email: leadData.email,
          reason: leadData.reason,
          message: leadData.message,
          status: 'new'
        });

      if (error) throw error;
      play('success');
    } catch (e) {
      play('error');
      throw e;
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: 'new' | 'contacted' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      play('success');
    } catch (e) {
      console.error(e);
      play('error');
    }
  };

  const handleSaveProfileSettings = async (payload: {
    username: string;
    fullName: string;
    avatarUrl: string;
    preferredCurrency: 'PHP' | 'USD';
  }) => {
    if (!authUserId) throw new Error('Please sign in first.');

    setIsSavingProfile(true);
    try {
      const { data: existingProfile, error: readError } = await supabase
        .from('profiles')
        .select('payment_info')
        .eq('id', authUserId)
        .single();

      if (readError) throw readError;

      const nextPaymentInfo = {
        ...(existingProfile?.payment_info || {}),
        preferred_currency: payload.preferredCurrency
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          username: payload.username,
          full_name: payload.fullName,
          avatar_url: payload.avatarUrl,
          payment_info: nextPaymentInfo
        })
        .eq('id', authUserId);

      if (error) throw error;

      setUser(prev => ({
        ...prev,
        username: payload.username,
        fullName: payload.fullName,
        avatarUrl: payload.avatarUrl
      }));
      setCurrency(payload.preferredCurrency);
      play('success');
    } catch (e) {
      play('error');
      throw e;
    } finally {
      setIsSavingProfile(false);
    }
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
            orders={salesHistory}
            onBackToStore={() => setView('store')}
          />
        )}
        {view === 'settings' && user.isLoggedIn && (
          <ProfileSettingsView
            username={user.username}
            fullName={user.fullName}
            avatarUrl={user.avatarUrl}
            currency={currency}
            isAdmin={user.isAdmin}
            isSaving={isSavingProfile}
            onSave={handleSaveProfileSettings}
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
