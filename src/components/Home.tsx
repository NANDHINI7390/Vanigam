import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TrendingUp, Wallet, Package, ShoppingCart, ReceiptText, BarChart3, ChevronRight, AlertTriangle, User } from 'lucide-react';
import { db } from '../db';
import { useLanguage } from '../LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { startOfDay, endOfDay, startOfToday, endOfToday } from 'date-fns';

const Home: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    
    const salesToday = useLiveQuery(() => {
        const start = startOfToday();
        const end = endOfToday();
        return db.sales.where('date').between(start, end, true, true).toArray();
    }, []);
    const lowStockCount = useLiveQuery(() => db.products.filter(p => p.stock > 0 && p.stock <= 5).count());
    const outOfStockCount = useLiveQuery(() => db.products.filter(p => p.stock === 0).count());
    const expiringSoon = useLiveQuery(() => {
        const soon = new Date();
        soon.setDate(soon.getDate() + 7); 
        const soonStr = soon.toISOString().split('T')[0];
        return db.products.filter(p => p.expiryDate !== undefined && p.expiryDate !== '' && p.expiryDate <= soonStr).toArray();
    });

    const totalSales = salesToday?.reduce((acc, s) => acc + s.totalAmount, 0) || 0;
    const totalProfit = salesToday?.reduce((acc, s) => acc + s.profit, 0) || 0;

    const categories = [
        { id: 'billing', title: t('billing'), icon: ReceiptText, color: 'text-orange-500', image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400' },
        { id: 'inventory', title: t('inventory'), icon: Package, color: 'text-blue-500', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400' },
        { id: 'purchases', title: t('purchases'), icon: ShoppingCart, color: 'text-green-500', image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=400' },
        { id: 'ledger', title: t('ledger'), icon: User, color: 'text-red-500', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=400' },
        { id: 'dashboard', title: t('dashboard'), icon: BarChart3, color: 'text-purple-500', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400' },
    ];

    return (
        <div className="flex flex-col gap-6 pb-8">
            {/* COMPACT STATS */}
            <header className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded-2xl border border-gray-50 flex flex-col gap-1 shadow-xs">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t('todaySales')}</p>
                    <p className="text-xs font-black text-gray-900 leading-none">{formatCurrency(totalSales)}</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-50 flex flex-col gap-1 shadow-xs">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t('todayProfit')}</p>
                    <p className="text-xs font-black text-green-600 leading-none">{formatCurrency(totalProfit)}</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-50 flex flex-col gap-1 shadow-xs">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Stock Alert</p>
                    <p className={cn("text-xs font-black leading-none", (outOfStockCount || 0) > 0 ? "text-red-600" : (lowStockCount || 0) > 0 ? "text-orange-600" : "text-gray-900")}>
                        {outOfStockCount && outOfStockCount > 0 ? `${outOfStockCount} Out` : `${lowStockCount || 0} Low`}
                    </p>
                </div>
            </header>

            {/* STOCK ALERTS - PREFER OUT OF STOCK */}
            {outOfStockCount && outOfStockCount > 0 ? (
                <button 
                    onClick={() => onNavigate('inventory')}
                    className="w-full bg-black p-4 rounded-3xl text-white flex items-center justify-between shadow-lg shadow-black/20 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="animate-pulse text-red-500" size={16} />
                        <div>
                             <p className="text-[9px] font-black uppercase tracking-widest leading-none text-red-500">Critical Alert</p>
                             <h4 className="text-xs font-black leading-none mt-1">{outOfStockCount} {t('stockNotAvailable')}</h4>
                        </div>
                    </div>
                    <div className="p-2 bg-white/20 rounded-full"><ChevronRight size={14} /></div>
                </button>
            ) : expiringSoon && expiringSoon.length > 0 ? (
                <button 
                    onClick={() => onNavigate('inventory')}
                    className="w-full bg-orange-600 p-4 rounded-3xl text-white flex items-center justify-between shadow-lg shadow-orange-600/20 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="animate-pulse" size={16} />
                        <div>
                             <p className="text-[9px] font-black uppercase tracking-widest leading-none">Stock Alert</p>
                             <h4 className="text-xs font-black leading-none mt-1">{expiringSoon[0].name} expiring soon</h4>
                        </div>
                    </div>
                    <div className="p-2 bg-white/20 rounded-full"><ChevronRight size={14} /></div>
                </button>
            ) : lowStockCount && lowStockCount > 0 ? (
                <button 
                    onClick={() => onNavigate('inventory')}
                    className="w-full bg-red-600 p-4 rounded-3xl text-white flex items-center justify-between shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="animate-pulse" size={16} />
                        <div>
                             <p className="text-[9px] font-black uppercase tracking-widest leading-none">Inventory Alert</p>
                             <h4 className="text-xs font-black leading-none mt-1">{lowStockCount} items running low</h4>
                        </div>
                    </div>
                    <div className="p-2 bg-white/20 rounded-full"><ChevronRight size={14} /></div>
                </button>
            ) : null}

            {/* VISUAL WELCOME CARD */}
            <section className="relative h-44 rounded-[3rem] overflow-hidden shadow-xl shadow-orange-100 flex items-center px-8 text-white">
                <img 
                    src="https://images.unsplash.com/photo-1604719312563-8912e9aaa252?auto=format&fit=crop&q=80&w=800" 
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Store"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-r from-orange-600 via-orange-600/70 to-transparent" />
                <div className="relative z-10 text-left">
                    <p className="text-orange-200 text-[10px] font-black uppercase tracking-[0.4em] mb-2 leading-none uppercase">{t('qualityGroceries')}</p>
                    <h2 className="text-white text-3xl font-black tracking-tighter leading-none mb-1">
                        {t('appName')}
                    </h2>
                    <div className="flex items-center gap-2 mt-4">
                         <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                         <span className="text-white/80 text-[10px] font-black uppercase tracking-widest leading-none">Shop is Open</span>
                    </div>
                </div>
            </section>

            {/* QUICK ACTIONS CATEGORIES */}
            <section className="grid grid-cols-2 gap-4">
                 {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => onNavigate(cat.id)}
                        className="relative overflow-hidden aspect-square rounded-[2rem] p-5 flex flex-col justify-between group active:scale-95 transition-all shadow-sm text-left"
                    >
                        <img src={cat.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80" />
                        <div className={cn("relative z-10 w-8 h-8 rounded-xl flex items-center justify-center text-white backdrop-blur-md bg-white/20")}>
                            <cat.icon size={16} className={cat.color} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-white text-[10px] font-black uppercase tracking-widest leading-none mb-1">{cat.title}</h3>
                            <p className="text-white/60 text-[8px] font-bold uppercase tracking-tight">Open Tool</p>
                        </div>
                    </button>
                 ))}
            </section>

            {/* FRESH ARRIVALS HIGHLIGHT */}
            <section className="relative h-48 rounded-[3rem] overflow-hidden shadow-lg group active:scale-[0.98] transition-all">
                <img 
                    src="https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=800" 
                    alt="Fresh Arrival"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-8 right-8">
                     <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1 leading-none uppercase">Daily Farm Fresh</p>
                     <h3 className="text-white text-xl font-black uppercase tracking-tight leading-none">பச்சை காய்கறிகள்</h3>
                     <p className="text-white/60 text-[9px] font-bold mt-2 uppercase tracking-widest">Hand-picked fresh everyday</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
