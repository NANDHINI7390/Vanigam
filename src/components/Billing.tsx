import React, { useState, useEffect, useRef } from 'react';
import { Mic, Search, Plus, Trash2, MessageCircle as WhatsApp, Printer, X, ShoppingCart, User, Volume2, Edit3, CheckCircle2, AlertTriangle, Smartphone, Wallet } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product, type Sale, type SaleItem } from '../db';
import { useLanguage } from '../LanguageContext';
import { parseTamilBillText } from '../services/geminiService';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const QuickProduct = ({ product, onClick }: { key?: any, product: Product, onClick: () => void }) => {
    const isOutOfStock = product.stock === 0;
    return (
        <button 
            disabled={isOutOfStock}
            onClick={onClick}
            className={cn("bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-90 transition-all text-center relative", 
                isOutOfStock && "opacity-50 grayscale")}
        >
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs", 
                isOutOfStock ? "bg-gray-100 text-gray-400" : "bg-orange-100 text-orange-600")}>
                {product.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-900 leading-tight uppercase tracking-tighter truncate w-16">{product.name}</p>
                <p className="text-[8px] font-bold text-gray-400 mt-0.5">{isOutOfStock ? 'OUT OF STOCK' : formatCurrency(product.sellingPrice)}</p>
            </div>
            {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center p-2">
                     <span className="bg-red-600 text-white text-[6px] font-black uppercase px-2 py-0.5 rounded-full rotate-12 shadow-sm">Not Available</span>
                </div>
            )}
        </button>
    );
};

interface BillItemUI extends SaleItem {
    uId: string;
}

const BillItemRow = ({ item, onUpdate, onRemove }: { key?: any, item: BillItemUI, onUpdate: (updates: Partial<BillItemUI>) => void, onRemove: () => void }) => {
    const { t } = useLanguage();
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 flex items-center justify-between group"
        >
            <div className="flex flex-col gap-1">
                <h4 className="font-black text-gray-900 text-sm leading-none flex items-center gap-2">
                    {item.name}
                    <button className="text-gray-300 group-hover:text-orange-500 transition-colors"><Edit3 size={12} /></button>
                </h4>
                <div className="flex items-center gap-3">
                    <input 
                        type="number"
                        min="1"
                        className="bg-gray-100 px-2 py-0.5 rounded-lg text-xs font-black w-12 text-center border-none"
                        value={item.quantity}
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                onUpdate({ quantity: val });
                            }
                        }}
                    />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">@ {formatCurrency(item.price)}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <p className="text-lg font-black text-gray-900 leading-none">{formatCurrency(item.quantity * item.price)}</p>
                <button onClick={onRemove} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.div>
    );
};

