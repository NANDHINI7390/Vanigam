import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Home as HomeIcon, ReceiptText, Package, ShoppingCart, Globe, BarChart3, ListOrdered } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { cn } from './lib/utils';

// Screens
import Home from './components/Home';
import Billing from './components/Billing';
import Inventory from './components/Inventory';
import Purchases from './components/Purchases';
import Dashboard from './components/Dashboard';
import CustomerLedger from './components/CustomerLedger';

const Navigation = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const { t, lang, setLang } = useLanguage();

    const lowStockCount = useLiveQuery(() => db.products.filter(p => p.stock <= 5).count());
    
    const tabs = [
      { id: 'home', icon: HomeIcon, label: t('home') },
      { id: 'billing', icon: ReceiptText, label: t('billing') },
      { id: 'purchases', icon: ShoppingCart, label: t('purchases') },
      { id: 'ledger', icon: ListOrdered, label: t('ledger') },
      { id: 'inventory', icon: Package, label: t('inventory'), badge: (lowStockCount || 0) > 0 ? lowStockCount : null },
      { id: 'dashboard', icon: BarChart3, label: t('dashboard') },
    ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe shadow-[0_-10px_35px_rgb(0,0,0,0.06)] z-50 rounded-t-[2.5rem]">
      <div className="flex justify-around items-center h-22 px-1 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-all relative px-1",
              activeTab === tab.id ? "text-orange-600 -translate-y-1" : "text-gray-300 hover:text-gray-400"
            )}
          >
            <tab.icon className={cn("w-6 h-6 mb-1.5", activeTab === tab.id ? "stroke-[2.5]" : "stroke-[1.5]")} />
            {tab.badge && (
               <span className="absolute top-0 right-1/4 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {tab.badge}
               </span>
            )}
            <span className={cn("text-[9px] font-black uppercase tracking-tighter text-center leading-none", activeTab === tab.id ? "opacity-100" : "opacity-60")}>
                {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-3 w-8 h-1.5 bg-orange-600 rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

const Header = () => {
  const { t, lang, setLang } = useLanguage();

  return (
    <header className="bg-gray-50/80 backdrop-blur-md py-4 px-6 sticky top-0 z-40 flex justify-between items-center">
      <div>
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] leading-none mb-1">{t('vanigam')}</p>
          <h1 className="text-xl font-black tracking-tighter text-gray-900 leading-none">
            {t('appName')}
          </h1>
      </div>
      <button
        onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
        className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-2 rounded-2xl font-black text-[10px] text-gray-500 hover:bg-gray-50 transition-colors uppercase tracking-widest shadow-sm"
      >
        <Globe size={12} className="text-orange-500" />
        {lang === 'ta' ? 'English' : 'தமிழ்'}
      </button>
    </header>
  );
};

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <Home onNavigate={setActiveTab} />;
      case 'billing': return <Billing />;
      case 'inventory': return <Inventory />;
      case 'purchases': return <Purchases />;
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'ledger': return <CustomerLedger />;
      default: return <Home onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans antialiased text-gray-900 selection:bg-orange-100">
      <Header />
      <main className="max-w-lg mx-auto p-6 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
