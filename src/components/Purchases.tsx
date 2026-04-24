import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, User, CheckCircle2, X, Package, Calendar, Calculator, ArrowRight, ChevronRight, ShoppingBag, Search, Filter } from 'lucide-react';
import { db, type Product, type Purchase } from '../db';
import { useLanguage } from '../LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { LogDetailsModal } from './LogDetailsModal';
import { SignaturePad } from './SignaturePad';

const PurchaseCard = ({ purchase, onPayBalanceRequest, onClick }: { key?: any, purchase: Purchase, onPayBalanceRequest: (p: Purchase, amount: number) => void, onClick: () => void }) => {
    const { t } = useLanguage();
    const [isPaying, setIsPaying] = useState(false);
    const [payAmt, setPayAmt] = useState<number>(purchase.remainingAmount);

    return (
        <div 
            onClick={onClick}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 active:bg-gray-50 transition-colors"
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                        <User size={14} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight leading-none truncate w-32">{purchase.supplier || t('supplierName')}</h4>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{purchase.productName} • {format(purchase.date, 'dd MMM')}</p>
                    </div>
                </div>
                <div className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", 
                    purchase.isPaid ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                    {purchase.isPaid ? t('paid') : t('pending')}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 py-2 border-y border-gray-50">
                <div><p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">{t('quantity')}</p><p className="font-black text-xs lowercase">{purchase.quantity} {purchase.unit}</p></div>
                <div><p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">{t('price')}</p><p className="font-black text-xs">₹{purchase.purchasePrice.toFixed(1)}</p></div>
                <div><p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">{t('total')}</p><p className="font-black text-xs">{formatCurrency(purchase.totalAmount)}</p></div>
                <div><p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">{t('remaining')}</p><p className="font-black text-xs text-red-600">{formatCurrency(purchase.remainingAmount)}</p></div>
            </div>

            {!purchase.isPaid && (
                <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                    {isPaying ? (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 bg-gray-50 p-2 rounded-xl">
                            <input 
                                type="number" 
                                className="flex-1 bg-white border-none px-3 py-1.5 rounded-lg text-xs font-black outline-orange-500"
                                value={payAmt}
                                autoFocus
                                onChange={e => setPayAmt(Number(e.target.value))}
                                placeholder="Amt"
                            />
                            <button 
                                onClick={() => {
                                    if (payAmt > 0) {
                                        onPayBalanceRequest(purchase, payAmt);
                                        setIsPaying(false);
                                    }
                                }}
                                className="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            >
                                {t('payRemaining')}
                            </button>
                            <button onClick={() => setIsPaying(false)} className="bg-gray-200 text-gray-400 p-1.5 rounded-lg">
                                <X size={14} />
                            </button>
                        </motion.div>
                    ) : (
                        <button 
                            onClick={() => setIsPaying(true)}
                            className="w-full bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={12} /> {t('payRemaining')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const Purchases: React.FC = () => {
    const { t } = useLanguage();
    const [isAdding, setIsAdding] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    
    // Filtering
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

    // Signature Modal State
    const [signatureTarget, setSignatureTarget] = useState<{ purchase: Purchase, amount: number } | null>(null);

    // FORM STATE
    const [productName, setProductName] = useState('');
    const [quantity, setQuantity] = useState<number>(0);
    const [unit, setUnit] = useState('kg');
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [expiryDate, setExpiryDate] = useState('');
    const [supplier, setSupplier] = useState('');
    const [amountPaid, setAmountPaid] = useState<number>(0);

    const products = useLiveQuery(() => db.products.toArray());
    
    const purchaseHistory = useLiveQuery(() => {
        let query = db.purchases.orderBy('date').reverse();
        
        return query.filter(p => {
            const matchesSearch = p.productName.toLowerCase().includes(search.toLowerCase()) || 
                                (p.supplier?.toLowerCase().includes(search.toLowerCase()));
            const matchesStatus = statusFilter === 'all' ? true : 
                                 statusFilter === 'paid' ? p.isPaid : !p.isPaid;
            return matchesSearch && matchesStatus;
        }).toArray();
    }, [search, statusFilter]);

    const costPerUnit = quantity > 0 ? totalAmount / quantity : 0;
    const remainingAmount = totalAmount - amountPaid;

    const handleAddPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const now = new Date();
        const firstPayment = amountPaid > 0 ? [{ amount: amountPaid, date: now }] : [];

        await db.transaction('rw', [db.products, db.purchases], async () => {
             // 1. Find or Create Product
            let product = products?.find(p => p.name.toLowerCase() === productName.toLowerCase());
            let productId: number;
            
            if (product) {
                productId = product.id!;
                await db.products.update(productId, {
                    stock: product.stock + quantity,
                    purchasePrice: costPerUnit,
                    expiryDate: expiryDate || product.expiryDate,
                    unit: unit
                });
            } else {
                productId = await db.products.add({
                    name: productName,
                    stock: quantity,
                    purchasePrice: costPerUnit,
                    sellingPrice: costPerUnit * 1.2, 
                    unit: unit,
                    expiryDate: expiryDate,
                    supplier: supplier
                });
            }

            // 2. Save Purchase Record
            const purchase: Purchase = {
                productId,
                productName,
                quantity,
                unit,
                totalAmount,
                purchasePrice: costPerUnit,
                amountPaid,
                remainingAmount,
                supplier,
                isPaid: remainingAmount <= 0,
                date: now,
                expiryDate,
                payments: firstPayment
            };
            await db.purchases.add(purchase);
        });

        setIsAdding(false);
        resetForm();
    };

    const resetForm = () => {
        setProductName(''); setQuantity(0); setUnit('kg'); setTotalAmount(0); setExpiryDate(''); setSupplier(''); setAmountPaid(0);
    };

    const handlePayBalanceRequest = (purchase: Purchase, amount: number) => {
        setSignatureTarget({ purchase, amount });
    };

    const handleSavePaymentWithSignature = async (signature: string) => {
        if (!signatureTarget) return;
        const { purchase, amount } = signatureTarget;
        if (!purchase.id) return;

        const now = new Date();
        const newPaid = purchase.amountPaid + amount;
        const newRemaining = Math.max(0, purchase.totalAmount - newPaid);
        const newPayments = [...(purchase.payments || []), { amount, date: now, signature }];

        await db.purchases.update(purchase.id, {
            amountPaid: newPaid,
            remainingAmount: newRemaining,
            isPaid: newRemaining <= 0,
            payments: newPayments
        });

        setSignatureTarget(null);
    };

    return (
        <div className="flex flex-col gap-6 pb-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{t('purchases')}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{t('autoCreatesInventory')}</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn("p-3 rounded-2xl shadow-sm transition-all", 
                        isAdding ? "bg-gray-100 text-gray-400" : "bg-orange-600 text-white")}
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                </button>
            </header>

            {!isAdding && (
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                            type="text"
                            placeholder={t('search')}
                            className="w-full bg-white px-10 py-3 rounded-2xl shadow-sm border border-gray-100 font-bold text-sm outline-orange-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {(['all', 'pending', 'paid'] as const).map(f => (
                            <button 
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                    statusFilter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-400 border-gray-100")}
                            >
                                {t(f)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {isAdding ? (
                    <motion.form 
                        key="add-purchase"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onSubmit={handleAddPurchase} 
                        className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50 flex flex-col gap-5"
                    >
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('productName')}</label>
                            <input
                                required
                                list="product-suggestions"
                                placeholder="..."
                                className="bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm outline-orange-500"
                                value={productName}
                                onChange={e => setProductName(e.target.value)}
                            />
                            <datalist id="product-suggestions">
                                {products?.map(p => <option key={p.id} value={p.name} />)}
                            </datalist>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('quantity')}</label>
                                <div className="flex gap-1">
                                    <input type="number" required className="flex-1 bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm outline-orange-500 w-full" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} />
                                    <select className="bg-gray-50 border-none p-4 rounded-2xl font-bold text-xs outline-orange-500" value={unit} onChange={e => setUnit(e.target.value)}>
                                        <option value="kg">kg</option>
                                        <option value="pc">pc</option>
                                        <option value="lt">lt</option>
                                        <option value="gram">g</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('totalAmount')}</label>
                                <input type="number" required placeholder="₹" className="bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm outline-orange-500" value={totalAmount || ''} onChange={e => setTotalAmount(Number(e.target.value))} />
                            </div>
                        </div>

                        {quantity > 0 && totalAmount > 0 && (
                            <div className="bg-orange-50 p-4 rounded-2xl flex items-center justify-between border border-orange-100">
                                <div>
                                    <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">{t('calculatedCost')}</p>
                                    <h3 className="text-lg font-black text-orange-600">₹{costPerUnit.toFixed(1)} <span className="text-[10px]">{t('per')} {unit}</span></h3>
                                </div>
                                <Calculator className="text-orange-200" size={24} />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pb-2 border-b border-gray-50">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('expiry')}</label>
                                <div className="relative">
                                    <input type="date" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-xs outline-orange-500" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                                    <Calendar size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('amountPaid')}</label>
                                <input type="number" placeholder="₹" className="bg-gray-100 border-none p-4 rounded-2xl font-bold text-sm outline-orange-500" value={amountPaid || ''} onChange={e => setAmountPaid(Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('supplierName')}</label>
                            <input className="bg-gray-50 border-none p-4 rounded-2xl font-bold text-xs outline-orange-500" value={supplier} onChange={e => setSupplier(e.target.value)} />
                        </div>

                        <button type="submit" className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-lg uppercase text-[10px] tracking-[0.2em] active:scale-95 flex items-center justify-center gap-2">
                             {t('addStock')} <ArrowRight size={14} />
                        </button>
                    </motion.form>
                ) : (
                    <motion.div 
                        key="history"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-4"
                    >
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 mb-1">
                            <Package size={10} /> {t('history')}
                        </h4>
                        {purchaseHistory?.map(p => (
                            <PurchaseCard key={p.id} purchase={p} onPayBalanceRequest={handlePayBalanceRequest} onClick={() => { setSelectedPurchase(p); }} />
                        ))}
                        {purchaseHistory?.length === 0 && (
                             <p className="text-center py-10 text-[10px] font-black text-gray-300 uppercase italic tracking-widest leading-none">{t('noRecords')}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {signatureTarget && (
                <SignaturePad 
                    onSave={handleSavePaymentWithSignature}
                    onCancel={() => setSignatureTarget(null)}
                    title={t('paymentAcknowledge')}
                />
            )}

            <AnimatePresence>
                {selectedPurchase && (
                    <LogDetailsModal 
                        isOpen={!!selectedPurchase} 
                        onClose={() => setSelectedPurchase(null)} 
                        purchase={selectedPurchase} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Purchases;
