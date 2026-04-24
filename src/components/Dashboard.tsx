import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, ChevronRight, ReceiptText, User } from 'lucide-react';
import { db, type Sale } from '../db';
import { useLanguage } from '../LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { LogDetailsModal } from './LogDetailsModal';

const AnalysisCard = ({ title, value, percentage, isPositive, icon: Icon }: { title: string, value: string, percentage: string, isPositive: boolean, icon: any }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                <Icon size={16} />
            </div>
            <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight", 
                isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                {isPositive ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                {percentage}
            </div>
        </div>
        <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-lg font-black text-gray-900 mt-0.5">{value}</h3>
        </div>
    </div>
);

const Dashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [days, setDays] = useState(7);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const today = new Date();
    const startDate = startOfDay(subDays(today, days));
    const endDate = endOfDay(today);

    const sales = useLiveQuery(() => db.sales.where('date').between(startDate, endDate).toArray(), [days]);
    const purchases = useLiveQuery(() => db.purchases.where('date').between(startDate, endDate).toArray(), [days]);
    
    // PENDING CUSTOMERS QUERY - Using toArray().filter for reliability across browsers with boolean indices
    const allSales = useLiveQuery(() => db.sales.toArray());

    const pendingSummary = React.useMemo(() => {
        if (!allSales) return [];
        const map = new Map<string, number>();
        allSales.filter(s => s.paymentMethod === 'credit' && !s.isPaid && s.customerName).forEach(s => {
            const name = s.customerName!;
            const current = map.get(name) || 0;
            map.set(name, current + s.totalAmount);
        });
        return Array.from(map.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [allSales]);

    const totalSales = sales?.reduce((acc, s) => acc + s.totalAmount, 0) || 0;
    const totalProfit = sales?.reduce((acc, s) => acc + s.profit, 0) || 0;
    const totalPurchases = purchases?.reduce((acc, p) => acc + p.totalAmount, 0) || 0;
    const billCount = sales?.length || 0;

    return (
        <div className="flex flex-col gap-5 pb-10">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                   <h1 className="text-xl font-black text-gray-900 tracking-tight">{t('dashboard')}</h1>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('analyticsReport')}</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {[7, 30].map(d => (
                        <button 
                            key={d}
                            onClick={() => setDays(d)}
                            className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", 
                                days === d ? "bg-white text-gray-900 shadow-sm" : "text-gray-400")}
                        >
                            {d}D
                        </button>
                    ))}
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                <AnalysisCard 
                    title={t('todaySales')}
                    value={formatCurrency(totalSales)}
                    percentage="12%"
                    isPositive={true}
                    icon={TrendingUp}
                />
                <AnalysisCard 
                    title={t('todayProfit')}
                    value={formatCurrency(totalProfit)}
                    percentage="5%"
                    isPositive={true}
                    icon={Wallet}
                />
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm col-span-2 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><ReceiptText size={16} /></div>
                         <div>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('totalIssuedBills')}</p>
                             <h4 className="text-lg font-black text-gray-900">{billCount} {t('bills')}</h4>
                         </div>
                     </div>
                     <div className="text-right">
                         <p className="text-[8px] font-bold text-gray-400 uppercase">{t('avgValue')}</p>
                         <p className="text-sm font-black text-gray-900">{formatCurrency(billCount > 0 ? totalSales / billCount : 0)}</p>
                     </div>
                </div>
            </div>

            {/* CUSTOMERS WITH PENDING */}
            <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('customersWithPending')}</h4>
                    <button onClick={() => onNavigate('ledger')} className="text-[10px] font-black text-orange-600 uppercase flex items-center gap-1">
                        View All Ledger <ChevronRight size={10} />
                    </button>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                    {pendingSummary.slice(0, 5).map(customer => (
                        <button 
                            key={customer.name}
                            onClick={() => onNavigate('ledger')}
                            className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-black text-[10px]">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{customer.name}</p>
                            </div>
                            <p className="text-sm font-black text-red-600">{formatCurrency(customer.amount)}</p>
                        </button>
                    ))}
                    {pendingSummary.length === 0 && (
                        <div className="p-8 text-center text-[10px] font-black text-gray-300 uppercase italic">
                             No pending accounts
                        </div>
                    )}
                </div>
            </section>

            {/* Cost vs Revenue Chart-ish */}
            <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('cashActivity')}</h4>
                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">{days} {t('daysFlow')}</span>
                </div>
                
                <div className="space-y-4 pt-2">
                    <div>
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <p className="text-[9px] font-black text-gray-500 uppercase">{t('inboundRevenue')}</p>
                            <p className="text-sm font-black text-green-600">{formatCurrency(totalSales)}</p>
                        </div>
                        <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-green-500 rounded-full" />
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <p className="text-[9px] font-black text-gray-500 uppercase">{t('outboundExpenses')}</p>
                            <p className="text-sm font-black text-orange-600">{formatCurrency(totalPurchases)}</p>
                        </div>
                        <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalPurchases / (totalSales || 1)) * 100, 100)}%` }} className="h-full bg-orange-500 rounded-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Small History Log */}
            <section className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">{t('recentActivity')}</h4>
                <div className="flex flex-col gap-2">
                    {sales?.slice().sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10).map(sale => (
                        <button 
                            key={sale.id} 
                            onClick={() => setSelectedSale(sale)}
                            className="bg-white p-3 rounded-2xl border border-gray-50 flex justify-between items-center active:bg-gray-50 transition-colors text-left w-full"
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn("w-1 h-6 rounded-full", sale.totalAmount > 0 ? "bg-green-100" : "bg-gray-100")} />
                                <div>
                                    <p className="font-bold text-gray-800 text-[11px] leading-tight">{format(sale.date, 'dd MMM, p')}</p>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{sale.items.length} {t('items')}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <div>
                                    <p className="text-xs font-black text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                                    <p className="text-[8px] font-black text-green-600 uppercase">Profit: {formatCurrency(sale.profit)}</p>
                                </div>
                                <ChevronRight size={12} className="text-gray-300" />
                            </div>
                        </button>
                    ))}
                    {(!sales || sales.length === 0) && (
                        <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-100">
                            <p className="text-[10px] font-black text-gray-300 uppercase italic">{t('noSalesHistory')}</p>
                        </div>
                    )}
                </div>
            </section>

            <AnimatePresence>
                {selectedSale && (
                    <LogDetailsModal 
                        isOpen={!!selectedSale} 
                        onClose={() => setSelectedSale(null)} 
                        sale={selectedSale} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
