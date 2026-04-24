import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { User, ChevronRight, ArrowLeft, History, Receipt, CheckCircle2, TrendingDown } from 'lucide-react';
import { db, type Sale } from '../db';
import { useLanguage } from '../LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const CustomerCard: React.FC<{ name: string, pending: number, onClick: () => void }> = ({ name, pending, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between active:bg-gray-50 transition-all text-left"
    >
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <User size={24} />
            </div>
            <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{name}</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Customer Account</p>
            </div>
        </div>
        <div className="text-right flex items-center gap-4">
            <div>
                <p className="text-[8px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Total Pending</p>
                <p className="text-lg font-black text-red-600 leading-none">{formatCurrency(pending)}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
        </div>
    </button>
);

const CustomerLedger: React.FC = () => {
    const { t } = useLanguage();
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

    // Queries
    const sales = useLiveQuery(() => db.sales.toArray());
    
    const customers = React.useMemo(() => {
        if (!sales) return [];
        const map = new Map<string, number>();
        sales.filter(s => s.paymentMethod === 'credit').forEach(s => {
            if (s.customerName) {
                const current = map.get(s.customerName) || 0;
                map.set(s.customerName, current + (s.isPaid ? 0 : s.totalAmount));
            }
        });
        return Array.from(map.entries())
            .map(([name, pending]) => ({ name, pending }))
            .sort((a, b) => b.pending - a.pending);
    }, [sales]);

    const customerBills = useLiveQuery(
        () => selectedCustomer ? db.sales.where('customerName').equals(selectedCustomer).reverse().toArray() : Promise.resolve([]),
        [selectedCustomer]
    );

    const markAllAsPaid = async () => {
        if (!selectedCustomer) return;
        if (confirm(`Mark all bills for ${selectedCustomer} as Paid?`)) {
            const ids = customerBills?.filter(b => !b.isPaid).map(b => b.id);
            if (ids && ids.length > 0) {
                await db.sales.where('id').anyOf(ids as number[]).modify({ isPaid: true });
            }
        }
    };

    const markBillPaid = async (saleId: number) => {
        await db.sales.update(saleId, { isPaid: true });
    };

    if (selectedCustomer) {
        const pendingTotal = customerBills?.reduce((acc, b) => acc + (b.isPaid ? 0 : b.totalAmount), 0) || 0;
        
        return (
            <div className="flex flex-col gap-6">
                <header className="flex items-center gap-4">
                    <button onClick={() => setSelectedCustomer(null)} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">{selectedCustomer}</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Ledger History</p>
                    </div>
                </header>

                <section className="bg-red-600 p-8 rounded-[3rem] text-white shadow-xl shadow-red-100 relative overflow-hidden">
                    <TrendingDown size={120} className="absolute -bottom-8 -right-8 text-white opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">{t('pendingAmount')}</p>
                    <h2 className="text-4xl font-black">{formatCurrency(pendingTotal)}</h2>
                    {pendingTotal > 0 && (
                        <button 
                            onClick={markAllAsPaid}
                            className="mt-8 bg-white text-red-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg"
                        >
                            <CheckCircle2 size={14} /> Clear All Pending
                        </button>
                    )}
                </section>

                <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center gap-2">
                        <History size={12} /> Transaction History
                    </h4>
                    {customerBills?.map(bill => (
                        <div key={bill.id} className="bg-white p-4 rounded-2xl border border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl", bill.isPaid ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                                    <Receipt size={16} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase text-gray-900 leading-none mb-0.5">{format(bill.date, 'dd MMM, yyyy')}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">{bill.items.length} Items</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <p className="text-sm font-black text-gray-900 leading-none">{formatCurrency(bill.totalAmount)}</p>
                                    <p className={cn("text-[8px] font-black uppercase mt-1 leading-none", bill.isPaid ? "text-green-600" : "text-red-500")}>
                                        {bill.isPaid ? "PAID" : "PENDING"}
                                    </p>
                                </div>
                                {!bill.isPaid && (
                                    <button onClick={() => markBillPaid(bill.id!)} className="p-2 text-gray-300 hover:text-green-600 transition-colors">
                                        <CheckCircle2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-12">
            <header>
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{t('customerAccounts')}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Credit (Udhaar) Tracking</p>
            </header>

            <div className="flex flex-col gap-3">
                {customers.map(c => (
                    <CustomerCard 
                        key={c.name}
                        name={c.name}
                        pending={c.pending}
                        onClick={() => setSelectedCustomer(c.name)}
                    />
                ))}

                {customers.length === 0 && (
                    <div className="py-20 text-center bg-gray-50 border-2 border-dashed border-gray-100 rounded-[3rem] px-8">
                        <User size={24} className="text-gray-100 mx-auto mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest">No customer credit accounts. These appear when you make a <span className="text-orange-600">Credit Bill</span></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerLedger;
