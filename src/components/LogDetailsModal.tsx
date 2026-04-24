import React from 'react';
import { X, Calendar, ShoppingBag, User, Smartphone, Printer, Package, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { type Sale, type Purchase } from '../db';
import { format } from 'date-fns';

interface LogDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale?: Sale;
    purchase?: Purchase;
}

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ isOpen, onClose, sale, purchase }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-6">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                className="bg-white w-full max-w-sm rounded-[3rem] p-8 flex flex-col shadow-2xl relative overflow-hidden"
            >
                <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-gray-100 rounded-full text-gray-400">
                    <X size={16} />
                </button>

                <header className="mb-4">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                        {sale ? t('billDetails') : t('purchaseDetails')}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        <Calendar size={12} />
                        {format(sale?.date || purchase?.date || new Date(), 'dd MMM yyyy, p')}
                    </div>
                </header>

                {sale && (
                    <div className="flex gap-2 mb-4">
                        <div className={cn("px-3 py-1.5 rounded-xl flex items-center gap-2", 
                            sale.paymentMethod === 'credit' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                            {sale.paymentMethod === 'upi' ? <Smartphone size={12} /> : sale.paymentMethod === 'credit' ? <User size={12} /> : <Wallet size={12} />}
                            <span className="text-[9px] font-black uppercase tracking-widest">{sale.paymentMethod}</span>
                        </div>
                        {sale.customerName && (
                            <div className="bg-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-2 text-gray-600">
                                <User size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[80px]">{sale.customerName}</span>
                            </div>
                        )}
                        {!sale.isPaid && (
                           <div className="bg-red-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 font-black text-[9px] uppercase tracking-widest">
                               PENDING
                           </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-4 flex-1 max-h-[50vh] overflow-y-auto mb-6 pr-2">
                    {sale && sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                            <div>
                                <p className="text-xs font-black text-gray-800 uppercase leading-none mb-1">{item.name}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">{t('quantity')}: {item.quantity}</p>
                            </div>
                            <p className="font-black text-xs text-gray-900">{formatCurrency(item.quantity * item.price)}</p>
                        </div>
                    ))}

                    {purchase && (
                        <div className="flex flex-col gap-4">
                             <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-3">
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 bg-white rounded-xl text-orange-600 shadow-sm"><Package size={16} /></div>
                                     <div>
                                         <p className="text-[9px] font-black text-gray-400 uppercase">{t('productName')}</p>
                                         <p className="text-xs font-black text-gray-900 uppercase">{purchase.productName}</p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><User size={16} /></div>
                                     <div>
                                         <p className="text-[9px] font-black text-gray-400 uppercase">{t('supplierName')}</p>
                                         <p className="text-xs font-black text-gray-900 uppercase">{purchase.supplier || 'N/A'}</p>
                                     </div>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-green-50/50 p-3 rounded-2xl border border-green-100">
                                     <p className="text-[8px] font-black text-green-600 uppercase mb-1">{t('amountPaid')}</p>
                                     <p className="font-black text-sm text-green-700">{formatCurrency(purchase.amountPaid)}</p>
                                 </div>
                                 <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100">
                                     <p className="text-[8px] font-black text-red-600 uppercase mb-1">{t('pending')}</p>
                                     <p className="font-black text-sm text-red-700">{formatCurrency(purchase.remainingAmount)}</p>
                                 </div>
                             </div>

                             {purchase.payments && purchase.payments.length > 0 && (
                                 <div className="mt-2">
                                     <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 px-1">{t('paymentHistory')}</h4>
                                     <div className="flex flex-col gap-3">
                                         {purchase.payments.map((pmt, idx) => (
                                             <div key={idx} className="bg-white border border-gray-100 p-3 rounded-2xl flex flex-col gap-3 shadow-sm">
                                                 <div className="flex justify-between items-center">
                                                     <div>
                                                         <p className="text-[9px] font-black text-gray-900 leading-none mb-1">{format(pmt.date, 'dd MMM, p')}</p>
                                                         <p className="text-[11px] font-black text-green-600 leading-none">{formatCurrency(pmt.amount)}</p>
                                                     </div>
                                                 </div>
                                                 {pmt.signature && (
                                                     <div className="border-t border-gray-50 pt-2 flex flex-col gap-1.5">
                                                         <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest">{t('signature')}</p>
                                                         <div className="bg-gray-50 rounded-xl p-2 flex items-center justify-center">
                                                             <img src={pmt.signature} alt="Signature" className="h-12 object-contain opacity-80" referrerPolicy="no-referrer" />
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-gray-100 mt-auto">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('total')}</p>
                        <h3 className="text-2xl font-black text-gray-900 leading-none">
                            {formatCurrency(sale?.totalAmount || purchase?.totalAmount || 0)}
                        </h3>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                    >
                        {t('close')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
