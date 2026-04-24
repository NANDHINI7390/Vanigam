import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ta' | 'en';

interface Translations {
  [key: string]: {
    ta: string;
    en: string;
  };
}

export const translations: Translations = {
  appName: { ta: 'உசேன் மளிகை', en: 'Hussain Maligai' },
  home: { ta: 'முகப்பு', en: 'Home' },
  dashboard: { ta: 'புள்ளிவிவரம்', en: 'Reports' },
  inventory: { ta: 'பொருட்கள்', en: 'Products' },
  billing: { ta: 'விற்பனை', en: 'Billing' },
  purchases: { ta: 'கொள்முதல்', en: 'Purchase' },
  bills: { ta: 'பில்கள்', en: 'Bills' },
  todaySales: { ta: 'இன்றைய விற்பனை', en: "Today's Sales" },
  todayProfit: { ta: 'இன்றைய லாபம்', en: "Today's Profit" },
  lowStock: { ta: 'குறைவான இருப்பு', en: 'Low Stock' },
  newBill: { ta: 'புதிய பில்', en: 'New Bill' },
  addStock: { ta: 'கொள்முதல் சேர்', en: 'Add Purchase' },
  save: { ta: 'சேமி', en: 'Save' },
  edit: { ta: 'திருத்து', en: 'Edit' },
  delete: { ta: 'நீக்கு', en: 'Delete' },
  search: { ta: 'தேடு', en: 'Search' },
  productName: { ta: 'பொருள் பெயர்', en: 'Item Name' },
  quantity: { ta: 'அளவு', en: 'Qty' },
  price: { ta: 'விலை', en: 'Price' },
  unit: { ta: 'அலகு', en: 'Unit' },
  sellingPrice: { ta: 'விற்பனை விலை', en: 'Sale Price' },
  purchasePrice: { ta: 'வாங்கிய விலை', en: 'Cost Price' },
  total: { ta: 'மொத்தம்', en: 'Total' },
  voiceInput: { ta: 'பேசிப் போடு', en: 'Speak Bill' },
  whatsappShare: { ta: 'WhatsApp பகிரு', en: 'WhatsApp' },
  history: { ta: 'வரலாறு', en: 'History' },
  amountPaid: { ta: 'செலுத்தப்பட்டது', en: 'Paid' },
  totalPaid: { ta: 'வாங்கிய விலை (மொத்தம்)', en: 'Total Paid' },
  remaining: { ta: 'மீதி', en: 'Balance' },
  attachBill: { ta: 'பில் புகைப்படம்', en: 'Bill Image' },
  markPaid: { ta: 'செலுத்தியதாகக் குறி', en: 'Mark as Paid' },
  pending: { ta: 'நிலுவை', en: 'Pending' },
  paid: { ta: 'செலுத்தப்பட்டது', en: 'Paid' },
  supplierName: { ta: 'சப்ளையர் பெயர்', en: 'Supplier Name' },
  voiceNotAvailable: { ta: 'பேச்சு வசதி இல்லை - கையால் சேர்க்கவும்', en: 'Voice not available - add manually' },
  billDetails: { ta: 'விற்பனை விவரம்', en: 'Bill Details' },
  purchaseDetails: { ta: 'கொள்முதல் விவரம்', en: 'Purchase Details' },
  items: { ta: 'பொருட்கள்', en: 'Items' },
  date: { ta: 'தேதி', en: 'Date' },
  close: { ta: 'மூடு', en: 'Close' },
  stockAlert: { ta: 'இருப்பு எச்சரிக்கை', en: 'Stock Alert' },
  quickSummary: { ta: 'சுருக்கம்', en: 'Quick Summary' },
  cashSale: { ta: 'விற்பனை', en: 'Cash Sale' },
  qualityGroceries: { ta: 'தரமான மளிகை மற்றும் காய்கறிகள்', en: 'Quality Groceries & Fresh Veg' },
  vanigam: { ta: 'வணிகம்', en: 'Business' },
  stockExceeded: { ta: '{stock} {unit} மட்டுமே உள்ளது', en: 'Only {stock} {unit} available' },
  outOfStock: { ta: 'இந்த பொருள் தற்போது கையிருப்பில் இல்லை. தயவுசெய்து புதிய இருப்பை முதலில் வாங்கவும்.', en: 'This product is currently out of stock. Please purchase new stock first.' },
  stockNotAvailable: { ta: 'இருப்பு இல்லை', en: 'Stock Not Available' },
  productNotFound: { ta: 'இந்த பொருள் பட்டியலில் இல்லை', en: 'Item not in inventory' },
  whatsappWelcome: { ta: 'வணக்கம்! உசேன் மளிகையிலிருந்து உங்கள் பில் விவரம் இதோ:', en: 'Hello! Here is your bill from Hussain Maligai:' },
  whatsappThankYou: { ta: 'எங்களிடம் வாங்கியதற்கு நன்றி! மீண்டும் வருக!', en: 'Thank you for shopping with us! Visit again!' },
  generateBill: { ta: 'பில் போடு', en: 'Finish Bill' },
  analyticsReport: { ta: 'புள்ளிவிவர அறிக்கை', en: 'Analytics Report' },
  totalIssuedBills: { ta: 'வழங்கப்பட்ட மொத்த பில்கள்', en: 'Total Issued Bills' },
  avgValue: { ta: 'சராசரி மதிப்பு', en: 'Avg Value' },
  cashActivity: { ta: 'பண நடவடிக்கை', en: 'Cash Activity' },
  daysFlow: { ta: 'நாட்கள் ஓட்டம்', en: 'Days Flow' },
  inboundRevenue: { ta: 'உள்வரும் வருவாய்', en: 'Inbound Revenue' },
  outboundExpenses: { ta: 'வெளியே செல்லும் செலவுகள்', en: 'Outbound Expenses' },
  recentActivity: { ta: 'சமீபத்திய நடவடிக்கைகள்', en: 'Recent Activity' },
  noSalesHistory: { ta: 'விற்பனை வரலாறு இல்லை', en: 'No sales history' },
  autoCreatesInventory: { ta: 'சரக்கு தானாகவே உருவாகும்', en: 'Auto-creates Inventory' },
  calculatedCost: { ta: 'கணக்கிடப்பட்ட அடக்க விலை', en: 'Calculated Cost' },
  per: { ta: 'ஒன்றுக்கு', en: 'per' },
  expiry: { ta: 'காலாவதி', en: 'Expiry' },
  noRecords: { ta: 'பதிவுகள் இல்லை', en: 'No records yet' },
  prepareBill: { ta: 'பில் தயார் செய்', en: 'Prepare Bill' },
  manualAdd: { ta: 'நேரடியாக சேர்', en: 'Manual Add' },
  selectProduct: { ta: 'பொருளைத் தேர்ந்தெடுக்கவும்', en: 'Select Product' },
  cash: { ta: 'பணம்', en: 'Cash' },
  upi: { ta: 'UPI / போன்பே', en: 'UPI' },
  credit: { ta: 'கடனட்டை / உத்தார்', en: 'Credit' },
  customerName: { ta: 'வாடிக்கையாளர் பெயர்', en: 'Customer Name' },
  ledger: { ta: 'கடன் கணக்கு', en: 'Ledger' },
  customerAccounts: { ta: 'வாடிக்கையாளர் கணக்குகள்', en: 'Customer Accounts' },
  pendingAmount: { ta: 'பாக்கி தொகை', en: 'Pending Amount' },
  customersWithPending: { ta: 'பாக்கி வைத்துள்ளவர்கள்', en: 'Customers with Pending' },
  paymentSuccess: { ta: 'பணம் செலுத்தப்பட்டது', en: 'Payment Success' },
  payRemaining: { ta: 'இன்னும் தொகை செலுத்துக', en: 'Pay Balance' },
  signature: { ta: 'கையெழுத்து', en: 'Signature' },
  pleaseSignBelow: { ta: 'கீழே கையெழுத்திடவும்', en: 'Please sign below' },
  all: { ta: 'அனைத்தும்', en: 'All' },
  paymentAcknowledge: { ta: 'பணம் செலுத்தியதற்கான அங்கீகாரம்', en: 'Payment Acknowledgment' },
  paymentHistory: { ta: 'பணம் செலுத்திய வரலாறு', en: 'Payment History' },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'ta';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key: string) => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