const Billing: React.FC = () => {
    const { t } = useLanguage();
    const [billItems, setBillItems] = useState<BillItemUI[]>([]);
    const [finalInvoice, setFinalInvoice] = useState<{ 
        items: SaleItem[], 
        total: number, 
        paymentMethod: string, 
        customerName?: string 
    } | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [lastSaleId, setLastSaleId] = useState<number | null>(null);
    const [manualProductId, setManualProductId] = useState<number | 0>(0);
    const [manualProductName, setManualProductName] = useState('');
    const [manualQty, setManualQty] = useState(1);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    
    // NEW PAYMENT STATES
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'credit'>('cash');
    const [customerName, setCustomerName] = useState('');

    const products = useLiveQuery(() => db.products.toArray());
    const topProducts = products?.slice(0, 6) || [];
    const recentCustomers = useLiveQuery(async () => {
        const sales = await db.sales.where('paymentMethod').equals('credit').toArray();
        const names = Array.from(new Set(sales.map(s => s.customerName).filter(Boolean)));
        return names as string[];
    });

    const totalAmount = billItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const totalProfit = billItems.reduce((acc, item) => acc + ((item.price - item.purchasePrice) * item.quantity), 0);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ta-IN';

            recognition.onstart = () => {
                setIsListening(true);
                setTranscript('');
            };
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setTranscript(prev => prev + event.results[i][0].transcript + ' ');
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript(''); 
            recognitionRef.current?.start();
        }
    };

    const getStockExceededMsg = (product: Product, requested: number) => {
        const unit = product.unit || '';
        return t('stockExceeded')
            .replace('{stock}', product.stock.toString())
            .replace('{requested}', requested.toString())
            .split('{unit}').join(unit) + ` (${product.name})`;
    };

    const handleVoiceParse = async (text: string) => {
        if (!text.trim()) return;
        setIsParsing(true);
        try {
            const productsList = (products || []).map(p => ({
                id: p.id || 0,
                name: p.name,
                price: p.sellingPrice
            }));
            const items = await parseTamilBillText(text, productsList);
            const enrichedItems: BillItemUI[] = [];
            
            for (const item of items) {
                // Try exact match then includes match
                const product = products?.find(p => p.name.toLowerCase() === item.name.toLowerCase()) ||
                              products?.find(p => p.name.toLowerCase().includes(item.name.toLowerCase())) ||
                              products?.find(p => item.name.toLowerCase().includes(p.name.toLowerCase()));
                if (product) {
                    if (product.stock === 0) {
                        setError(`${product.name}: ${t('outOfStock')}`);
                        continue;
                    }
                    if (item.quantity > product.stock) {
                        setError(getStockExceededMsg(product, item.quantity));
                        continue;
                    }
                    enrichedItems.push({
                        uId: crypto.randomUUID(),
                        productId: product.id || 0,
                        name: product.name,
                        quantity: item.quantity,
                        price: product.sellingPrice, // Always use stored selling price
                        purchasePrice: product.purchasePrice
                    });
                } else {
                    enrichedItems.push({
                        uId: crypto.randomUUID(),
                        productId: 0,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        purchasePrice: item.price * 0.8
                    });
                }
            }
            setBillItems(prev => [...prev, ...enrichedItems]);
            setTranscript('');
        } catch (error) {
            console.error("Voice parsing failed", error);
        } finally {
            setIsParsing(false);
        }
    };

    const handleAddItem = (product: Product) => {
        const existing = billItems.find(i => i.productId !== 0 && i.productId === product.id);
        const newQty = (existing?.quantity || 0) + 1;
        
        if (product.stock === 0) {
            setError(`${product.name}: ${t('outOfStock')}`);
            return;
        }

        if (newQty > product.stock) {
            setError(getStockExceededMsg(product, newQty));
            return;
        }

        if (existing) {
            updateItem(existing.uId, { quantity: newQty });
        } else {
            setBillItems([...billItems, {
                uId: crypto.randomUUID(),
                productId: product.id || 0,
                name: product.name,
                quantity: 1,
                price: product.sellingPrice,
                purchasePrice: product.purchasePrice
            }]);
        }
    };

    const updateItem = (uId: string, updates: Partial<BillItemUI>) => {
        const itemToUpdate = billItems.find(i => i.uId === uId);
        if (!itemToUpdate) return;

        if (updates.quantity !== undefined) {
            const product = products?.find(p => p.id === itemToUpdate.productId);
            if (product) {
               if (product.stock === 0) {
                   setError(`${product.name}: ${t('outOfStock')}`);
                   return;
               }
               if (updates.quantity > product.stock) {
                   setError(getStockExceededMsg(product, updates.quantity));
                   return;
               }
            }
        }
        setBillItems(prev => prev.map(item => item.uId === uId ? { ...item, ...updates } : item));
    };

    const removeItem = (uId: string) => {
        setBillItems(prev => prev.filter(item => item.uId !== uId));
    };

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const product = products?.find(p => p.name === manualProductName);
        if (product) {
            if (product.stock === 0) {
                setError(`${product.name}: ${t('outOfStock')}`);
                return;
            }
            const existing = billItems.find(i => i.productId !== 0 && i.productId === product.id);
            const newQty = (existing?.quantity || 0) + manualQty;
            
            if (newQty > product.stock) {
                setError(getStockExceededMsg(product, newQty));
                return;
            }

            if (existing) {
                updateItem(existing.uId, { quantity: newQty });
            } else {
                setBillItems([...billItems, {
                    uId: crypto.randomUUID(),
                    productId: product.id || 0,
                    name: product.name,
                    quantity: manualQty,
                    price: product.sellingPrice,
                    purchasePrice: product.purchasePrice
                }]);
            }
            setManualProductName('');
            setManualQty(1);
        } else if (manualProductName.trim()) {
            // Allow adding one-off custom items if needed? 
            // Or only allow from inventory as per requirement. 
            // User said "Suppose if voice is not working... add the bill manually".
            // Since Purchase creates products, usually they should exist.
            setError(t('productNotFound') || "Product not in inventory");
        }
    };

    const handleFinishBill = async () => {
        if (billItems.length === 0) return;
        if (paymentMethod === 'credit' && !customerName.trim()) {
            setError("Customer Name is required for Credit payments!");
            return;
        }

        // Cache the bill for the modal before clearing
        setFinalInvoice({ 
            items: [...billItems], 
            total: totalAmount,
            paymentMethod,
            customerName: paymentMethod === 'credit' ? customerName : undefined
        });

        const sale: Sale = {
            date: new Date(),
            totalAmount,
            profit: totalProfit,
            items: billItems,
            paymentMethod,
            customerName: paymentMethod === 'credit' ? customerName : undefined,
            isPaid: paymentMethod !== 'credit'
        };

        try {
            await db.transaction('rw', db.sales, db.products, async () => {
                const saleId = await db.sales.add(sale);
                setLastSaleId(saleId as number);
                
                for (const item of billItems) {
                    if (item.productId > 0) {
                        const product = await db.products.get(item.productId);
                        if (product) {
                            await db.products.update(item.productId, {
                                stock: product.stock - item.quantity
                            });
                        }
                    }
                }
            });
            setIsInvoiceOpen(true);
            setBillItems([]);
            setCustomerName('');
            setPaymentMethod('cash');
        } catch (error) {
            console.error("Billing failed", error);
            setFinalInvoice(null);
        }
    };

    const shareOnWhatsApp = () => {
        const itemsToShare = finalInvoice?.items || billItems;
        const totalToShare = finalInvoice?.total || totalAmount;
        const currentMethod = finalInvoice?.paymentMethod || paymentMethod;
        const currentName = finalInvoice?.customerName || customerName;
        
        const methodLabel = currentMethod === 'upi' ? 'UPI' : currentMethod === 'credit' ? 'CREDIT' : 'CASH';
        const customerLine = (currentMethod === 'credit' && currentName) ? `*Customer:* ${currentName}\n` : '';
        
        const text = `*${t('appName')}*\n\n${t('whatsappWelcome')}\n\n${customerLine}*Payment:* ${methodLabel}\n\n${itemsToShare.map(i => `${i.name} x${i.quantity} - ₹${i.quantity * i.price}`).join('\n')}\n\n*${t('total')}: ₹${totalToShare}*\n\n${t('whatsappThankYou')}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    };

    return (
        <div className="flex flex-col gap-6 pb-4">
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-4 left-4 right-4 z-[100] bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
                    >
                        <AlertTriangle size={20} className="shrink-0" />
                        <p className="text-xs font-black uppercase tracking-tight leading-tight">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* VOICE INPUT SECTION */}
            <div className="relative">
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={toggleListening}
                        className={cn(
                            "w-full h-16 rounded-2xl shadow-sm flex items-center justify-between px-6 transition-all active:scale-98",
                            isListening ? "bg-red-500 shadow-red-200 shadow-lg" : "bg-orange-600 shadow-orange-200"
                        )}
                    >
                        <div className="flex items-center gap-3 text-white">
                            <div className={cn("p-2 bg-white/20 rounded-xl", isListening && "animate-pulse")}>
                                <Mic size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-wider leading-none mb-1">
                                    {isListening ? "Recording... (Tap to Stop)" : t('voiceInput')}
                                </p>
                                <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">
                                    {isListening ? "Say all items clearly" : "Speak multiple items at once"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                             <Volume2 size={16} className="text-white" />
                        </div>
                    </button>
                    
                    {!(window as any).webkitSpeechRecognition && (
                         <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-xl border border-yellow-100">
                             <AlertTriangle size={12} className="text-yellow-600" />
                             <p className="text-[9px] font-black text-yellow-700 uppercase">{t('voiceNotAvailable')}</p>
                         </div>
                    )}
                </div>
                
                <AnimatePresence>
                    {(transcript || isParsing) && (
                         <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="mt-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-lg flex flex-col gap-4"
                         >
                             <div className="relative">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Transcript</p>
                                 <div className="p-3 bg-gray-50 rounded-xl min-h-[60px] max-h-[120px] overflow-y-auto no-scrollbar">
                                     {isParsing ? (
                                        <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase">
                                            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" />
                                            Preparing Bill...
                                        </div>
                                     ) : (
                                        <p className="text-[11px] font-bold text-gray-700 leading-relaxed italic">"{transcript || "..."}"</p>
                                     )}
                                 </div>
                             </div>

                             {!isParsing && transcript && !isListening && (
                                <button 
                                    onClick={() => handleVoiceParse(transcript)}
                                    className="w-full bg-orange-100 text-orange-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={14} /> {t('prepareBill')}
                                </button>
                             )}
                         </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MANUAL ADD SECTION */}
            <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                    <Edit3 size={12} className="text-gray-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('manualAdd')}</h4>
                </div>
                <form onSubmit={handleManualAdd} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <input 
                                list="billing-products"
                                placeholder={t('productName')}
                                className="bg-gray-50 border-none p-4 rounded-2xl font-bold text-xs outline-orange-500 w-full"
                                value={manualProductName}
                                onChange={e => setManualProductName(e.target.value)}
                            />
                            <datalist id="billing-products">
                                {products?.filter(p => p.stock > 0).map(p => (
                                    <option key={p.id} value={p.name}>
                                        Stock: {p.stock}
                                    </option>
                                ))}
                            </datalist>
                        </div>
                        <div className="flex gap-2">
                             <input 
                                type="number" 
                                required
                                min="1"
                                placeholder="Qty"
                                className="bg-gray-50 border-none p-4 rounded-2xl font-bold text-xs outline-orange-500 w-full"
                                value={manualQty}
                                onChange={e => setManualQty(Number(e.target.value))}
                             />
                             <button 
                                type="submit"
                                disabled={!manualProductName.trim()}
                                className="bg-orange-600 text-white p-4 rounded-2xl shadow-xl shadow-orange-100 disabled:bg-gray-200 transition-colors active:scale-95 flex items-center justify-center min-w-[56px]"
                             >
                                <Plus size={20} />
                             </button>
                        </div>
                    </div>
                </form>
            </section>

            {/* QUICK SELECT GRID */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">அடிக்கடி விற்பவை (Quick Buy)</h4>
                    <div className="relative">
                        <Search size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder={t('search')}
                            className="bg-orange-50 pl-8 pr-3 py-1 rounded-full text-[10px] font-black text-orange-600 uppercase border-none outline-none w-32 focus:w-48 transition-all"
                            value={productSearchQuery}
                            onChange={e => setProductSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {products?.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                        .slice(0, 9)
                        .map(p => (
                            <QuickProduct 
                                key={p.id} 
                                product={p} 
                                onClick={() => handleAddItem(p)} 
                            />
                        ))}
                    {products && products.length === 0 && (
                        <div className="col-span-3 py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2">
                             <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Inventory is Empty</p>
                        </div>
                    )}
                </div>
            </section>

            {/* BILL ITEMS LIST */}
            <div className="flex flex-col gap-3 mt-4 pb-80">
                <div className="flex items-center justify-between px-2 border-b border-gray-100 pb-3 mb-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-l-4 border-orange-600 pl-3">பட்டியல் (Bill Draft)</h3>
                    <p className="text-xs font-black text-gray-400">{billItems.length} Items</p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <AnimatePresence mode="popLayout">
                        {billItems.map(item => (
                            <BillItemRow 
                                key={item.uId}
                                item={item} 
                                onUpdate={(u) => updateItem(item.uId, u)}
                                onRemove={() => removeItem(item.uId)}
                            />
                        ))}
                    </AnimatePresence>

                    {billItems.length === 0 && (
                        <div className="py-16 flex flex-col items-center justify-center gap-4 bg-white/50 border-2 border-dashed border-gray-100 rounded-[3rem]">
                            <ShoppingCart size={48} className="text-gray-100" />
                            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Bill is Empty</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FIXED BOTTOM ACTION BAR */}
            {billItems.length > 0 && (
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-28 left-4 right-4 z-40 flex flex-col gap-3"
                >
                    {/* Payment Selector */}
                    <div className="bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] shadow-xl border border-white flex gap-2">
                         {[
                            { id: 'cash', label: t('cash'), icon: Wallet },
                            { id: 'upi', label: t('upi'), icon: Smartphone },
                            { id: 'credit', label: t('credit'), icon: User },
                         ].map(m => (
                             <button
                                 key={m.id}
                                 onClick={() => setPaymentMethod(m.id as any)}
                                 className={cn("flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all", 
                                     paymentMethod === m.id ? "bg-orange-600 text-white shadow-lg" : "bg-gray-50 text-gray-400")}
                             >
                                 <m.icon size={14} />
                                 <span className="text-[8px] font-black uppercase tracking-tighter">{m.label}</span>
                             </button>
                         ))}
                    </div>

                    {paymentMethod === 'credit' && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-3 rounded-2xl shadow-xl border border-orange-100 relative">
                             <input 
                                list="customer-names"
                                placeholder={t('customerName')}
                                className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl text-xs font-black outline-orange-500"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                             />
                             <datalist id="customer-names">
                                 {recentCustomers?.map(name => <option key={name} value={name} />)}
                             </datalist>
                             <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                  <User size={14} className="text-orange-300" />
                             </div>
                        </motion.div>
                    )}

                    <button 
                        onClick={handleFinishBill}
                        disabled={paymentMethod === 'credit' && !customerName.trim()}
                        className={cn("w-full h-20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-between px-8 group active:scale-95 transition-all overflow-hidden relative disabled:opacity-50 disabled:grayscale",
                            paymentMethod === 'credit' ? "bg-orange-600 text-white" : "bg-gray-900 text-white")}
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative z-10 text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Total Pay</p>
                            <h3 className="text-2xl font-black">{formatCurrency(totalAmount)}</h3>
                        </div>
                        <div className="relative z-10 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2">
                           {t('generateBill')} <CheckCircle2 size={18} />
                        </div>
                    </button>
                </motion.div>
            )}

            {/* INVOICE MODAL */}
            <AnimatePresence>
                {isInvoiceOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-sm rounded-[3rem] p-10 flex flex-col shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-orange-600" />
                            <button onClick={() => setIsInvoiceOpen(false)} className="absolute right-6 top-6 p-2 bg-gray-100 rounded-full"><X size={16} /></button>
                            
                            <header className="text-center mb-8">
                                <h2 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">{t('appName')}</h2>
                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Invoice • {new Date().toLocaleDateString()}</p>
                            </header>

                            <div className="flex flex-col gap-4 flex-1 max-h-[40vh] overflow-y-auto mb-8 pr-2">
                                {(finalInvoice?.items || []).map((item, idx) => (
                                    <div key={`${item.productId}-${idx}`} className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-black text-gray-800 uppercase">{item.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-black text-gray-900">{formatCurrency(item.quantity * item.price)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t-2 border-dashed border-gray-100 pt-6 mb-8">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Subtotal</p>
                                    <p className="font-bold text-gray-900">{formatCurrency(finalInvoice?.total || 0)}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-black text-gray-900 uppercase">Grand Total</h3>
                                    <h3 className="text-2xl font-black text-orange-600">{formatCurrency(finalInvoice?.total || 0)}</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={shareOnWhatsApp}
                                    className="bg-green-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    <WhatsApp size={16} /> WhatsApp
                                </button>
                                <button className="bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95 transition-all">
                                    <Printer size={16} /> Print
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Billing;
