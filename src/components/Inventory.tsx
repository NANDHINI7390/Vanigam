import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Edit3, Package, Calendar, Tag, Trash2, CheckCircle2 } from 'lucide-react';
import { db, type Product } from '../db';
import { useLanguage } from '../LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const ProductCard = ({ product, onEdit }: { key?: any, product: Product, onEdit: () => void }) => {
    const { t } = useLanguage();
    const isLow = product.stock <= 5;
    const isOutOfStock = product.stock === 0;

    return (
        <motion.div 
            layout
            className={cn("bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center justify-between group active:bg-gray-50 transition-colors", 
                isOutOfStock && "opacity-60 bg-gray-50")}
        >
            <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl transition-colors", 
                    isOutOfStock ? "bg-gray-200 text-gray-500" :
                    isLow ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500")}>
                    <Package size={18} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-tight leading-none">{product.name}</h3>
                        {isOutOfStock && (
                            <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-tighter shadow-sm">
                                {t('stockNotAvailable')}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-lg border", 
                                isOutOfStock ? "bg-gray-100 text-gray-400 border-gray-200" :
                                isLow ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-50 text-gray-400 border-gray-100")}>
                                Stock: {product.stock} {product.unit}
                            </span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                Cost: ₹{product.purchasePrice.toFixed(1)}
                            </span>
                        </div>
                        {product.expiryDate && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar size={10} className="text-orange-400" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Exp: {product.expiryDate}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-right flex items-center gap-3">
                <div>
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Selling</p>
                   <p className="text-sm font-black text-orange-600 leading-none">{formatCurrency(product.sellingPrice)}</p>
                </div>
                <button onClick={onEdit} className="p-2 text-gray-300 hover:text-orange-500 transition-colors"><Edit3 size={16} /></button>
            </div>
        </motion.div>
    );
};

const EditPriceModal = ({ product, onClose }: { product: Product, onClose: () => void }) => {
    const { t } = useLanguage();
    const [price, setPrice] = useState(product.sellingPrice);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    
    const handleSave = async () => {
        await db.products.update(product.id!, { sellingPrice: price });
        onClose();
    };

    const handleDelete = async () => {
        await db.products.delete(product.id!);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
                {!isConfirmingDelete ? (
                    <motion.div 
                        key="edit"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex flex-col gap-6"
                    >
                        <header className="flex justify-between items-center pb-2 border-b border-gray-50">
                            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 leading-none">{product.name}</h2>
                            <button onClick={() => setIsConfirmingDelete(true)} className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                <Trash2 size={14} /> {t('delete')}
                            </button>
                        </header>
                        
                        <p className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest -mb-2">Set New Selling Price</p>
                        
                        <div className="space-y-6">
                            <div className="bg-orange-50 p-8 rounded-[2.5rem] flex flex-col items-center gap-2 border border-orange-100 shadow-inner">
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Selling Price (₹)</p>
                                <input 
                                    type="number" 
                                    autoFocus
                                    className="w-full bg-transparent text-center text-5xl font-black text-orange-600 outline-none border-none p-0 appearance-none" 
                                    value={price} 
                                    onChange={e => setPrice(Number(e.target.value))} 
                                />
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">{t('todayProfit')}: {formatCurrency(price - product.purchasePrice)}</p>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={onClose} className="flex-1 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-gray-600 transition-colors">Cancel</button>
                                <button onClick={handleSave} className="flex-[2] bg-gray-900 text-white rounded-[1.5rem] py-5 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                                    <CheckCircle2 size={16} /> {t('save')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="confirm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="text-center py-4"
                    >
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Delete Product?</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 leading-relaxed px-4">
                            Are you sure you want to delete <span className="text-red-500">{product.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex flex-col gap-2">
                             <button onClick={handleDelete} className="w-full bg-red-600 text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100">
                                Yes, Delete Product
                             </button>
                             <button onClick={() => setIsConfirmingDelete(false)} className="w-full py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                Nevermind, Go Back
                             </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        </div>
    );
};

const Inventory: React.FC = () => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const products = useLiveQuery(() => 
        db.products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = 
                filter === 'all' ? true :
                filter === 'low' ? (p.stock > 0 && p.stock <= 5) :
                filter === 'out' ? (p.stock === 0) : true;
            return matchesSearch && matchesFilter;
        }).toArray(),
        [search, filter]
    );

    return (
        <div className="flex flex-col gap-6 pb-12">
            <header>
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{t('inventory')}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Manage Your Selling Prices</p>
            </header>

            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                        type="text"
                        placeholder="Search your items..."
                        className="w-full bg-white px-10 py-3.5 rounded-2xl shadow-sm border border-gray-100 font-bold text-sm outline-orange-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {(['all', 'low', 'out'] as const).map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                filter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-400 border-gray-100")}
                        >
                            {t(f === 'low' ? 'lowStock' : f === 'out' ? 'outOfStock' : 'all')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2.5">
                <AnimatePresence mode="popLayout">
                    {products?.map(p => (
                        <ProductCard 
                            key={p.id} 
                            product={p} 
                            onEdit={() => setEditingProduct(p)} 
                        />
                    ))}
                </AnimatePresence>
                {products?.length === 0 && (
                     <div className="py-20 text-center bg-gray-50 border-2 border-dashed border-gray-100 rounded-[3rem]">
                        <Package size={24} className="text-gray-100 mx-auto mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest px-8">Your products appear here after you enter a <span className="text-orange-600">Purchase</span></p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {editingProduct && <EditPriceModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default Inventory;
