const isLocalDevHost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';
const APP_VERSION = '2026-06-26-offline-barcode-1';
const APP_UPDATE_CHECK_INTERVAL_MS = isLocalDevHost ? 12000 : 45000;
const APP_UPDATE_WATCH_FILES = [
  './index.html',
  './script.js',
  './styles.css',
  './service-worker.js',
];

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (isLocalDevHost) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(
            cacheKeys
              .filter((key) => key.startsWith('purela-pharmacy'))
              .map((key) => caches.delete(key))
          );
        }
        console.log('Service workers disabled for local development');
      } catch (err) {
        console.log('Failed to disable service worker locally:', err);
      }
      return;
    }

    if (window.location.hostname.includes('stackblitz')) return;

    navigator.serviceWorker
      .register('./service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registered:', registration.scope);
        registration.update();
        setInterval(() => registration.update(), APP_UPDATE_CHECK_INTERVAL_MS);
      })
      .catch((err) => console.log('ServiceWorker registration failed:', err));
  });
}
window.addEventListener('error', (e) => {
  try {
    const msg = (e && e.message) || '';
    const file = (e && e.filename) || '';
    const line = (e && e.lineno) || 0;
    const col = (e && e.colno) || 0;
    const lowerMsg = (msg || '').toString().toLowerCase();
    const isAbort =
      lowerMsg.includes('abort') ||
      lowerMsg.includes('err_aborted') ||
      lowerMsg.includes('err_network_changed') ||
      lowerMsg.includes('network_changed') ||
      lowerMsg.includes('err_network_io_suspended') ||
      lowerMsg.includes('network_io_suspended') ||
      lowerMsg.includes('err_failed') ||
      lowerMsg.includes('failed to fetch');
    const isLiveReload =
      lowerMsg.includes('livereload') ||
      (file || '').toString().toLowerCase().includes('livereload');
    if (isAbort || isLiveReload) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      return;
    }
    console.error('[GlobalError]', msg, file, line, col);
    const err = e && e.error;
    if (err && err.stack) console.error(err.stack);
  } catch (_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  try {
    const msg = ((e && e.reason && (e.reason.message || '')) || '')
      .toString()
      .toLowerCase();
    const isAbort =
      msg.includes('abort') ||
      msg.includes('err_aborted') ||
      msg.includes('err_network_changed') ||
      msg.includes('network_changed') ||
      msg.includes('err_network_io_suspended') ||
      msg.includes('network_io_suspended') ||
      msg.includes('livereload') ||
      msg.includes('err_failed') ||
      msg.includes('failed to fetch');
    if (isAbort) {
      e.preventDefault();
      return;
    }
  } catch (_) {}
});
if (navigator.serviceWorker && !isLocalDevHost) {
  let serviceWorkerReloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (serviceWorkerReloading) return;
    serviceWorkerReloading = true;
    location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e && e.data;
    if (d && d.type === 'SW_ACTIVATED') {
      try {
        location.reload();
      } catch (_) {}
    }
  });
}

let isOnline = navigator.onLine;

const supabaseUrl = 'https://xzqmhzxfqozupxotbvzl.supabase.co';
const supabaseKey = 'sb_publishable_Je1YaN5txkis5tCHnG0anQ_8U90_unL';
const legacySupabaseUrl = 'https://uckxllzltwhyxskwlmwg.supabase.co';
const legacySupabaseKey = 'sb_publishable_NReYt-eRV45wnVWgTCO3PA_5H-RKgnh';
const lsUrl = (() => {
  try {
    return localStorage.getItem('supabaseUrl');
  } catch (_) {
    return null;
  }
})();
const lsKey = (() => {
  try {
    return localStorage.getItem('supabaseKey');
  } catch (_) {
    return null;
  }
})();
const winUrl = typeof window !== 'undefined' ? window.__SUPABASE_URL__ : null;
const winKey = typeof window !== 'undefined' ? window.__SUPABASE_ANON__ : null;
const qsOffline = (() => {
  try {
    return new URLSearchParams(location.search).has('offline');
  } catch (_) {
    return false;
  }
})();
let supabaseClient = null,
  supabaseIsStub = false;
let effUrl =
  winUrl || (lsUrl && lsUrl !== legacySupabaseUrl ? lsUrl : null) || supabaseUrl;
let effKey =
  winKey || (lsKey && lsKey !== legacySupabaseKey ? lsKey : null) || supabaseKey;
if (!qsOffline && effUrl && effKey) {
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(effUrl, effKey);
    }
  } catch (_) {}
}
if (!supabaseClient) {
  isOnline = false;
  const offlineResult = () => ({
    data: null,
    error: { message: 'offline' },
  });
  const makeOfflineQuery = () => {
    const query = {
      select: () => query,
      insert: () => query,
      update: () => query,
      delete: () => query,
      range: () => query,
      order: () => query,
      limit: () => query,
      is: () => query,
      not: () => query,
      eq: () => query,
      single: async () => offlineResult(),
      then: (resolve, reject) =>
        Promise.resolve(offlineResult()).then(resolve, reject),
      catch: (reject) => Promise.resolve(offlineResult()).catch(reject),
    };
    return query;
  };
  supabaseClient = {
    from: () => makeOfflineQuery(),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      signInWithPassword: async () => ({ error: { message: 'offline' } }),
      signOut: async () => ({}),
      refreshSession: async () => ({}),
      updateUser: async () => ({ error: { message: 'offline' } }),
      setSession: async () => ({ error: { message: 'offline' } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
  };
  supabaseClient.auth.admin = {
    createUser: async () => ({ error: { message: 'offline' } }),
  };
  supabaseIsStub = true;
}

// Global variables
let products = [],
  cart = [],
  sales = [],
  deletedSales = [],
  users = [],
  currentUser = null;
const PRODUCTS_PAGE_SIZE = 100;
let productsOffset = 0;
let productsHasMore = true;
let isLoadingProducts = false;
let currentPage = 'pos',
  syncQueue = [];
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3,
  RETRY_DELAY = 5000;
let isProcessingSyncQueue = false;
const REMOTE_READ_TIMEOUT_MS = 3500;
const REMOTE_WRITE_TIMEOUT_MS = 5000;
const CONNECTION_CHECK_TIMEOUT_MS = 2500;

// New global variables for extended features
let expenses = [],
  purchases = [],
  stockAlerts = [],
  profitData = [],
  categories = [],
  finishedProductReports = [],
  customerRequests = [],
  treatmentRecords = [];
let productSearchSeq = 0;
let lastProductsFetchAt = 0;
let lastSalesFetchAt = 0;
const FETCH_TTL_MS = 60000;
let expenseCategories = [
  'Rent',
  'Utilities',
  'Salaries',
  'Supplies',
  'Marketing',
  'Maintenance',
  'Other',
];
let appRealtimeChannel = null;
// Removed pagination view mode to keep inventory consistent

const STORE_BRANDING = {
  name: 'PURELA PHARMACY',
  address: '1 BAKOLE STREET ALATISHE IBEJU LEKKI',
  phone: '+2347073524486',
};

// Settings - Changed from const to let to allow reassignment
let settings = {
  storeName: STORE_BRANDING.name,
  storeAddress: STORE_BRANDING.address,
  storePhone: STORE_BRANDING.phone,
  lowStockThreshold: 10,
  expiryWarningDays: 90,
  shiftDefinitions: {
    morning: { start: '07:00', end: '15:00' },
    afternoon: { start: '15:00', end: '23:00' },
    overnight: { start: '23:00', end: '07:00' },
  },
};

function applyStoreBranding() {
  settings.storeName = STORE_BRANDING.name;
  settings.storeAddress = STORE_BRANDING.address;
  settings.storePhone = STORE_BRANDING.phone;
}

const CUSTOMER_DISPLAY_CHANNEL = 'purela_customer_display_channel';
const PERSISTENT_DB_NAME = 'purela_pharmacy_persistent_cache';
const PERSISTENT_DB_VERSION = 1;
const PERSISTENT_STORE_NAME = 'app_state';
const PERSISTENT_STATE_KEY = 'primary';
const SUPABASE_CACHE_PROJECT_KEY = 'pagerrysmart_supabase_cache_project';
let isReportsLoading = false;
let lastOverallTotals = {
  total: 0,
  transactions: 0,
  items: 0,
  cash: 0,
  pos: 0,
};
let lastDailyTotals = { total: 0, transactions: 0, items: 0, cash: 0, pos: 0 };
const DEFAULT_CATEGORIES = [
  {
    name: 'Pain & Fever Medicines',
    type: 'Drug',
    description: 'For pain, headache, body pain, fever',
  },
  {
    name: 'Antibiotics',
    type: 'Drug',
    description: 'For bacterial infections',
  },
  {
    name: 'Malaria Medicines',
    type: 'Drug',
    description: 'For treatment and prevention of malaria',
  },
  {
    name: 'Cough, Cold & Flu Medicines',
    type: 'Drug',
    description: 'For cough, catarrh, flu, sore throat',
  },
  {
    name: 'Allergy Medicines',
    type: 'Drug',
    description: 'For itching, sneezing, rashes, allergies',
  },
  {
    name: 'Stomach & Ulcer Medicines',
    type: 'Drug',
    description: 'For ulcer, heartburn, stomach pain, indigestion',
  },
  {
    name: 'Diarrhea & Vomiting Medicines',
    type: 'Drug',
    description: 'For running stomach and vomiting',
  },
  { name: 'Blood Pressure & Heart Medicines', type: 'Drug' },
  { name: 'Diabetes Medicines', type: 'Drug', description: 'For high blood sugar' },
  {
    name: 'Asthma & Breathing Medicines',
    type: 'Drug',
    description: 'For asthma and breathing problems',
  },
  {
    name: 'Vitamins & Supplements',
    type: 'Drug',
    description: 'Vitamins, blood tonics, iron, calcium',
  },
  {
    name: 'Skin Medicines',
    type: 'Drug',
    description: 'Creams and ointments for skin infections, rashes, acne',
  },
  {
    name: 'Eye, Ear & Nose Medicines',
    type: 'Drug',
    description: 'Eye drops, ear drops, nasal sprays',
  },
  {
    name: "Family Planning & Women's Health Medicines",
    type: 'Drug',
    description: 'Contraceptives and pregnancy supplements',
  },
  {
    name: "Men's Health Medicines",
    type: 'Drug',
    description: 'Fertility and sexual health medicines',
  },
  {
    name: 'Mental Health & Sleep Medicines',
    type: 'Drug',
    description: 'For anxiety, depression, sleep problems',
  },
  {
    name: 'Seizure & Nerve Medicines',
    type: 'Drug',
    description: 'For epilepsy and nerve pain',
  },
  {
    name: 'Injection Medicines',
    type: 'Drug',
    description: 'Injectable drugs used in hospitals and pharmacies',
  },
  {
    name: 'Herbal Medicines',
    type: 'Drug',
    description: 'Herbal and natural remedies',
  },
  {
    name: 'Emergency & First Aid Medicines',
    type: 'Drug',
    description: 'Antiseptics, wound care, emergency drugs',
  },
  { name: 'Cosmetics', type: 'Non-Drug' },
  { name: 'Drinks', type: 'Non-Drug' },
  { name: 'Provisions', type: 'Non-Drug' },
  { name: 'Household Items', type: 'Non-Drug' },
  { name: 'Foodstuffs', type: 'Non-Drug' },
];

// Local storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'pagerrysmart_products',
  SALES: 'pagerrysmart_sales',
  DELETED_SALES: 'pagerrysmart_deleted_sales',
  USERS: 'pagerrysmart_users',
  SETTINGS: 'pagerrysmart_settings',
  CURRENT_USER: 'pagerrysmart_current_user',
  EXPENSES: 'pagerrysmart_expenses',
  PURCHASES: 'pagerrysmart_purchases',
  STOCK_ALERTS: 'pagerrysmart_stock_alerts',
  PROFIT_DATA: 'pagerrysmart_profit_data',
  CATEGORIES: 'pagerrysmart_categories',
  FINISHED_PRODUCT_REPORTS: 'pagerrysmart_finished_product_reports',
  CUSTOMER_REQUESTS: 'pagerrysmart_customer_requests',
  TREATMENT_RECORDS: 'pagerrysmart_treatment_records',
  CUSTOMER_DISPLAY_STATE: 'pagerrysmart_customer_display_state',
};
function runMigrations(prev) {
  const move = (from, to) => {
    try {
      const v = localStorage.getItem(from);
      if (v && !localStorage.getItem(to)) {
        localStorage.setItem(to, v);
      }
      localStorage.removeItem(from);
    } catch (_) {}
  };
  move('pgm_products', STORAGE_KEYS.PRODUCTS);
  move('pgm_sales', STORAGE_KEYS.SALES);
  move('pgm_expenses', STORAGE_KEYS.EXPENSES);
  move('pgm_purchases', STORAGE_KEYS.PURCHASES);
}
function ensureAppVersion() {
  const k = 'pagerrysmart_app_version';
  const prev = localStorage.getItem(k) || '';
  if (prev !== APP_VERSION) {
    runMigrations(prev);
    localStorage.setItem(k, APP_VERSION);
  }
}
ensureAppVersion();

// DOM elements
const loginPage = document.getElementById('login-page');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const navLinks = document.querySelectorAll('.nav-link');
const pageContents = document.querySelectorAll('.page-content');
const pageTitle = document.getElementById('page-title');
const currentUserEl = document.getElementById('current-user');
const userRoleEl = document.getElementById('user-role');
const userShiftEl = document.getElementById('user-shift');
const logoutBtn = document.getElementById('logout-btn');
const productsGrid = document.getElementById('products-grid');
const cartItems = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const paymentMethodSelect = document.getElementById('payment-method');
const customerNameInput = document.getElementById('sale-customer-name');
const customerPhoneInput = document.getElementById('sale-customer-phone');
const saleDiscountInput = document.getElementById('sale-discount');
const openCustomerViewBtn = document.getElementById('open-customer-view-btn');
const closeCustomerViewBtn = document.getElementById('close-customer-view-btn');
const inventoryTableBody = document.getElementById('inventory-table-body');
let inventoryRenderSeq = 0;
let inventoryCategoryFilter = null;
let inventorySearchTerm = '';
const salesTableBody = document.getElementById('sales-table-body');
const deletedSalesTableBody = document.getElementById(
  'deleted-sales-table-body'
);
const dailySalesTableBody = document.getElementById('daily-sales-table-body');
const reportProductSalesBody = document.getElementById(
  'report-product-sales-body'
);
const reportCategorySalesBody = document.getElementById(
  'report-category-sales-body'
);
const productModal = document.getElementById('product-modal');
const receiptModal = document.getElementById('receipt-modal');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const POS_BARCODE_MIN_LENGTH = 4;
const POS_FOCUS_RECOVERY_DELAY_MS = 120;
let currentProductSalesRows = [];
let currentCategorySalesRows = [];
let currentShiftTimer = null;
let customerDisplayWindow = null;
let customerDisplayLastSale = null;
let customerDisplayChannel = null;
let appFileSignatures = {};
let appUpdateCheckInProgress = false;
let appUpdateReloadPending = false;
let liveRefreshTimer = null;
const liveRefreshReasons = new Set();
let liveRefreshShouldNotify = false;
try {
  if ('BroadcastChannel' in window) {
    customerDisplayChannel = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL);
  }
} catch (_) {}

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] || char;
  });
}

function simpleHash(text) {
  let hash = 0;
  const source = String(text || '');
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return `${source.length}:${hash}`;
}

function isOfflineLikeError(error) {
  const msg = (error && (error.message || error.statusText || '')).toString().toLowerCase();
  return (
    (error && error.name === 'AbortError') ||
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('request timeout') ||
    msg.includes('timeout') ||
    msg.includes('err_internet_disconnected') ||
    msg.includes('err_network_changed') ||
    msg.includes('err_network_io_suspended') ||
    msg.includes('err_failed') ||
    msg.includes('service unavailable')
  );
}

function setOfflineMode(message = 'Offline') {
  isOnline = false;
  const offlineIndicator = document.getElementById('offline-indicator');
  if (offlineIndicator) offlineIndicator.classList.add('show');
  updateConnectionStatus('offline', message);
}

function setOnlineMode(message = 'Connected') {
  isOnline = true;
  const offlineIndicator = document.getElementById('offline-indicator');
  if (offlineIndicator) offlineIndicator.classList.remove('show');
  updateConnectionStatus('online', message);
}

async function withTimeout(promise, timeoutMs, label = 'Request') {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runRemote(promise, label = 'Request', timeoutMs = REMOTE_READ_TIMEOUT_MS) {
  try {
    const result = await withTimeout(promise, timeoutMs, label);
    if (result && result.error && isOfflineLikeError(result.error)) {
      setOfflineMode('Offline cache');
    }
    return result;
  } catch (error) {
    if (isOfflineLikeError(error)) {
      setOfflineMode('Offline cache');
    }
    throw error;
  }
}

async function readAppFileSignature(file) {
  if (!navigator.onLine) throw new Error('offline');
  const response = await fetch(`${file}${file.includes('?') ? '&' : '?'}vcheck=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Could not check ${file}`);
  return simpleHash(await response.text());
}

async function checkForAppFileUpdates() {
  if (appUpdateCheckInProgress || appUpdateReloadPending) return;
  if (!navigator.onLine) return;
  appUpdateCheckInProgress = true;
  try {
    for (const file of APP_UPDATE_WATCH_FILES) {
      const signature = await readAppFileSignature(file);
      if (!appFileSignatures[file]) {
        appFileSignatures[file] = signature;
        continue;
      }
      if (appFileSignatures[file] !== signature) {
        appUpdateReloadPending = true;
        showNotification('App updated. Reloading latest version...', 'info');
        setTimeout(() => location.reload(), 900);
        return;
      }
    }
  } catch (error) {
    console.warn('App update check failed:', error);
  } finally {
    appUpdateCheckInProgress = false;
  }
}

function startAppUpdateWatcher() {
  checkForAppFileUpdates();
  setInterval(checkForAppFileUpdates, APP_UPDATE_CHECK_INTERVAL_MS);
}

function isCustomerViewOpen() {
  return !!(customerDisplayWindow && !customerDisplayWindow.closed);
}

function updateCustomerViewButtons() {
  const isOpen = isCustomerViewOpen();
  if (openCustomerViewBtn) {
    openCustomerViewBtn.innerHTML = isOpen
      ? '<i class="fas fa-display"></i> Focus Customer View'
      : '<i class="fas fa-desktop"></i> Customer View';
  }
  if (closeCustomerViewBtn) {
    closeCustomerViewBtn.style.display = isOpen ? 'inline-flex' : 'none';
  }
}

function buildCustomerDisplaySale(sale) {
  if (!sale || typeof sale !== 'object') return null;
  return {
    receiptNumber: sale.receiptNumber || sale.receiptnumber || '',
    totalAmount: Number(sale.total) || 0,
    paymentMethod: sale.paymentMethod || sale.paymentmethod || 'cash',
    createdAt: sale.created_at || sale.createdAt || new Date().toISOString(),
  };
}

function buildCustomerDisplayState() {
  const cartItemsState = Array.isArray(cart)
    ? cart.map((item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return {
          id: item.id,
          name: item.name,
          price,
          quantity,
          lineTotal: price * quantity,
        };
      })
    : [];
  const itemCount = cartItemsState.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const totalAmount = cartItemsState.reduce(
    (sum, item) => sum + (Number(item.lineTotal) || 0),
    0
  );
  const discount = Math.min(
    Math.max(Number(saleDiscountInput && saleDiscountInput.value) || 0, 0),
    totalAmount
  );

  return {
    storeName: (settings && settings.storeName) || 'PURELA PHARMACY',
    storeAddress: (settings && settings.storeAddress) || '',
    cashierName: (currentUser && currentUser.name) || 'Cashier',
    paymentMethod:
      (paymentMethodSelect && paymentMethodSelect.value) || 'cash',
    cartItems: cartItemsState,
    itemCount,
    totalAmount: totalAmount - discount,
    subtotalAmount: totalAmount,
    discountAmount: discount,
    updatedAt: new Date().toISOString(),
    lastSale: cartItemsState.length > 0 ? null : customerDisplayLastSale,
  };
}

function syncCustomerDisplayState() {
  const state = buildCustomerDisplayState();
  try {
    localStorage.setItem(
      STORAGE_KEYS.CUSTOMER_DISPLAY_STATE,
      JSON.stringify(state)
    );
  } catch (_) {}
  try {
    if (customerDisplayChannel) {
      customerDisplayChannel.postMessage(state);
    }
  } catch (_) {}
  updateCustomerViewButtons();
}

function closeCustomerView() {
  try {
    if (customerDisplayWindow && !customerDisplayWindow.closed) {
      customerDisplayWindow.close();
    }
  } catch (_) {}
  customerDisplayWindow = null;
  updateCustomerViewButtons();
}

function isStandaloneAppMode() {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true
    );
  } catch (_) {
    return false;
  }
}

async function getCustomerViewTargetScreen() {
  if (typeof window.getScreenDetails !== 'function') return null;
  try {
    const screenDetails = await window.getScreenDetails();
    const screens = Array.isArray((screenDetails && screenDetails.screens))
      ? screenDetails.screens
      : [];
    if (screens.length < 2) return null;
    return (
      screens.find((screen) => screen !== screenDetails.currentScreen) ||
      screens[1] ||
      null
    );
  } catch (_) {
    return null;
  }
}

async function openCustomerView() {
  const hadOpenWindow = isCustomerViewOpen();
  const targetScreen = await getCustomerViewTargetScreen();
  const left = Math.round(
    (targetScreen && targetScreen.availLeft != null ? targetScreen.availLeft : (targetScreen && targetScreen.left != null ? targetScreen.left : window.screenX + 40))
  );
  const top = Math.round(
    (targetScreen && targetScreen.availTop != null ? targetScreen.availTop : (targetScreen && targetScreen.top != null ? targetScreen.top : window.screenY + 40))
  );
  const width = Math.max(
    900,
    Math.round((targetScreen && targetScreen.availWidth != null ? targetScreen.availWidth : (targetScreen && targetScreen.width != null ? targetScreen.width : 1200)))
  );
  const height = Math.max(
    700,
    Math.round((targetScreen && targetScreen.availHeight != null ? targetScreen.availHeight : (targetScreen && targetScreen.height != null ? targetScreen.height : 900)))
  );
  const popupUrl = new URL(
    './customer-display.html',
    window.location.href
  ).toString();
  const standaloneMode = isStandaloneAppMode();
  const popupTarget = standaloneMode
    ? '_blank'
    : 'purela_customer_display_window';
  const features = [
    'popup=yes',
    'resizable=yes',
    'scrollbars=yes',
    'noopener=yes',
    'noreferrer=yes',
    `left=${left}`,
    `top=${top}`,
    `width=${width}`,
    `height=${height}`,
  ].join(',');
  const popup = window.open(
    popupUrl,
    popupTarget,
    features
  );

  if (!popup) {
    showNotification(
      'Allow popups to open the customer display on the second screen.',
      'warning'
    );
    return;
  }

  customerDisplayWindow = popup;

  try {
    popup.focus();
  } catch (_) {}

  try {
    if (targetScreen && typeof popup.moveTo === 'function') {
      popup.moveTo(left, top);
      if (typeof popup.resizeTo === 'function') {
        popup.resizeTo(width, height);
      }
    }
  } catch (_) {}

  syncCustomerDisplayState();

  if (targetScreen) {
    showNotification(
      hadOpenWindow
        ? 'Customer view refreshed on the second screen.'
        : 'Customer view opened on the second screen.',
      'success'
    );
  } else {
    showNotification(
      hadOpenWindow
        ? 'Customer view refreshed.'
        : standaloneMode
          ? 'Customer view opened in a separate window. Keep this window for the cashier.'
          : 'Customer view opened. Move it to the second screen if needed.',
      'info'
    );
  }
}

window.setInterval(updateCustomerViewButtons, 2000);
window.addEventListener('beforeunload', () => {
  try {
    if (customerDisplayChannel) customerDisplayChannel.close();
  } catch (_) {}
});

// Enhanced Stock Alert System
function checkAndGenerateAlerts() {
  const alerts = {
    expired: [],
    expiringSoon: [],
    lowStock: [],
    outOfStock: [],
  };
  const today = new Date();
  products.forEach((product) => {
    if (product.deleted) return;
    const expiryDate = new Date(product.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry < 0) {
      alerts.expired.push({
        id: product.id,
        name: product.name,
        expiryDate: product.expiryDate,
        daysExpired: Math.abs(daysUntilExpiry),
        severity: 'critical',
        message: `CRITICAL: ${product.name} expired ${Math.abs(
          daysUntilExpiry
        )} days ago`,
      });
    } else if (daysUntilExpiry <= settings.expiryWarningDays) {
      alerts.expiringSoon.push({
        id: product.id,
        name: product.name,
        expiryDate: product.expiryDate,
        daysUntilExpiry: daysUntilExpiry,
        severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
        message: `${daysUntilExpiry <= 7 ? 'URGENT' : 'WARNING'}: ${
          product.name
        } expires in ${daysUntilExpiry} days`,
      });
    }
    if (product.stock <= 0) {
      alerts.outOfStock.push({
        id: product.id,
        name: product.name,
        currentStock: product.stock,
        severity: 'critical',
        message: `CRITICAL: ${product.name} is out of stock`,
      });
    } else if (product.stock <= settings.lowStockThreshold) {
      alerts.lowStock.push({
        id: product.id,
        name: product.name,
        currentStock: product.stock,
        threshold: settings.lowStockThreshold,
        severity:
          product.stock <= settings.lowStockThreshold / 2 ? 'high' : 'medium',
        message: `${
          product.stock <= settings.lowStockThreshold / 2 ? 'URGENT' : 'WARNING'
        }: ${product.name} has only ${product.stock} items left (threshold: ${
          settings.lowStockThreshold
        })`,
      });
    }
  });
  const allAlerts = [
    ...alerts.expired,
    ...alerts.outOfStock,
    ...alerts.expiringSoon.filter((a) => a.severity === 'high'),
    ...alerts.lowStock.filter((a) => a.severity === 'high'),
    ...alerts.expiringSoon.filter((a) => a.severity === 'medium'),
    ...alerts.lowStock.filter((a) => a.severity === 'medium'),
  ];
  stockAlerts = allAlerts;
  saveToLocalStorage();
  const criticalAlerts = allAlerts.filter(
    (alert) => alert.severity === 'critical'
  );
  if (criticalAlerts.length > 0) {
    showNotification(
      `${criticalAlerts.length} critical stock alerts detected! Check Analytics page for details.`,
      'error'
    );
  }
  return { all: allAlerts, byType: alerts };
}

function readArrayFromLS(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : [];
  } catch (_) {
    return [];
  }
}

function openPersistentDb() {
  return new Promise((resolve) => {
    try {
      if (
        typeof window === 'undefined' ||
        !window.indexedDB ||
        typeof window.indexedDB.open !== 'function'
      ) {
        resolve(null);
        return;
      }
      const request = window.indexedDB.open(
        PERSISTENT_DB_NAME,
        PERSISTENT_DB_VERSION
      );
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PERSISTENT_STORE_NAME)) {
          db.createObjectStore(PERSISTENT_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

function buildAppStateSnapshot() {
  return {
    products,
    sales,
    deletedSales,
    users,
    currentUser,
    expenses,
    purchases,
    stockAlerts,
    profitData,
    categories,
    finishedProductReports,
    customerRequests,
    syncQueue,
    settings,
    savedAt: new Date().toISOString(),
    version: APP_VERSION,
  };
}

function hasPersistentData(state) {
  if (!state || typeof state !== 'object') return false;
  const arrays = [
    state.products,
    state.sales,
    state.deletedSales,
    state.users,
    state.expenses,
    state.purchases,
    state.stockAlerts,
    state.profitData,
    state.categories,
    state.finishedProductReports,
    state.customerRequests,
    state.syncQueue,
  ];
  return arrays.some((value) => Array.isArray(value) && value.length > 0);
}

function applyAppStateSnapshot(state) {
  if (!state || typeof state !== 'object') return;
  if (Array.isArray(state.products)) products = state.products;
  if (Array.isArray(state.sales)) sales = state.sales;
  if (Array.isArray(state.deletedSales)) deletedSales = state.deletedSales;
  if (Array.isArray(state.users)) users = state.users;
  if (Array.isArray(state.expenses)) expenses = state.expenses;
  if (Array.isArray(state.purchases)) purchases = state.purchases;
  if (Array.isArray(state.stockAlerts)) stockAlerts = state.stockAlerts;
  if (Array.isArray(state.profitData)) profitData = state.profitData;
  if (Array.isArray(state.categories)) categories = state.categories;
  if (Array.isArray(state.finishedProductReports)) {
    finishedProductReports = state.finishedProductReports;
  }
  if (Array.isArray(state.customerRequests)) {
    customerRequests = state.customerRequests;
  }
  if (Array.isArray(state.syncQueue)) syncQueue = state.syncQueue;
  if (state.currentUser && typeof state.currentUser === 'object') {
    currentUser = state.currentUser;
  }
  if (state.settings && typeof state.settings === 'object') {
    Object.assign(settings, state.settings);
  }
}

async function savePersistentBackup() {
  try {
    const db = await openPersistentDb();
    if (!db) return false;
    await new Promise((resolve) => {
      const tx = db.transaction(PERSISTENT_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PERSISTENT_STORE_NAME);
      store.put({
        id: PERSISTENT_STATE_KEY,
        payload: buildAppStateSnapshot(),
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    });
    try {
      db.close();
    } catch (_) {}
    return true;
  } catch (_) {
    return false;
  }
}

async function loadPersistentBackup() {
  try {
    const db = await openPersistentDb();
    if (!db) return null;
    const result = await new Promise((resolve) => {
      const tx = db.transaction(PERSISTENT_STORE_NAME, 'readonly');
      const store = tx.objectStore(PERSISTENT_STORE_NAME);
      const request = store.get(PERSISTENT_STATE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    });
    try {
      db.close();
    } catch (_) {}
    return result && result.payload ? result.payload : null;
  } catch (_) {
    return null;
  }
}

async function clearPersistentBackup() {
  try {
    const db = await openPersistentDb();
    if (!db) return false;
    await new Promise((resolve) => {
      const tx = db.transaction(PERSISTENT_STORE_NAME, 'readwrite');
      tx.objectStore(PERSISTENT_STORE_NAME).delete(PERSISTENT_STATE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    });
    try {
      db.close();
    } catch (_) {}
    return true;
  } catch (_) {
    return false;
  }
}

function clearCachedBusinessData() {
  [
    STORAGE_KEYS.PRODUCTS,
    STORAGE_KEYS.SALES,
    STORAGE_KEYS.DELETED_SALES,
    STORAGE_KEYS.USERS,
    STORAGE_KEYS.CURRENT_USER,
    STORAGE_KEYS.EXPENSES,
    STORAGE_KEYS.PURCHASES,
    STORAGE_KEYS.STOCK_ALERTS,
    STORAGE_KEYS.PROFIT_DATA,
    STORAGE_KEYS.CATEGORIES,
    STORAGE_KEYS.FINISHED_PRODUCT_REPORTS,
    STORAGE_KEYS.CUSTOMER_REQUESTS,
    STORAGE_KEYS.TREATMENT_RECORDS,
    STORAGE_KEYS.CUSTOMER_DISPLAY_STATE,
    'syncQueue',
  ].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  });
}

async function resetCachedBusinessDataForProject() {
  try {
    const cachedProject = localStorage.getItem(SUPABASE_CACHE_PROJECT_KEY);
    if (cachedProject !== supabaseUrl) {
      clearCachedBusinessData();
      await clearPersistentBackup();
      localStorage.setItem(SUPABASE_CACHE_PROJECT_KEY, supabaseUrl);
    }
  } catch (_) {}
}

async function restorePersistentStateIfNeeded(force = false) {
  const shouldRestore = force || !hasPersistentData(buildAppStateSnapshot());
  if (!shouldRestore) return false;
  const backup = await loadPersistentBackup();
  if (!hasPersistentData(backup)) return false;
  applyAppStateSnapshot(backup);
  saveToLocalStorage({ skipBackup: true });
  return true;
}

// Function to acknowledge an alert
function acknowledgeAlert(productId) {
  const acknowledgedAlerts = readArrayFromLS('acknowledgedAlerts');

  if (!acknowledgedAlerts.includes(productId)) {
    acknowledgedAlerts.push(productId);
    localStorage.setItem(
      'acknowledgedAlerts',
      JSON.stringify(acknowledgedAlerts)
    );
    showNotification('Alert acknowledged', 'success');

    // Refresh the alerts list
    loadStockAlerts();
  }
}

// Function to resolve a discrepancy
function resolveDiscrepancy(discrepancyId, type) {
  const resolvedDiscrepancies = readArrayFromLS('resolvedDiscrepancies');

  if (!resolvedDiscrepancies.includes(discrepancyId)) {
    resolvedDiscrepancies.push(discrepancyId);
    localStorage.setItem(
      'resolvedDiscrepancies',
      JSON.stringify(resolvedDiscrepancies)
    );
    showNotification('Discrepancy resolved', 'success');

    // Refresh the discrepancies list
    loadDiscrepancies();
  }
}

// Connection management
function checkSupabaseConnection() {
  if (!navigator.onLine || supabaseIsStub) {
    setOfflineMode('Offline');
    return;
  }

  updateConnectionStatus('checking', 'Checking connection...');

  runRemote(
    supabaseClient.from('products').select('id').limit(1),
    'Connection check',
    CONNECTION_CHECK_TIMEOUT_MS
  )
    .then(() => {
      setOnlineMode('Connected');
      connectionRetryCount = 0;
      if (syncQueue.length > 0) processSyncQueue();
    })
    .catch((error) => {
      const msg = (error && (error.message || '')).toString().toLowerCase();
      const isAbort =
        (error && error.name === 'AbortError') ||
        msg.includes('abort') ||
        msg.includes('err_aborted') ||
        msg.includes('err_network_changed') ||
        msg.includes('network_changed') ||
        msg.includes('err_network_io_suspended') ||
        msg.includes('network_io_suspended');
      if (isAbort) {
        setTimeout(checkSupabaseConnection, 2000);
        return;
      }
      setOfflineMode('Offline cache');

      if (
        error.code === '42P17' ||
        error.message.includes('infinite recursion')
      ) {
        showNotification(
          'Database policy issue detected. Some features may be limited.',
          'warning'
        );
        return;
      }

      if (connectionRetryCount < MAX_RETRY_ATTEMPTS) {
        connectionRetryCount++;
        setTimeout(checkSupabaseConnection, RETRY_DELAY);
      } else {
        showNotification(
          'Connection to database failed. Some features may be limited.',
          'warning'
        );
      }
    });
}

function updateConnectionStatus(status, message) {
  const statusEl = document.getElementById('connection-status');
  const textEl = document.getElementById('connection-text');

  if (statusEl && textEl) {
    statusEl.className = 'connection-status ' + status;
    textEl.textContent = message;
  }
}

// PWA Install Prompt
let deferredPrompt;
const installBtn = document.getElementById('install-btn');
const dbConfigBtn = document.getElementById('db-config-btn');
const dbConfigModal = document.getElementById('db-config-modal');
const dbConfigClose = document.getElementById('db-config-close');
const dbUrlInput = document.getElementById('db-url-input');
const dbKeyInput = document.getElementById('db-key-input');
const dbSaveBtn = document.getElementById('db-save-btn');
const dbTestBtn = document.getElementById('db-test-btn');
const dbConfigHint = document.getElementById('db-config-hint');

function openDbConfig() {
  if (dbUrlInput) dbUrlInput.value = effUrl || '';
  if (dbKeyInput) dbKeyInput.value = effKey || '';
  if (dbConfigModal) dbConfigModal.style.display = 'flex';
  if (dbConfigHint) dbConfigHint.style.display = 'none';
}
function closeDbConfig() {
  if (dbConfigModal) dbConfigModal.style.display = 'none';
}
async function testDbConnection(url, key) {
  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return false;
    const tmp = window.supabase.createClient(url, key);
    const { error } = await withTimeout(
      tmp.from('products').select('id').limit(1),
      CONNECTION_CHECK_TIMEOUT_MS,
      'Test database connection'
    );
    if (error && (String(error.message || '').toLowerCase().includes('api key') || String(error.code || '') === '401')) {
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}
function reinitSupabase(url, key) {
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(url, key);
      supabaseIsStub = false;
    }
  } catch (_) {}
}

window.addEventListener('beforeinstallprompt', (e) => {
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'flex';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.style.display = 'none';
      }
      deferredPrompt = null;
    } else {
      showNotification('Use browser menu to install this app', 'info');
    }
  });
}
if (dbConfigBtn) {
  dbConfigBtn.addEventListener('click', openDbConfig);
}
if (dbConfigClose) {
  dbConfigClose.addEventListener('click', closeDbConfig);
}
if (dbSaveBtn) {
  dbSaveBtn.addEventListener('click', async () => {
    const url = (dbUrlInput && dbUrlInput.value) || '';
    const key = (dbKeyInput && dbKeyInput.value) || '';
    try {
      localStorage.setItem('supabaseUrl', url);
      localStorage.setItem('supabaseKey', key);
    } catch (_) {}
    effUrl = url;
    effKey = key;
    const ok = await testDbConnection(url, key);
    if (!ok) {
      if (dbConfigHint) dbConfigHint.style.display = 'block';
      showNotification('Connection failed. Check URL/key.', 'error');
      return;
    }
    reinitSupabase(url, key);
    closeDbConfig();
    showNotification('Database settings saved', 'success');
    checkSupabaseConnection();
  });
}
if (dbTestBtn) {
  dbTestBtn.addEventListener('click', async () => {
    const url = (dbUrlInput && dbUrlInput.value) || '';
    const key = (dbKeyInput && dbKeyInput.value) || '';
    const ok = await testDbConnection(url, key);
    if (dbConfigHint) dbConfigHint.style.display = ok ? 'none' : 'block';
    showNotification(ok ? 'Connection OK' : 'Connection failed', ok ? 'success' : 'error');
  });
}

function recreateSupabaseClientFromStoredConfig() {
  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return false;
    }
    const storedUrl = localStorage.getItem('supabaseUrl');
    const storedKey = localStorage.getItem('supabaseKey');
    const url =
      (storedUrl && storedUrl !== legacySupabaseUrl ? storedUrl : null) ||
      effUrl ||
      supabaseUrl;
    const key =
      (storedKey && storedKey !== legacySupabaseKey ? storedKey : null) ||
      effKey ||
      supabaseKey;
    supabaseClient = window.supabase.createClient(url, key);
    supabaseIsStub = false;
    return true;
  } catch (error) {
    console.warn('Could not initialize Supabase client:', error);
    return false;
  }
}

window.addEventListener('supabase-js-ready', () => {
  if (recreateSupabaseClientFromStoredConfig()) {
    checkSupabaseConnection();
  }
});

window.addEventListener('supabase-js-failed', () => {
  setOfflineMode('Offline cache');
});

// Online/Offline Detection
window.addEventListener('online', () => {
  if (supabaseIsStub) recreateSupabaseClientFromStoredConfig();
  checkSupabaseConnection();
  setTimeout(() => {
    if (!isOnline || supabaseIsStub) return;
    showNotification('You are back online!', 'success');
    setupRealtimeListeners();
    try {
      if (syncQueue && syncQueue.length > 0) {
        processSyncQueue();
      }
    } catch (e) {
      console.error('Error triggering sync after online:', e);
    }
    scheduleLiveDataRefresh('all', { notify: false });
    refreshAllData();
  }, CONNECTION_CHECK_TIMEOUT_MS + 250);
});

window.addEventListener('offline', () => {
  setOfflineMode('Offline');
});

function getAuthDisplayName(user) {
  if (!user) return 'User';

  const metadataName = user.user_metadata && user.user_metadata.name;
  if (metadataName) return metadataName;

  if (typeof user.email === 'string' && user.email) {
    return user.email.split('@')[0];
  }

  return 'User';
}

function normalizeAppUser(user, authUser = null) {
  const profile = user && typeof user === 'object' ? user : {};
  const metadata = (authUser && authUser.user_metadata) || {};
  return {
    id: profile.id || (authUser && authUser.id) || '',
    name:
      profile.name ||
      metadata.name ||
      getAuthDisplayName(authUser) ||
      'User',
    email: profile.email || (authUser && authUser.email) || '',
    role: String(profile.role || metadata.role || 'cashier').toLowerCase(),
    created_at:
      profile.created_at || (authUser && authUser.created_at) || new Date().toISOString(),
    last_login: new Date().toISOString(),
  };
}

async function fetchUserProfile(authUser) {
  if (!authUser) return null;
  try {
    let { data, error } = await runRemote(
      supabaseClient.from('users').select('*').eq('id', authUser.id).single(),
      'Fetch user profile'
    );

    if (!error && data) return data;

    if (authUser.email) {
      const result = await runRemote(
        supabaseClient
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single(),
        'Fetch user profile by email'
      );
      if (!result.error && result.data) return result.data;
    }
  } catch (error) {
    console.warn('Could not fetch user profile:', error);
  }
  return null;
}

async function requireExplicitLogin() {
  if ((!navigator.onLine || supabaseIsStub || !isOnline) && currentUser) {
    setOfflineMode('Offline cache');
    return;
  }
  currentUser = null;
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } catch (_) {}
  try {
    if (supabaseClient && supabaseClient.auth) {
      await withTimeout(
        supabaseClient.auth.signOut(),
        CONNECTION_CHECK_TIMEOUT_MS,
        'Sign out'
      );
    }
  } catch (_) {}
}

// Authentication Module
const AuthModule = {
  async signUp(email, password, name, role = 'cashier') {
    try {
      const {
        data: { user },
      } = await withTimeout(
        supabaseClient.auth.getUser(),
        CONNECTION_CHECK_TIMEOUT_MS,
        'Get current user'
      );
      if (!user || !currentUser || currentUser.role !== 'admin') {
        showNotification('Only admins can create new users.', 'error');
        return { success: false };
      }

      const adminPassword = prompt(
        'Please confirm your admin password to continue:'
      );
      if (!adminPassword) return { success: false };

      const { error: signInError } = await withTimeout(
        supabaseClient.auth.signInWithPassword({
          email: currentUser.email,
          password: adminPassword,
        }),
        REMOTE_WRITE_TIMEOUT_MS,
        'Confirm admin password'
      );

      if (signInError) {
        showNotification('Incorrect admin password.', 'error');
        return { success: false };
      }

      const { data, error } = await withTimeout(
        supabaseClient.auth.admin.createUser({
          email,
          password,
          user_metadata: { name, role },
        }),
        REMOTE_WRITE_TIMEOUT_MS,
        'Create user'
      );

      if (error) throw error;

      try {
        await runRemote(
          supabaseClient.from('users').insert({
            id: data.user.id,
            name,
            email,
            role,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            created_by: user.id,
          }),
          'Save user profile',
          REMOTE_WRITE_TIMEOUT_MS
        );
      } catch (dbError) {
        console.warn('Could not save user to database:', dbError);
      }

      showNotification(
        `User "${name}" (${role}) created successfully!`,
        'success'
      );
      return { success: true };
    } catch (error) {
      console.warn('Signup error:', error);
      showNotification('Error creating user: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  async signIn(email, password) {
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    loginSubmitBtn.classList.add('loading');
    loginSubmitBtn.disabled = true;

    try {
      if (!navigator.onLine || supabaseIsStub) {
        throw new Error('No internet connection. Use a previously logged-in account offline.');
      }

      const { data, error } = await withTimeout(
        supabaseClient.auth.signInWithPassword({
          email,
          password,
        }),
        REMOTE_WRITE_TIMEOUT_MS,
        'Login'
      );
      if (error) throw error;

      const fallbackUser = normalizeAppUser(null, data.user);

      try {
        const userData = await fetchUserProfile(data.user);

        if (userData) {
          currentUser = normalizeAppUser(userData, data.user);
          try {
            await runRemote(
              supabaseClient
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('email', currentUser.email),
              'Update last login',
              REMOTE_WRITE_TIMEOUT_MS
            );
          } catch (updateError) {
            console.warn('Could not update last login:', updateError);
          }
        } else {
          currentUser = fallbackUser;
          try {
            const { data: newUser } = await runRemote(
              supabaseClient.from('users').insert(fallbackUser).select().single(),
              'Create local user profile',
              REMOTE_WRITE_TIMEOUT_MS
            );
            if (newUser) currentUser = newUser;
          } catch (insertError) {
            console.warn('Could not create user in database:', insertError);
          }
        }
      } catch (fetchError) {
        if (
          fetchError.message &&
          fetchError.message.includes('infinite recursion')
        ) {
          showNotification(
            'Database policy issue detected. Using limited functionality.',
            'warning'
          );
        }
        currentUser = fallbackUser;
      }

      localStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(currentUser)
      );
      showApp();
      showNotification('Login successful!', 'success');
      if (isOnline && syncQueue.length > 0) {
        setTimeout(() => {
          processSyncQueue();
        }, 2000);
      }
      return { success: true };
    } catch (error) {
      console.warn('Signin error:', error);
      showNotification(error.message || 'Login failed', 'error');
      return { success: false, error: error.message };
    } finally {
      loginSubmitBtn.classList.remove('loading');
      loginSubmitBtn.disabled = false;
    }
  },

  async signOut() {
    try {
      await withTimeout(
        supabaseClient.auth.signOut(),
        CONNECTION_CHECK_TIMEOUT_MS,
        'Sign out'
      );
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      currentUser = null;
      showLogin();
      showNotification('Logged out successfully', 'info');
    } catch (error) {
      console.warn('Signout error:', error);
      showNotification(error.message, 'error');
    }
  },

  isAdmin() {
    return currentUser && currentUser.role === 'admin';
  },

  onAuthStateChanged(callback) {
    withTimeout(
      supabaseClient.auth.getSession(),
      CONNECTION_CHECK_TIMEOUT_MS,
      'Get session'
    ).then(({ data: { session } }) => {
      if (session) {
        this.handleExistingSession(session, callback);
      } else {
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            this.handleExistingSession(session, callback);
          } else {
            currentUser = null;
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            callback(null);
          }
        });
        callback(null);
      }
    }).catch(() => {
      callback(currentUser || null);
    });
  },

  async handleExistingSession(session, callback) {
    const fallbackUser = {
      id: session.user.id,
      name: getAuthDisplayName(session && session.user),
      email: session.user.email,
      role: (session && session.user && session.user.user_metadata && session.user.user_metadata.role) || 'cashier',
      created_at: session.user.created_at,
      last_login: new Date().toISOString(),
    };

    try {
      const { data: userData, error } = await runRemote(
        supabaseClient.from('users').select('*').eq('id', session.user.id).single(),
        'Load existing session profile'
      );

      if (!error && userData) {
        currentUser = userData;
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_USER,
          JSON.stringify(currentUser)
        );
        callback(currentUser);
      } else {
        currentUser = fallbackUser;
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_USER,
          JSON.stringify(currentUser)
        );
        callback(currentUser);

        try {
          const { data: newUser } = await runRemote(
            supabaseClient.from('users').insert(fallbackUser).select().single(),
            'Create session profile',
            REMOTE_WRITE_TIMEOUT_MS
          );
          if (newUser) {
            currentUser = newUser;
            localStorage.setItem(
              STORAGE_KEYS.CURRENT_USER,
              JSON.stringify(currentUser)
            );
            callback(currentUser);
          }
        } catch (insertError) {
          console.warn('Could not create user in database:', insertError);
        }
      }
    } catch (fetchError) {
      if (
        fetchError.message &&
        fetchError.message.includes('infinite recursion')
      ) {
        showNotification(
          'Database policy issue detected. Using limited functionality.',
          'warning'
        );
      }
      currentUser = fallbackUser;
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(currentUser)
      );
      callback(currentUser);
    }
  },
};

// Data Module
const DataModule = {
  async fetchProducts(offset = 0, limit = PRODUCTS_PAGE_SIZE) {
    try {
      if (isOnline) {
        let query = supabaseClient
          .from('products')
          .select('id,name,category,price,stock,expirydate,barcode,deleted')
          .range(offset, offset + limit - 1);

        const { data, error } = await runRemote(query, 'Fetch products');

        if (error) {
          if (
            error.code === '42P17' ||
            error.message.includes('infinite recursion')
          ) {
            showNotification(
              'Database policy issue for products. Using local cache.',
              'warning'
            );
          } else if (
            error.code === '42501' ||
            error.message.includes('policy')
          ) {
            showNotification(
              'Permission denied for products. Using local cache.',
              'warning'
            );
          } else {
            throw error;
          }
        } else if (data) {
          const normalizedProducts = data.map((product) => {
            // IMPORTANT: Handle database column name (expirydate) to internal field (expiryDate)
            if (product.expirydate && !product.expiryDate) {
              product.expiryDate = product.expirydate;
            }
            return product;
          });
          const activeProducts = normalizedProducts.filter(
            (product) => !product.deleted
          );
          const localDeletedIds = new Set(
            products.filter((p) => p && p.deleted).map((p) => p.id)
          );
          const serverMap = new Map(activeProducts.map((p) => [p.id, p]));
          const merged = [];
          activeProducts.forEach((sp) => {
            const lp = products.find((p) => p.id === sp.id);
            if (lp && lp.deleted) {
              return;
            }
            merged.push(sp);
          });
          products.forEach((lp) => {
            if (!serverMap.has(lp.id) && !lp.deleted) {
              merged.push(lp);
            }
          });
          if (offset === 0) {
            products = merged;
          } else {
            const seen = new Set(products.map((p) => p.id));
            merged.forEach((p) => {
              if (!seen.has(p.id)) {
                products.push(p);
                seen.add(p.id);
              }
            });
          }
          dedupeProducts();
          productsHasMore = activeProducts.length === limit;
          productsOffset = offset + activeProducts.length;
          saveToLocalStorage();
          return products;
        }
      }
      return products;
    } catch (error) {
      console.warn('Error in fetchProducts:', error);
      if (error.code === '42501' || error.message.includes('policy')) {
        showNotification(
          'Permission denied for products. Using local cache.',
          'warning'
        );
      } else if (
        error.code === '42P17' ||
        error.message.includes('infinite recursion')
      ) {
        showNotification(
          'Database policy issue detected. Using local cache.',
          'warning'
        );
      } else if (isOfflineLikeError(error)) {
        setOfflineMode('Offline cache');
      } else {
        showNotification('Error fetching products: ' + error.message, 'error');
      }
      return products;
    }
  },

  async fetchAllProducts() {
    try {
      if (isOnline) {
        if (Date.now() - lastProductsFetchAt < FETCH_TTL_MS) {
          return products;
        }
        const acc = [];
        let offset = 0;
        const limit = PRODUCTS_PAGE_SIZE;
        while (true) {
          const { data, error } = await runRemote(
            supabaseClient
              .from('products')
              .select('id,name,category,price,stock,expirydate,barcode,deleted')
              .range(offset, offset + limit - 1),
            'Fetch all products'
          );
          if (error) throw error;
          const batch = (data || [])
            .map((p) => {
              if (p.expirydate && !p.expiryDate) p.expiryDate = p.expirydate;
              return p;
            })
            .filter((p) => !p.deleted);
          acc.push(...batch);
          if (!data || data.length < limit) break;
          offset += limit;
        }
        const localDeletedIds = new Set(
          products.filter((p) => p && p.deleted).map((p) => p.id)
        );
        const serverMap = new Map(acc.map((p) => [p.id, p]));
        const merged = [];
        acc.forEach((sp) => {
          const lp = products.find((p) => p.id === sp.id);
          if (lp && lp.deleted) return;
          merged.push(sp);
        });
        products.forEach((lp) => {
          if (!serverMap.has(lp.id) && !lp.deleted) merged.push(lp);
        });
        products = merged;
        dedupeProducts();
        productsHasMore = false;
        productsOffset = products.length;
        saveToLocalStorage();
        lastProductsFetchAt = Date.now();
        return products;
      }
      return products;
    } catch (error) {
      console.warn('Error in fetchAllProducts:', error);
      return products;
    }
  },

  async fetchCategories() {
    try {
      if (isOnline) {
        const { data, error } = await runRemote(
          supabaseClient
            .from('categories')
            .select('id,name,type')
            .order('name', { ascending: true }),
          'Fetch categories'
        );
        if (error) throw error;
        const server = Array.isArray(data) ? data : [];
        const serverIds = new Set(server.map((c) => c.id));
        const merged = [...server];
        (Array.isArray(categories) ? categories : []).forEach((c) => {
          if (!serverIds.has(c.id)) merged.push(c);
        });
        categories = merged;
        saveToLocalStorage();
        if (!categories || categories.length === 0) {
          await this.seedCategories();
          const { data: data2 } = await runRemote(
            supabaseClient
              .from('categories')
              .select('id,name,type')
              .order('name', { ascending: true }),
            'Reload categories'
          );
          categories = Array.isArray(data2) ? data2 : [];
          saveToLocalStorage();
        }
        return categories;
      }
      if (!categories || categories.length === 0) {
        categories = DEFAULT_CATEGORIES.map((c, i) => ({
          id: 'local_' + (i + 1),
          name: c.name,
          type: c.type,
        }));
        saveToLocalStorage();
      }
      return categories;
    } catch (error) {
      console.warn('Error in fetchCategories:', error);
      return categories;
    }
  },

  async seedCategories() {
    try {
      if (!isOnline) return false;
      const { data: existing } = await runRemote(
        supabaseClient.from('categories').select('name'),
        'Check categories'
      );
      const existingNames = new Set(
        (existing || []).map((c) =>
          (c.name || '').toString().trim().toLowerCase()
        )
      );
      const toInsert = DEFAULT_CATEGORIES.filter(
        (c) => !existingNames.has(c.name.toLowerCase())
      ).map((c) => ({ name: c.name, type: c.type }));
      if (toInsert.length > 0) {
        const { error } = await runRemote(
          supabaseClient.from('categories').insert(toInsert),
          'Seed categories',
          REMOTE_WRITE_TIMEOUT_MS
        );
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.warn('Error seeding categories:', error);
      return false;
    }
  },

  mergeProductData(serverProducts) {
    const serverProductsMap = {};
    serverProducts.forEach((product) => {
      serverProductsMap[product.id] = product;
    });

    const localProductsMap = {};
    products.forEach((product) => {
      localProductsMap[product.id] = product;
    });

    const mergedProducts = [];

    serverProducts.forEach((serverProduct) => {
      const localProduct = localProductsMap[serverProduct.id];

      if (localProduct) {
        const serverDate = new Date(
          serverProduct.updated_at || serverProduct.created_at || 0
        );
        const localDate = new Date(
          localProduct.updated_at || localProduct.created_at || 0
        );

        mergedProducts.push(
          localDate > serverDate ? localProduct : serverProduct
        );
      } else {
        mergedProducts.push(serverProduct);
      }
    });

    products.forEach((localProduct) => {
      if (!serverProductsMap[localProduct.id]) {
        mergedProducts.push(localProduct);
      }
    });

    return mergedProducts;
  },

  async fetchSales() {
    try {
      if (isOnline) {
        if (Date.now() - lastSalesFetchAt < FETCH_TTL_MS) {
          return sales;
        }
        const allSales = [];
        let offset = 0;
        const limit = PRODUCTS_PAGE_SIZE;
        let done = false;

        while (!done) {
          const fetchPromise = supabaseClient
            .from('sales')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
          let data, error;
          try {
            const result = await runRemote(fetchPromise, 'Fetch sales');
            data = result && result.data;
            error = result && result.error;
          } catch (e) {
            if (e && e.message === 'Request timeout') {
              showNotification(
                'Connection timeout. Using local cache.',
                'warning'
              );
              done = true;
              break;
            }
            throw e;
          }
          if (error) {
            if (
              error.code === '42P17' ||
              (error.message || '').includes('infinite recursion')
            ) {
              showNotification(
                'Database policy issue for sales. Using local cache.',
                'warning'
              );
            } else if (
              error.code === '42501' ||
              (error.message || '').includes('policy')
            ) {
              showNotification(
                'Permission denied for sales. Using local cache.',
                'warning'
              );
            } else {
              throw error;
            }
            done = true;
          } else if (data && Array.isArray(data)) {
            allSales.push(...data);
            if (data.length < limit) {
              done = true;
            } else {
              offset += limit;
            }
          } else {
            done = true;
          }
        }

        if (allSales.length) {
          const validatedSales = allSales
            .filter((s) => !s.deleted && !s.deleted_at && !s.deletedAt)
            .map((sale) => {
              if (!sale.receiptNumber && sale.receiptnumber) {
                sale.receiptNumber = sale.receiptnumber;
              } else if (!sale.receiptNumber && !sale.receiptnumber) {
                sale.receiptNumber = `UNKNOWN_${Date.now()}`;
              }

              if (!sale.items) sale.items = [];
              if (typeof sale.total !== 'number') {
                sale.total = parseFloat(sale.total) || 0;
              }
              if (!sale.created_at) {
                sale.created_at = new Date().toISOString();
              }
              return sale;
            });
          const localDeletedReceipts = new Set(
            [
              ...deletedSales.map(
                (s) => s && (s.receiptNumber || s.receiptnumber)
              ),
              ...sales
                .filter((s) => s && (s.deleted || s.deleted_at || s.deletedAt))
                .map((s) => s.receiptNumber),
            ].filter(Boolean)
          );
          const serverActive = validatedSales.filter(
            (s) => !localDeletedReceipts.has(s.receiptNumber)
          );
          const serverMap = new Map(
            serverActive.map((s) => [s.receiptNumber, s])
          );
          const mergedSales = [];
          sales.forEach((ls) => {
            if (!ls) return;
            const rn = ls.receiptNumber;
            if (ls.deleted || ls.deleted_at || ls.deletedAt) return;
            const srv = serverMap.get(rn);
            if (srv) {
              if (!srv.paymentmethod && ls.paymentMethod)
                srv.paymentmethod = ls.paymentMethod;
              if (!srv.paymentMethod && ls.paymentMethod)
                srv.paymentMethod = ls.paymentMethod;
              if (!Array.isArray(srv.items) || srv.items.length === 0)
                srv.items = Array.isArray(ls.items) ? ls.items : [];
              if (
                (typeof srv.total !== 'number' || isNaN(srv.total)) &&
                typeof ls.total === 'number'
              )
                srv.total = ls.total;
              if (!srv.created_at && ls.created_at)
                srv.created_at = ls.created_at;
            } else {
              mergedSales.push(ls);
            }
          });
          serverMap.forEach((v) => mergedSales.push(v));
          mergedSales.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
            return dateB - dateA;
          });
          sales = mergedSales;
          saveToLocalStorage();
          lastSalesFetchAt = Date.now();
          return sales;
        }
      }
      return sales;
    } catch (error) {
      if (error && error.message === 'Request timeout') {
        showNotification('Connection timeout. Using local cache.', 'warning');
      } else if (
        error &&
        (error.code === '42501' || (error.message || '').includes('policy'))
      ) {
        showNotification(
          'Permission denied for sales. Using local cache.',
          'warning'
        );
      } else if (
        error &&
        (error.code === '42P17' ||
          (error.message || '').includes('infinite recursion'))
      ) {
        showNotification(
          'Database policy issue detected. Using local cache.',
          'warning'
        );
      } else {
        console.warn('Error in fetchSales:', error);
        showNotification('Error fetching sales: ' + error.message, 'error');
      }
      return sales;
    }
  },

  mergeSalesData(serverSales) {
    const serverSalesMap = {};
    serverSales.forEach((sale) => {
      serverSalesMap[sale.receiptNumber] = sale;
    });

    const localSalesMap = {};
    sales.forEach((sale) => {
      if (sale && sale.receiptNumber) {
        localSalesMap[sale.receiptNumber] = sale;
      }
    });

    const mergedSales = [];

    serverSales.forEach((serverSale) => {
      const localSale = localSalesMap[serverSale.receiptNumber];

      if (localSale) {
        const serverDate = new Date(
          serverSale.updated_at || serverSale.created_at || 0
        );
        const localDate = new Date(
          localSale.updated_at || localSale.created_at || 0
        );

        mergedSales.push(localDate > serverDate ? localSale : serverSale);
      } else {
        mergedSales.push(serverSale);
      }
    });

    sales.forEach((localSale) => {
      if (
        localSale &&
        localSale.receiptNumber &&
        !serverSalesMap[localSale.receiptNumber]
      ) {
        mergedSales.push(localSale);
      }
    });

    mergedSales.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });

    return mergedSales;
  },

  async fetchDeletedSales() {
    try {
      if (isOnline) {
        const { data, error } = await runRemote(
          supabaseClient.from('deleted_sales').select('*'),
          'Fetch deleted sales'
        );
        if (error || !data || data.length === 0) {
          const { data: softDeleted, error: softError } = await runRemote(
            supabaseClient
              .from('sales')
              .select('*')
              .not('deleted_at', 'is', null),
            'Fetch soft-deleted sales'
          );
          if (!softError && softDeleted) {
            deletedSales = softDeleted;
            saveToLocalStorage();
            return deletedSales;
          } else {
            deletedSales = [];
            saveToLocalStorage();
            return deletedSales;
          }
        } else {
          deletedSales = data || [];
          saveToLocalStorage();
          return deletedSales;
        }
      }
      return deletedSales;
    } catch (error) {
      console.warn('Error fetching deleted sales:', error);
      return deletedSales;
    }
  },

  async fetchExpenses() {
    try {
      if (isOnline) {
        const { data, error } = await runRemote(
          supabaseClient
            .from('expenses')
            .select('*')
            .order('date', { ascending: false }),
          'Fetch expenses'
        );
        if (error) throw error;
        const server = Array.isArray(data) ? data : [];
        const serverKeys = new Set(server.map((e) => expenseKey(e)));
        const merged = [...server];
        (Array.isArray(expenses) ? expenses : []).forEach((le) => {
          if (!serverKeys.has(expenseKey(le))) merged.push(le);
        });
        expenses = dedupeListByKey(merged, expenseKey);
        saveToLocalStorage();
        return expenses;
      }
      return expenses;
    } catch (error) {
      console.warn('Error in fetchExpenses:', error);
      if (isOfflineLikeError(error)) {
        setOfflineMode('Offline cache');
      } else {
        showNotification('Error fetching expenses: ' + error.message, 'error');
      }
      return expenses;
    }
  },

  async saveExpense(expense) {
    try {
      // Ensure we have a valid user ID
      let userId = (currentUser && currentUser.id);

      // If no valid user ID, use a default UUID or skip the field
      if (!userId || userId === 'undefined') {
        console.warn('No valid user ID found, using default');
        userId = '00000000-0000-0000-0000-000000000000';
      }

      const expenseToSave = {
        date: expense.date,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        receipt: expense.receipt,
        notes: expense.notes,
        created_by: userId,
      };

      if (isOnline) {
        const { data, error } = await runRemote(
          supabaseClient.from('expenses').insert(expenseToSave).select(),
          'Save expense',
          REMOTE_WRITE_TIMEOUT_MS
        );

        if (error) throw error;

        if (data && data.length > 0) {
          expenses.unshift(data[0]);
          saveToLocalStorage();
          return { success: true, expense: data[0] };
        }
      } else {
        expenseToSave.id = 'temp_' + Date.now();
        expenses.unshift(expenseToSave);
        saveToLocalStorage();

        addToSyncQueue({
          type: 'saveExpense',
          data: expenseToSave,
        });

        return { success: true, expense: expenseToSave };
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      const localExpense = {
        date: expense.date,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        receipt: expense.receipt,
        notes: expense.notes,
        created_by:
          (currentUser && currentUser.id) ||
          '00000000-0000-0000-0000-000000000000',
        id: expense.id || 'temp_' + Date.now(),
      };
      expenses.unshift(localExpense);
      saveToLocalStorage();
      addToSyncQueue({
        type: 'saveExpense',
        data: localExpense,
      });
      showNotification(
        'Expense saved locally. It will sync when connection returns.',
        'warning'
      );
      return { success: true, expense: localExpense };
    }
  },

  async fetchPurchases() {
    try {
      if (isOnline) {
        const { data, error } = await runRemote(
          supabaseClient
            .from('purchases')
            .select('*')
            .order('date', { ascending: false }),
          'Fetch purchases'
        );
        if (error) throw error;
        const server = Array.isArray(data) ? data : [];
        const serverSignatures = new Set(
          server.map((p) => purchaseSignature(p))
        );
        const merged = [...server];
        (Array.isArray(purchases) ? purchases : []).forEach((lp) => {
          const sig = purchaseSignature(lp);
          if (!serverSignatures.has(sig)) merged.push(lp);
        });
        purchases = dedupeListByKey(merged.map(normalizePurchaseRecord), purchaseKey);
        saveToLocalStorage();
        return purchases;
      }
      return purchases;
    } catch (error) {
      console.warn('Error in fetchPurchases:', error);
      if (isOfflineLikeError(error)) {
        setOfflineMode('Offline cache');
      } else {
        showNotification('Error fetching purchases: ' + error.message, 'error');
      }
      return purchases;
    }
  },

  async savePurchase(purchase) {
    try {
      // Ensure we have a valid user ID
      let userId = (currentUser && currentUser.id);

      // If no valid user ID, use a default UUID or skip the field
      if (!userId || userId === 'undefined') {
        console.warn('No valid user ID found, using default');
        userId = '00000000-0000-0000-0000-000000000000';
      }

      const normalizedPurchase = normalizePurchaseRecord(purchase);
      const purchaseToSave = {
        date: purchase.date,
        supplier: purchase.supplier,
        description: purchase.description,
        quantity: normalizedPurchase.quantity,
        costprice: normalizedPurchase.costPrice,
        sellingprice: normalizedPurchase.sellingPrice,
        amount: normalizedPurchase.amount,
        invoice: purchase.invoice,
        notes: purchase.notes,
        created_by: userId,
      };

      if (isOnline) {
        const query =
          purchase.id && !String(purchase.id).startsWith('temp_')
            ? supabaseClient
                .from('purchases')
                .update(purchaseToSave)
                .eq('id', purchase.id)
                .select()
            : supabaseClient.from('purchases').insert(purchaseToSave).select();

        const { data, error } = await runRemote(
          query,
          'Save purchase',
          REMOTE_WRITE_TIMEOUT_MS
        );

        if (error) throw error;

        if (data && data.length > 0) {
          const savedPurchase = normalizePurchaseRecord({
            ...normalizedPurchase,
            ...data[0],
            productId: normalizedPurchase.productId,
            productName: normalizedPurchase.productName,
          });
          const existingIndex = purchases.findIndex((p) => p.id === savedPurchase.id);
          if (existingIndex >= 0) purchases[existingIndex] = savedPurchase;
          else purchases.unshift(savedPurchase);
          purchases = dedupeListByKey(purchases, purchaseKey);
          saveToLocalStorage();
          return { success: true, purchase: savedPurchase };
        }
        return { success: true, purchase: normalizedPurchase };
      } else {
        const localPurchase = {
          ...normalizedPurchase,
          id: normalizedPurchase.id || 'temp_' + Date.now(),
          created_by: userId,
        };
        const existingIndex = purchases.findIndex((p) => p.id === localPurchase.id);
        if (existingIndex >= 0) purchases[existingIndex] = localPurchase;
        else purchases.unshift(localPurchase);
        saveToLocalStorage();

        addToSyncQueue({
          type: 'savePurchase',
          data: localPurchase,
        });

        return { success: true, purchase: localPurchase };
      }
    } catch (error) {
      console.error('Error saving purchase:', error);
      const userId =
        (currentUser && currentUser.id) || '00000000-0000-0000-0000-000000000000';
      const localPurchase = {
        ...normalizePurchaseRecord(purchase),
        id: purchase.id || 'temp_' + Date.now(),
        created_by: userId,
      };
      const existingIndex = purchases.findIndex((p) => p.id === localPurchase.id);
      if (existingIndex >= 0) purchases[existingIndex] = localPurchase;
      else purchases.unshift(localPurchase);
      saveToLocalStorage();
      addToSyncQueue({
        type: 'savePurchase',
        data: localPurchase,
      });
      showNotification(
        'Purchase saved locally. It will sync when connection returns.',
        'warning'
      );
      return { success: true, purchase: localPurchase };
    }
  },

  calculateProfit(startDate, endDate) {
    const filteredSales = sales.filter((sale) => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    });

    const filteredExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate)
      );
    });

    const filteredPurchases = purchases.filter((purchase) => {
      const purchaseDate = new Date(purchase.date);
      return (
        purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate)
      );
    });

    const totalRevenue = filteredSales.reduce(
      (sum, sale) => sum + sale.total,
      0
    );
    const totalExpenses = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalPurchases = filteredPurchases.reduce(
      (sum, purchase) => sum + purchase.amount,
      0
    );

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      purchases: totalPurchases,
      profit: totalRevenue - (totalExpenses + totalPurchases),
      salesCount: filteredSales.length,
      expenseCount: filteredExpenses.length,
      purchaseCount: filteredPurchases.length,
    };
  },

  checkStockLevels() {
    const alerts = [];
    const today = new Date();

    products.forEach((product) => {
      if (product.deleted) return;

      // Check for low stock
      if (product.stock <= settings.lowStockThreshold) {
        alerts.push({
          id: product.id,
          type: 'low_stock',
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          threshold: settings.lowStockThreshold,
          message: `Low stock alert: ${product.name} has only ${product.stock} items left (threshold: ${settings.lowStockThreshold})`,
          created_at: today.toISOString(),
        });
      }

      // Check for expiry dates
      const expiryDate = new Date(product.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= settings.expiryWarningDays) {
        alerts.push({
          id: product.id + '_expiry',
          type: 'expiry_warning',
          productId: product.id,
          productName: product.name,
          expiryDate: product.expiryDate,
          daysUntilExpiry: daysUntilExpiry,
          message: `Expiry warning: ${product.name} expires in ${daysUntilExpiry} days`,
          created_at: today.toISOString(),
        });
      }
    });

    stockAlerts = alerts;
    saveToLocalStorage();
    return alerts;
  },

  detectDiscrepancies() {
    const discrepancies = [];

    // Check for sales with negative or zero totals
    sales.forEach((sale) => {
      if (sale.total <= 0) {
        discrepancies.push({
          id: sale.id + '_invalid_total',
          type: 'invalid_sale_total',
          saleId: sale.id,
          receiptNumber: sale.receiptNumber,
          message: `Sale with receipt #${sale.receiptNumber} has an invalid total: ${sale.total}`,
          created_at: new Date().toISOString(),
        });
      }

      // Check for sales with empty items
      if (!sale.items || sale.items.length === 0) {
        discrepancies.push({
          id: sale.id + '_empty_items',
          type: 'empty_sale_items',
          saleId: sale.id,
          receiptNumber: sale.receiptNumber,
          message: `Sale with receipt #${sale.receiptNumber} has no items`,
          created_at: new Date().toISOString(),
        });
      }
    });

    // Check for products with negative stock
    products.forEach((product) => {
      if (product.stock < 0) {
        discrepancies.push({
          id: product.id + '_negative_stock',
          type: 'negative_stock',
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          message: `Product ${product.name} has negative stock: ${product.stock}`,
          created_at: new Date().toISOString(),
        });
      }
    });

    return discrepancies;
  },

  async saveProduct(product) {
    const productModalLoading = document.getElementById(
      'product-modal-loading'
    );
    const saveProductBtn = document.getElementById('save-product-btn');

    if (productModalLoading) productModalLoading.style.display = 'flex';
    if (saveProductBtn) {
      saveProductBtn.disabled = true;
    }

    try {
      const missingRequiredFields =
        !String(product.name || '').trim() ||
        !String(product.category || '').trim() ||
        product.price === '' ||
        product.price === null ||
        product.price === undefined ||
        isNaN(product.price) ||
        product.stock === '' ||
        product.stock === null ||
        product.stock === undefined ||
        isNaN(product.stock) ||
        !String(product.expiryDate || '').trim();

      if (missingRequiredFields) {
        throw new Error('Please fill in all required fields');
      }

      if (isNaN(product.price) || product.price <= 0) {
        throw new Error('Please enter a valid price');
      }

      if (isNaN(product.stock) || product.stock < 0) {
        throw new Error('Please enter a valid stock quantity');
      }

      if (!isOnline) {
        if (!product.id) {
          product.id = 'temp_' + Date.now();
        }
        if (String(product.id).startsWith('temp_') && !product.clientTempId) {
          product.clientTempId = product.id;
        }
        const key = productKeyNCP(product);
        const existIdx = products.findIndex((p) => productKeyNCP(p) === key);
        if (existIdx >= 0) {
          products[existIdx] = { ...products[existIdx], ...product };
        } else {
          products.push(product);
        }
        dedupeProducts();
        saveToLocalStorage();
        addToSyncQueue({ type: 'saveProduct', data: product });
        return { success: true, product };
      }

      // IMPORTANT: Use the correct database column names (lowercase)
      const productToSave = {
        name: product.name,
        category: product.category,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        expirydate: product.expiryDate, // Database column: expirydate
        barcode: product.barcode || null,
        // categoryid removed to match DB schema
      };

      let result;

      if (product.id && !product.id.startsWith('temp_')) {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );
        const fetchPromise = supabaseClient
          .from('products')
          .update(productToSave)
          .eq('id', product.id)
          .select();
        const { data, error } = await Promise.race([fetchPromise, timeout]);

        if (error) throw error;
        result = { success: true, product: data[0] || product };
      } else {
        try {
          const timeoutExists = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          );
          const existsPromise = findMatchingServerProduct(productToSave);
          const exists = await Promise.race([existsPromise, timeoutExists]);
          if (exists && exists.id) {
            product.id = exists.id;
            result = { success: true, product: exists };
          } else {
            const timeoutInsert = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), 5000)
            );
            const insertPromise = supabaseClient
              .from('products')
              .insert(productToSave)
              .select();
            const { data, error } = await Promise.race([
              insertPromise,
              timeoutInsert,
            ]);
            if (error) throw error;
            if (data && data.length > 0) {
              product.id = data[0].id;
              result = { success: true, product: data[0] };
            } else {
              result = { success: true, product };
            }
          }
        } catch (e) {
          const timeoutInsert2 = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          );
          const insertPromise2 = supabaseClient
            .from('products')
            .insert(productToSave)
            .select();
          const { data, error } = await Promise.race([
            insertPromise2,
            timeoutInsert2,
          ]);
          if (error) throw error;
          if (data && data.length > 0) {
            product.id = data[0].id;
            result = { success: true, product: data[0] };
          } else {
            result = { success: true, product };
          }
        }
      }

      if (product.id && !product.id.startsWith('temp_')) {
        const index = products.findIndex((p) => p.id === product.id);
        if (index >= 0) products[index] = product;
        else {
          const key = productKeyNCP(product);
          const existIdx = products.findIndex((p) => productKeyNCP(p) === key);
          if (existIdx >= 0) products[existIdx] = product;
          else products.push(product);
        }
      } else {
        const key = productKeyNCP(product);
        const existIdx = products.findIndex((p) => productKeyNCP(p) === key);
        if (existIdx >= 0)
          products[existIdx] = { ...products[existIdx], ...product };
        else products.push(product);
      }

      dedupeProducts();
      saveToLocalStorage();
      return result;
    } catch (error) {
      console.error('Error saving product:', error);
      // Always fall back to local save and queue sync on any error
      if (!String(product.id || '').startsWith('temp_')) {
        product.id = product.id || 'temp_' + Date.now();
      }
      if (String(product.id).startsWith('temp_') && !product.clientTempId) {
        product.clientTempId = product.id;
      }
      const key = productKeyNCP(product);
      const existIdx = products.findIndex((p) => productKeyNCP(p) === key);
      if (existIdx >= 0)
        products[existIdx] = { ...products[existIdx], ...product };
      else products.push(product);
      saveToLocalStorage();
      addToSyncQueue({ type: 'saveProduct', data: product });
      showNotification(
        'Saved locally. Will sync when connection/policy allows.',
        'warning'
      );
      return { success: true, product };
    } finally {
      if (productModalLoading) productModalLoading.style.display = 'none';
      if (saveProductBtn) {
        saveProductBtn.disabled = false;
      }
    }
  },

  async deleteProduct(productId) {
    try {
      const index = products.findIndex((p) => p.id === productId);
      if (index >= 0) {
        products[index].deleted = true;
        products[index].deletedAt = new Date().toISOString();
        saveToLocalStorage();
      }

      if (isOnline) {
        try {
          let targetId = productId;
          const local = products.find((p) => p.id === productId);
          if (String(productId).startsWith('temp_') && local) {
            const matchedProduct = await findMatchingServerProduct(local);
            if (matchedProduct && matchedProduct.id) {
              targetId = matchedProduct.id;
            }
          }
          const { error: deleteError } = await runRemote(
            supabaseClient.from('products').delete().eq('id', targetId),
            'Delete product',
            REMOTE_WRITE_TIMEOUT_MS
          );
          if (deleteError) {
            const { error: updateError } = await runRemote(
              supabaseClient
                .from('products')
                .update({ deleted: true })
                .eq('id', targetId),
              'Mark product deleted',
              REMOTE_WRITE_TIMEOUT_MS
            );
            if (updateError) throw updateError;
          }
          products = products.filter(
            (p) => p.id !== productId && p.id !== targetId
          );
          saveToLocalStorage();
          return { success: true };
        } catch (dbError) {
          console.error('Database delete failed:', dbError);
          showNotification(
            'Failed to delete from database. Marked as deleted locally.',
            'warning'
          );
          const p = products.find((x) => x.id === productId) || {};
          let targetId = productId;
          if (
            String(productId).startsWith('temp_') &&
            p &&
            p.name &&
            p.category
          ) {
            try {
              const matchedProduct = await findMatchingServerProduct(p);
              if (matchedProduct && matchedProduct.id) {
                targetId = matchedProduct.id;
              }
            } catch (_) {}
          }
          addToSyncQueue({
            type: 'deleteProduct',
            id: targetId,
            data: {
              name: p.name,
              category: p.category,
              price: p.price,
            },
          });
          return { success: true };
        }
      } else {
        const p = products.find((x) => x.id === productId) || {};
        addToSyncQueue({
          type: 'deleteProduct',
          id: productId,
          data: {
            name: p.name,
            category: p.category,
            price: p.price,
          },
        });
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Error deleting product', 'error');
      return { success: false, error };
    }
  },

  async saveSale(sale) {
    try {
      const existingSale = sales.find(
        (s) => s.receiptNumber === sale.receiptNumber
      );
      if (existingSale) {
        return { success: true, sale: existingSale };
      }

      // Always save locally first
      const localResult = this.saveSaleLocally(sale);

      if (isOnline) {
        try {
          // Simplify the user ID validation
          let validCashierId =
            (currentUser && currentUser.id) || '00000000-0000-0000-0000-000000000000';

          // If it's not a valid UUID, use the fallback ID
          if (
            !validCashierId.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            )
          ) {
            validCashierId = '00000000-0000-0000-0000-000000000000';
          }

          // IMPORTANT: Use the correct database column names (lowercase)
          const saleToSaveWithPM = {
            receiptnumber: sale.receiptNumber, // Database column: receiptnumber
            cashierid: validCashierId, // Database column: cashierid
            items: sale.items,
            total: sale.total,
            created_at: sale.created_at,
            cashier: sale.cashier,
            paymentmethod: sale.paymentMethod,
            subtotal: sale.subtotal,
            discount: sale.discount,
            customername: sale.customerName,
            customerphone: sale.customerPhone,
          };
          const saleToSaveNoPM = {
            receiptnumber: sale.receiptNumber,
            cashierid: validCashierId,
            items: sale.items,
            total: sale.total,
            created_at: sale.created_at,
            cashier: sale.cashier,
          };

          let data, error;
          try {
            ({ data, error } = await runRemote(
              supabaseClient.from('sales').insert(saleToSaveWithPM).select(),
              'Save sale',
              REMOTE_WRITE_TIMEOUT_MS
            ));
            if (error) throw error;
          } catch (e) {
            ({ data, error } = await runRemote(
              supabaseClient.from('sales').insert(saleToSaveNoPM).select(),
              'Save sale fallback',
              REMOTE_WRITE_TIMEOUT_MS
            ));
            if (error) throw error;
          }

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }

          if (data && data.length > 0) {
            // Update the local sale with the Supabase ID
            const index = sales.findIndex(
              (s) => s.receiptNumber === sale.receiptNumber
            );
            if (index >= 0) {
              sales[index].id = data[0].id;
              sales[index].cashierId = validCashierId;
              saveToLocalStorage();
            }
            return {
              success: true,
              sale: { ...sale, id: data[0].id, cashierId: validCashierId },
            };
          } else {
            throw new Error('No data returned from insert operation');
          }
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          showNotification(
            'Database error: ' +
              dbError.message +
              '. Sale saved locally and will sync when connection is restored.',
            'warning'
          );

          // Add to sync queue to try again later
          addToSyncQueue({
            type: 'saveSale',
            data: sale,
          });

          return localResult;
        }
      } else {
        // If offline, add to sync queue
        addToSyncQueue({
          type: 'saveSale',
          data: sale,
        });

        return localResult;
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      showNotification('Error saving sale', 'error');
      return { success: false, error };
    }
  },

  saveSaleLocally(sale) {
    sale.id =
      'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sales.push(sale);
    saveToLocalStorage();
    return { success: true, sale };
  },

  async deleteSale(saleId) {
    try {
      const saleIndex = sales.findIndex((s) => s.id === saleId);
      if (saleIndex >= 0) {
        const sale = sales[saleIndex];
        sale.deleted = true;
        sale.deletedAt = new Date().toISOString();
        deletedSales.push(sale);
        sales.splice(saleIndex, 1);
        saveToLocalStorage();
      }

      if (isOnline) {
        try {
          let { data: saleData, error: fetchError } = await runRemote(
            supabaseClient.from('sales').select('*').eq('id', saleId).single(),
            'Find sale to delete'
          );

          if (fetchError || !saleData) {
            const localSale =
              deletedSales.find((s) => s.id === saleId) ||
              sales.find((s) => s.id === saleId);
            const receiptNo =
              (localSale && localSale.receiptnumber) || (localSale && localSale.receiptNumber);
            if (receiptNo) {
              const { data: byReceipt, error: byReceiptErr } = await runRemote(
                supabaseClient
                  .from('sales')
                  .select('*')
                  .eq('receiptnumber', receiptNo)
                  .single(),
                'Find sale by receipt'
              );
              if (!byReceiptErr && byReceipt) {
                saleData = byReceipt;
              }
            }
            if (!saleData) throw fetchError || new Error('Sale not found');
          }

          if (saleData) {
            const archivedSale = {
              // CHANGED: Removed 'id: saleData.id' to let the database auto-generate a unique ID
              original_sale_id: saleData.id, // CHANGED: Store the original sale ID in the new column
              receiptnumber: saleData.receiptnumber || saleData.receiptNumber,
              items: saleData.items,
              total: saleData.total,
              created_at: saleData.created_at,
              cashier: saleData.cashier || null,
              cashierid: saleData.cashierid || saleData.cashierId || null,
              deleted: true,
              deleted_at: new Date().toISOString(),
            };
            if (isArchiveEnabled()) {
              const { error: insertError } = await runRemote(
                supabaseClient.from('deleted_sales').insert(archivedSale),
                'Archive deleted sale',
                REMOTE_WRITE_TIMEOUT_MS
              );
              if (insertError) {
                let { error: updateError } = await runRemote(
                  supabaseClient
                    .from('sales')
                    .update({ deleted_at: archivedSale.deleted_at })
                    .eq('id', saleId),
                  'Soft delete sale',
                  REMOTE_WRITE_TIMEOUT_MS
                );
                if (updateError) {
                  const { error: updateByReceiptErr } = await runRemote(
                    supabaseClient
                      .from('sales')
                      .update({ deleted_at: archivedSale.deleted_at })
                      .eq('receiptnumber', archivedSale.receiptnumber),
                    'Soft delete sale by receipt',
                    REMOTE_WRITE_TIMEOUT_MS
                  );
                  if (updateByReceiptErr) throw updateByReceiptErr;
                }
                return { success: true };
              }
              let { error: deleteError } = await runRemote(
                supabaseClient.from('sales').delete().eq('id', saleId),
                'Delete sale',
                REMOTE_WRITE_TIMEOUT_MS
              );
              if (deleteError) {
                const { error: deleteByReceiptErr } = await runRemote(
                  supabaseClient
                    .from('sales')
                    .delete()
                    .eq('receiptnumber', archivedSale.receiptnumber),
                  'Delete sale by receipt',
                  REMOTE_WRITE_TIMEOUT_MS
                );
                if (deleteByReceiptErr) {
                  let { error: updateError } = await runRemote(
                    supabaseClient
                      .from('sales')
                      .update({ deleted_at: archivedSale.deleted_at })
                      .eq('id', saleId),
                    'Soft delete sale after delete failed',
                    REMOTE_WRITE_TIMEOUT_MS
                  );
                  if (updateError) {
                    const { error: updateByReceiptErr } = await runRemote(
                      supabaseClient
                        .from('sales')
                        .update({ deleted_at: archivedSale.deleted_at })
                        .eq('receiptnumber', archivedSale.receiptnumber),
                      'Soft delete sale by receipt after delete failed',
                      REMOTE_WRITE_TIMEOUT_MS
                    );
                    if (updateByReceiptErr) throw updateByReceiptErr;
                  }
                }
                return { success: true };
              }
              return { success: true };
            } else {
              let { error: updateError } = await runRemote(
                supabaseClient
                  .from('sales')
                  .update({ deleted_at: archivedSale.deleted_at })
                  .eq('id', saleId),
                'Soft delete sale',
                REMOTE_WRITE_TIMEOUT_MS
              );
              if (updateError) {
                const { error: updateByReceiptErr } = await runRemote(
                  supabaseClient
                    .from('sales')
                    .update({ deleted_at: archivedSale.deleted_at })
                    .eq('receiptnumber', archivedSale.receiptnumber),
                  'Soft delete sale by receipt',
                  REMOTE_WRITE_TIMEOUT_MS
                );
                if (updateByReceiptErr) throw updateByReceiptErr;
              }
              return { success: true };
            }
          } else {
            return { success: false, error: 'Sale not found' };
          }
        } catch (dbError) {
          console.error('Database delete failed:', dbError);
          showNotification(
            'Failed to delete from database. Marked as deleted locally.',
            'warning'
          );

          addToSyncQueue({
            type: 'deleteSale',
            id: saleId,
          });

          return { success: true };
        }
      } else {
        addToSyncQueue({
          type: 'deleteSale',
          id: saleId,
        });

        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      showNotification('Error deleting sale', 'error');
      return { success: false, error };
    }
  },
};

// Sync Queue Management
function addToSyncQueue(operation) {
  if (!operation.id) {
    operation.id =
      'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  operation.timestamp = new Date().toISOString();

  const isTempId = (value) => !!value && String(value).startsWith('temp_');

  if (operation.type === 'saveSale') {
    const receiptNumber = operation.data.receiptNumber;
    const existingIndex = syncQueue.findIndex(
      (op) => op.type === 'saveSale' && op.data.receiptNumber === receiptNumber
    );

    if (existingIndex !== -1) {
      syncQueue[existingIndex] = operation;
    } else {
      syncQueue.push(operation);
    }
  } else if (operation.type === 'saveProduct') {
    if (operation.data.stock !== undefined && !operation.data.name) {
      const incomingId =
        operation.data.clientTempId || operation.data.id || null;
      const existingIndex = syncQueue.findIndex(
        (op) =>
          op.type === 'saveProduct' &&
          (op.data.id === incomingId ||
            op.data.clientTempId === incomingId ||
            op.data.id === operation.data.id) &&
          op.data.stock !== undefined
      );

      if (existingIndex !== -1) {
        syncQueue[existingIndex].data.stock = operation.data.stock;
        if (operation.data.id) {
          syncQueue[existingIndex].data.id = operation.data.id;
        }
        if (operation.data.clientTempId) {
          syncQueue[existingIndex].data.clientTempId =
            operation.data.clientTempId;
        }
      } else {
        syncQueue.push(operation);
      }
    } else {
      const tempRef =
        (operation.data &&
          (operation.data.clientTempId ||
            (isTempId(operation.data.id) ? operation.data.id : null))) ||
        null;
      const key =
        operation.data && operation.data.name ? productSignature(operation.data) : null;
      const existingIndex = syncQueue.findIndex(
        (op) =>
          op.type === operation.type &&
          ((tempRef &&
            op.data &&
            (op.data.clientTempId === tempRef || op.data.id === tempRef)) ||
            (key &&
            op.data &&
            productSignature(op.data) === key) ||
            (!key && op.data && op.data.id === operation.data.id))
      );

      if (existingIndex !== -1) {
        syncQueue[existingIndex] = operation;
      } else {
        syncQueue.push(operation);
      }
    }
  } else if (operation.type === 'savePurchase') {
    const key =
      operation.data &&
      operation.data.date &&
      operation.data.supplier &&
      operation.data.amount != null
        ? `${
            operation.data.date
          }|${String(operation.data.supplier).toLowerCase()}|${normalizePrice(
            operation.data.amount
          )}`
        : null;
    const existingIndex = syncQueue.findIndex(
      (op) =>
        op.type === 'savePurchase' &&
        op.data &&
        `${op.data.date}|${(
          op.data.supplier || ''
        ).toLowerCase()}|${normalizePrice(op.data.amount)}` === key
    );
    if (existingIndex !== -1) {
      syncQueue[existingIndex] = operation;
    } else {
      syncQueue.push(operation);
    }
  } else {
    const existingIndex = syncQueue.findIndex(
      (op) => op.type === operation.type && op.id === operation.id
    );

    if (existingIndex !== -1) {
      syncQueue[existingIndex] = operation;
    } else {
      syncQueue.push(operation);
    }
  }

  localStorage.setItem('syncQueue', JSON.stringify(syncQueue));

  if (isOnline) {
    processSyncQueue();
  } else {
    showNotification(
      'Offline: Operation saved locally and will sync automatically.',
      'info'
    );
  }
}

function replaceTempProductReferences(tempId, serverId) {
  if (!tempId || !serverId || tempId === serverId) return;

  const rewriteSaleItems = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((entry) => {
      if (!entry || !Array.isArray(entry.items)) return;
      entry.items.forEach((item) => {
        if (!item) return;
        if (item.id === tempId) item.id = serverId;
        if (item.productId === tempId) item.productId = serverId;
      });
    });
  };

  products = products.map((product) => {
    if (!product) return product;
    if (product.id === tempId || product.clientTempId === tempId) {
      return {
        ...product,
        id: serverId,
        clientTempId: tempId,
      };
    }
    return product;
  });

  cart.forEach((item) => {
    if (item && item.id === tempId) {
      item.id = serverId;
    }
  });

  rewriteSaleItems(sales);
  rewriteSaleItems(deletedSales);

  syncQueue.forEach((operation) => {
    if (!operation) return;
    if (operation.type === 'saveProduct' && operation.data) {
      if (operation.data.id === tempId || operation.data.clientTempId === tempId) {
        operation.data.id = serverId;
        operation.data.clientTempId = tempId;
      }
    } else if (operation.type === 'deleteProduct') {
      if (operation.id === tempId) operation.id = serverId;
      if (operation.data && operation.data.id === tempId) {
        operation.data.id = serverId;
      }
    } else if (operation.type === 'saveSale' && operation.data) {
      rewriteSaleItems([operation.data]);
    }
  });

  dedupeProducts();
  saveToLocalStorage();
}

async function processSyncQueue() {
  if (syncQueue.length === 0 || !isOnline || supabaseIsStub) return;
  if (isProcessingSyncQueue) return;
  isProcessingSyncQueue = true;

  const syncStatus = document.getElementById('sync-status');
  const syncStatusText = document.getElementById('sync-status-text');

  if (syncStatus) {
    syncStatus.classList.add('show', 'syncing');
    syncStatusText.textContent = `Syncing ${syncQueue.length} operations...`;
  }

  syncQueue.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  try {
    for (let i = 0; i < syncQueue.length; i++) {
      if (!navigator.onLine || !isOnline || supabaseIsStub) {
        setOfflineMode('Offline cache');
        break;
      }
      const operation = syncQueue[i];

      if (operation.synced) continue;

      try {
        let success = false;

        const syncTask = (() => {
          if (operation.type === 'saveSale') return syncSale(operation);
          if (operation.type === 'saveProduct') return syncProduct(operation);
          if (operation.type === 'deleteProduct') return syncDeleteProduct(operation);
          if (operation.type === 'deleteSale') return syncDeleteSale(operation);
          if (operation.type === 'saveExpense') return syncExpense(operation);
          if (operation.type === 'savePurchase') return syncPurchase(operation);
          if (operation.type === 'deleteExpense') return syncDeleteExpense(operation);
          if (operation.type === 'deletePurchase') return syncDeletePurchase(operation);
          return Promise.resolve(false);
        })();

        success = await withTimeout(
          syncTask,
          REMOTE_WRITE_TIMEOUT_MS + 1500,
          `Sync ${operation.type}`
        );

        if (success) {
          operation.synced = true;
          operation.syncedAt = new Date().toISOString();
        }
      } catch (error) {
        console.error(`Error syncing operation:`, operation.type, error);
        if (isOfflineLikeError(error)) {
          setOfflineMode('Offline cache');
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));

    const originalLength = syncQueue.length;
    syncQueue = syncQueue.filter((op) => !op.synced);

    if (syncQueue.length < originalLength) {
      localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    }

    if (syncStatus && syncStatusText) {
      if (syncQueue.length === 0) {
        syncStatus.classList.remove('syncing');
        syncStatus.classList.add('show');
        syncStatusText.textContent = 'All data synced';
        setTimeout(() => syncStatus.classList.remove('show'), 3000);
        await refreshAllData();
      } else {
        syncStatus.classList.remove('syncing');
        syncStatus.classList.add('error');
        syncStatusText.textContent = `${syncQueue.length} operations pending`;
        setTimeout(() => syncStatus.classList.remove('show', 'error'), 3000);
      }
    }
  } finally {
    isProcessingSyncQueue = false;
  }
}

async function ensureValidUserId(userId) {
  if (!userId) return null;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(userId)) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!error && data) return userId;
    } catch (error) {
      console.error('Error checking user ID:', error);
    }
  }

  if (currentUser && currentUser.email) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', currentUser.email)
        .single();

      if (!error && data) {
        currentUser.id = data.id;
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_USER,
          JSON.stringify(currentUser)
        );
        return data.id;
      }
    } catch (error) {
      console.error('Error finding user by email:', error);
    }
  }

  return '00000000-0000-0000-0000-000000000000';
}

async function syncSale(operation) {
  try {
    let validCashierId =
      operation.data.cashierId || '00000000-0000-0000-0000-000000000000';

    // If it's not a valid UUID, use the fallback ID
    if (
      !validCashierId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    ) {
      validCashierId = '00000000-0000-0000-0000-000000000000';
    }

    operation.data.cashierId = validCashierId;

    // IMPORTANT: Use receiptnumber (lowercase) to match the database column
    const { data: existingSales, error: fetchError } = await supabaseClient
      .from('sales')
      .select('*')
      .eq('receiptnumber', operation.data.receiptNumber); // Database column: receiptnumber

    if (fetchError) throw fetchError;

    if (!existingSales || existingSales.length === 0) {
      // IMPORTANT: Use the correct database column names (lowercase)
      const saleToSaveWithPM = {
        receiptnumber: operation.data.receiptNumber, // Database column: receiptnumber
        cashierid: validCashierId, // Database column: cashierid
        items: operation.data.items,
        total: operation.data.total,
        created_at: operation.data.created_at,
        cashier: operation.data.cashier,
        paymentmethod: operation.data.paymentMethod,
      };
      const saleToSaveNoPM = {
        receiptnumber: operation.data.receiptNumber,
        cashierid: validCashierId,
        items: operation.data.items,
        total: operation.data.total,
        created_at: operation.data.created_at,
        cashier: operation.data.cashier,
      };

      let data, error;
      try {
        ({ data, error } = await supabaseClient
          .from('sales')
          .insert(saleToSaveWithPM)
          .select());
        if (error) throw error;
      } catch (e) {
        ({ data, error } = await supabaseClient
          .from('sales')
          .insert(saleToSaveNoPM)
          .select());
        if (error) throw error;
      }

      if (error) throw error;

      if (data && data.length > 0) {
        const localSaleIndex = sales.findIndex(
          (s) => s.receiptNumber === operation.data.receiptNumber
        );
        if (localSaleIndex !== -1) {
          sales[localSaleIndex].id = data[0].id;
          sales[localSaleIndex].cashierId = validCashierId;
          saveToLocalStorage();
        }
        return true;
      }
    } else {
      if (existingSales.length > 0) {
        const localSaleIndex = sales.findIndex(
          (s) => s.receiptNumber === operation.data.receiptNumber
        );
        if (localSaleIndex !== -1) {
          sales[localSaleIndex].id = existingSales[0].id;
          sales[localSaleIndex].cashierId = validCashierId;
          saveToLocalStorage();
        }
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error syncing sale:', error);
    return false;
  }
}

async function syncProduct(operation) {
  try {
    if (operation.data.stock !== undefined && !operation.data.name) {
      if (
        operation.data.clientTempId &&
        (!operation.data.id || String(operation.data.id).startsWith('temp_'))
      ) {
        const resolvedProduct = products.find(
          (product) =>
            product &&
            (product.id === operation.data.clientTempId ||
              product.clientTempId === operation.data.clientTempId)
        );
        if (
          resolvedProduct &&
          resolvedProduct.id &&
          !String(resolvedProduct.id).startsWith('temp_')
        ) {
          operation.data.id = resolvedProduct.id;
        }
      }
      if (!operation.data.id || String(operation.data.id).startsWith('temp_')) {
        return false;
      }
      // IMPORTANT: Use the correct database column names (lowercase)
      const { error } = await supabaseClient
        .from('products')
        .update({ stock: operation.data.stock })
        .eq('id', operation.data.id);

      if (error) throw error;
    } else {
      if (operation.data.id && !operation.data.id.startsWith('temp_')) {
        // IMPORTANT: Use the correct database column names (lowercase)
        const productToSave = {
          name: operation.data.name,
          category: operation.data.category,
          price: operation.data.price,
          stock: operation.data.stock,
          expirydate: operation.data.expiryDate, // Database column: expirydate
          barcode: operation.data.barcode,
          // categoryid removed to match DB schema
        };

        const { error } = await supabaseClient
          .from('products')
          .update(productToSave)
          .eq('id', operation.data.id);

        if (error) throw error;
      } else {
        // IMPORTANT: Use the correct database column names (lowercase)
        const productToSave = {
          name: operation.data.name,
          category: operation.data.category,
          price: operation.data.price,
          stock: operation.data.stock,
          expirydate: operation.data.expiryDate, // Database column: expirydate
          barcode: operation.data.barcode,
          // categoryid removed to match DB schema
        };
        // Check if a matching product already exists (avoid double insert)
        try {
          const existing = await findMatchingServerProduct(productToSave);
          if (existing && existing.id) {
            const existId = existing.id;
            const tempId =
              operation.data.clientTempId ||
              (String(operation.data.id || '').startsWith('temp_')
                ? operation.data.id
                : null);
            const localIdx = products.findIndex(
              (p) => p.id === operation.data.id
            );
            if (localIdx !== -1) {
              products[localIdx].id = existId;
              if (tempId) {
                products[localIdx].clientTempId = tempId;
              }
            }
            if (tempId) replaceTempProductReferences(tempId, existId);
            dedupeProducts();
            saveToLocalStorage();
            return true;
          }
        } catch (_) {}

        const { data, error } = await supabaseClient
          .from('products')
          .insert(productToSave)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const tempId =
            operation.data.clientTempId ||
            (String(operation.data.id || '').startsWith('temp_')
              ? operation.data.id
              : null);
          const localProductIndex = products.findIndex(
            (p) => p.id === operation.data.id
          );
          if (localProductIndex !== -1) {
            products[localProductIndex].id = data[0].id;
            if (tempId) {
              products[localProductIndex].clientTempId = tempId;
            }
          }
          if (tempId) replaceTempProductReferences(tempId, data[0].id);
          dedupeProducts();
          saveToLocalStorage();
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error syncing product:', error);
    return false;
  }
}

async function syncDeleteProduct(operation) {
  try {
    if (!operation || !operation.id) return true;
    if (String(operation.id).startsWith('temp_')) {
      // Attempt to find matching server product by signature
      let sigData = operation.data;
      if (!sigData) {
        const local = products.find((p) => p.id === operation.id);
        if (local)
          sigData = {
            name: local.name,
            category: local.category,
            expiryDate: local.expiryDate,
            barcode: local.barcode,
          };
      }
      if (
        sigData &&
        sigData.name &&
        sigData.category &&
        sigData.price !== undefined
      ) {
        try {
          const existing = await findMatchingServerProduct(sigData);
          if (existing && existing.id) {
            const serverId = existing.id;
            const { error: delErr } = await supabaseClient
              .from('products')
              .delete()
              .eq('id', serverId);
            if (delErr) throw delErr;
            products = products.filter(
              (p) => p.id !== operation.id && p.id !== serverId
            );
            saveToLocalStorage();
            return true;
          }
        } catch (_) {}
      }
      // Fallback: just remove local temp product
      products = products.filter((p) => p.id !== operation.id);
      saveToLocalStorage();
      return true;
    }
    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', operation.id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error syncing product deletion:', error);
    return false;
  }
}

async function syncDeleteSale(operation) {
  try {
    let { data: saleData, error: fetchError } = await supabaseClient
      .from('sales')
      .select('*')
      .eq('id', operation.id)
      .single();

    if (fetchError || !saleData) {
      const localSale =
        deletedSales.find((s) => s.id === operation.id) ||
        sales.find((s) => s.id === operation.id);
      const receiptNo = (localSale && localSale.receiptnumber) || (localSale && localSale.receiptNumber);
      if (receiptNo) {
        const { data: byReceipt, error: byReceiptErr } = await supabaseClient
          .from('sales')
          .select('*')
          .eq('receiptnumber', receiptNo)
          .single();
        if (!byReceiptErr && byReceipt) {
          saleData = byReceipt;
        }
      }
      if (!saleData) throw fetchError || new Error('Sale not found');
    }

    if (saleData) {
      const archivedSale = {
        // CHANGED: Removed 'id: saleData.id' to let the database auto-generate a unique ID
        original_sale_id: saleData.id, // CHANGED: Store the original sale's ID in the new column
        receiptnumber: saleData.receiptnumber || saleData.receiptNumber,
        items: saleData.items,
        total: saleData.total,
        created_at: saleData.created_at,
        cashier: saleData.cashier || null,
        cashierid: saleData.cashierid || saleData.cashierId || null,
        deleted: true,
        deleted_at: new Date().toISOString(),
      };
      if (isArchiveEnabled()) {
        const { error: insertError } = await supabaseClient
          .from('deleted_sales')
          .insert(archivedSale);
        if (insertError) {
          let { error: updateError } = await supabaseClient
            .from('sales')
            .update({ deleted_at: archivedSale.deleted_at })
            .eq('id', operation.id);
          if (updateError) {
            const { error: updateByReceiptErr } = await supabaseClient
              .from('sales')
              .update({ deleted_at: archivedSale.deleted_at })
              .eq('receiptnumber', archivedSale.receiptnumber);
            if (updateByReceiptErr) throw updateByReceiptErr;
          }
          return true;
        }
        let { error: deleteError } = await supabaseClient
          .from('sales')
          .delete()
          .eq('id', operation.id);
        if (deleteError) {
          const { error: deleteByReceiptErr } = await supabaseClient
            .from('sales')
            .delete()
            .eq('receiptnumber', archivedSale.receiptnumber);
          if (deleteByReceiptErr) {
            let { error: updateError } = await supabaseClient
              .from('sales')
              .update({ deleted_at: archivedSale.deleted_at })
              .eq('id', operation.id);
            if (updateError) {
              const { error: updateByReceiptErr } = await supabaseClient
                .from('sales')
                .update({ deleted_at: archivedSale.deleted_at })
                .eq('receiptnumber', archivedSale.receiptnumber);
              if (updateByReceiptErr) throw updateByReceiptErr;
            }
          }
          return true;
        }
      } else {
        let { error: updateError } = await supabaseClient
          .from('sales')
          .update({ deleted_at: archivedSale.deleted_at })
          .eq('id', operation.id);
        if (updateError) {
          const { error: updateByReceiptErr } = await supabaseClient
            .from('sales')
            .update({ deleted_at: archivedSale.deleted_at })
            .eq('receiptnumber', archivedSale.receiptnumber);
          if (updateByReceiptErr) throw updateByReceiptErr;
        }
        return true;
      }
    }

    return true;
  } catch (error) {
    console.error('Error syncing sale deletion:', error);
    return false;
  }
}

async function syncExpense(operation) {
  try {
    // Ensure we have a valid user ID
    let userId = operation.data.created_by;

    // If no valid user ID, use a default UUID
    if (!userId || userId === 'undefined') {
      userId = '00000000-0000-0000-0000-000000000000';
      operation.data.created_by = userId;
    }

    // Create a copy of the expense data without the temporary ID
    const expenseData = { ...operation.data };

    // Remove the temporary ID if it exists
    if (expenseData.id && expenseData.id.startsWith('temp_')) {
      delete expenseData.id;
    }

    // Check if this expense already exists in the database
    const { data: existingExpenses, error: fetchError } = await supabaseClient
      .from('expenses')
      .select('*')
      .eq('date', expenseData.date)
      .eq('description', expenseData.description)
      .eq('amount', expenseData.amount);

    if (fetchError) throw fetchError;

    // If expense already exists, just update the local ID
    if (existingExpenses && existingExpenses.length > 0) {
      const localExpenseIndex = expenses.findIndex(
        (e) =>
          e.id === operation.data.id &&
          e.date === expenseData.date &&
          e.description === expenseData.description
      );

      if (localExpenseIndex !== -1) {
        expenses[localExpenseIndex].id = existingExpenses[0].id;
        expenses = dedupeListByKey(expenses, expenseKey);
        saveToLocalStorage();
      }
      return true;
    }

    // Otherwise, insert the new expense
    const { data, error } = await supabaseClient
      .from('expenses')
      .insert(expenseData)
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      const localExpenseIndex = expenses.findIndex(
        (e) => e.id === operation.data.id
      );
      if (localExpenseIndex !== -1) {
        expenses[localExpenseIndex].id = data[0].id;
        expenses = dedupeListByKey(expenses, expenseKey);
        saveToLocalStorage();
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error syncing expense:', error);
    return false;
  }
}

async function syncDeleteExpense(operation) {
  try {
    const { error } = await supabaseClient
      .from('expenses')
      .delete()
      .eq('id', operation.id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error syncing expense deletion:', error);
    return false;
  }
}

async function syncPurchase(operation) {
  try {
    // Ensure we have a valid user ID (prefer current authenticated user)
    let userId =
      currentUser && currentUser.id
        ? currentUser.id
        : operation.data.created_by;
    if (!userId || userId === 'undefined') {
      userId = '00000000-0000-0000-0000-000000000000';
    }
    operation.data.created_by = userId;

    const normalizedPurchase = normalizePurchaseRecord(operation.data);
    const purchaseData = {
      date: normalizedPurchase.date,
      supplier: normalizedPurchase.supplier,
      description: normalizedPurchase.description,
      quantity: normalizedPurchase.quantity,
      costprice: normalizedPurchase.costPrice,
      sellingprice: normalizedPurchase.sellingPrice,
      amount: normalizedPurchase.amount,
      invoice: normalizedPurchase.invoice,
      notes: normalizedPurchase.notes,
      created_by: userId,
    };
    if (normalizedPurchase.id) purchaseData.id = normalizedPurchase.id;

    // Remove the temporary ID if it exists
    if (purchaseData.id && String(purchaseData.id).startsWith('temp_')) {
      delete purchaseData.id;
    }

    // Check if this purchase already exists in the database
    const { data: existingPurchases, error: fetchError } = await supabaseClient
      .from('purchases')
      .select('*')
      .eq('date', purchaseData.date)
      .eq('supplier', purchaseData.supplier)
      .eq('amount', purchaseData.amount)
      .eq('created_by', userId);

    if (fetchError) throw fetchError;

    // If purchase already exists, just update the local ID
    if (existingPurchases && existingPurchases.length > 0) {
      const localPurchaseIndex = purchases.findIndex(
        (p) =>
          p.id === operation.data.id &&
          p.date === purchaseData.date &&
          p.supplier === purchaseData.supplier
      );

      if (localPurchaseIndex !== -1) {
        purchases[localPurchaseIndex].id = existingPurchases[0].id;
        purchases = dedupeListByKey(purchases, purchaseKey);
        saveToLocalStorage();
      }
      return true;
    }

    // Otherwise, insert the new purchase
    const { data, error } = await supabaseClient
      .from('purchases')
      .insert(purchaseData)
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      const localPurchaseIndex = purchases.findIndex(
        (p) => p.id === operation.data.id
      );
      if (localPurchaseIndex !== -1) {
        purchases[localPurchaseIndex].id = data[0].id;
        purchases = dedupeListByKey(purchases, purchaseKey);
        saveToLocalStorage();
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error syncing purchase:', error);
    return false;
  }
}

async function syncDeletePurchase(operation) {
  try {
    const { error } = await supabaseClient
      .from('purchases')
      .delete()
      .eq('id', operation.id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error syncing purchase deletion:', error);
    return false;
  }
}
function loadSyncQueue() {
  const savedQueue = localStorage.getItem('syncQueue');
  if (savedQueue) {
    try {
      syncQueue = JSON.parse(savedQueue);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const originalLength = syncQueue.length;
      syncQueue = syncQueue.filter((op) => {
        const opDate = new Date(op.timestamp || 0);
        return opDate > weekAgo;
      });

      if (syncQueue.length < originalLength) {
        localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
      }
    } catch (e) {
      console.error('Error parsing sync queue:', e);
      syncQueue = [];
    }
  }
}

function cleanupSyncQueue() {
  syncQueue = syncQueue.filter((op) => !op.synced);
  localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
}

function cleanupDuplicateSales() {
  const receiptNumbers = new Set();
  const uniqueSales = [];

  sales.forEach((sale) => {
    if (!receiptNumbers.has(sale.receiptNumber)) {
      receiptNumbers.add(sale.receiptNumber);
      uniqueSales.push(sale);
    }
  });

  if (sales.length !== uniqueSales.length) {
    sales = uniqueSales;
    saveToLocalStorage();
  }
}
function isArchiveEnabled() {
  const v = localStorage.getItem('ARCHIVE_ENABLED');
  return v === 'true';
}
function disableArchive() {
  localStorage.setItem('ARCHIVE_ENABLED', 'false');
}

async function refreshVisiblePageAfterLiveSync() {
  if (currentPage === 'inventory') {
    await loadInventory(false);
    loadExpenses();
  } else if (currentPage === 'stock') {
    loadStockCheck();
  } else if (currentPage === 'purchases') {
    await loadPurchases();
  } else if (currentPage === 'profit-loss') {
    await loadProfitLossReport();
  } else if (currentPage === 'reports') {
    try {
      generateReport();
    } catch (_) {}
  } else if (currentPage === 'sales') {
    loadSales();
  } else if (currentPage === 'pos') {
    loadProducts();
    syncCustomerDisplayState();
  } else if (currentPage === 'requests') {
    loadRequestsPage();
  }
}

function scheduleLiveDataRefresh(reason = 'remote-change', options = {}) {
  liveRefreshReasons.add(reason);
  if (options.notify !== false) liveRefreshShouldNotify = true;
  clearTimeout(liveRefreshTimer);
  liveRefreshTimer = setTimeout(async () => {
    const reasons = Array.from(liveRefreshReasons);
    liveRefreshReasons.clear();
    const shouldNotify = liveRefreshShouldNotify;
    liveRefreshShouldNotify = false;
    try {
      const needsProducts = reasons.some((item) =>
        ['products', 'categories', 'all'].includes(item)
      );
      const needsSales = reasons.some((item) =>
        ['sales', 'deleted_sales', 'all'].includes(item)
      );
      const needsExpenses = reasons.some((item) =>
        ['expenses', 'all'].includes(item)
      );
      const needsPurchases = reasons.some((item) =>
        ['purchases', 'all'].includes(item)
      );
      const fetches = [];
      if (needsProducts) fetches.push(DataModule.fetchAllProducts());
      if (needsSales) {
        fetches.push(DataModule.fetchSales());
        fetches.push(DataModule.fetchDeletedSales());
      }
      if (needsExpenses) fetches.push(DataModule.fetchExpenses());
      if (needsPurchases) fetches.push(DataModule.fetchPurchases());
      if (reasons.includes('categories')) fetches.push(DataModule.fetchCategories());
      await Promise.allSettled(fetches);
      saveToLocalStorage();
      checkAndGenerateAlerts();
      loadProducts();
      loadSales();
      await refreshVisiblePageAfterLiveSync();
      if (shouldNotify && !document.hidden) {
        showNotification('Latest data synced from another device', 'info');
      }
    } catch (error) {
      console.warn('Live data refresh failed:', error);
    }
  }, 500);
}

function setupRealtimeListeners() {
  if (!isOnline || supabaseIsStub) return;
  if (appRealtimeChannel) return;

  const channel = supabaseClient.channel(`app-changes-${APP_VERSION}`);

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'products' },
    () => scheduleLiveDataRefresh('products')
  );

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'sales' },
    () => scheduleLiveDataRefresh('sales')
  );

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'deleted_sales' },
    () => scheduleLiveDataRefresh('deleted_sales')
  );

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'expenses' },
    () => scheduleLiveDataRefresh('expenses')
  );

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'purchases' },
    () => scheduleLiveDataRefresh('purchases')
  );

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'categories' },
    () => scheduleLiveDataRefresh('categories')
  );

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Realtime sync connected');
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.warn('Realtime sync connection issue:', status);
      appRealtimeChannel = null;
      setTimeout(setupRealtimeListeners, 3000);
    }
  });
  appRealtimeChannel = channel;
}

// Local Storage Functions
function loadFromLocalStorage() {
  try {
    // Initialize empty arrays/objects first
    products = [];
    sales = [];
    deletedSales = [];
    users = [];
    currentUser = null;
    expenses = [];
    purchases = [];
    stockAlerts = [];
    profitData = [];
    finishedProductReports = [];
    customerRequests = [];
    treatmentRecords = [];

    // Load products
    const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        if (Array.isArray(parsedProducts)) {
          products = parsedProducts;
        }
      } catch (parseError) {
        console.error('Error parsing products from localStorage:', parseError);
        products = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
        } catch (_) {}
      }
    }

    // Load sales
    const savedSales = localStorage.getItem(STORAGE_KEYS.SALES);
    if (savedSales) {
      try {
        const parsedSales = JSON.parse(savedSales);
        if (Array.isArray(parsedSales)) {
          sales = parsedSales;
        }
      } catch (parseError) {
        console.error('Error parsing sales from localStorage:', parseError);
        sales = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.SALES);
        } catch (_) {}
      }
    }

    // Load deleted sales
    const savedDeletedSales = localStorage.getItem(STORAGE_KEYS.DELETED_SALES);
    if (savedDeletedSales) {
      try {
        const parsedDeletedSales = JSON.parse(savedDeletedSales);
        if (Array.isArray(parsedDeletedSales)) {
          deletedSales = parsedDeletedSales;
        }
      } catch (parseError) {
        console.error(
          'Error parsing deleted sales from localStorage:',
          parseError
        );
        deletedSales = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.DELETED_SALES);
        } catch (_) {}
      }
    }

    // Load users
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        if (Array.isArray(parsedUsers)) {
          users = parsedUsers;
        }
      } catch (parseError) {
        console.error('Error parsing users from localStorage:', parseError);
        users = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.USERS);
        } catch (_) {}
      }
    }

    // Load settings - Update properties of the existing settings object
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings && typeof parsedSettings === 'object') {
          // Update properties of the existing settings object instead of reassigning
          Object.assign(settings, parsedSettings);
        }
      } catch (parseError) {
        console.error('Error parsing settings from localStorage:', parseError);
        try {
          localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        } catch (_) {}
      }
    }

    // Load current user
    const savedCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedCurrentUser) {
      try {
        const parsedCurrentUser = JSON.parse(savedCurrentUser);
        if (parsedCurrentUser && typeof parsedCurrentUser === 'object') {
          currentUser = parsedCurrentUser;
        }
      } catch (parseError) {
        console.error(
          'Error parsing current user from localStorage:',
          parseError
        );
        currentUser = null;
        try {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        } catch (_) {}
      }
    }

    // Load expenses
    const savedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (savedExpenses) {
      try {
        expenses = JSON.parse(savedExpenses);
      } catch (parseError) {
        console.error('Error parsing expenses from localStorage:', parseError);
        expenses = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.EXPENSES);
        } catch (_) {}
      }
    }

    // Load purchases
    const savedPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (savedPurchases) {
      try {
        purchases = JSON.parse(savedPurchases);
      } catch (parseError) {
        console.error('Error parsing purchases from localStorage:', parseError);
        purchases = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.PURCHASES);
        } catch (_) {}
      }
    }

    // Load stock alerts
    const savedStockAlerts = localStorage.getItem(STORAGE_KEYS.STOCK_ALERTS);
    if (savedStockAlerts) {
      try {
        stockAlerts = JSON.parse(savedStockAlerts);
      } catch (parseError) {
        console.error(
          'Error parsing stock alerts from localStorage:',
          parseError
        );
        stockAlerts = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.STOCK_ALERTS);
        } catch (_) {}
      }
    }

    // Load profit data
    const savedProfitData = localStorage.getItem(STORAGE_KEYS.PROFIT_DATA);
    if (savedProfitData) {
      try {
        profitData = JSON.parse(savedProfitData);
      } catch (parseError) {
        console.error(
          'Error parsing profit data from localStorage:',
          parseError
        );
        profitData = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.PROFIT_DATA);
        } catch (_) {}
      }
    }

    const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        if (Array.isArray(parsedCategories)) {
          categories = parsedCategories;
        }
      } catch (parseError) {
        console.error(
          'Error parsing categories from localStorage:',
          parseError
        );
        categories = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
        } catch (_) {}
      }
    }

    const savedFinishedProductReports = localStorage.getItem(
      STORAGE_KEYS.FINISHED_PRODUCT_REPORTS
    );
    if (savedFinishedProductReports) {
      try {
        const parsedFinishedProductReports = JSON.parse(
          savedFinishedProductReports
        );
        if (Array.isArray(parsedFinishedProductReports)) {
          finishedProductReports = parsedFinishedProductReports;
        }
      } catch (parseError) {
        console.error(
          'Error parsing finished product reports from localStorage:',
          parseError
        );
        finishedProductReports = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.FINISHED_PRODUCT_REPORTS);
        } catch (_) {}
      }
    }

    const savedCustomerRequests = localStorage.getItem(
      STORAGE_KEYS.CUSTOMER_REQUESTS
    );
    if (savedCustomerRequests) {
      try {
        const parsedCustomerRequests = JSON.parse(savedCustomerRequests);
        if (Array.isArray(parsedCustomerRequests)) {
          customerRequests = parsedCustomerRequests;
        }
      } catch (parseError) {
        console.error(
          'Error parsing customer requests from localStorage:',
          parseError
        );
        customerRequests = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.CUSTOMER_REQUESTS);
        } catch (_) {}
      }
    }

    const savedTreatmentRecords = localStorage.getItem(
      STORAGE_KEYS.TREATMENT_RECORDS
    );
    if (savedTreatmentRecords) {
      try {
        const parsedTreatmentRecords = JSON.parse(savedTreatmentRecords);
        if (Array.isArray(parsedTreatmentRecords)) {
          treatmentRecords = parsedTreatmentRecords;
        }
      } catch (parseError) {
        console.error(
          'Error parsing treatment records from localStorage:',
          parseError
        );
        treatmentRecords = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.TREATMENT_RECORDS);
        } catch (_) {}
      }
    }
  } catch (e) {
    console.error('Error loading data from localStorage:', e);
    // Reset to defaults on error
    products = [];
    sales = [];
    deletedSales = [];
    users = [];
    currentUser = null;
    expenses = [];
    purchases = [];
    stockAlerts = [];
    profitData = [];
    categories = [];
    finishedProductReports = [];
    customerRequests = [];
    treatmentRecords = [];
  }
}

function saveToLocalStorage(options = {}) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    localStorage.setItem(
      STORAGE_KEYS.DELETED_SALES,
      JSON.stringify(deletedSales)
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
    localStorage.setItem(
      STORAGE_KEYS.STOCK_ALERTS,
      JSON.stringify(stockAlerts)
    );
    localStorage.setItem(STORAGE_KEYS.PROFIT_DATA, JSON.stringify(profitData));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(
      STORAGE_KEYS.FINISHED_PRODUCT_REPORTS,
      JSON.stringify(finishedProductReports)
    );
    localStorage.setItem(
      STORAGE_KEYS.CUSTOMER_REQUESTS,
      JSON.stringify(customerRequests)
    );
    localStorage.setItem(
      STORAGE_KEYS.TREATMENT_RECORDS,
      JSON.stringify(treatmentRecords)
    );
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));

    if (currentUser) {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(currentUser)
      );
    }
    if (!options.skipBackup) {
      savePersistentBackup();
    }
  } catch (e) {
    console.error('Error saving data to localStorage:', e);
    showNotification(
      'Error saving data locally. Some changes may be lost.',
      'error'
    );
  }
}

function validateDataStructure() {
  let isValid = true;

  if (!Array.isArray(products)) {
    products = [];
    isValid = false;
  }

  if (!Array.isArray(sales)) {
    sales = [];
    isValid = false;
  }

  if (!Array.isArray(deletedSales)) {
    deletedSales = [];
    isValid = false;
  }

  if (!Array.isArray(users)) {
    users = [];
    isValid = false;
  }

  if (!Array.isArray(expenses)) {
    expenses = [];
    isValid = false;
  }

  if (!Array.isArray(purchases)) {
    purchases = [];
    isValid = false;
  }

  if (!Array.isArray(stockAlerts)) {
    stockAlerts = [];
    isValid = false;
  }

  if (!Array.isArray(profitData)) {
    profitData = [];
    isValid = false;
  }

  if (!Array.isArray(finishedProductReports)) {
    finishedProductReports = [];
    isValid = false;
  }

  if (!Array.isArray(customerRequests)) {
    customerRequests = [];
    isValid = false;
  }

  if (!Array.isArray(treatmentRecords)) {
    treatmentRecords = [];
    isValid = false;
  }

  if (!Array.isArray(syncQueue)) {
    syncQueue = [];
    isValid = false;
  }

  if (!settings || typeof settings !== 'object') {
    settings = {
      storeName: STORE_BRANDING.name,
      storeAddress: STORE_BRANDING.address,
      storePhone: STORE_BRANDING.phone,
      lowStockThreshold: 10,
      expiryWarningDays: 90,
    };
    isValid = false;
  }
  applyStoreBranding();

  if (!isValid) {
    saveToLocalStorage();
  }

  return isValid;
}

function normalizePrice(value) {
  const n = Number(value);
  if (!isFinite(n)) return '0.00';
  return n.toFixed(2);
}

function normalizeProductText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function isElementVisible(el) {
  return !!(
    el &&
    el.offsetParent !== null &&
    getComputedStyle(el).visibility !== 'hidden'
  );
}

function isModalCurrentlyOpen() {
  return Array.from(document.querySelectorAll('.modal')).some(
    (modal) => modal && getComputedStyle(modal).display !== 'none'
  );
}

function shouldKeepPosSearchFocused() {
  if (currentPage !== 'pos') return false;
  if (!isElementVisible(appContainer)) return false;
  if (isModalCurrentlyOpen()) return false;
  const active = document.activeElement;
  if (
    active &&
    active !== document.body &&
    active.id !== 'product-search' &&
    active.tagName === 'INPUT' &&
    active.type !== 'hidden'
  ) {
    return false;
  }
  if (
    active &&
    active !== document.body &&
    (active.tagName === 'TEXTAREA' ||
      active.tagName === 'SELECT' ||
      active.isContentEditable)
  ) {
    return false;
  }
  return true;
}

function focusPosSearch(options = {}) {
  const { select = false, defer = false } = options;
  const run = () => {
    const searchInput = document.getElementById('product-search');
    if (!searchInput || !shouldKeepPosSearchFocused()) return;
    try {
      searchInput.focus({ preventScroll: true });
    } catch (_) {
      searchInput.focus();
    }
    if (select && typeof searchInput.select === 'function') {
      searchInput.select();
    }
  };
  if (defer) {
    setTimeout(run, POS_FOCUS_RECOVERY_DELAY_MS);
  } else {
    run();
  }
}

function configurePosInputs() {
  const selectors = [
    ['#product-search', { autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }],
    ['#inventory-search', { autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }],
    ['#purchase-product-search', { autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }],
    ['#finished-product-search', { autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }],
    ['#product-barcode', { autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', inputmode: 'numeric' }],
    ['#product-stock', { inputmode: 'numeric' }],
    ['#product-price', { inputmode: 'decimal' }],
    ['#expense-amount', { inputmode: 'decimal' }],
    ['#purchase-quantity', { inputmode: 'numeric' }],
    ['#purchase-cost-price', { inputmode: 'decimal' }],
    ['#purchase-selling-price', { inputmode: 'decimal' }],
    ['#finished-quantity', { inputmode: 'numeric' }],
    ['#customer-request-quantity', { inputmode: 'numeric' }],
  ];
  selectors.forEach(([selector, attrs]) => {
    const el = document.querySelector(selector);
    if (!el) return;
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  });
}

function resolveExactProductMatch(searchTerm) {
  const normalizedTerm = normalizeProductText(searchTerm);
  if (!normalizedTerm || normalizedTerm.length < POS_BARCODE_MIN_LENGTH) {
    return null;
  }
  const exactMatches = products.filter((product) => {
    if (!product || product.deleted) return false;
    return (
      normalizeProductText(product.barcode) === normalizedTerm ||
      normalizeProductText(product.id) === normalizedTerm ||
      normalizeProductText(product.name) === normalizedTerm
    );
  });
  if (exactMatches.length !== 1) {
    return null;
  }
  return exactMatches[0];
}

function tryHandleDirectProductEntry(searchTerm) {
  const matchedProduct = resolveExactProductMatch(searchTerm);
  if (!matchedProduct) {
    return false;
  }
  addToCart(matchedProduct);
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.value = '';
  }
  applyProductSearch('');
  focusPosSearch({ defer: true });
  return true;
}

function normalizeProductExpiry(value) {
  return (value || '').toString().trim();
}

function getProductExpiryValue(product) {
  return normalizeProductExpiry(
    product && (product.expiryDate || product.expirydate)
  );
}

function matchesProductIdentity(a, b) {
  const aBarcode = normalizeProductText(a && a.barcode);
  const bBarcode = normalizeProductText(b && b.barcode);
  if (aBarcode || bBarcode) {
    return aBarcode === bBarcode;
  }
  return (
    normalizeProductText(a && a.name) === normalizeProductText(b && b.name) &&
    normalizeProductText(a && a.category) ===
      normalizeProductText(b && b.category) &&
    normalizePrice(a && a.price) === normalizePrice(b && b.price) &&
    getProductExpiryValue(a) === getProductExpiryValue(b)
  );
}

function productKeyNCP(p) {
  const barcode = normalizeProductText(p && p.barcode);
  if (barcode) {
    return `barcode:${barcode}`;
  }
  const name = normalizeProductText(p && p.name);
  const category = normalizeProductText(p && p.category);
  const price = normalizePrice(p && p.price);
  const expiry = getProductExpiryValue(p);
  return `${name}|${category}|${price}|${expiry}`;
}

function productSignature(p) {
  return productKeyNCP(p);
}

function matchesProductSearch(product, term) {
  const normalizedTerm = normalizeProductText(term);
  if (!normalizedTerm) return true;
  return [
    product && product.name,
    product && product.category,
    product && product.barcode,
    product && product.id,
  ].some((value) => normalizeProductText(value).includes(normalizedTerm));
}

function mergeProductListsBySignature(...lists) {
  const merged = [];
  const seen = new Set();
  lists.forEach((list) => {
    (Array.isArray(list) ? list : []).forEach((product) => {
      if (!product || product.deleted) return;
      const key = productSignature(product);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(product);
    });
  });
  return merged;
}

async function findMatchingServerProduct(product) {
  if (!product || !product.name || !product.category) return null;
  let query = supabaseClient
    .from('products')
    .select('id,name,category,price,stock,expirydate,barcode,deleted')
    .eq('name', product.name)
    .eq('category', product.category)
    .eq('price', Number(product.price));
  const expiryValue = getProductExpiryValue(product);
  if (expiryValue) {
    query = query.eq('expirydate', expiryValue);
  }
  const { data, error } = await query;
  if (error) throw error;
  const match = (data || []).find((candidate) =>
    matchesProductIdentity(candidate, product)
  );
  if (match && match.expirydate && !match.expiryDate) {
    match.expiryDate = match.expirydate;
  }
  return match || null;
}

function dedupeProducts() {
  try {
    if (!Array.isArray(products)) return;
    const result = [];
    const seenServerIds = new Set();
    const serverSigs = new Set();
    // Keep unique server-backed items first
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p) continue;
      const id = p.id;
      if (id && !String(id).startsWith('temp_')) {
        const sig = productSignature(p);
        if (serverSigs.has(sig)) continue;
        if (seenServerIds.has(id)) continue;
        seenServerIds.add(id);
        serverSigs.add(sig);
        result.push(p);
      }
    }
    // Keep temp items when not exactly covered by a server item signature
    const tempSigs = new Set();
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p) continue;
      const id = p.id;
      if (id && !String(id).startsWith('temp_')) continue;
      const sig = productSignature(p);
      if (serverSigs.has(sig)) continue;
      if (tempSigs.has(sig)) continue;
      tempSigs.add(sig);
      result.push(p);
    }
    products = result;
  } catch (e) {
    console.error('Error de-duplicating products:', e);
  }
}

function dedupeListByKey(list, keyFn) {
  const seen = new Set();
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    const key = keyFn(item);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function purchaseKey(p) {
  if (p && p.id && !String(p.id).startsWith('temp_')) return String(p.id);
  return `${p.date || ''}|${(p.supplier || '').toLowerCase()}|${normalizePrice(
    p.amount
  )}`;
}

function purchaseSignature(p) {
  const normalized = normalizePurchaseRecord(p || {});
  return `${normalized.date || ''}|${String(normalized.supplier || '').toLowerCase()}|${String(
    normalized.description || ''
  ).toLowerCase()}|${normalizePrice(normalized.amount)}`;
}

function expenseKey(e) {
  return `${e.date || ''}|${(e.description || '').toLowerCase()}|${(
    e.category || ''
  ).toLowerCase()}|${normalizePrice(e.amount)}`;
}

function validateSalesData() {
  let isValid = true;

  if (!Array.isArray(sales)) {
    sales = [];
    isValid = false;
  }

  sales.forEach((sale, index) => {
    if (!sale || typeof sale !== 'object') {
      isValid = false;
      return;
    }

    if (!sale.receiptNumber) {
      isValid = false;
    }

    if (!sale.created_at) {
      isValid = false;
    }

    if (typeof sale.total !== 'number' || isNaN(sale.total)) {
      isValid = false;
    }

    if (!Array.isArray(sale.items)) {
      isValid = false;
    }
  });

  if (!isValid) {
    showNotification(
      'Sales data validation failed. Some data may be missing.',
      'warning'
    );
  }

  return isValid;
}

// UI Functions
function formatRoleName(role) {
  const value = (role || '').toString().trim();
  if (!value) return 'User';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function timeStringToMinutes(value) {
  const [hours, minutes] = (value || '').split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return NaN;
  }
  return hours * 60 + minutes;
}

function getCurrentShiftKey(date = new Date()) {
  const definitions =
    (settings && settings.shiftDefinitions) || {};
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  for (const [shiftKey, shiftRange] of Object.entries(definitions)) {
    const start = timeStringToMinutes(shiftRange && shiftRange.start);
    const end = timeStringToMinutes(shiftRange && shiftRange.end);

    if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) {
      continue;
    }

    const isOvernight = start > end;
    const isMatch = isOvernight
      ? currentMinutes >= start || currentMinutes < end
      : currentMinutes >= start && currentMinutes < end;

    if (isMatch) {
      return shiftKey;
    }
  }

  return null;
}

function formatShiftName(shiftKey) {
  if (!shiftKey) return 'Unassigned Shift';
  return (
    shiftKey.charAt(0).toUpperCase() +
    shiftKey.slice(1).toLowerCase() +
    ' Shift'
  );
}

function isCashierUser(user = currentUser) {
  return (user && String(user.role || '').toLowerCase() === 'cashier') || false;
}

function canAccessPage(pageName) {
  if (AuthModule.isAdmin()) return true;
  return !['inventory'].includes(pageName);
}

function canModifyProtectedData() {
  return AuthModule.isAdmin();
}

function updateRoleAccessUI() {
  const inventoryLink = document.querySelector('[data-page="inventory"]');
  const addProductBtn = document.getElementById('add-product-btn');
  const addExpenseBtn = document.getElementById('add-expense-btn');
  const addPurchaseBtn = document.getElementById('add-purchase-btn');

  if (inventoryLink) {
    inventoryLink.style.display = canAccessPage('inventory') ? '' : 'none';
  }

  if (addProductBtn) {
    addProductBtn.style.display = canModifyProtectedData() ? '' : 'none';
  }

  if (addExpenseBtn) {
    addExpenseBtn.style.display = canModifyProtectedData() ? '' : 'none';
  }

  if (addPurchaseBtn) {
    addPurchaseBtn.style.display = canModifyProtectedData() ? '' : 'none';
  }
}

function updateCurrentUserShiftUI() {
  const accountShiftRow = document.getElementById('user-shift-row');
  const accountShiftDisplay = document.getElementById('user-shift-display');
  const roleText = formatRoleName(currentUser && currentUser.role);

  if (currentUserEl) {
    currentUserEl.textContent = (currentUser && currentUser.name) || 'User';
  }

  if (userRoleEl) {
    userRoleEl.textContent = roleText;
  }

  if (!currentUser || !isCashierUser(currentUser)) {
    if (userShiftEl) userShiftEl.style.display = 'none';
    if (accountShiftRow) accountShiftRow.style.display = 'none';
    if (accountShiftDisplay) accountShiftDisplay.textContent = '-';
    return;
  }

  const currentShift = formatShiftName(getCurrentShiftKey());

  if (userShiftEl) {
    userShiftEl.textContent = currentShift;
    userShiftEl.style.display = 'inline-flex';
  }

  if (accountShiftRow) {
    accountShiftRow.style.display = 'flex';
  }

  if (accountShiftDisplay) {
    accountShiftDisplay.textContent = currentShift;
  }
}

function stopShiftClock() {
  if (currentShiftTimer) {
    clearInterval(currentShiftTimer);
    currentShiftTimer = null;
  }
}

function startShiftClock() {
  stopShiftClock();
  updateCurrentUserShiftUI();

  if (isCashierUser()) {
    currentShiftTimer = setInterval(() => {
      updateCurrentUserShiftUI();
    }, 60000);
  }
}

function showLogin() {
  stopShiftClock();
  loginPage.style.display = 'flex';
  appContainer.style.display = 'none';
  if (notification && loginPage && notification.parentElement !== loginPage) {
    loginPage.appendChild(notification);
  }
  customerDisplayLastSale = null;
  syncCustomerDisplayState();
}

function initChangePasswordForm() {
  if (currentUser && currentUser.email) {
    const changePasswordForm = document.getElementById('change-password-form');
    if (
      changePasswordForm &&
      !document.getElementById('change-password-username')
    ) {
      const usernameField = document.createElement('input');
      usernameField.type = 'email';
      usernameField.id = 'change-password-username';
      usernameField.name = 'username';
      usernameField.value = currentUser.email;
      usernameField.style.display = 'none';
      usernameField.setAttribute('aria-hidden', 'true');
      usernameField.setAttribute('tabindex', '-1');
      usernameField.setAttribute('autocomplete', 'username');

      changePasswordForm.insertBefore(
        usernameField,
        changePasswordForm.firstChild
      );
    }
  }
}

async function showApp() {
  loginPage.style.display = 'none';
  appContainer.style.display = 'flex';
  if (notification && notification.parentElement !== document.body) {
    document.body.appendChild(notification);
  }

  if (currentUser) {
    startShiftClock();
    updateRoleAccessUI();

    const usersContainer = document.getElementById('users-container');
    if (usersContainer) {
      usersContainer.style.display = AuthModule.isAdmin() ? 'block' : 'none';
    }

    const addProductBtns = document.querySelectorAll('.add-product-btn');
    addProductBtns.forEach((btn) => {
      btn.style.display = AuthModule.isAdmin() ? 'block' : 'none';
    });

    initChangePasswordForm();
  }

  try {
    const localBefore = Array.isArray(products) ? products.slice() : [];
    // Fetch products and sales in parallel
    const [productsResult, salesResult] = await Promise.allSettled([
      DataModule.fetchAllProducts(),
      DataModule.fetchSales(),
    ]);

    if (productsResult.status === 'fulfilled') {
      const fetched = Array.isArray(productsResult.value)
        ? productsResult.value
        : [];
      const fallbackHasLocal =
        Array.isArray(localBefore) && localBefore.length > 0;
      products =
        fetched.length === 0 && fallbackHasLocal ? localBefore : fetched;
    } else {
      const fallbackHasLocal =
        Array.isArray(localBefore) && localBefore.length > 0;
      if (fallbackHasLocal) products = localBefore;
    }

    if (salesResult.status === 'fulfilled') {
      sales = salesResult.value;
    } else {
      validateSalesData();
    }

    {
      const deletedSalesResult = await DataModule.fetchDeletedSales();
      if (deletedSalesResult) {
        deletedSales = deletedSalesResult;
      }
    }

    // Load expenses and purchases
    if (expenses.length === 0) {
      await DataModule.fetchExpenses();
    }

    if (purchases.length === 0) {
      await DataModule.fetchPurchases();
    }

    await DataModule.fetchCategories();

    scheduleRender(() => checkAndGenerateAlerts());

    loadProducts();
    loadSales();
    setupRealtimeListeners();
    try {
      generateReport();
    } catch (_) {}
  } catch (error) {
    console.error('Error loading initial data:', error);
    showNotification('Error loading data. Using offline cache.', 'warning');

    await DataModule.fetchCategories();
    loadProducts();
    loadSales();
    setupRealtimeListeners();
    try {
      generateReport();
    } catch (_) {}
  }
  syncCustomerDisplayState();
}

function showNotification(message, type = 'success') {
  notificationMessage.textContent = message;
  notification.className = `notification ${type} show`;

  const icon = notification.querySelector('i');
  icon.className =
    type === 'success'
      ? 'fas fa-check-circle'
      : type === 'error'
      ? 'fas fa-exclamation-circle'
      : type === 'warning'
      ? 'fas fa-exclamation-triangle'
      : 'fas fa-info-circle';

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

function showInstallPromptNotification() {
  notificationMessage.textContent = 'Install this app';
  notification.className = 'notification info show';
  const icon = notification.querySelector('i');
  icon.className = 'fas fa-download';
  notification.onclick = async () => {
    try {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (installBtn) installBtn.style.display = 'none';
        }
        deferredPrompt = null;
      } else {
        showNotification('Use browser menu to install this app', 'info');
      }
    } finally {
      notification.classList.remove('show');
      notification.onclick = null;
    }
  };
  setTimeout(() => {
    notification.classList.remove('show');
    notification.onclick = null;
  }, 10000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date, short = false) {
  if (!date) return '-';

  if (typeof date === 'string') {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return '-';
    }

    if (short) {
      return d.toLocaleDateString();
    }

    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '-';
  }

  if (short) {
    return d.toLocaleDateString();
  }

  return (
    d.toLocaleDateString() +
    ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

function generateLocalId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getActiveProductsSorted() {
  return (Array.isArray(products) ? products : [])
    .filter((product) => product && !product.deleted)
    .slice()
    .sort((a, b) =>
      (a.name || '').toString().localeCompare((b.name || '').toString())
    );
}

function getFinishedInventoryItems() {
  return getActiveProductsSorted().filter((product) => Number(product.stock) <= 0);
}

function getLowStockInventoryItems() {
  return getActiveProductsSorted().filter((product) => {
    const stock = Number(product.stock) || 0;
    return stock > 0 && stock <= settings.lowStockThreshold;
  });
}

function getFinishedProductSearchTerm() {
  const searchInput = document.getElementById('finished-product-search');
  return searchInput ? searchInput.value.trim().toLowerCase() : '';
}

function updateFinishedProductSearchFeedback(message, type = 'info') {
  const feedback = document.getElementById('finished-product-search-feedback');
  if (!feedback) return;

  feedback.textContent = message;
  feedback.style.color =
    type === 'success'
      ? 'var(--success-color)'
      : type === 'error'
      ? 'var(--accent-color)'
      : 'var(--gray-color)';
}

function populateFinishedProductOptions(searchTerm = '') {
  const select = document.getElementById('finished-product-select');
  if (!select) return;

  const activeProducts = getActiveProductsSorted();
  const normalizedSearchTerm = (searchTerm || '').trim().toLowerCase();
  const filteredProducts = normalizedSearchTerm
    ? activeProducts.filter((product) => {
        const haystack = [
          product.name || '',
          product.category || '',
          product.barcode || '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearchTerm);
      })
    : activeProducts;
  const previousValue = select.value;
  select.innerHTML = '';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent =
    filteredProducts.length > 0 ? 'Select product' : 'No matching products';
  select.appendChild(placeholderOption);

  filteredProducts.forEach((product) => {
    const option = document.createElement('option');
    option.value = String(product.id || '');
    option.textContent = `${product.name || 'Unnamed Product'} (${Number(
      product.stock
    ) || 0} in stock)`;
    select.appendChild(option);
  });

  if (
    previousValue &&
    filteredProducts.some((product) => String(product.id) === previousValue)
  ) {
    select.value = previousValue;
  }

  if (!normalizedSearchTerm) {
    updateFinishedProductSearchFeedback(
      activeProducts.length > 0
        ? 'Search to quickly narrow the product list.'
        : 'No products available yet.'
    );
    return;
  }

  if (!filteredProducts.length) {
    updateFinishedProductSearchFeedback(
      `No product found for "${searchTerm}".`,
      'error'
    );
    return;
  }

  const exactMatch = filteredProducts.find((product) => {
    const productName = (product.name || '').toString().trim().toLowerCase();
    const barcode = (product.barcode || '').toString().trim().toLowerCase();
    return (
      productName === normalizedSearchTerm || barcode === normalizedSearchTerm
    );
  });
  const selectedProduct = exactMatch || filteredProducts[0];
  if (selectedProduct) {
    select.value = String(selectedProduct.id || '');
  }

  updateFinishedProductSearchFeedback(
    `${filteredProducts.length} product${
      filteredProducts.length === 1 ? '' : 's'
    } found. ${
      selectedProduct ? `${selectedProduct.name} selected.` : ''
    }`,
    'success'
  );
}

function handleFinishedProductSearch() {
  populateFinishedProductOptions(getFinishedProductSearchTerm());
}

function createRequestBadge(statusText, className) {
  const badge = document.createElement('span');
  badge.className = `request-badge ${className}`;
  badge.textContent = statusText;
  return badge;
}

function normalizeTreatmentStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return 'completed';
  if (normalized === 'followup_due') return 'followup_due';
  return normalized === 'active' ? 'active' : '';
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTreatmentFollowUpState(record) {
  if (!record || !record.followUpDate) return 'none';
  const followUpDate = new Date(record.followUpDate);
  if (isNaN(followUpDate.getTime())) return 'none';

  const today = new Date(getTodayDateString());
  if (followUpDate < today) return 'overdue';
  if (followUpDate.getTime() === today.getTime()) return 'due_today';
  return 'upcoming';
}

function getEffectiveTreatmentStatus(record) {
  const baseStatus = normalizeTreatmentStatus(record && record.status);
  if (baseStatus === 'completed') return 'completed';
  const followUpState = getTreatmentFollowUpState(record);
  if (followUpState === 'overdue' || followUpState === 'due_today') {
    return 'followup_due';
  }
  return baseStatus || 'active';
}

function createTreatmentStatusBadge(status) {
  const badge = document.createElement('span');
  badge.className = `treatment-status-badge ${status}`;
  badge.textContent =
    status === 'completed'
      ? 'Completed'
      : status === 'followup_due'
      ? 'Follow-up Due'
      : 'Active';
  return badge;
}

function sortTreatmentRecords(list) {
  return list.slice().sort((a, b) => {
    const aDate = new Date(a.treatmentDate || a.createdAt || 0).getTime();
    const bDate = new Date(b.treatmentDate || b.createdAt || 0).getTime();
    return bDate - aDate;
  });
}

function getFilteredTreatmentRecords() {
  const searchInput = document.getElementById('treatment-search');
  const statusFilter = document.getElementById('treatment-status-filter');
  const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const filterStatus = normalizeTreatmentStatus(
    statusFilter ? statusFilter.value : ''
  );

  return sortTreatmentRecords(
    treatmentRecords.filter((record) => {
      const effectiveStatus = getEffectiveTreatmentStatus(record);
      if (filterStatus && effectiveStatus !== filterStatus) return false;
      if (!searchTerm) return true;

      const haystack = [
        record.patientName || '',
        record.patientPhone || '',
        record.treatmentTitle || '',
        record.medication || '',
        record.notes || '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    })
  );
}

function updateTreatmentSummary() {
  const totalEl = document.getElementById('treatments-total-count');
  const activeEl = document.getElementById('treatments-active-count');
  const dueEl = document.getElementById('treatments-followup-due-count');
  const completedEl = document.getElementById('treatments-completed-count');

  let activeCount = 0;
  let dueCount = 0;
  let completedCount = 0;

  treatmentRecords.forEach((record) => {
    const status = getEffectiveTreatmentStatus(record);
    if (status === 'completed') {
      completedCount += 1;
    } else if (status === 'followup_due') {
      dueCount += 1;
    } else {
      activeCount += 1;
    }
  });

  if (totalEl) totalEl.textContent = String(treatmentRecords.length);
  if (activeEl) activeEl.textContent = String(activeCount);
  if (dueEl) dueEl.textContent = String(dueCount);
  if (completedEl) completedEl.textContent = String(completedCount);
}

function renderTreatmentFollowUpList() {
  const container = document.getElementById('treatment-followup-list');
  if (!container) return;

  const followUps = sortTreatmentRecords(
    treatmentRecords.filter(
      (record) =>
        getEffectiveTreatmentStatus(record) !== 'completed' && record.followUpDate
    )
  ).slice(0, 6);

  container.innerHTML = '';

  if (!followUps.length) {
    const emptyText = document.createElement('p');
    emptyText.className = 'request-empty';
    emptyText.textContent = 'No follow-up reminders yet';
    container.appendChild(emptyText);
    return;
  }

  followUps.forEach((record) => {
    const wrapper = document.createElement('div');
    const followUpState = getTreatmentFollowUpState(record);
    wrapper.className = `treatment-followup-item${
      followUpState === 'overdue' ? ' overdue' : ''
    }`;

    const textWrap = document.createElement('div');
    textWrap.className = 'treatment-followup-text';

    const title = document.createElement('strong');
    title.textContent = record.patientName || 'Unnamed Patient';
    textWrap.appendChild(title);

    const details = document.createElement('span');
    details.textContent = `${record.treatmentTitle || 'Treatment'} | Follow-up: ${formatDate(
      record.followUpDate,
      true
    )}`;
    textWrap.appendChild(details);

    const helper = document.createElement('span');
    helper.textContent =
      followUpState === 'overdue'
        ? 'Attention needed: follow-up date has passed.'
        : followUpState === 'due_today'
        ? 'Follow-up is due today.'
        : 'Upcoming follow-up scheduled.';
    textWrap.appendChild(helper);

    wrapper.appendChild(textWrap);
    wrapper.appendChild(
      createTreatmentStatusBadge(getEffectiveTreatmentStatus(record))
    );
    container.appendChild(wrapper);
  });
}

function renderTreatmentsTable(records = getFilteredTreatmentRecords()) {
  const tableBody = document.getElementById('treatments-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!records.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 9;
    cell.style.textAlign = 'center';
    cell.textContent = 'No treatment records available';
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  records.forEach((record) => {
    const row = document.createElement('tr');
    const values = [
      formatDate(record.treatmentDate, true),
      record.patientName || '-',
      record.patientPhone || '-',
      record.treatmentTitle || '-',
      record.medication || '-',
      record.followUpDate ? formatDate(record.followUpDate, true) : '-',
    ];

    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    const statusCell = document.createElement('td');
    statusCell.appendChild(
      createTreatmentStatusBadge(getEffectiveTreatmentStatus(record))
    );
    row.appendChild(statusCell);

    const noteCell = document.createElement('td');
    noteCell.textContent = record.notes || '-';
    row.appendChild(noteCell);

    const actionCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'request-action-group';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'btn btn-outline btn-sm';
    toggleButton.textContent =
      getEffectiveTreatmentStatus(record) === 'completed'
        ? 'Reopen'
        : 'Mark Completed';
    toggleButton.dataset.action = 'toggle-treatment-status';
    toggleButton.dataset.id = record.id;
    actions.appendChild(toggleButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.textContent = 'Delete';
    deleteButton.dataset.action = 'delete-treatment-record';
    deleteButton.dataset.id = record.id;
    actions.appendChild(deleteButton);

    actionCell.appendChild(actions);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

function loadTreatmentsPage() {
  const treatmentDateInput = document.getElementById('treatment-date');
  if (treatmentDateInput && !treatmentDateInput.value) {
    treatmentDateInput.value = getTodayDateString();
  }

  updateTreatmentSummary();
  renderTreatmentFollowUpList();
  renderTreatmentsTable();
}

function saveTreatmentRecord(event) {
  event.preventDefault();

  const patientNameInput = document.getElementById('treatment-patient-name');
  const patientPhoneInput = document.getElementById('treatment-patient-phone');
  const treatmentDateInput = document.getElementById('treatment-date');
  const treatmentTitleInput = document.getElementById('treatment-title');
  const medicationInput = document.getElementById('treatment-medication');
  const notesInput = document.getElementById('treatment-notes');
  const followUpDateInput = document.getElementById('treatment-followup-date');
  const statusInput = document.getElementById('treatment-status');

  const patientName = patientNameInput ? patientNameInput.value.trim() : '';
  const treatmentTitle = treatmentTitleInput
    ? treatmentTitleInput.value.trim()
    : '';
  const treatmentDate = treatmentDateInput ? treatmentDateInput.value.trim() : '';

  if (!patientName || !treatmentTitle || !treatmentDate) {
    showNotification('Enter patient name, treatment, and date', 'error');
    return;
  }

  treatmentRecords.unshift({
    id: generateLocalId('treatment'),
    patientName,
    patientPhone: patientPhoneInput ? patientPhoneInput.value.trim() : '',
    treatmentDate,
    treatmentTitle,
    medication: medicationInput ? medicationInput.value.trim() : '',
    notes: notesInput ? notesInput.value.trim() : '',
    followUpDate: followUpDateInput ? followUpDateInput.value.trim() : '',
    status: normalizeTreatmentStatus(statusInput ? statusInput.value : '') || 'active',
    recordedBy: (currentUser && currentUser.name) || 'Store User',
    createdAt: new Date().toISOString(),
  });

  saveToLocalStorage();
  if (event.target && typeof event.target.reset === 'function') {
    event.target.reset();
  }
  if (treatmentDateInput) treatmentDateInput.value = getTodayDateString();
  if (statusInput) statusInput.value = 'active';

  loadTreatmentsPage();
  showNotification('Treatment record saved successfully', 'success');
}

function toggleTreatmentRecordStatus(recordId) {
  treatmentRecords = treatmentRecords.map((record) => {
    if (record.id !== recordId) return record;
    return {
      ...record,
      status:
        getEffectiveTreatmentStatus(record) === 'completed'
          ? 'active'
          : 'completed',
    };
  });

  saveToLocalStorage();
  loadTreatmentsPage();
  showNotification('Treatment status updated', 'success');
}

function deleteTreatmentRecord(recordId) {
  treatmentRecords = treatmentRecords.filter((record) => record.id !== recordId);
  saveToLocalStorage();
  loadTreatmentsPage();
  showNotification('Treatment record removed', 'success');
}

function filterTreatments() {
  renderTreatmentsTable(getFilteredTreatmentRecords());
}

function renderInventoryStatusList(targetId, items, mode) {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = '';

  if (!items.length) {
    const emptyText = document.createElement('p');
    emptyText.className = 'request-empty';
    emptyText.textContent =
      mode === 'finished'
        ? 'No finished items in inventory'
        : 'No low stock items in inventory';
    container.appendChild(emptyText);
    return;
  }

  items.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = `request-status-item ${mode}`;

    const textWrap = document.createElement('div');
    textWrap.className = 'request-status-text';

    const title = document.createElement('strong');
    title.textContent = item.name || 'Unnamed Product';
    textWrap.appendChild(title);

    const details = document.createElement('span');
    details.textContent =
      mode === 'finished'
        ? `Category: ${item.category || 'Uncategorized'} â€¢ Stock: ${Number(
            item.stock
          ) || 0}`
        : `Category: ${item.category || 'Uncategorized'} â€¢ Remaining: ${
            Number(item.stock) || 0
          } / ${settings.lowStockThreshold}`;
    textWrap.appendChild(details);

    wrapper.appendChild(textWrap);
    wrapper.appendChild(
      createRequestBadge(
        mode === 'finished' ? 'Finished' : 'Low Stock',
        mode === 'finished' ? 'finished' : 'low'
      )
    );
    container.appendChild(wrapper);
  });
}

function renderFinishedProductReportsTable() {
  const tableBody = document.getElementById('finished-products-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!finishedProductReports.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.style.textAlign = 'center';
    cell.textContent = 'No finished products recorded';
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  finishedProductReports
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .forEach((report) => {
      const row = document.createElement('tr');
      const values = [
        formatDate(report.createdAt),
        report.productName || '-',
        String(report.quantity || 0),
        report.reportedBy || '-',
        report.note || '-',
      ];

      values.forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actionCell = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'request-action-group';

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'btn btn-danger btn-sm';
      deleteButton.textContent = 'Delete';
      deleteButton.dataset.action = 'delete-finished-report';
      deleteButton.dataset.id = report.id;
      actions.appendChild(deleteButton);

      actionCell.appendChild(actions);
      row.appendChild(actionCell);
      tableBody.appendChild(row);
    });
}

function renderCustomerRequestsTable() {
  const tableBody = document.getElementById('customer-requests-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!customerRequests.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.style.textAlign = 'center';
    cell.textContent = 'No customer requests recorded';
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  customerRequests
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .forEach((request) => {
      const row = document.createElement('tr');
      const values = [
        formatDate(request.createdAt),
        request.itemName || '-',
        request.customerName || '-',
        String(request.quantity || 0),
      ];

      values.forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });

      const statusCell = document.createElement('td');
      statusCell.appendChild(
        createRequestBadge(
          request.status === 'fulfilled' ? 'Fulfilled' : 'Open',
          request.status === 'fulfilled' ? 'fulfilled' : 'open'
        )
      );
      row.appendChild(statusCell);

      const noteCell = document.createElement('td');
      noteCell.textContent = request.note || '-';
      row.appendChild(noteCell);

      const actionCell = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'request-action-group';

      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = 'btn btn-outline btn-sm';
      toggleButton.textContent =
        request.status === 'fulfilled' ? 'Reopen' : 'Mark Fulfilled';
      toggleButton.dataset.action = 'toggle-customer-request';
      toggleButton.dataset.id = request.id;
      actions.appendChild(toggleButton);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'btn btn-danger btn-sm';
      deleteButton.textContent = 'Delete';
      deleteButton.dataset.action = 'delete-customer-request';
      deleteButton.dataset.id = request.id;
      actions.appendChild(deleteButton);

      actionCell.appendChild(actions);
      row.appendChild(actionCell);
      tableBody.appendChild(row);
    });
}

function updateRequestsSummary() {
  const finishedCount = document.getElementById('requests-finished-count');
  const customerCount = document.getElementById('requests-customer-count');
  const outOfStockCount = document.getElementById('requests-out-of-stock-count');
  const lowStockCount = document.getElementById('requests-low-stock-count');

  if (finishedCount) {
    finishedCount.textContent = String(finishedProductReports.length);
  }
  if (customerCount) {
    customerCount.textContent = String(customerRequests.length);
  }
  if (outOfStockCount) {
    outOfStockCount.textContent = String(getFinishedInventoryItems().length);
  }
  if (lowStockCount) {
    lowStockCount.textContent = String(getLowStockInventoryItems().length);
  }
}

function loadRequestsPage() {
  populateFinishedProductOptions(getFinishedProductSearchTerm());
  updateRequestsSummary();
  renderFinishedProductReportsTable();
  renderCustomerRequestsTable();
  renderInventoryStatusList(
    'requests-out-of-stock-list',
    getFinishedInventoryItems(),
    'finished'
  );
  renderInventoryStatusList(
    'requests-low-stock-list',
    getLowStockInventoryItems(),
    'low'
  );
}

function saveFinishedProductReport(event) {
  event.preventDefault();

  const productSelect = document.getElementById('finished-product-select');
  const quantityInput = document.getElementById('finished-quantity');
  const noteInput = document.getElementById('finished-note');

  const selectedProductId = productSelect ? productSelect.value : '';
  const quantity = Math.max(1, Number(quantityInput ? quantityInput.value : 1) || 1);
  const note = noteInput ? noteInput.value.trim() : '';

  const selectedProduct = getActiveProductsSorted().find(
    (product) => String(product.id) === selectedProductId
  );

  if (!selectedProduct) {
    showNotification('Select a valid product to record', 'error');
    return;
  }

  finishedProductReports.unshift({
    id: generateLocalId('finished'),
    productId: selectedProduct.id,
    productName: selectedProduct.name || 'Unnamed Product',
    quantity,
    note,
    reportedBy: (currentUser && currentUser.name) || 'Store User',
    createdAt: new Date().toISOString(),
  });

  saveToLocalStorage();
  if (event.target && typeof event.target.reset === 'function') {
    event.target.reset();
  }
  updateFinishedProductSearchFeedback('Search to quickly narrow the product list.');
  if (quantityInput) quantityInput.value = '1';
  loadRequestsPage();
  showNotification('Finished product recorded successfully', 'success');
}

function saveCustomerRequest(event) {
  event.preventDefault();

  const itemInput = document.getElementById('customer-request-item');
  const customerInput = document.getElementById('customer-request-customer');
  const quantityInput = document.getElementById('customer-request-quantity');
  const noteInput = document.getElementById('customer-request-note');

  const itemName = itemInput ? itemInput.value.trim() : '';
  const customerName = customerInput ? customerInput.value.trim() : '';
  const quantity = Math.max(1, Number(quantityInput ? quantityInput.value : 1) || 1);
  const note = noteInput ? noteInput.value.trim() : '';

  if (!itemName) {
    showNotification('Enter the item the customer requested', 'error');
    return;
  }

  customerRequests.unshift({
    id: generateLocalId('request'),
    itemName,
    customerName,
    quantity,
    note,
    status: 'open',
    createdAt: new Date().toISOString(),
    recordedBy: (currentUser && currentUser.name) || 'Store User',
  });

  saveToLocalStorage();
  if (event.target && typeof event.target.reset === 'function') {
    event.target.reset();
  }
  if (quantityInput) quantityInput.value = '1';
  loadRequestsPage();
  showNotification('Customer request saved successfully', 'success');
}

function deleteFinishedProductReport(reportId) {
  finishedProductReports = finishedProductReports.filter(
    (report) => report.id !== reportId
  );
  saveToLocalStorage();
  loadRequestsPage();
  showNotification('Finished product report removed', 'success');
}

function toggleCustomerRequest(requestId) {
  customerRequests = customerRequests.map((request) => {
    if (request.id !== requestId) return request;
    return {
      ...request,
      status: request.status === 'fulfilled' ? 'open' : 'fulfilled',
    };
  });
  saveToLocalStorage();
  loadRequestsPage();
  showNotification('Customer request updated', 'success');
}

function deleteCustomerRequest(requestId) {
  customerRequests = customerRequests.filter((request) => request.id !== requestId);
  saveToLocalStorage();
  loadRequestsPage();
  showNotification('Customer request removed', 'success');
}

function scheduleRender(fn) {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(fn);
  } else {
    setTimeout(fn, 0);
  }
}

function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `R${year}${month}${day}${random}`;
}

// Page Navigation
function showPage(pageName) {
  if (!canAccessPage(pageName)) {
    showNotification('Only admins can access inventory', 'error');
    pageName = 'pos';
  }

  pageContents.forEach((page) => {
    page.style.display = 'none';
  });

  const selectedPage = document.getElementById(`${pageName}-page`);
  if (selectedPage) {
    selectedPage.style.display = 'block';
  }

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('data-page') === pageName) {
      link.classList.add('active');
    }
  });

  const titles = {
    pos: 'Point of Sale',
    inventory: 'Inventory & Expenses',
    stock: 'Stock Check',
    reports: 'Sales Reports',
    expenses: 'Expense Management',
    purchases: 'Purchase Management',
    'profit-loss': 'Profit & Loss Report',
    requests: 'Customer Requests & Finished Products',
    treatments: 'Patient Treatment & Follow-up',
    account: 'My Account',
  };

  pageTitle.textContent = titles[pageName] || 'PURELA PHARMACY';
  currentPage = pageName;

  if (pageName === 'inventory') {
    loadInventory();
    loadExpenses();
  } else if (pageName === 'stock') {
    loadStockCheck();
  } else if (pageName === 'reports') {
    loadReports();
  } else if (pageName === 'account') {
    loadAccount();
  } else if (pageName === 'expenses') {
    loadExpenses();
  } else if (pageName === 'purchases') {
    loadPurchases();
  } else if (pageName === 'profit-loss') {
    loadProfitLossReport();
  } else if (pageName === 'requests') {
    loadRequestsPage();
  } else if (pageName === 'treatments') {
    loadTreatmentsPage();
  }

  if (pageName === 'pos') {
    focusPosSearch({ defer: true, select: true });
  }
}

function mergeExpensesIntoInventory() {
  const workspace = document.getElementById('inventory-expenses-workspace');
  const expensesPage = document.getElementById('expenses-page');
  const expensePanel = expensesPage && expensesPage.querySelector('.inventory-container');
  if (!workspace || !expensePanel || workspace.contains(expensePanel)) return;

  expensePanel.classList.add('inventory-expense-panel');
  const heading = expensePanel.querySelector('.inventory-header h3');
  if (heading) heading.textContent = 'Expense Records';
  workspace.appendChild(expensePanel);
}

function loadStockCheck() {
  const loading = document.getElementById('stock-loading');
  if (loading) loading.style.display = isOnline ? 'flex' : 'none';
  const banner = document.getElementById('stock-check-banner');
  const tableBody = document.getElementById('stock-table-body');
  const totalItemsEl = document.getElementById('stock-total-items');
  const render = () => {
    const list = (Array.isArray(products) ? products : []).filter(
      (p) => p && !p.deleted
    );
    const sorted = list.slice().sort((a, b) => {
      const ac = (a.category || 'Uncategorized').toString().toLowerCase();
      const bc = (b.category || 'Uncategorized').toString().toLowerCase();
      if (ac !== bc) return ac.localeCompare(bc);
      const an = (a.name || '').toString().toLowerCase();
      const bn = (b.name || '').toString().toLowerCase();
      return an.localeCompare(bn);
    });
    if (sorted.length === 0) {
      if (tableBody) {
        tableBody.innerHTML =
          '<tr><td colspan="4" style="text-align: center;">No products</td></tr>';
      }
      if (totalItemsEl) totalItemsEl.textContent = '0';
    } else {
      let html = '';
      const chunk = 200;
      let idx = 0;
      let lastCat = null;
      if (tableBody) tableBody.innerHTML = '';
      function renderChunk() {
        for (let i = 0; i < chunk && idx < sorted.length; i++, idx++) {
          const p = sorted[idx];
          const cat = (p.category || 'Uncategorized').toString();
          if (cat !== lastCat) {
            html += `<tr class="category-header"><td colspan="4">${cat}</td></tr>`;
            lastCat = cat;
          }
          html += `
            <tr>
              <td>${p.name}</td>
              <td>${Number(p.stock) || 0}</td>
              <td class="stock-physical-cell"></td>
              <td class="stock-notes-cell"></td>
            </tr>`;
        }
        if (html && tableBody) {
          tableBody.insertAdjacentHTML('beforeend', html);
          html = '';
        }
        if (idx < sorted.length) {
          if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(renderChunk, { timeout: 100 });
          } else {
            requestAnimationFrame(renderChunk);
          }
        }
      }
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(renderChunk, { timeout: 100 });
      } else {
        requestAnimationFrame(renderChunk);
      }
      if (totalItemsEl) totalItemsEl.textContent = String(sorted.length);
    }
    if (loading) loading.style.display = 'none';
  };
  const today = new Date();
  const day = today.getDay();
  const isThursday = day === 4;
  if (banner) {
    if (isThursday) {
      banner.textContent = 'Today is Thursday: Weekly Stock Check';
    } else {
      const next = new Date(today);
      const diff = (4 - day + 7) % 7 || 7;
      next.setDate(today.getDate() + diff);
      banner.textContent = 'Next Thursday: ' + next.toISOString().split('T')[0];
    }
  }
  if (isOnline) {
    DataModule.fetchAllProducts()
      .then(() => render())
      .catch(() => render());
  } else {
    render();
  }
}

function getStockCheckProducts() {
  return (Array.isArray(products) ? products : [])
    .filter((p) => p && !p.deleted)
    .slice()
    .sort((a, b) => {
      const ac = (a.category || 'Uncategorized').toString().toLowerCase();
      const bc = (b.category || 'Uncategorized').toString().toLowerCase();
      if (ac !== bc) return ac.localeCompare(bc);
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
}

function printStockCheck() {
  const sorted = getStockCheckProducts();
  const title = document.getElementById('stock-check-banner')?.textContent || 'Stock Check';
  const printedAt = new Date().toLocaleString();
  let rows = '';
  let lastCat = null;

  sorted.forEach((product) => {
    const cat = (product.category || 'Uncategorized').toString();
    if (cat !== lastCat) {
      rows += `<tr class="category-row"><td colspan="4">${cat}</td></tr>`;
      lastCat = cat;
    }
    rows += `
      <tr>
        <td>${escapeHtml(product.name || 'Unnamed Product')}</td>
        <td>${Number(product.stock) || 0}</td>
        <td></td>
        <td></td>
      </tr>`;
  });

  const printWindow = window.open('', '_blank', 'width=1000,height=700');
  if (!printWindow) {
    showNotification('Allow pop-ups to print the stock sheet', 'warning');
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Physical Stock Check</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
          h1 { margin: 0 0 4px; font-size: 22px; }
          p { margin: 0 0 16px; color: #444; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #333; padding: 7px; text-align: left; min-height: 28px; }
          th { background: #f0f0f0; }
          .category-row td { background: #e8eef7; font-weight: 700; }
          @media print { body { margin: 10mm; } }
        </style>
      </head>
      <body>
        <h1>Physical Stock Check</h1>
        <p>${escapeHtml(title)} | Printed: ${escapeHtml(printedAt)} | Products: ${sorted.length}</p>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>System Qty</th>
              <th>Physical Qty Available</th>
              <th>Difference / Notes</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="4">No products</td></tr>'}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213',
  '122312', '132212', '221213', '221312', '231212', '112232', '122132',
  '122231', '113222', '123122', '123221', '223211', '221132', '221231',
  '213212', '223112', '312131', '311222', '321122', '321221', '312212',
  '322112', '322211', '212123', '212321', '232121', '111323', '131123',
  '131321', '112313', '132113', '132311', '211313', '231113', '231311',
  '112133', '112331', '132131', '113123', '113321', '133121', '313121',
  '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111',
  '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114',
  '413111', '241112', '134111', '111242', '121142', '121241', '114212',
  '124112', '124211', '411212', '421112', '421211', '212141', '214121',
  '412121', '111143', '111341', '131141', '114113', '114311', '411113',
  '411311', '113141', '114131', '311141', '411131', '211412', '211214',
  '211232', '2331112',
];

function generateUniqueProductBarcode(currentProductId = '') {
  const existing = new Set(
    (Array.isArray(products) ? products : [])
      .filter((product) => String(product.id || '') !== String(currentProductId || ''))
      .map((product) => String(product.barcode || '').trim())
      .filter(Boolean)
  );

  for (let attempt = 0; attempt < 100; attempt++) {
    const body = String((Date.now() + attempt) % 1000000000).padStart(9, '0');
    const random = String(Math.floor(Math.random() * 10));
    const candidate = `63${body}${random}`;
    if (!existing.has(candidate)) return candidate;
  }

  return `63${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function getCode128Values(value) {
  const text = String(value || '').trim();
  if (!text) return [];

  const values = [104];
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 32 || code > 126) {
      throw new Error('Barcode can only contain standard letters, numbers, and symbols.');
    }
    values.push(code - 32);
  }

  let checksum = values[0];
  for (let index = 1; index < values.length; index++) {
    checksum += values[index] * index;
  }
  values.push(checksum % 103, 106);
  return values;
}

function createCode128Svg(value) {
  const values = getCode128Values(value);
  if (!values.length) return '';

  let x = 10;
  let bars = '';
  values.forEach((code) => {
    const pattern = CODE128_PATTERNS[code];
    let drawBar = true;
    for (const widthText of pattern) {
      const width = Number(widthText);
      if (drawBar) {
        bars += `<rect x="${x}" y="0" width="${width}" height="54"></rect>`;
      }
      x += width;
      drawBar = !drawBar;
    }
  });

  const totalWidth = x + 10;
  return `<svg class="barcode-svg" viewBox="0 0 ${totalWidth} 54" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Barcode ${escapeHtml(value)}">${bars}</svg>`;
}

function getProductById(productId) {
  return (Array.isArray(products) ? products : []).find(
    (product) => String(product.id) === String(productId)
  );
}

async function persistGeneratedProductBarcode(product) {
  if (!product) return;
  saveToLocalStorage();

  if (!isOnline || String(product.id || '').startsWith('temp_')) {
    addToSyncQueue({ type: 'saveProduct', data: product });
    return;
  }

  try {
    const { error } = await runRemote(
      supabaseClient
        .from('products')
        .update({ barcode: product.barcode })
        .eq('id', product.id),
      'Sync generated barcode',
      REMOTE_WRITE_TIMEOUT_MS
    );
    if (error) throw error;
  } catch (error) {
    console.warn('Could not sync generated barcode immediately:', error);
    addToSyncQueue({ type: 'saveProduct', data: product });
  }
}

async function ensureProductBarcode(product) {
  if (!product) return '';
  const existing = String(product.barcode || '').trim();
  if (existing) return existing;

  product.barcode = generateUniqueProductBarcode(product.id);
  await persistGeneratedProductBarcode(product);
  return product.barcode;
}

function buildBarcodeLabelHtml(product, barcode) {
  return `
    <!doctype html>
    <html>
      <head>
        <title>Barcode Label</title>
        <style>
          @page { size: 1.9in 1in; margin: 0; }
          * { box-sizing: border-box; }
          html, body { width: 1.9in; height: 1in; margin: 0; padding: 0; background: #fff; }
          body {
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            text-rendering: geometricPrecision;
          }
          .label {
            width: 1.9in;
            height: 1in;
            padding: 0.03in 0.08in 0.07in;
            display: grid;
            grid-template-rows: 0.09in 0.12in 0.48in 0.17in;
            gap: 0.005in;
          }
          .pharmacy-name {
            font-size: 7px;
            font-weight: 900;
            line-height: 1;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-transform: uppercase;
          }
          .product-name {
            font-size: 7.5px;
            font-weight: 900;
            line-height: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
          }
          .barcode-svg {
            display: block;
            width: 100%;
            height: 0.48in;
            fill: #000;
            shape-rendering: crispEdges;
          }
          .label-footer {
            display: grid;
            grid-template-rows: 0.075in 0.075in;
            gap: 0.005in;
            align-items: center;
            min-width: 0;
          }
          .barcode-value,
          .product-price {
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1;
            white-space: nowrap;
            text-align: center;
            color: #000;
          }
          .barcode-value {
            display: block;
            width: 100%;
            min-width: 0;
            overflow: hidden;
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 0.2px;
          }
          .product-price {
            display: block;
            width: 100%;
            font-size: 9px;
            font-weight: 900;
            overflow: hidden;
            text-overflow: clip;
          }
          @media print {
            html, body, .label { width: 1.9in; height: 1in; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="pharmacy-name">PURELA PHARMACY</div>
          <div class="product-name">${escapeHtml(product.name || 'Product')}</div>
          ${createCode128Svg(barcode)}
          <div class="label-footer">
            <div class="barcode-value">${escapeHtml(barcode)}</div>
            <div class="product-price">${escapeHtml(formatCurrency(Number(product.price) || 0))}</div>
          </div>
        </div>
        <script>
          window.addEventListener('load', () => {
            window.focus();
            window.print();
          });
        <\/script>
      </body>
    </html>
  `;
}

async function printProductLabel(productId) {
  const product = typeof productId === 'object' ? productId : getProductById(productId);
  if (!product) {
    showNotification('Product not found for barcode label', 'error');
    return;
  }

  let barcode;
  try {
    barcode = await ensureProductBarcode(product);
    createCode128Svg(barcode);
  } catch (error) {
    showNotification(error.message || 'Could not create barcode label', 'error');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=360,height=260');
  if (!printWindow) {
    showNotification('Allow pop-ups to print barcode labels', 'warning');
    return;
  }

  printWindow.document.write(buildBarcodeLabelHtml(product, barcode));
  printWindow.document.close();
  loadProducts();
  if (currentPage === 'inventory') loadInventory(false);
}

function validateProductData(product) {
  const validatedProduct = { ...product };

  if (typeof validatedProduct.name === 'string') {
    validatedProduct.name = validatedProduct.name.trim();
  }
  if (typeof validatedProduct.category === 'string') {
    validatedProduct.category = validatedProduct.category.trim();
  }
  if (typeof validatedProduct.barcode === 'string') {
    validatedProduct.barcode = validatedProduct.barcode.trim();
  }
  if (
    validatedProduct.price === '' ||
    validatedProduct.price === null ||
    validatedProduct.price === undefined ||
    isNaN(validatedProduct.price)
  )
    validatedProduct.price = 0;
  if (
    validatedProduct.stock === '' ||
    validatedProduct.stock === null ||
    validatedProduct.stock === undefined ||
    isNaN(validatedProduct.stock)
  )
    validatedProduct.stock = 0;
  if (typeof validatedProduct.expiryDate === 'string') {
    validatedProduct.expiryDate = validatedProduct.expiryDate.trim();
  }
  if (!validatedProduct.expiryDate) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    validatedProduct.expiryDate = date.toISOString().split('T')[0];
  }

  validatedProduct.price = parseFloat(validatedProduct.price);
  validatedProduct.stock = parseInt(validatedProduct.stock);
  validatedProduct.expirydate = validatedProduct.expiryDate;

  return validatedProduct;
}

// Product Functions
function loadProducts() {
  const list = products.filter((p) => !p.deleted);
  if (list.length === 0) {
    productsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No Products Added Yet</h3>
                <p>Click "Add Product" to start adding your inventory</p>
            </div>
        `;
    return;
  }
  productsGrid.innerHTML = '';
  const chunkSize = 50;
  let index = 0;
  function renderChunk() {
    const fragment = document.createDocumentFragment();
    const today = new Date();
    for (let i = 0; i < chunkSize && index < list.length; i++, index++) {
      const product = list[index];
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      const expiryDate = new Date(product.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );
      let expiryWarning = '';
      let productNameStyle = '';
      if (daysUntilExpiry < 0) {
        expiryWarning = `<div class="expiry-warning"><i class="fas fa-exclamation-triangle"></i> Expired</div>`;
        productNameStyle = 'style="color: red; font-weight: bold;"';
      } else if (daysUntilExpiry <= settings.expiryWarningDays) {
        expiryWarning = `<div class="expiry-warning"><i class="fas fa-clock"></i> Expires in ${daysUntilExpiry} days</div>`;
        productNameStyle = 'style="color: red; font-weight: bold;"';
      }
      let stockClass = 'stock-high';
      if (product.stock <= 0) {
        stockClass = 'stock-low';
      } else if (product.stock <= settings.lowStockThreshold) {
        stockClass = 'stock-medium';
      }
      productCard.innerHTML = `
                <div class="product-img">
                    <i class="fas fa-box"></i>
                </div>
                <h4 ${productNameStyle}>${product.name}</h4>
                <div class="price">${formatCurrency(product.price)}</div>
                <div class="stock ${stockClass}">Stock: ${product.stock}</div>
                ${expiryWarning}
            `;
      productCard.addEventListener('click', () => addToCart(product));
      fragment.appendChild(productCard);
    }
    productsGrid.appendChild(fragment);
    if (index < list.length) {
      setTimeout(renderChunk, 0);
    }
  }
  renderChunk();
}

async function loadInventory(refreshRemote = true) {
  const inventoryLoading = document.getElementById('inventory-loading');
  if (inventoryLoading)
    inventoryLoading.style.display = refreshRemote && isOnline ? 'flex' : 'none';
  if (refreshRemote && isOnline) {
    try {
      await DataModule.fetchAllProducts();
    } catch (e) {}
    const il = document.getElementById('inventory-loading');
    if (il) il.style.display = 'none';
  }
  dedupeProducts();
  renderInventoryAlerts();
  updateInventoryTotalFromAllProducts();
  const baseList = products.filter((p) => !p.deleted);
  const normalizedSearch = inventorySearchTerm.trim().toLowerCase();
  const msPerDay = 1000 * 60 * 60 * 24;
  const todayTs = Date.now();
  let list;
  if (!inventoryCategoryFilter) {
    list = baseList.slice();
  } else if (inventoryCategoryFilter === 'Expired') {
    list = baseList.filter(
      (p) => (Date.parse(p.expiryDate) - todayTs) / msPerDay < 0
    );
  } else if (inventoryCategoryFilter === 'Expiring Soon') {
    list = baseList.filter((p) => {
      const d = Math.ceil((Date.parse(p.expiryDate) - todayTs) / msPerDay);
      return d >= 0 && d <= settings.expiryWarningDays;
    });
  } else if (inventoryCategoryFilter === 'Low Stock') {
    list = baseList.filter(
      (p) => p.stock > 0 && p.stock <= settings.lowStockThreshold
    );
  } else if (inventoryCategoryFilter === 'Out of Stock') {
    list = baseList.filter((p) => p.stock <= 0);
  } else {
    list = baseList.filter(
      (p) =>
        (p.category || 'Uncategorized').toString() === inventoryCategoryFilter
    );
  }
  if (normalizedSearch) {
    list = list.filter((product) => matchesProductSearch(product, normalizedSearch));
  }
  list = list.slice().sort((a, b) => {
    const an = (a.name || '').toString().toLowerCase();
    const bn = (b.name || '').toString().toLowerCase();
    return an.localeCompare(bn);
  });
  if (list.length === 0) {
    inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center;">No products in inventory</td>
            </tr>
        `;
    const inventoryTotalValue = document.getElementById(
      'inventory-total-value'
    );
    if (inventoryTotalValue)
      inventoryTotalValue.textContent = formatCurrency(0);
    const inventoryTotalItems = document.getElementById(
      'inventory-total-items'
    );
    if (inventoryTotalItems) inventoryTotalItems.textContent = '0';
    if (inventoryLoading) inventoryLoading.style.display = 'none';
    return;
  }
  let totalValue = list.reduce(
    (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
    0
  );
  const inventoryTotalItems = document.getElementById('inventory-total-items');
  if (inventoryTotalItems)
    inventoryTotalItems.textContent = String(list.length);
  const byCategory = {};
  const byCategoryCount = {};
  for (let i = 0; i < baseList.length; i++) {
    const p = baseList[i];
    const cat = (p.category || 'Uncategorized').toString();
    const val = (Number(p.price) || 0) * (Number(p.stock) || 0);
    byCategory[cat] = (byCategory[cat] || 0) + val;
    byCategoryCount[cat] = (byCategoryCount[cat] || 0) + 1;
  }
  const summaryEl = document.getElementById('inventory-category-summary');
  if (summaryEl) {
    let sHtml = '';
    let expiredCount = 0,
      expiredValue = 0;
    let soonCount = 0,
      soonValue = 0;
    let lowCount = 0,
      lowValue = 0;
    let outCount = 0,
      outValue = 0;
    for (let i = 0; i < baseList.length; i++) {
      const p = baseList[i];
      const val = (Number(p.price) || 0) * (Number(p.stock) || 0);
      const d = Math.ceil((Date.parse(p.expiryDate) - todayTs) / msPerDay);
      if (d < 0) {
        expiredCount++;
        expiredValue += val;
      } else if (d <= settings.expiryWarningDays) {
        soonCount++;
        soonValue += val;
      }
      if (p.stock <= 0) {
        outCount++;
        outValue += val;
      } else if (p.stock <= settings.lowStockThreshold) {
        lowCount++;
        lowValue += val;
      }
    }
    sHtml += `
            <div class="summary-card" onclick="filterInventoryByCategory('Expired')">
                <h3>Expired</h3>
                <p>${formatCurrency(expiredValue)}</p>
                <p>${expiredCount} items</p>
            </div>
            <div class="summary-card" onclick="filterInventoryByCategory('Expiring Soon')">
                <h3>Expiring Soon</h3>
                <p>${formatCurrency(soonValue)}</p>
                <p>${soonCount} items</p>
            </div>
            <div class="summary-card" onclick="filterInventoryByCategory('Low Stock')">
                <h3>Low Stock</h3>
                <p>${formatCurrency(lowValue)}</p>
                <p>${lowCount} items</p>
            </div>
            <div class="summary-card" onclick="filterInventoryByCategory('Out of Stock')">
                <h3>Out of Stock</h3>
                <p>${formatCurrency(outValue)}</p>
                <p>${outCount} items</p>
            </div>
        `;
    const cats = Object.keys(byCategory).sort((a, b) => a.localeCompare(b));
    for (let i = 0; i < cats.length; i++) {
      const c = cats[i];
      sHtml += `
                <div class="summary-card" onclick="filterInventoryByCategory('${c.replace(
                  /'/g,
                  '&#39;'
                )}')">
                    <h3>${c}</h3>
                    <p>${formatCurrency(byCategory[c])}</p>
                    <p>${byCategoryCount[c]} items</p>
                </div>
            `;
    }
    summaryEl.innerHTML = sHtml;
  }
  inventoryTableBody.innerHTML = '';
  const chunkSize = 400;
  let index = 0;
  const mySeq = ++inventoryRenderSeq;
  const seenKeys = new Set();
  function renderChunk() {
    if (mySeq !== inventoryRenderSeq) return;
    let html = '';
    for (let i = 0; i < chunkSize && index < list.length; i++, index++) {
      const product = list[index];
      if (!product) continue;
      const key = productKeyNCP(product);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      const expiryTs =
        product.expiryTs || (product.expiryTs = Date.parse(product.expiryDate));
      const daysUntilExpiry = Math.ceil((expiryTs - todayTs) / msPerDay);
      let rowClass = '';
      let stockBadgeClass = 'stock-high';
      let stockBadgeText = 'In Stock';
      let productNameStyle = '';
      if (product.stock <= 0) {
        stockBadgeClass = 'stock-low';
        stockBadgeText = 'Out of Stock';
      } else if (product.stock <= settings.lowStockThreshold) {
        stockBadgeClass = 'stock-medium';
        stockBadgeText = 'Low Stock';
      }
      let expiryBadgeClass = 'expiry-good';
      let expiryBadgeText = 'Good';
      if (daysUntilExpiry < 0) {
        expiryBadgeClass = 'expiry-expired';
        expiryBadgeText = 'Expired';
        rowClass = 'expired';
        productNameStyle = 'style="color: red; font-weight: bold;"';
      } else if (daysUntilExpiry <= settings.expiryWarningDays) {
        expiryBadgeClass = 'expiry-warning';
        expiryBadgeText = 'Expiring Soon';
        rowClass = 'expiring-soon';
        productNameStyle = 'style="color: red; font-weight: bold;"';
      }
      let actionButtons = '';
      if (AuthModule.isAdmin()) {
        actionButtons = `
                    <div class="action-buttons">
                        <button class="btn-label" title="Print barcode label" onclick="printProductLabel('${product.id}')">
                            <i class="fas fa-barcode"></i>
                        </button>
                        <button class="btn-edit" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
      } else {
        actionButtons = '<span class="no-permission">Admin only</span>';
      }
      html += `
                <tr ${rowClass ? `class=\"${rowClass}\"` : ''}>
                    <td>${product.id}</td>
                    <td ${productNameStyle}>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${product.stock}</td>
                    <td>${formatDate(product.expiryDate)}</td>
                    <td>
                        <span class="stock-badge ${stockBadgeClass}">${stockBadgeText}</span>
                        <span class="expiry-badge ${expiryBadgeClass}">${expiryBadgeText}</span>
                    </td>
                    <td>
                        ${actionButtons}
                    </td>
                </tr>
            `;
    }
    if (mySeq !== inventoryRenderSeq) return;
    if (html) inventoryTableBody.insertAdjacentHTML('beforeend', html);
    if (index < list.length) {
      requestAnimationFrame(renderChunk);
    } else {
      const inventoryTotalValue = document.getElementById(
        'inventory-total-value'
      );
      if (inventoryTotalValue)
        inventoryTotalValue.textContent = formatCurrency(totalValue);
      if (inventoryLoading) inventoryLoading.style.display = 'none';
    }
  }
  requestAnimationFrame(renderChunk);
}

function filterInventoryByCategory(cat) {
  if (inventoryCategoryFilter === cat) {
    inventoryCategoryFilter = null;
  } else {
    inventoryCategoryFilter = cat;
  }
  loadInventory(false);
}

function renderInventoryAlerts() {
  const expiringSoonList = document.getElementById('inventory-expiring-soon-list');
  const lowStockList = document.getElementById('inventory-low-stock-list');
  const outOfStockList = document.getElementById('inventory-out-of-stock-list');
  if (!expiringSoonList || !lowStockList || !outOfStockList) return;

  const todayTs = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;
  const activeProducts = (Array.isArray(products) ? products : []).filter(
    (product) => product && !product.deleted
  );
  const expiringSoon = activeProducts
    .map((product) => ({
      product,
      days: Math.ceil((Date.parse(product.expiryDate) - todayTs) / msPerDay),
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.days) &&
        entry.days >= 0 &&
        entry.days <= settings.expiryWarningDays
    )
    .sort((a, b) => a.days - b.days)
    .slice(0, 12);
  const lowStock = activeProducts
    .filter(
      (product) =>
        Number(product.stock) > 0 &&
        Number(product.stock) <= Number(settings.lowStockThreshold)
    )
    .sort((a, b) => Number(a.stock) - Number(b.stock))
    .slice(0, 12);
  const outOfStock = activeProducts
    .filter((product) => Number(product.stock) <= 0)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .slice(0, 12);

  const renderList = (target, rows, emptyText, mode) => {
    if (!rows.length) {
      target.innerHTML = `<p>${emptyText}</p>`;
      return;
    }
    target.innerHTML = rows
      .map((row) => {
        const product = row.product || row;
        const meta =
          mode === 'expiry'
            ? `${row.days} day${row.days === 1 ? '' : 's'} left | ${formatDate(
                product.expiryDate,
                true
              )}`
            : `Stock: ${Number(product.stock) || 0} | ${
                product.category || 'Uncategorized'
              }`;
        return `
          <div class="inventory-alert-row">
            <div>
              <strong>${product.name || 'Unnamed product'}</strong>
              <span>${meta}</span>
            </div>
            <button type="button" class="btn-edit" onclick="editProduct('${product.id}')" title="Edit product">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        `;
      })
      .join('');
  };

  renderList(expiringSoonList, expiringSoon, 'No products expiring soon', 'expiry');
  renderList(lowStockList, lowStock, 'No low stock products', 'stock');
  renderList(outOfStockList, outOfStock, 'No out of stock products', 'stock');
}

function loadSales() {
  updateSalesTables();

  if (currentPage === 'reports') {
    generateReport();
  }
}

function loadDeletedSales() {
  updateSalesTables();
}

function updateSalesTables() {
  if (!salesTableBody || !deletedSalesTableBody) return;
  const activeSales = sales.filter(
    (s) => !s.deleted && !s.deleted_at && !s.deletedAt
  );
  if (activeSales.length === 0) {
    salesTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No sales data available</td>
            </tr>
        `;
  } else {
    salesTableBody.innerHTML = '';
    const sortedSales = [...activeSales].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });
    const recentSales = sortedSales.slice(0, 10);
    const fragment = document.createDocumentFragment();
    recentSales.forEach((sale) => {
      const row = document.createElement('tr');
      let actionButtons = `
                <button type="button" class="btn-edit" onclick="viewSale('${sale.id}')" title="View Sale">
                    <i class="fas fa-eye"></i>
                </button>
            `;
      if (AuthModule.isAdmin()) {
        actionButtons += `
                    <button type="button" class="btn-delete" onclick="deleteSale('${sale.id}')" title="Delete Sale">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
      }
      const totalItemsSold = sale.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      row.innerHTML = `
                <td>${sale.receiptNumber}</td>
                <td>${formatDate(sale.created_at)}</td>
                <td>${totalItemsSold}</td>
                <td>${formatCurrency(sale.total)}</td>
                <td>
                    <div class="action-buttons">
                        ${actionButtons}
                    </div>
                </td>
            `;
      fragment.appendChild(row);
    });
    salesTableBody.appendChild(fragment);
  }

  if (deletedSales.length === 0) {
    deletedSalesTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No deleted sales</td>
            </tr>
        `;
  } else {
    deletedSalesTableBody.innerHTML = '';
    const sortedDeletedSales = [...deletedSales].sort((a, b) => {
      const aDel = a.deleted_at || a.deletedAt;
      const bDel = b.deleted_at || b.deletedAt;
      const dateA = aDel ? new Date(aDel) : new Date(0);
      const dateB = bDel ? new Date(bDel) : new Date(0);
      return dateB - dateA;
    });
    const fragmentDeleted = document.createDocumentFragment();
    sortedDeletedSales.forEach((sale) => {
      const row = document.createElement('tr');
      const totalItemsSold = sale.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      row.innerHTML = `
                <td>${sale.receiptNumber}</td>
                <td>${formatDate(sale.created_at)}</td>
                <td>${totalItemsSold}</td>
                <td>${formatCurrency(sale.total)}</td>
                <td><span class="deleted-badge">Deleted</span></td>
            `;
      fragmentDeleted.appendChild(row);
    });
    deletedSalesTableBody.appendChild(fragmentDeleted);
  }
}

function loadReports() {
  const reportsLoading = document.getElementById('reports-loading');
  if (reportsLoading) reportsLoading.style.display = 'flex';

  const today = new Date().toISOString().split('T')[0];
  const reportDateEl = document.getElementById('report-date');
  if (reportDateEl) {
    reportDateEl.value = today;
  }
  const periodEl = document.getElementById('report-period');
  const startEl = document.getElementById('report-start-date');
  const endEl = document.getElementById('report-end-date');
  const debouncedGenerateReport = debounce(() => generateReport(), 150);
  if (periodEl) {
    periodEl.addEventListener('change', () => {
      const v = periodEl.value || 'day';
      const showRange = v === 'custom';
      if (startEl) startEl.style.display = showRange ? '' : 'none';
      if (endEl) endEl.style.display = showRange ? '' : 'none';
      debouncedGenerateReport();
    });
  }
  if (reportDateEl) {
    reportDateEl.addEventListener('change', debouncedGenerateReport);
  }
  if (startEl) startEl.addEventListener('change', debouncedGenerateReport);
  if (endEl) endEl.addEventListener('change', debouncedGenerateReport);
  const shiftEl = document.getElementById('report-shift');
  if (shiftEl) {
    shiftEl.addEventListener('change', debouncedGenerateReport);
  }
  const generateBtn = document.getElementById('generate-report-btn');
  if (generateBtn) {
    generateBtn.onclick = debouncedGenerateReport;
  }
  const productSearchEl = document.getElementById('report-product-search');
  if (productSearchEl) {
    productSearchEl.addEventListener('input', () => {
      renderProductSalesTable(currentProductSalesRows, productSearchEl.value);
    });
  }
  const categorySearchEl = document.getElementById('report-category-search');
  if (categorySearchEl) {
    categorySearchEl.addEventListener('input', () => {
      renderCategorySalesTable(
        currentCategorySalesRows,
        categorySearchEl.value
      );
    });
  }

  setTimeout(() => {
    debouncedGenerateReport();
    if (reportsLoading) reportsLoading.style.display = 'none';
    Promise.all([
      DataModule.fetchSales(),
      DataModule.fetchExpenses(),
      DataModule.fetchPurchases(),
    ])
      .then(([fetchedSales, fetchedExpenses, fetchedPurchases]) => {
        sales = fetchedSales;
        expenses = fetchedExpenses;
        purchases = fetchedPurchases;
        debouncedGenerateReport();
      })
      .catch((error) => {
        console.error('Error fetching sales for report:', error);
        debouncedGenerateReport();
      });
  }, 0);
}

function generateReport() {
  try {
    const reportDateEl = document.getElementById('report-date');
    const selectedDate = reportDateEl
      ? reportDateEl.value
      : new Date().toISOString().split('T')[0];
    let selectedDateObj = null;
    if (selectedDate && typeof selectedDate === 'string') {
      const parts = selectedDate.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        selectedDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    if (!selectedDateObj) {
      const now = new Date();
      selectedDateObj = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
    }

    const shiftEl = document.getElementById('report-shift');
    const shift = shiftEl ? (shiftEl.value || 'all') : 'all';

    const activeSales = Array.isArray(sales)
      ? sales.filter((s) => !s.deleted && !s.deleted_at && !s.deletedAt)
      : [];
    const archivedSales = Array.isArray(deletedSales) ? deletedSales : [];

    const combinedMap = new Map();
    for (const s of [...activeSales, ...archivedSales]) {
      if (!s || typeof s !== 'object') continue;
      const rn =
        s.receiptnumber || s.receiptNumber || `NO_RN_${s.id || Math.random()}`;
      if (!combinedMap.has(rn)) combinedMap.set(rn, s);
    }
    const combinedSales = Array.from(combinedMap.values());

    let periodEl2 = document.getElementById('report-period');
    let period = periodEl2 ? periodEl2.value || 'day' : 'day';
    let rangeStart = null;
    let rangeEnd = null;
    if (period === 'day') {
      if (shift === 'morning') {
        rangeStart = new Date(selectedDateObj);
        rangeStart.setHours(7, 0, 0, 0);
        rangeEnd = new Date(selectedDateObj);
        rangeEnd.setHours(14, 59, 59, 999);
      } else if (shift === 'afternoon') {
        rangeStart = new Date(selectedDateObj);
        rangeStart.setHours(15, 0, 0, 0);
        rangeEnd = new Date(selectedDateObj);
        rangeEnd.setHours(22, 59, 59, 999);
      } else if (shift === 'overnight') {
        rangeStart = new Date(selectedDateObj);
        rangeStart.setDate(rangeStart.getDate() - 1);
        rangeStart.setHours(23, 0, 0, 0);
        rangeEnd = new Date(selectedDateObj);
        rangeEnd.setHours(6, 59, 59, 999);
      } else {
        rangeStart = new Date(selectedDateObj);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(selectedDateObj);
        rangeEnd.setHours(23, 59, 59, 999);
      }
    } else if (period === 'week') {
      const d = new Date(selectedDateObj);
      const day = d.getDay();
      const diffToMonday = (day + 6) % 7;
      rangeStart = new Date(d);
      rangeStart.setDate(d.getDate() - diffToMonday);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 6);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      const d = new Date(selectedDateObj);
      rangeStart = new Date(d.getFullYear(), d.getMonth(), 1);
      rangeEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (period === 'custom') {
      const startEl2 = document.getElementById('report-start-date');
      const endEl2 = document.getElementById('report-end-date');
      const s = startEl2 && startEl2.value ? new Date(startEl2.value) : null;
      const e = endEl2 && endEl2.value ? new Date(endEl2.value) : null;
      if (s && !isNaN(s.getTime())) {
        rangeStart = s;
        rangeStart.setHours(0, 0, 0, 0);
      }
      if (e && !isNaN(e.getTime())) {
        rangeEnd = e;
        rangeEnd.setHours(23, 59, 59, 999);
      }
    }

    function passesShift(date) {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) return false;
      if (shift === 'all') return true;
      const hm = date.getHours() * 60 + date.getMinutes();
      if (shift === 'morning') return hm >= 7 * 60 && hm < 15 * 60;
      if (shift === 'afternoon') return hm >= 15 * 60 && hm < 23 * 60;
      if (shift === 'overnight') return hm >= 23 * 60 || hm < 7 * 60;
      return true;
    }

    let periodSales = activeSales;
    if (rangeStart && rangeEnd) {
      periodSales = activeSales.filter((sale) => {
        if (!sale || !sale.created_at) return false;
        const d = new Date(sale.created_at);
        if (isNaN(d.getTime())) return false;
        return d >= rangeStart && d <= rangeEnd && passesShift(d);
      });
    } else {
      periodSales = activeSales.filter((sale) => {
        if (!sale || !sale.created_at) return false;
        const d = new Date(sale.created_at);
        if (isNaN(d.getTime())) return false;
        return passesShift(d);
      });
    }

    let totalSales = 0;
    let totalTransactions = 0;
    let totalItemsSold = 0;
    let totalCash = 0;
    let totalPos = 0;

    periodSales.forEach((sale) => {
      if (!sale || typeof sale !== 'object') return;
      totalSales +=
        typeof sale.total === 'number'
          ? sale.total
          : parseFloat(sale.total) || 0;
      totalTransactions++;
      if (Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          totalItemsSold += Number(item.quantity) || 0;
        });
      }
      const pm = (
        (sale.paymentMethod || sale.paymentmethod || '') + ''
      ).toLowerCase();
      if (pm === 'cash') {
        totalCash +=
          typeof sale.total === 'number'
            ? sale.total
            : parseFloat(sale.total) || 0;
      } else if (pm === 'pos') {
        totalPos +=
          typeof sale.total === 'number'
            ? sale.total
            : parseFloat(sale.total) || 0;
      }
    });

    const totalSalesEl = document.getElementById('report-total-sales');
    const totalTransactionsEl = document.getElementById('report-transactions');
    const totalItemsSoldEl = document.getElementById('report-items-sold');
    const totalCashEl = document.getElementById('report-cash-sales');
    const totalPosEl = document.getElementById('report-pos-sales');

    if (totalSalesEl) totalSalesEl.textContent = formatCurrency(totalSales);
    if (totalTransactionsEl)
      totalTransactionsEl.textContent = totalTransactions;
    if (totalItemsSoldEl) totalItemsSoldEl.textContent = totalItemsSold;
    if (totalCashEl) totalCashEl.textContent = formatCurrency(totalCash);
    if (totalPosEl) totalPosEl.textContent = formatCurrency(totalPos);
    lastOverallTotals = {
      total: totalSales,
      transactions: totalTransactions,
      items: totalItemsSold,
      cash: totalCash,
      pos: totalPos,
    };

    let dailyTotal = 0;
    let dailyTransactions = 0;
    let dailyItems = 0;
    let dailyCash = 0;
    let dailyPos = 0;

    const dailySales = [];

    const dailyWindow = (() => {
      if (shift === 'morning') {
        const s = new Date(selectedDateObj);
        s.setHours(7, 0, 0, 0);
        const e = new Date(selectedDateObj);
        e.setHours(14, 59, 59, 999);
        return { s, e };
      }
      if (shift === 'afternoon') {
        const s = new Date(selectedDateObj);
        s.setHours(15, 0, 0, 0);
        const e = new Date(selectedDateObj);
        e.setHours(22, 59, 59, 999);
        return { s, e };
      }
      if (shift === 'overnight') {
        const s = new Date(selectedDateObj);
        s.setDate(s.getDate() - 1);
        s.setHours(23, 0, 0, 0);
        const e = new Date(selectedDateObj);
        e.setHours(6, 59, 59, 999);
        return { s, e };
      }
      const s = new Date(selectedDateObj);
      s.setHours(0, 0, 0, 0);
      const e = new Date(selectedDateObj);
      e.setHours(23, 59, 59, 999);
      return { s, e };
    })();

    periodSales.forEach((sale) => {
      if (!sale || typeof sale !== 'object' || !sale.created_at) return;
      const d = new Date(sale.created_at);
      if (isNaN(d.getTime())) return;
      if (d >= dailyWindow.s && d <= dailyWindow.e) {
        dailyTotal += typeof sale.total === 'number' ? sale.total : Number(sale.total) || 0;
        dailyTransactions++;
        if (Array.isArray(sale.items)) {
          sale.items.forEach((item) => {
            dailyItems += Number(item.quantity) || 0;
          });
        }
        const pm2 = ((sale.paymentMethod || sale.paymentmethod || '') + '').toLowerCase();
        if (pm2 === 'cash') {
          dailyCash += typeof sale.total === 'number' ? sale.total : Number(sale.total) || 0;
        } else if (pm2 === 'pos') {
          dailyPos += typeof sale.total === 'number' ? sale.total : Number(sale.total) || 0;
        }
        dailySales.push(sale);
      }
    });

    const dailyTotalEl = document.getElementById('daily-total-sales');
    const dailyTransactionsEl = document.getElementById('daily-transactions');
    const dailyItemsEl = document.getElementById('daily-items-sold');
    const dailyCashEl = document.getElementById('daily-cash-sales');
    const dailyPosEl = document.getElementById('daily-pos-sales');

    if (dailyTotalEl) dailyTotalEl.textContent = formatCurrency(dailyTotal);
    if (dailyTransactionsEl)
      dailyTransactionsEl.textContent = dailyTransactions;
    if (dailyItemsEl) dailyItemsEl.textContent = dailyItems;
    if (dailyCashEl) dailyCashEl.textContent = formatCurrency(dailyCash);
    if (dailyPosEl) dailyPosEl.textContent = formatCurrency(dailyPos);
    lastDailyTotals = {
      total: dailyTotal,
      transactions: dailyTransactions,
      items: dailyItems,
      cash: dailyCash,
      pos: dailyPos,
    };

    if (!dailySalesTableBody) {
      console.error('dailySalesTableBody element not found');
      return;
    }

    if (dailySales.length === 0) {
      dailySalesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">No sales data for selected date</td>
                </tr>
            `;
    } else {
      dailySalesTableBody.innerHTML = '';
      dailySales.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
      });
      let idx = 0;
      const chunkSize = 200;
      function renderDailyChunk() {
        let html = '';
        for (let i = 0; i < chunkSize && idx < dailySales.length; i++, idx++) {
          const sale = dailySales[idx];
          let actionButtons = `
                        <button class="btn-edit" onclick="viewSale('${sale.id}')" title="View Sale">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
          if (AuthModule.isAdmin()) {
            actionButtons += `
                            <button class="btn-delete" onclick="deleteSale('${sale.id}')" title="Delete Sale">
                                <i class="fas fa-trash"></i>
                            </button>
                        `;
          }
          const totalItemsSold = Array.isArray(sale.items)
            ? sale.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
            : 0;
          html += `
                        <tr>
                            <td>${sale.receiptNumber || 'N/A'}</td>
                            <td>${formatDate(sale.created_at)}</td>
                            <td>${totalItemsSold}</td>
                            <td>${formatCurrency(sale.total || 0)}</td>
                            <td>
                                <div class="action-buttons">
                                    ${actionButtons}
                                </div>
                            </td>
                        </tr>
                    `;
        }
        if (html) dailySalesTableBody.insertAdjacentHTML('beforeend', html);
        if (idx < dailySales.length) {
          requestAnimationFrame(renderDailyChunk);
        }
      }
      requestAnimationFrame(renderDailyChunk);
    }
    let filteredActiveSales = periodSales;
    const productCountMap = new Map();
    const categoryCountMap = new Map();
    const productById = new Map(
      Array.isArray(products) ? products.map((p) => [p.id, p]) : []
    );
    filteredActiveSales.forEach((sale) => {
      if (!sale || !Array.isArray(sale.items)) return;
      sale.items.forEach((item) => {
        const qty = Number(item.quantity) || 0;
        const pid = item.id || item.productId || '';
        const pname = item.name || 'Unknown';
        const price = Number(item.price) || 0;
        const amt = price * qty;
        if (pid || pname) {
          const existing = productCountMap.get(pid || pname);
          if (existing) {
            existing.count += qty;
            existing.amount += amt;
          } else {
            productCountMap.set(pid || pname, {
              name: pname,
              count: qty,
              amount: amt,
            });
          }
        }
        let category = 'Uncategorized';
        const p = pid ? productById.get(pid) : null;
        if (p && p.category) category = p.category;
        const c = categoryCountMap.get(category);
        if (c) {
          c.count += qty;
          c.amount += amt;
        } else {
          categoryCountMap.set(category, { count: qty, amount: amt });
        }
      });
    });
    currentProductSalesRows = Array.from(productCountMap.values()).sort(
      (a, b) => b.count - a.count
    );
    currentCategorySalesRows = Array.from(categoryCountMap.entries())
      .map(([category, v]) => ({ category, count: v.count, amount: v.amount }))
      .sort((a, b) => b.count - a.count);
    const productSearchEl2 = document.getElementById('report-product-search');
    const categorySearchEl2 = document.getElementById('report-category-search');
    renderProductSalesTable(
      currentProductSalesRows,
      productSearchEl2 ? productSearchEl2.value : ''
    );
    renderCategorySalesTable(
      currentCategorySalesRows,
      categorySearchEl2 ? categorySearchEl2.value : ''
    );
  } catch (error) {
    console.error('Error generating report:', error);
    showNotification('Error generating report: ' + error.message, 'error');
  }
}

function isDateInReportRange(value, rangeStart, rangeEnd) {
  const date = value ? new Date(value) : null;
  if (!date || isNaN(date.getTime())) return false;
  if (rangeStart && date < rangeStart) return false;
  if (rangeEnd && date > rangeEnd) return false;
  return true;
}

function removeEmbeddedSalesReportProfitLoss() {
  const embeddedPnl = document.getElementById('pnl-sales');
  const reportSection =
    embeddedPnl && typeof embeddedPnl.closest === 'function'
      ? embeddedPnl.closest('.report-section')
      : null;
  if (reportSection) reportSection.remove();
}

function renderProfitAndLossReport(periodSales, rangeStart, rangeEnd) {
  const salesRevenue = (Array.isArray(periodSales) ? periodSales : []).reduce(
    (sum, sale) => sum + (Number(sale && sale.total) || 0),
    0
  );
  const purchaseCost = (Array.isArray(purchases) ? purchases : [])
    .filter((purchase) =>
      isDateInReportRange(purchase && purchase.date, rangeStart, rangeEnd)
    )
    .reduce((sum, purchase) => sum + (Number(purchase && purchase.amount) || 0), 0);
  const expenseCost = (Array.isArray(expenses) ? expenses : [])
    .filter((expense) =>
      isDateInReportRange(expense && expense.date, rangeStart, rangeEnd)
    )
    .reduce((sum, expense) => sum + (Number(expense && expense.amount) || 0), 0);
  const result = salesRevenue - purchaseCost - expenseCost;
  const values = {
    'pnl-sales': salesRevenue,
    'pnl-purchases': purchaseCost,
    'pnl-expenses': expenseCost,
    'pnl-result': result,
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = formatCurrency(value);
  });

  const statusEl = document.getElementById('pnl-status');
  if (statusEl) statusEl.textContent = result < 0 ? 'Loss' : 'Profit';
  const resultEl = document.getElementById('pnl-result');
  if (resultEl) resultEl.classList.toggle('loss-value', result < 0);
  const rangeEl = document.getElementById('pnl-range');
  if (rangeEl && rangeStart && rangeEnd) {
    rangeEl.textContent = `${formatDate(rangeStart, true)} to ${formatDate(
      rangeEnd,
      true
    )}: sales less inventory purchases and expenses.`;
  }
}

function renderProductSalesTable(rows, query) {
  if (!reportProductSalesBody) return;
  const q = (query || '').toString().trim().toLowerCase();
  const list = q
    ? rows.filter((r) => (r.name || '').toString().toLowerCase().includes(q))
    : rows;
  if (!list || list.length === 0) {
    reportProductSalesBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center;">No product sales data</td>
            </tr>
        `;
    return;
  }
  const fragment = document.createDocumentFragment();
  reportProductSalesBody.innerHTML = '';
  list.forEach((r) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${r.name}</td>
            <td>${r.count}</td>
            <td>${formatCurrency(r.amount || 0)}</td>
        `;
    fragment.appendChild(row);
  });
  reportProductSalesBody.appendChild(fragment);
}

function renderCategorySalesTable(rows, query) {
  if (!reportCategorySalesBody) return;
  const q = (query || '').toString().trim().toLowerCase();
  const list = q
    ? rows.filter((r) =>
        (r.category || '').toString().toLowerCase().includes(q)
      )
    : rows;
  if (!list || list.length === 0) {
    reportCategorySalesBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center;">No category sales data</td>
            </tr>
        `;
    return;
  }
  const fragment = document.createDocumentFragment();
  reportCategorySalesBody.innerHTML = '';
  list.forEach((r) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${r.category}</td>
            <td>${r.count}</td>
            <td>${formatCurrency(r.amount || 0)}</td>
        `;
    fragment.appendChild(row);
  });
  reportCategorySalesBody.appendChild(fragment);
}

function loadAccount() {
  const accountLoading = document.getElementById('account-loading');
  if (accountLoading) accountLoading.style.display = 'flex';

  setTimeout(() => {
    if (accountLoading) accountLoading.style.display = 'none';

    if (currentUser) {
      const userNameEl = document.getElementById('user-name');
      const userEmailEl = document.getElementById('user-email');
      const userRoleDisplayEl = document.getElementById('user-role-display');
      const userCreatedEl = document.getElementById('user-created');
      const userLastLoginEl = document.getElementById('user-last-login');

      if (userNameEl) userNameEl.textContent = currentUser.name;
      if (userEmailEl) userEmailEl.textContent = currentUser.email;
      if (userRoleDisplayEl)
        userRoleDisplayEl.textContent = formatRoleName(currentUser.role);
      if (userCreatedEl)
        userCreatedEl.textContent = formatDate(currentUser.created_at);
      if (userLastLoginEl)
        userLastLoginEl.textContent = formatDate(currentUser.last_login);
      updateCurrentUserShiftUI();
    }

    if (AuthModule.isAdmin()) {
      loadUsers();
    }
  }, 500);
}

function loadUsers() {
  const usersList = document.getElementById('users-list');
  if (!usersList) return;

  usersList.innerHTML = '';

  if (users.length === 0) {
    usersList.innerHTML = '<p>No users found</p>';
    return;
  }

  users.forEach((user) => {
    const userCard = document.createElement('div');
    userCard.className = 'user-card';

    userCard.innerHTML = `
            <div class="user-info">
                <strong>${user.name}</strong>
                <span>${user.email}</span>
                <span class="role-badge ${user.role}">${user.role}</span>
            </div>
            <div class="action-buttons">
                <button class="btn-delete" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

    usersList.appendChild(userCard);
  });
}

// Cart Functions
function addToCart(product) {
  if (product.stock <= 0) {
    showNotification('Product is out of stock', 'error');
    focusPosSearch({ defer: true });
    return;
  }

  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      showNotification('Not enough stock available', 'error');
      focusPosSearch({ defer: true });
      return;
    }

    existingItem.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  customerDisplayLastSale = null;
  updateCart();
  focusPosSearch({ defer: true });
}

function updateCart() {
  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const discount = Math.min(
    Math.max(Number(saleDiscountInput && saleDiscountInput.value) || 0, 0),
    subtotal
  );
  const payable = Math.max(subtotal - discount, 0);

  if (cart.length === 0) {
    cartItems.innerHTML =
      '<p style="text-align: center; color: #999; padding: 20px;">No items in cart</p>';
    if (subtotalEl) subtotalEl.textContent = formatCurrency(0);
    totalEl.textContent = formatCurrency(0);
    syncCustomerDisplayState();
    return;
  }

  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';

    cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
                <div class="cart-item-qty">
                    <button type="button" data-action="update-cart-quantity" data-product-id="${
                      item.id
                    }" data-change="-1">-</button>
                    <input type="number" value="${
                      item.quantity
                    }" min="1" readonly>
                    <button type="button" data-action="update-cart-quantity" data-product-id="${item.id}" data-change="1">+</button>
                </div>
            </div>
            <div class="cart-item-total">${formatCurrency(itemTotal)}</div>
        `;

    cartItems.appendChild(cartItem);
  });

  if (subtotalEl) subtotalEl.textContent = formatCurrency(total);
  totalEl.textContent = formatCurrency(payable);
  syncCustomerDisplayState();
}

function updateQuantity(productId, change) {
  const item = cart.find((item) => item.id === productId);
  if (!item) return;

  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    cart = cart.filter((item) => item.id !== productId);
  } else if (newQuantity <= product.stock) {
    item.quantity = newQuantity;
  } else {
    showNotification('Not enough stock available', 'error');
    return;
  }

  customerDisplayLastSale = null;
  updateCart();
}

function clearCart() {
  customerDisplayLastSale = null;
  cart = [];
  if (saleDiscountInput) saleDiscountInput.value = '0';
  updateCart();
  focusPosSearch({ defer: true });
}

async function completeSale() {
  if (!currentUser) {
    showNotification('Please log in before completing a sale', 'error');
    showLogin();
    return;
  }

  if (cart.length === 0) {
    showNotification('Cart is empty', 'error');
    return;
  }

  const completeSaleBtn = document.getElementById('complete-sale-btn');
  completeSaleBtn.classList.add('loading');
  completeSaleBtn.disabled = true;

  try {
    let validCashierId =
      (currentUser && currentUser.id) || '00000000-0000-0000-0000-000000000000';

    // If it's not a valid UUID, use the fallback ID
    if (
      !validCashierId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    ) {
      validCashierId = '00000000-0000-0000-0000-000000000000';
    }

    const pmEl = document.getElementById('payment-method');
    const paymentMethod = pmEl && pmEl.value ? pmEl.value : 'cash';
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = Math.min(
      Math.max(Number(saleDiscountInput && saleDiscountInput.value) || 0, 0),
      subtotal
    );

    const sale = {
      receiptNumber: generateReceiptNumber(),
      clientSaleId:
        'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      items: [...cart],
      subtotal,
      discount,
      total: subtotal - discount,
      created_at: new Date().toISOString(),
      cashier: currentUser.name,
      cashierId: validCashierId,
      paymentMethod: paymentMethod,
      customerName:
        (customerNameInput && customerNameInput.value.trim()) ||
        'Walk-in customer',
      customerPhone: (customerPhoneInput && customerPhoneInput.value.trim()) || '',
    };

    const result = await DataModule.saveSale(sale);

    if (result.success) {
      for (const cartItem of cart) {
        const product = products.find((p) => p.id === cartItem.id);
        if (product) {
          product.stock -= cartItem.quantity;

          addToSyncQueue({
            type: 'saveProduct',
            data: {
              id: product.id,
              stock: product.stock,
          clientTempId: product.clientTempId || product.id,
            },
          });
        }
      }

      saveToLocalStorage();

      // Check for new alerts after updating stock
      checkAndGenerateAlerts();

      showReceipt(result.sale);

      customerDisplayLastSale = buildCustomerDisplaySale(result.sale);
      cart = [];
      updateCart();

      loadSales();

      showNotification('Sale completed successfully', 'success');

      try {
        if (typeof window.updateAnalyticsSummary === 'function') {
          window.updateAnalyticsSummary();
        }
      } catch (_) {}
    } else {
      showNotification('Failed to complete sale', 'error');
    }
  } catch (error) {
    console.error('Error completing sale:', error);
    showNotification('Error completing sale', 'error');
  } finally {
    completeSaleBtn.classList.remove('loading');
    completeSaleBtn.disabled = false;
  }
}

function showReceipt(sale) {
  const receiptContent = document.getElementById('receipt-content');
  if (!receiptContent) return;

  let itemsHtml = '';
  sale.items.forEach((item) => {
    itemsHtml += `
            <div class="receipt-item">
                <span>${item.name} x${item.quantity}</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `;
  });

  receiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>${settings.storeName}</h2>
            <p>${settings.storeAddress}</p>
            <p>${settings.storePhone}</p>
        </div>
        <div class="receipt-items">
            ${itemsHtml}
        </div>
        <div class="receipt-footer">
            <div class="receipt-total">
                <span>Subtotal:</span>
                <span>${formatCurrency(sale.subtotal || sale.total || 0)}</span>
            </div>
            <div class="receipt-item">
                <span>Discount:</span>
                <span>${formatCurrency(sale.discount || 0)}</span>
            </div>
            <div class="receipt-total">
                <span>Payable:</span>
                <span>${formatCurrency(sale.total)}</span>
            </div>
            <div class="receipt-item">
                <span>Customer:</span>
                <span>${sale.customerName || 'Walk-in customer'}</span>
            </div>
            ${
              sale.customerPhone
                ? `<div class="receipt-item">
                <span>Phone:</span>
                <span>${sale.customerPhone}</span>
            </div>`
                : ''
            }
            <div class="receipt-item">
                <span>Receipt #:</span>
                <span>${sale.receiptNumber}</span>
            </div>
            <div class="receipt-item">
                <span>Date:</span>
                <span>${formatDate(sale.created_at)}</span>
            </div>
            <div class="receipt-item">
                <span>Cashier:</span>
                <span>${sale.cashier}</span>
            </div>
            <div class="receipt-item">
                <span>Payment:</span>
                <span>${(sale.paymentMethod || 'cash').toUpperCase()}</span>
            </div>
        </div>
    `;

  receiptModal.style.display = 'flex';
}

function printReceipt() {
  const receiptContent = document.getElementById('receipt-content');
  if (!receiptContent) return;

  const content = receiptContent.innerHTML;
  const printMarkup = `
        <html>
            <head>
                <title>Receipt - ${settings.storeName}</title>
                <style>
                    @page { size: auto; margin: 8mm; }
                    html, body { background: #fff !important; }
                    body {
                        font-family: 'Courier New', monospace;
                        padding: 12px;
                        margin: 0;
                        color: #000;
                        background: #fff;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .receipt { box-shadow: none; max-width: 100%; padding: 0; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-items { margin-bottom: 20px; }
                    .receipt-item { display: flex; justify-content: space-between; margin-bottom: 8px; gap: 12px; }
                    .receipt-footer { border-top: 1px dashed #ccc; padding-top: 10px; }
                    .receipt-total { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                ${content}
            </body>
        </html>
    `;

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  printFrame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(printFrame);
  const frameDoc =
    printFrame.contentWindow && printFrame.contentWindow.document;
  if (!frameDoc) {
    printFrame.remove();
    showNotification('Unable to open print window on this device.', 'error');
    return;
  }
  frameDoc.open();
  frameDoc.write(printMarkup);
  frameDoc.close();

  const cleanup = () => {
    setTimeout(() => {
      try {
        printFrame.remove();
      } catch (_) {}
    }, 300);
  };

  const triggerPrint = () => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (_) {
      showNotification('Unable to print on this device.', 'error');
    } finally {
      cleanup();
    }
  };

  if (typeof printFrame.onload !== 'undefined') {
    printFrame.onload = () => {
      setTimeout(triggerPrint, 150);
    };
  }

  try {
    if (printFrame.contentWindow) {
      printFrame.contentWindow.onafterprint = cleanup;
    }
  } catch (_) {}

  setTimeout(triggerPrint, 500);
}

// Product Modal Functions
async function ensureCategoriesLoaded() {
  if (!Array.isArray(categories) || categories.length === 0) {
    await DataModule.fetchCategories();
  }
  const existingByName = new Map(
    (Array.isArray(categories) ? categories : []).map((category) => [
      String(category.name || '').trim().toLowerCase(),
      category,
    ])
  );
  categories = DEFAULT_CATEGORIES.map((category, index) => {
    const existing = existingByName.get(category.name.toLowerCase());
    return {
      id: (existing && existing.id) || `default_${index + 1}`,
      ...category,
    };
  });
  saveToLocalStorage();
}
function populateCategorySelect() {
  const el = document.getElementById('product-category');
  if (!el) return;
  const current = el.value;
  el.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = '';
  opt.textContent = 'Select Category';
  el.appendChild(opt);
  (Array.isArray(categories) ? categories : []).forEach((c) => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name;
    if (c.description) o.title = c.description;
    el.appendChild(o);
  });
  if (current) {
    el.value = current;
  }
}
function getCategoryNameById(id) {
  const c = (Array.isArray(categories) ? categories : []).find(
    (x) => String(x.id) === String(id)
  );
  return c ? c.name : '';
}
function getCategoryIdForProduct(product) {
  if (!product) return '';
  if (product.categoryId) return product.categoryId;

  const matchedCategory = (Array.isArray(categories) ? categories : []).find(
    (category) =>
      String(category.name || '').trim().toLowerCase() ===
      String(product.category || '').trim().toLowerCase()
  );

  return matchedCategory ? matchedCategory.id : '';
}

async function openProductModal(product = null) {
  if (!AuthModule.isAdmin()) {
    showNotification('Only admins can add or edit products', 'error');
    return;
  }

  const modalTitle = document.getElementById('modal-title');
  const productForm = document.getElementById('product-form');
  await ensureCategoriesLoaded();
  populateCategorySelect();

  if (product) {
    if (modalTitle) modalTitle.textContent = 'Edit Product';
    const productNameEl = document.getElementById('product-name');
    const productCategoryEl = document.getElementById('product-category');
    const productPriceEl = document.getElementById('product-price');
    const productStockEl = document.getElementById('product-stock');
    const productExpiryEl = document.getElementById('product-expiry');
    const productBarcodeEl = document.getElementById('product-barcode');
    const printProductLabelBtn = document.getElementById('print-product-label-btn');

    if (productNameEl) productNameEl.value = product.name;
    if (productCategoryEl) {
      productCategoryEl.value = getCategoryIdForProduct(product);
    }
    if (productPriceEl) productPriceEl.value = product.price;
    if (productStockEl) productStockEl.value = product.stock;
    if (productExpiryEl) productExpiryEl.value = product.expiryDate;
    if (productBarcodeEl) productBarcodeEl.value = product.barcode || '';
    if (printProductLabelBtn) {
      printProductLabelBtn.style.display = 'inline-flex';
      printProductLabelBtn.dataset.productId = product.id;
    }

    if (productForm) productForm.dataset.productId = product.id;
  } else {
    if (modalTitle) modalTitle.textContent = 'Add New Product';
    if (productForm) {
      productForm.reset();
      delete productForm.dataset.productId;
    }
    const printProductLabelBtn = document.getElementById('print-product-label-btn');
    if (printProductLabelBtn) {
      printProductLabelBtn.style.display = 'none';
      delete printProductLabelBtn.dataset.productId;
    }
  }

  productModal.style.display = 'flex';
  configurePosInputs();
}

function closeProductModal() {
  productModal.style.display = 'none';
  focusPosSearch({ defer: true });
}

async function saveProduct() {
  if (!AuthModule.isAdmin()) {
    showNotification('Only admins can add or edit products', 'error');
    return;
  }

  const productForm = document.getElementById('product-form');
  if (!productForm) return;
  if (typeof productForm.reportValidity === 'function' && !productForm.reportValidity()) {
    return;
  }

  const productId = productForm.dataset.productId;

  const productNameEl = document.getElementById('product-name');
  const productCategoryEl = document.getElementById('product-category');
  const productPriceEl = document.getElementById('product-price');
  const productStockEl = document.getElementById('product-stock');
  const productExpiryEl = document.getElementById('product-expiry');
  const productBarcodeEl = document.getElementById('product-barcode');

  const selectedCategoryId = productCategoryEl ? productCategoryEl.value : '';
  const selectedCategoryName = getCategoryNameById(selectedCategoryId);
  const productData = validateProductData({
    name: productNameEl ? productNameEl.value : '',
    category: selectedCategoryName,
    price: productPriceEl ? productPriceEl.value : '',
    stock: productStockEl ? productStockEl.value : '',
    expiryDate: productExpiryEl ? productExpiryEl.value : '',
    barcode: productBarcodeEl ? productBarcodeEl.value : '',
    categoryId: selectedCategoryId || null,
  });

  if (!productData.barcode) {
    productData.barcode = generateUniqueProductBarcode(productId);
    if (productBarcodeEl) productBarcodeEl.value = productData.barcode;
  }

  if (productId) {
    productData.id = productId;
  }

  const result = await DataModule.saveProduct(productData);

  if (result.success) {
    closeProductModal();
    const savedProduct = { ...productData, ...(result.product || {}) };
    if (!savedProduct.barcode) savedProduct.barcode = productData.barcode;
    if (savedProduct) {
      const savedId = savedProduct.id ? String(savedProduct.id) : '';
      const savedKey = productKeyNCP(savedProduct);
      const localIndex = products.findIndex(
        (product) =>
          (savedId && String(product.id) === savedId) ||
          productKeyNCP(product) === savedKey
      );
      if (localIndex >= 0) {
        products[localIndex] = { ...products[localIndex], ...savedProduct };
      } else {
        products.push(savedProduct);
      }
      dedupeProducts();
      saveToLocalStorage();
    }
    // Check for new alerts after updating products
    checkAndGenerateAlerts();

    loadProducts();

    if (currentPage === 'inventory') {
      loadInventory(false);
    }

    showNotification(
      productId ? 'Product updated successfully' : 'Product added successfully',
      'success'
    );
  }
}

function editProduct(productId) {
  if (!AuthModule.isAdmin()) {
    showNotification('Only admins can edit products', 'error');
    return;
  }

  const product = products.find((p) => p.id === productId);
  if (product) {
    openProductModal(product);
  }
}

async function deleteProduct(productId) {
  if (!AuthModule.isAdmin()) {
    showNotification('Only admins can delete products', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  const resultPromise = DataModule.deleteProduct(productId);

  dedupeProducts();
  saveToLocalStorage();
  loadProducts();

  if (currentPage === 'inventory') {
    loadInventory(false);
  }

  const result = await resultPromise;

  if (result.success) {
    dedupeProducts();
    saveToLocalStorage();

    // Check for new alerts after deleting products
    checkAndGenerateAlerts();

    loadProducts();

    if (currentPage === 'inventory') {
      loadInventory(false);
    }

    showNotification('Product deleted successfully', 'success');
  } else {
    showNotification('Failed to delete product', 'error');
  }
}

function viewSale(saleId) {
  const sale = sales.find((s) => s.id === saleId);
  if (sale) {
    showReceipt(sale);
  }
}

async function deleteSale(saleId) {
  if (!AuthModule.isAdmin()) {
    showNotification('You do not have permission to delete sales', 'error');
    return;
  }

  const sale = sales.find((s) => s.id === saleId);
  if (!sale) {
    showNotification('Sale not found', 'error');
    return;
  }

  const confirmMessage =
    `Are you sure you want to delete this sale?\n\n` +
    `Receipt #: ${sale.receiptNumber}\n` +
    `Date: ${formatDate(sale.created_at)}\n` +
    `Total: ${formatCurrency(sale.total)}\n\n` +
    `This action cannot be undone.`;

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    const result = await DataModule.deleteSale(saleId);

    if (result.success) {
      showNotification('Sale deleted successfully', 'success');

      sales = await DataModule.fetchSales();
      updateSalesTables();

      if (currentPage === 'reports') {
        generateReport();
      }

      try {
        if (typeof window.updateAnalyticsSummary === 'function') {
          window.updateAnalyticsSummary();
        }
      } catch (_) {}
    } else {
      showNotification('Failed to delete sale', 'error');
    }
  } catch (error) {
    console.error('Error deleting sale:', error);
    showNotification('Error deleting sale', 'error');
  }
}

async function refreshAllData() {
  try {
    const syncStatus = document.getElementById('sync-status');
    const syncStatusText = document.getElementById('sync-status-text');

    if (syncStatus) {
      syncStatus.classList.add('show', 'syncing');
      syncStatusText.textContent = 'Syncing all data...';
    }

    let newProducts = [];
    let newSales = [];
    let newDeletedSales = [];
    let newExpenses = [];
    let newPurchases = [];

    try {
      newProducts = await DataModule.fetchAllProducts();
    } catch (error) {
      console.error('Error fetching products:', error);
      newProducts = products;
    }

    try {
      newSales = await DataModule.fetchSales();
    } catch (error) {
      console.error('Error fetching sales:', error);
      newSales = sales;
    }

    try {
      newDeletedSales = await DataModule.fetchDeletedSales();
    } catch (error) {
      console.error('Error fetching deleted sales:', error);
      newDeletedSales = deletedSales;
    }

    try {
      newExpenses = await DataModule.fetchExpenses();
    } catch (error) {
      console.error('Error fetching expenses:', error);
      newExpenses = expenses;
    }

    try {
      newPurchases = await DataModule.fetchPurchases();
    } catch (error) {
      console.error('Error fetching purchases:', error);
      newPurchases = purchases;
    }

    products = newProducts;
    dedupeProducts();
    sales = newSales;
    deletedSales = newDeletedSales;
    expenses = newExpenses;
    purchases = newPurchases;

    validateSalesData();

    scheduleRender(() => checkAndGenerateAlerts());

    saveToLocalStorage();

    loadProducts();
    loadSales();
    try {
      generateReport();
    } catch (_) {}

    if (currentPage === 'inventory') {
      loadInventory();
    } else if (currentPage === 'reports') {
      try {
        generateReport();
      } catch (_) {}
    } else if (currentPage === 'account') {
      loadAccount();
    } else if (currentPage === 'expenses') {
      loadExpenses();
    } else if (currentPage === 'purchases') {
      loadPurchases();
    } else if (currentPage === 'profit-loss') {
      loadProfitLossReport();
    }

    if (syncQueue.length > 0) {
      await processSyncQueue();
    }

    if (syncStatus && syncStatusText) {
      syncStatus.classList.remove('syncing');
      syncStatus.classList.add('show');
      syncStatusText.textContent = 'All data synced';
      setTimeout(() => syncStatus.classList.remove('show'), 3000);
    }

    showNotification('All data synchronized successfully!', 'success');
  } catch (error) {
    console.error('Error refreshing data:', error);

    const syncStatus = document.getElementById('sync-status');
    const syncStatusText = document.getElementById('sync-status-text');

    if (syncStatus && syncStatusText) {
      syncStatus.classList.remove('syncing');
      syncStatus.classList.add('error');
      syncStatusText.textContent = 'Sync error';
      setTimeout(() => syncStatus.classList.remove('show', 'error'), 3000);
    }

    showNotification('Error syncing data. Please try again.', 'error');
  }
}

// Expense Functions
function openExpenseModal(expense = null) {
  if (!canModifyProtectedData()) {
    showNotification('Only admins can manage expenses', 'error');
    return;
  }

  const modalTitle = document.getElementById('expense-modal-title');
  const expenseForm = document.getElementById('expense-form');

  if (expense) {
    modalTitle.textContent = 'Edit Expense';
    document.getElementById('expense-date').value = expense.date;
    document.getElementById('expense-description').value = expense.description;
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-receipt').value = expense.receipt || '';
    document.getElementById('expense-notes').value = expense.notes || '';

    expenseForm.dataset.expenseId = expense.id;
  } else {
    modalTitle.textContent = 'Add Expense';
    expenseForm.reset();
    document.getElementById('expense-date').valueAsDate = new Date();
    delete expenseForm.dataset.expenseId;
  }

  document.getElementById('expense-modal').style.display = 'flex';
}

function closeExpenseModal() {
  document.getElementById('expense-modal').style.display = 'none';
}

async function saveExpense() {
  if (!canModifyProtectedData()) {
    showNotification('Only admins can manage expenses', 'error');
    return;
  }

  const expenseForm = document.getElementById('expense-form');
  const expenseId = expenseForm.dataset.expenseId;

  // Get form values
  const date = document.getElementById('expense-date').value;
  const description = document.getElementById('expense-description').value;
  const category = document.getElementById('expense-category').value;
  const amount = document.getElementById('expense-amount').value;
  const receipt = document.getElementById('expense-receipt').value;
  const notes = document.getElementById('expense-notes').value;

  // Validate required fields
  const missingFields = [];
  if (!date) missingFields.push('Date');
  if (!description.trim()) missingFields.push('Description');
  if (!category) missingFields.push('Category');
  if (!amount || parseFloat(amount) <= 0) missingFields.push('Amount');

  if (missingFields.length > 0) {
    const fieldList = missingFields.join(', ');
    showNotification(
      `Please fill in the following required fields: ${fieldList}`,
      'error'
    );

    // Highlight missing fields
    if (!date) document.getElementById('expense-date').classList.add('error');
    if (!description.trim())
      document.getElementById('expense-description').classList.add('error');
    if (!category)
      document.getElementById('expense-category').classList.add('error');
    if (!amount || parseFloat(amount) <= 0)
      document.getElementById('expense-amount').classList.add('error');

    // Remove error highlighting after 3 seconds
    setTimeout(() => {
      document
        .querySelectorAll('.error')
        .forEach((el) => el.classList.remove('error'));
    }, 3000);

    return;
  }

  const expenseData = {
    date: date,
    description: description.trim(),
    category: category,
    amount: parseFloat(amount),
    receipt: receipt,
    notes: notes,
  };

  if (expenseId) {
    expenseData.id = expenseId;
  }

  const modalLoading = document.getElementById('expense-modal-loading');
  const saveBtn = document.getElementById('save-expense-btn');

  modalLoading.style.display = 'flex';
  saveBtn.disabled = true;

  try {
    const result = await DataModule.saveExpense(expenseData);

    if (result.success) {
      closeExpenseModal();
      loadExpenses();
      showNotification('Expense saved successfully', 'success');
    } else {
      showNotification('Failed to save expense. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error saving expense:', error);
    showNotification('Error saving expense. Please try again.', 'error');
  } finally {
    modalLoading.style.display = 'none';
    saveBtn.disabled = false;
  }
}

async function loadExpenses() {
  const loading = document.getElementById('expenses-loading');
  const tableBody = document.getElementById('expenses-table-body');

  loading.style.display = 'flex';

  try {
    await DataModule.fetchExpenses();

    // Calculate monthly and yearly totals
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyTotal = 0;
    let yearlyTotal = 0;

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);

      if (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      ) {
        monthlyTotal += expense.amount;
      }

      if (expenseDate.getFullYear() === currentYear) {
        yearlyTotal += expense.amount;
      }
    });

    document.getElementById('monthly-expenses-total').textContent =
      formatCurrency(monthlyTotal);
    document.getElementById('yearly-expenses-total').textContent =
      formatCurrency(yearlyTotal);

    // Populate expense table
    if (expenses.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">No expenses data available</td>
                </tr>
            `;
    } else {
      tableBody.innerHTML = '';

      expenses.slice(0, 20).forEach((expense) => {
        const row = document.createElement('tr');
        const actionButtons = canModifyProtectedData()
          ? `
                        <button class="btn-edit" onclick="editExpense('${expense.id}')" title="Edit Expense">
                            <i class="fas fa-edit"></i>
                        </button>
                    `
          : '<span class="no-permission">Admin only</span>';

        row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>
                    <div class="action-buttons">
                        ${actionButtons}
                    </div>
                </td>
            `;

        tableBody.appendChild(row);
      });
    }

    // Create expense categories chart
    createExpenseCategoriesChart();
  } catch (error) {
    console.error('Error loading expenses:', error);
    showNotification('Error loading expenses', 'error');
  } finally {
    loading.style.display = 'none';
  }
}

function createExpenseCategoriesChart() {
  const chartContainer = document.getElementById('expense-categories-chart');
  if (!chartContainer) return;

  // Calculate totals by category
  const categoryTotals = {};

  expenses.forEach((expense) => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });

  // Sort categories by total
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5 categories

  if (sortedCategories.length === 0) {
    chartContainer.innerHTML = '<p>No expense data available</p>';
    return;
  }

  // Create a simple bar chart
  let maxAmount = Math.max(...sortedCategories.map((c) => c[1]));

  let chartHTML = '<div class="simple-bar-chart">';

  sortedCategories.forEach(([category, amount]) => {
    const percentage = (amount / maxAmount) * 100;
    chartHTML += `
            <div class="bar-item">
                <div class="bar-label">${category}</div>
                <div class="bar-container">
                    <div class="bar" style="width: ${percentage}%"></div>
                </div>
                <div class="bar-value">${formatCurrency(amount)}</div>
            </div>
        `;
  });

  chartHTML += '</div>';
  chartContainer.innerHTML = chartHTML;
}

function editExpense(expenseId) {
  if (!canModifyProtectedData()) {
    showNotification('Only admins can manage expenses', 'error');
    return;
  }

  const expense = expenses.find((e) => e.id === expenseId);
  if (expense) {
    openExpenseModal(expense);
  }
}

async function deleteExpense(expenseId) {
  if (!canModifyProtectedData()) {
    showNotification('Only admins can manage expenses', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }

  try {
    // Remove from local array
    expenses = expenses.filter((e) => e.id !== expenseId);
    saveToLocalStorage();

    // Remove from database if online
    if (isOnline) {
      await runRemote(
        supabaseClient.from('expenses').delete().eq('id', expenseId),
        'Delete expense',
        REMOTE_WRITE_TIMEOUT_MS
      );
    } else {
      // Add to sync queue
      addToSyncQueue({
        type: 'deleteExpense',
        id: expenseId,
      });
    }

    loadExpenses();
    showNotification('Expense deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting expense:', error);
    showNotification('Error deleting expense', 'error');
  }
}

function filterExpenses() {
  const searchTerm = document
    .getElementById('expense-search')
    .value.toLowerCase();
  const categoryFilter = document.getElementById(
    'expense-filter-category'
  ).value;
  const dateFilter = document.getElementById('expense-filter-date').value;

  const filteredExpenses = expenses.filter((expense) => {
    let matchesSearch = true;
    let matchesCategory = true;
    let matchesDate = true;

    if (searchTerm) {
      matchesSearch =
        String(expense.description || '').toLowerCase().includes(searchTerm) ||
        String(expense.notes || '').toLowerCase().includes(searchTerm) ||
        String(expense.receipt || '').toLowerCase().includes(searchTerm);
    }

    if (categoryFilter) {
      matchesCategory = expense.category === categoryFilter;
    }

    if (dateFilter) {
      matchesDate = expense.date === dateFilter;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const tableBody = document.getElementById('expenses-table-body');

  if (filteredExpenses.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No expenses match the current filters</td>
            </tr>
        `;
  } else {
    tableBody.innerHTML = '';

    filteredExpenses.forEach((expense) => {
      const row = document.createElement('tr');
      const actionButtons = canModifyProtectedData()
        ? `
                        <button class="btn-edit" onclick="editExpense('${expense.id}')" title="Edit Expense">
                            <i class="fas fa-edit"></i>
                        </button>
                    `
        : '<span class="no-permission">Admin only</span>';

      row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>
                    <div class="action-buttons">
                        ${actionButtons}
                    </div>
                </td>
            `;

      tableBody.appendChild(row);
    });
  }
}

async function refreshExpenses() {
  await loadExpenses();
  showNotification('Expenses refreshed', 'success');
}

// Purchase Functions
function normalizePurchaseRecord(purchase = {}) {
  const quantity = Math.max(
    1,
    parseInt(purchase.quantity ?? purchase.qty ?? 1, 10) || 1
  );
  const costPrice = Number(
    purchase.costPrice ?? purchase.costprice ?? purchase.cost_price ?? 0
  );
  const sellingPriceRaw =
    purchase.sellingPrice ?? purchase.sellingprice ?? purchase.selling_price;
  const sellingPrice =
    sellingPriceRaw === '' || sellingPriceRaw === null || sellingPriceRaw === undefined
      ? null
      : Number(sellingPriceRaw);
  const amountRaw = Number(purchase.amount);
  const amount =
    Number.isFinite(amountRaw) && amountRaw > 0
      ? amountRaw
      : quantity * (Number.isFinite(costPrice) ? costPrice : 0);

  return {
    ...purchase,
    quantity,
    costPrice: Number.isFinite(costPrice) ? costPrice : 0,
    sellingPrice: Number.isFinite(sellingPrice) ? sellingPrice : null,
    amount,
    productId: purchase.productId || purchase.product_id || '',
    productName: purchase.productName || purchase.product_name || '',
  };
}

function getPurchaseProductMatches(term) {
  const query = String(term || '').trim().toLowerCase();
  if (!query) return [];
  const tokens = query.split(/\s+/).filter(Boolean);
  return (Array.isArray(products) ? products : [])
    .filter((product) => product && !product.deleted)
    .map((product) => {
      const haystack = [
        product.name,
        product.barcode,
        product.category,
        product.price,
        product.stock,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();
      const score = tokens.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0
      );
      const startsWith = String(product.name || '')
        .toLowerCase()
        .startsWith(query);
      return { product, score: score + (startsWith ? 2 : 0) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || String(a.product.name).localeCompare(String(b.product.name)))
    .slice(0, 12)
    .map((entry) => entry.product);
}

function renderPurchaseProductSuggestions(term) {
  const suggestions = document.getElementById('purchase-product-suggestions');
  if (!suggestions) return;
  const matches = getPurchaseProductMatches(term);
  if (!String(term || '').trim()) {
    suggestions.innerHTML = '<small>Type a product name, barcode, or category to search inventory.</small>';
    return;
  }
  if (matches.length === 0) {
    suggestions.innerHTML = '<small>No matching products found.</small>';
    return;
  }
  suggestions.innerHTML = matches
    .map(
      (product) => `
        <button type="button" class="purchase-product-option" data-product-id="${product.id}">
          <strong>${escapeHtml(product.name || 'Unnamed Product')}</strong>
          <span>${escapeHtml(product.category || 'Uncategorized')} | Stock: ${Number(product.stock) || 0} | ${formatCurrency(Number(product.price) || 0)}</span>
        </button>`
    )
    .join('');
}

function selectPurchaseProduct(productId) {
  const product = (Array.isArray(products) ? products : []).find(
    (item) => String(item.id) === String(productId)
  );
  if (!product) return;
  const hidden = document.getElementById('purchase-product-id');
  const selected = document.getElementById('purchase-product-selected');
  const search = document.getElementById('purchase-product-search');
  const description = document.getElementById('purchase-description');
  const sellingPrice = document.getElementById('purchase-selling-price');
  const suggestions = document.getElementById('purchase-product-suggestions');

  if (hidden) hidden.value = product.id;
  if (selected) selected.value = product.name || '';
  if (search) search.value = product.name || '';
  if (description && !description.value.trim()) description.value = product.name || '';
  if (sellingPrice && !sellingPrice.value) sellingPrice.value = Number(product.price) || '';
  if (suggestions) suggestions.innerHTML = '<small>Selected product will be restocked when this purchase is saved.</small>';
  updatePurchaseEstimate();
}

async function applyPurchaseStockChange(productId, quantityChange, sellingPrice) {
  if (!productId || !Number.isFinite(quantityChange) || quantityChange === 0) return;
  const product = (Array.isArray(products) ? products : []).find(
    (item) => String(item.id) === String(productId)
  );
  if (!product) return;

  const nextStock = Math.max(0, (Number(product.stock) || 0) + quantityChange);
  const nextPrice =
    Number.isFinite(sellingPrice) && sellingPrice > 0 ? sellingPrice : Number(product.price) || 0;
  product.stock = nextStock;
  product.price = nextPrice;
  saveToLocalStorage();

  if (!isOnline || String(product.id).startsWith('temp_')) {
    addToSyncQueue({ type: 'saveProduct', data: product });
    return;
  }

  try {
    const updateData = { stock: nextStock, price: nextPrice };
    const { error } = await runRemote(
      supabaseClient.from('products').update(updateData).eq('id', product.id),
      'Sync purchased stock',
      REMOTE_WRITE_TIMEOUT_MS
    );
    if (error) throw error;
  } catch (error) {
    console.warn('Could not sync product stock after purchase:', error);
    addToSyncQueue({ type: 'saveProduct', data: product });
  }
}

async function openPurchaseModal(purchase = null) {
  if (!canModifyProtectedData()) {
    showNotification('Only admins can manage purchases', 'error');
    return;
  }

  if ((!Array.isArray(products) || products.length === 0) && isOnline) {
    try {
      await DataModule.fetchAllProducts();
    } catch (error) {
      console.warn('Could not preload products for purchase search:', error);
    }
  }

  const modalTitle = document.getElementById('purchase-modal-title');
  const purchaseForm = document.getElementById('purchase-form');

  if (purchase) {
    const normalizedPurchase = normalizePurchaseRecord(purchase);
    modalTitle.textContent = 'Edit Purchase';
    document.getElementById('purchase-date').value = normalizedPurchase.date;
    document.getElementById('purchase-supplier').value = normalizedPurchase.supplier;
    document.getElementById('purchase-quantity').value =
      Number(normalizedPurchase.quantity) > 0 ? normalizedPurchase.quantity : 1;
    document.getElementById('purchase-cost-price').value =
      Number(normalizedPurchase.costPrice) >= 0 ? normalizedPurchase.costPrice : '';
    document.getElementById('purchase-selling-price').value =
      Number(normalizedPurchase.sellingPrice) >= 0 ? normalizedPurchase.sellingPrice : '';
    document.getElementById('purchase-description').value =
      normalizedPurchase.description;
    document.getElementById('purchase-product-id').value = normalizedPurchase.productId || '';
    document.getElementById('purchase-product-selected').value =
      normalizedPurchase.productName || normalizedPurchase.description || '';
    document.getElementById('purchase-product-search').value =
      normalizedPurchase.productName || normalizedPurchase.description || '';
    document.getElementById('purchase-invoice').value = normalizedPurchase.invoice || '';
    document.getElementById('purchase-notes').value = normalizedPurchase.notes || '';

    purchaseForm.dataset.purchaseId = purchase.id;
    purchaseForm.dataset.originalProductId = normalizedPurchase.productId || '';
    purchaseForm.dataset.originalQuantity = String(normalizedPurchase.quantity || 0);
  } else {
    modalTitle.textContent = 'Add Purchase';
    purchaseForm.reset();
    document.getElementById('purchase-date').valueAsDate = new Date();
    delete purchaseForm.dataset.purchaseId;
    delete purchaseForm.dataset.originalProductId;
    delete purchaseForm.dataset.originalQuantity;
    document.getElementById('purchase-product-id').value = '';
    document.getElementById('purchase-product-selected').value = '';
    renderPurchaseProductSuggestions('');
  }

  updatePurchaseEstimate();
  document.getElementById('purchase-modal').style.display = 'flex';
}

function closePurchaseModal() {
  document.getElementById('purchase-modal').style.display = 'none';
}

function updatePurchaseEstimate() {
  const quantity = Number(document.getElementById('purchase-quantity').value);
  const costPrice = Number(document.getElementById('purchase-cost-price').value);
  const sellingPrice = Number(
    document.getElementById('purchase-selling-price').value
  );
  const revenueEl = document.getElementById('purchase-expected-revenue');
  const profitEl = document.getElementById('purchase-expected-profit');
  const validQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const costTotal =
    Number.isFinite(costPrice) && costPrice >= 0 ? costPrice * validQuantity : 0;
  const revenue =
    Number.isFinite(sellingPrice) && sellingPrice >= 0
      ? sellingPrice * validQuantity
      : 0;

  if (revenueEl) revenueEl.textContent = formatCurrency(revenue);
  if (profitEl) profitEl.textContent = formatCurrency(revenue - costTotal);
}

async function savePurchase() {
  if (!canModifyProtectedData()) {
    showNotification('Only admins can manage purchases', 'error');
    return;
  }

  const purchaseForm = document.getElementById('purchase-form');
  const purchaseId = purchaseForm.dataset.purchaseId;

  // Get form values
  const date = document.getElementById('purchase-date').value;
  const supplier = document.getElementById('purchase-supplier').value;
  const description = document.getElementById('purchase-description').value;
  const quantityEl = document.getElementById('purchase-quantity');
  const costPriceEl = document.getElementById('purchase-cost-price');
  const sellingPriceEl = document.getElementById('purchase-selling-price');
  const productId = document.getElementById('purchase-product-id').value;
  const selectedProductName = document.getElementById('purchase-product-selected').value;
  const quantity = Number(quantityEl.value);
  const costPrice = Number(costPriceEl.value);
  const sellingPrice = Number(sellingPriceEl.value);
  const amount = quantity * costPrice;
  const invoice = document.getElementById('purchase-invoice').value;
  const notes = document.getElementById('purchase-notes').value;

  // Validate required fields
  const missingFields = [];
  if (!date) missingFields.push('Date');
  if (!supplier.trim()) missingFields.push('Supplier');
  if (!Number.isInteger(quantity) || quantity <= 0) missingFields.push('Quantity');
  if (!Number.isFinite(costPrice) || costPrice < 0)
    missingFields.push('Cost Price');
  if (!description.trim()) missingFields.push('Description');

  if (missingFields.length > 0) {
    const fieldList = missingFields.join(', ');
    showNotification(
      `Please fill in the following required fields: ${fieldList}`,
      'error'
    );

    // Highlight missing fields
    if (!date) document.getElementById('purchase-date').classList.add('error');
    if (!supplier.trim())
      document.getElementById('purchase-supplier').classList.add('error');
    if (!Number.isInteger(quantity) || quantity <= 0)
      quantityEl.classList.add('error');
    if (!Number.isFinite(costPrice) || costPrice < 0)
      costPriceEl.classList.add('error');
    if (!description.trim())
      document.getElementById('purchase-description').classList.add('error');

    // Remove error highlighting after 3 seconds
    setTimeout(() => {
      document
        .querySelectorAll('.error')
        .forEach((el) => el.classList.remove('error'));
    }, 3000);

    return;
  }

  const purchaseData = {
    date: date,
    supplier: supplier.trim(),
    description: description.trim(),
    quantity,
    costPrice,
    sellingPrice: Number.isFinite(sellingPrice) ? sellingPrice : null,
    amount,
    productId,
    productName: selectedProductName,
    invoice: invoice,
    notes: notes,
  };

  if (purchaseId) {
    purchaseData.id = purchaseId;
  }

  const modalLoading = document.getElementById('purchase-modal-loading');
  const saveBtn = document.getElementById('save-purchase-btn');

  modalLoading.style.display = 'flex';
  saveBtn.disabled = true;

  try {
    const result = await DataModule.savePurchase(purchaseData);

    if (result.success) {
      const originalProductId = purchaseForm.dataset.originalProductId || '';
      const originalQuantity = Number(purchaseForm.dataset.originalQuantity) || 0;
      if (purchaseId && originalProductId && originalProductId !== productId) {
        await applyPurchaseStockChange(originalProductId, -originalQuantity, null);
        await applyPurchaseStockChange(productId, quantity, sellingPrice);
      } else if (productId) {
        const quantityChange = purchaseId ? quantity - originalQuantity : quantity;
        await applyPurchaseStockChange(productId, quantityChange, sellingPrice);
      }
      closePurchaseModal();
      loadPurchases();
      if (document.getElementById('inventory-page')?.style.display !== 'none') {
        loadInventory(false);
      }
      showNotification('Purchase saved successfully', 'success');
    } else {
      showNotification('Failed to save purchase. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error saving purchase:', error);
    showNotification('Error saving purchase. Please try again.', 'error');
  } finally {
    modalLoading.style.display = 'none';
    saveBtn.disabled = false;
  }
}

async function loadPurchases() {
  const loading = document.getElementById('purchases-loading');
  const tableBody = document.getElementById('purchases-table-body');

  loading.style.display = 'flex';

  try {
    await DataModule.fetchPurchases();

    // Calculate monthly and yearly totals
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyTotal = 0;
    let yearlyTotal = 0;
    const suppliers = new Set();

    purchases.forEach((purchase) => {
      const purchaseDate = new Date(purchase.date);
      const amount = Number(purchase.amount) || 0;

      if (
        purchaseDate.getMonth() === currentMonth &&
        purchaseDate.getFullYear() === currentYear
      ) {
        monthlyTotal += amount;
      }

      if (purchaseDate.getFullYear() === currentYear) {
        yearlyTotal += amount;
      }

      suppliers.add(purchase.supplier);
    });

    document.getElementById('monthly-purchases-total').textContent =
      formatCurrency(monthlyTotal);
    document.getElementById('yearly-purchases-total').textContent =
      formatCurrency(yearlyTotal);
    document.getElementById('total-suppliers').textContent = suppliers.size;

    // Populate purchase table
    if (purchases.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center;">No purchases data available</td>
                </tr>
            `;
    } else {
      tableBody.innerHTML = '';

      purchases.slice(0, 20).forEach((purchase) => {
        purchase = normalizePurchaseRecord(purchase);
        const row = document.createElement('tr');
        const revenue = purchase.sellingPrice ? purchase.sellingPrice * purchase.quantity : 0;
        const profit = revenue - purchase.amount;
        const actionButtons = canModifyProtectedData()
          ? `
                              <button class="btn-edit" onclick="editPurchase('${purchase.id}')" title="Edit Purchase">
                                  <i class="fas fa-edit"></i>
                              </button>
                          `
          : '<span class="no-permission">Admin only</span>';

        row.innerHTML = `
                      <td>${formatDate(purchase.date)}</td>
                      <td>${purchase.supplier}</td>
                      <td>${purchase.productName || purchase.description}</td>
                      <td>${purchase.quantity}</td>
                      <td>${formatCurrency(purchase.costPrice)}</td>
                      <td>${purchase.sellingPrice ? formatCurrency(purchase.sellingPrice) : '-'}</td>
                      <td>${formatCurrency(purchase.amount)}</td>
                      <td>${revenue ? formatCurrency(revenue) : '-'}</td>
                      <td class="${profit < 0 ? 'loss-value' : 'profit-value'}">${revenue ? formatCurrency(profit) : '-'}</td>
                      <td>
                          <div class="action-buttons">
                              ${actionButtons}
                          </div>
                      </td>
                  `;

        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Error loading purchases:', error);
    showNotification('Error loading purchases', 'error');
  } finally {
    loading.style.display = 'none';
  }
}

function editPurchase(purchaseId) {
  if (!canModifyProtectedData()) {
    showNotification('Only admins can manage purchases', 'error');
    return;
  }

  const purchase = purchases.find((p) => p.id === purchaseId);
  if (purchase) {
    openPurchaseModal(purchase);
  }
}

async function deletePurchase(purchaseId) {
  if (!canModifyProtectedData()) {
    showNotification('Only admins can manage purchases', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this purchase?')) {
    return;
  }

  try {
    // Remove from local array
    purchases = purchases.filter((p) => p.id !== purchaseId);
    saveToLocalStorage();

    // Remove from database if online
    if (isOnline) {
      await runRemote(
        supabaseClient.from('purchases').delete().eq('id', purchaseId),
        'Delete purchase',
        REMOTE_WRITE_TIMEOUT_MS
      );
    } else {
      // Add to sync queue
      addToSyncQueue({
        type: 'deletePurchase',
        id: purchaseId,
      });
    }

    loadPurchases();
    showNotification('Purchase deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting purchase:', error);
    showNotification('Error deleting purchase', 'error');
  }
}

function filterPurchases() {
  const searchTerm = document
    .getElementById('purchase-search')
    .value.toLowerCase();
  const dateFilter = document.getElementById('purchase-filter-date').value;

  const filteredPurchases = purchases.filter((purchase) => {
    let matchesSearch = true;
    let matchesDate = true;

    if (searchTerm) {
      matchesSearch =
        String(purchase.supplier || '').toLowerCase().includes(searchTerm) ||
        String(purchase.description || '').toLowerCase().includes(searchTerm) ||
        String(purchase.productName || purchase.product_name || '').toLowerCase().includes(searchTerm) ||
        String(purchase.notes || '').toLowerCase().includes(searchTerm) ||
        String(purchase.invoice || '').toLowerCase().includes(searchTerm);
    }

    if (dateFilter) {
      matchesDate = purchase.date === dateFilter;
    }

    return matchesSearch && matchesDate;
  });

  const tableBody = document.getElementById('purchases-table-body');

  if (filteredPurchases.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center;">No purchases match the current filters</td>
            </tr>
        `;
  } else {
    tableBody.innerHTML = '';

    filteredPurchases.forEach((purchase) => {
      purchase = normalizePurchaseRecord(purchase);
      const row = document.createElement('tr');
      const revenue = purchase.sellingPrice ? purchase.sellingPrice * purchase.quantity : 0;
      const profit = revenue - purchase.amount;
      const actionButtons = canModifyProtectedData()
        ? `
                        <button class="btn-edit" onclick="editPurchase('${purchase.id}')" title="Edit Purchase">
                            <i class="fas fa-edit"></i>
                        </button>
                    `
        : '<span class="no-permission">Admin only</span>';

      row.innerHTML = `
                <td>${formatDate(purchase.date)}</td>
                <td>${purchase.supplier}</td>
                <td>${purchase.productName || purchase.description}</td>
                <td>${purchase.quantity}</td>
                <td>${formatCurrency(purchase.costPrice)}</td>
                <td>${purchase.sellingPrice ? formatCurrency(purchase.sellingPrice) : '-'}</td>
                <td>${formatCurrency(purchase.amount)}</td>
                <td>${revenue ? formatCurrency(revenue) : '-'}</td>
                <td class="${profit < 0 ? 'loss-value' : 'profit-value'}">${revenue ? formatCurrency(profit) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        ${actionButtons}
                    </div>
                </td>
            `;

      tableBody.appendChild(row);
    });
  }
}

async function refreshPurchases() {
  await loadPurchases();
  showNotification('Purchases refreshed', 'success');
}

// Enhanced loadStockAlerts function
function loadStockAlerts() {
  const lowStockLoading = document.getElementById('stock-alerts-loading');
  const stockAlertsList = document.getElementById('stock-alerts-list');
  if (lowStockLoading) lowStockLoading.style.display = 'flex';
  try {
    const result = checkAndGenerateAlerts();
    const allAlerts = result.all;
    const byType = result.byType;
    const expiredCount = byType.expired.length;
    const expiringSoonCount = byType.expiringSoon.length;
    const lowStockCount = byType.lowStock.length + byType.outOfStock.length;
    const expiredBadge = document.getElementById('expired-badge');
    const expiringSoonBadge = document.getElementById('expiring-soon-badge');
    const lowStockBadge = document.getElementById('low-stock-badge');
    if (expiredBadge) expiredBadge.textContent = expiredCount;
    if (expiringSoonBadge) expiringSoonBadge.textContent = expiringSoonCount;
    if (lowStockBadge) lowStockBadge.textContent = lowStockCount;
    const acknowledgedAlerts = readArrayFromLS('acknowledgedAlerts');
    const groups = [
      { title: `Expired (${expiredCount})`, items: byType.expired },
      {
        title: `Expiring Soon (${expiringSoonCount})`,
        items: byType.expiringSoon,
      },
      {
        title: `Low Stock (${byType.lowStock.length})`,
        items: byType.lowStock,
      },
      {
        title: `Out of Stock (${byType.outOfStock.length})`,
        items: byType.outOfStock,
      },
    ];
    const totalItems =
      expiredCount +
      expiringSoonCount +
      byType.lowStock.length +
      byType.outOfStock.length;
    if (totalItems === 0) {
      stockAlertsList.innerHTML = '<p>No stock alerts</p>';
    } else {
      stockAlertsList.innerHTML = '';
      groups.forEach((group) => {
        if (!group.items || group.items.length === 0) return;
        const section = document.createElement('div');
        section.className = 'alert-group';
        const header = document.createElement('h4');
        header.textContent = group.title;
        section.appendChild(header);
        group.items.forEach((alert) => {
          if (acknowledgedAlerts.includes(alert.id)) return;
          const alertDiv = document.createElement('div');
          alertDiv.className = `alert-item ${alert.severity}`;
          let iconClass = 'fas fa-exclamation-triangle';
          if (alert.severity === 'critical') {
            iconClass = 'fas fa-times-circle';
          } else if (alert.expiryDate) {
            iconClass = 'fas fa-clock';
          } else {
            iconClass = 'fas fa-box';
          }
          const secondary = alert.expiryDate
            ? `Expires on: ${formatDate(alert.expiryDate)}`
            : `Stock: ${alert.currentStock}`;
          alertDiv.innerHTML = `
                        <div class="alert-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="alert-content">
                            <div class="alert-title">${alert.name}</div>
                            <div class="alert-message">${alert.message}</div>
                            <div class="alert-time">${secondary}</div>
                        </div>
                        <div class="alert-actions">
                            <button class="btn btn-sm btn-primary" onclick="viewProduct('${alert.id}')">View</button>
                            <button class="btn btn-sm btn-secondary" onclick="acknowledgeAlert('${alert.id}')">Acknowledge</button>
                        </div>
                    `;
          section.appendChild(alertDiv);
        });
        stockAlertsList.appendChild(section);
      });
    }
  } catch (error) {
    console.error('Error loading stock alerts:', error);
    if (stockAlertsList)
      stockAlertsList.innerHTML = '<p>Error loading stock alerts</p>';
  } finally {
    if (lowStockLoading) lowStockLoading.style.display = 'none';
  }
}

// Enhanced loadDiscrepancies function
function loadDiscrepancies() {
  const loading = document.getElementById('discrepancies-loading');
  const discrepanciesList = document.getElementById('discrepancies-list');

  if (loading) loading.style.display = 'flex';

  try {
    const discrepancies = DataModule.detectDiscrepancies();

    // Update discrepancy badge if it exists
    const discrepancyBadge = document.getElementById('discrepancy-badge');
    if (discrepancyBadge) discrepancyBadge.textContent = discrepancies.length;

    // Get resolved discrepancies
    const resolvedDiscrepancies = JSON.parse(
      localStorage.getItem('resolvedDiscrepancies') || '[]'
    );

    if (discrepancies.length === 0) {
      discrepanciesList.innerHTML = '<p>No discrepancies found</p>';
    } else {
      discrepanciesList.innerHTML = '';

      discrepancies.forEach((discrepancy) => {
        // Skip resolved discrepancies
        if (resolvedDiscrepancies.includes(discrepancy.id)) return;

        const discrepancyDiv = document.createElement('div');
        discrepancyDiv.className = 'alert-item discrepancy';

        discrepancyDiv.innerHTML = `
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-message">${discrepancy.message}</div>
                        <div class="alert-time">${formatDate(
                          discrepancy.created_at
                        )}</div>
                    </div>
                    <div class="alert-actions">
                        ${
                          discrepancy.type.includes('sale')
                            ? `<button class="btn btn-sm btn-primary" onclick="viewSale('${discrepancy.saleId}')">View Sale</button>
                             <button class="btn btn-sm btn-secondary" onclick="resolveDiscrepancy('${discrepancy.id}', 'sale')">Resolve</button>`
                            : `<button class="btn btn-sm btn-primary" onclick="viewProduct('${discrepancy.productId}')">View Product</button>
                             <button class="btn btn-sm btn-secondary" onclick="resolveDiscrepancy('${discrepancy.id}', 'product')">Resolve</button>`
                        }
                    </div>
                `;

        discrepanciesList.appendChild(discrepancyDiv);
      });
    }
  } catch (error) {
    console.error('Error loading discrepancies:', error);
    discrepanciesList.innerHTML = '<p>Error loading discrepancies</p>';
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

// Analytics Functions
async function loadAnalytics() {
  const loading = document.getElementById('analytics-loading');
  if (loading) loading.style.display = 'flex';

  try {
    // Get date range based on selected period
    const period = document.getElementById('analytics-period').value;
    let startDate, endDate;

    const today = new Date();
    endDate = today.toISOString().split('T')[0];

    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate = startDate.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = startDate.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        startDate = startDate.toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        startDate = startDate.toISOString().split('T')[0];
        break;
      case 'custom':
        startDate = document.getElementById('analytics-start-date').value;
        endDate = document.getElementById('analytics-end-date').value;
        break;
    }

    // Calculate profit data
    const profitInfo = DataModule.calculateProfit(startDate, endDate);

    // Update summary cards
    document.getElementById('analytics-revenue').textContent = formatCurrency(
      profitInfo.revenue
    );
    document.getElementById('analytics-expenses').textContent = formatCurrency(
      profitInfo.expenses
    );
    const purchasesEl = document.getElementById('analytics-purchases');
    if (purchasesEl)
      purchasesEl.textContent = formatCurrency(profitInfo.purchases);
    document.getElementById('analytics-profit').textContent = formatCurrency(
      profitInfo.profit
    );

    const profitMargin =
      profitInfo.revenue > 0
        ? ((profitInfo.profit / profitInfo.revenue) * 100).toFixed(2)
        : 0;
    document.getElementById(
      'analytics-profit-margin'
    ).textContent = `${profitMargin}%`;

    // Create sales trend chart
    createSalesTrendChart(startDate, endDate);

    // Create purchase trend chart
    createPurchaseTrendChart(startDate, endDate);

    // Create expense trend chart
    createExpenseTrendChart(startDate, endDate);

    // Create top products chart
    createTopProductsChart(startDate, endDate);

    // Load stock alerts with enhanced functionality
    loadStockAlerts();

    // Load discrepancies with enhanced functionality
    loadDiscrepancies();

    // Check for critical alerts and show notification
    const criticalAlerts = stockAlerts.filter(
      (alert) => alert.severity === 'critical'
    );
    if (criticalAlerts.length > 0) {
      showNotification(
        `${criticalAlerts.length} critical stock alerts detected!`,
        'error'
      );
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    showNotification('Error loading analytics', 'error');
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function createSalesTrendChart(startDate, endDate) {
  const chartContainer = document.getElementById('sales-trend-chart');
  if (!chartContainer) return;

  // Filter sales by date range
  const filteredSales = sales.filter((sale) => {
    if (sale.deleted || sale.deleted_at || sale.deletedAt) return false;
    const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
    return saleDate >= startDate && saleDate <= endDate;
  });

  // Group sales by day
  const salesByDay = {};

  filteredSales.forEach((sale) => {
    const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
    if (!salesByDay[saleDate]) {
      salesByDay[saleDate] = 0;
    }
    salesByDay[saleDate] += sale.total;
  });

  // Create a simple line chart
  const dates = Object.keys(salesByDay).sort();
  const values = dates.map((date) => salesByDay[date]);

  if (dates.length === 0) {
    chartContainer.innerHTML = '<p>No sales data for the selected period</p>';
    return;
  }

  let maxValue = Math.max(...values);

  let chartHTML = '<div class="simple-line-chart">';
  chartHTML += '<div class="chart-y-axis">';

  // Add Y-axis labels
  for (let i = 5; i >= 0; i--) {
    const value = (maxValue / 5) * i;
    chartHTML += `<div class="y-label">${formatCurrency(value)}</div>`;
  }

  chartHTML += '</div>';
  chartHTML += '<div class="chart-content">';
  chartHTML += '<div class="chart-grid">';

  // Add grid lines
  for (let i = 0; i <= 5; i++) {
    chartHTML += `<div class="grid-line" style="bottom: ${
      (100 / 5) * i
    }%"></div>`;
  }

  chartHTML += '</div>';
  chartHTML += '<div class="chart-data">';

  // Add data points and lines
  dates.forEach((date, index) => {
    const value = salesByDay[date];
    const percentage = (value / maxValue) * 100;

    // Add line from previous point if not the first point
    if (index > 0) {
      const prevValue = salesByDay[dates[index - 1]];
      const prevPercentage = (prevValue / maxValue) * 100;

      chartHTML += `
                <svg class="chart-line" style="position: absolute; left: ${
                  (100 / (dates.length - 1)) * (index - 1)
                }%; width: ${
        100 / (dates.length - 1)
      }%; height: 100%; top: 0; pointer-events: none;">
                    <line x1="0" y1="${100 - prevPercentage}%" x2="100%" y2="${
        100 - percentage
      }%" stroke="#4a6fdc" stroke-width="2" />
                </svg>
            `;
    }

    // Add data point
    chartHTML += `
            <div class="chart-point" style="left: ${
              (100 / (dates.length - 1)) * index
            }%; bottom: ${percentage}%" title="${date}: ${formatCurrency(
      value
    )}">
                <div class="point"></div>
                <div class="point-label">${formatDate(date, true)}</div>
            </div>
        `;
  });

  chartHTML += '</div>';
  chartHTML += '</div>';
  chartHTML += '</div>';

  chartContainer.innerHTML = chartHTML;
}

function createPurchaseTrendChart(startDate, endDate) {
  const chartContainer = document.getElementById('purchase-trend-chart');
  if (!chartContainer) return;
  const filtered = purchases.filter((purchase) => {
    const d = new Date(purchase.date).toISOString().split('T')[0];
    return d >= startDate && d <= endDate;
  });
  const byDay = {};
  filtered.forEach((p) => {
    const d = new Date(p.date).toISOString().split('T')[0];
    if (!byDay[d]) byDay[d] = 0;
    byDay[d] += p.amount;
  });
  const dates = Object.keys(byDay).sort();
  const values = dates.map((date) => byDay[date]);
  if (dates.length === 0) {
    chartContainer.innerHTML =
      '<p>No purchase data for the selected period</p>';
    return;
  }
  let maxValue = Math.max(...values);
  let chartHTML = '<div class="simple-line-chart">';
  chartHTML += '<div class="chart-y-axis">';
  for (let i = 5; i >= 0; i--) {
    const value = (maxValue / 5) * i;
    chartHTML += `<div class="y-label">${formatCurrency(value)}</div>`;
  }
  chartHTML += '</div>';
  chartHTML += '<div class="chart-content">';
  chartHTML += '<div class="chart-grid">';
  for (let i = 0; i <= 5; i++) {
    chartHTML += `<div class="grid-line" style="bottom: ${
      (100 / 5) * i
    }%"></div>`;
  }
  chartHTML += '</div>';
  chartHTML += '<div class="chart-data">';
  dates.forEach((date, index) => {
    const value = byDay[date];
    const percentage = (value / maxValue) * 100;
    if (index > 0) {
      const prevValue = byDay[dates[index - 1]];
      const prevPercentage = (prevValue / maxValue) * 100;
      chartHTML += `
                <svg class="chart-line" style="position: absolute; left: ${
                  (100 / (dates.length - 1)) * (index - 1)
                }%; width: ${
        100 / (dates.length - 1)
      }%; height: 100%; top: 0; pointer-events: none;">
                    <line x1="0" y1="${100 - prevPercentage}%" x2="100%" y2="${
        100 - percentage
      }%" stroke="#dc6f4a" stroke-width="2" />
                </svg>
            `;
    }
    chartHTML += `
            <div class="chart-point" style="left: ${
              (100 / (dates.length - 1)) * index
            }%; bottom: ${percentage}%" title="${date}: ${formatCurrency(
      value
    )}">
                <div class="point"></div>
                <div class="point-label">${formatDate(date, true)}</div>
            </div>
        `;
  });
  chartHTML += '</div>';
  chartHTML += '</div>';
  chartHTML += '</div>';
  chartContainer.innerHTML = chartHTML;
}

function createExpenseTrendChart(startDate, endDate) {
  const chartContainer = document.getElementById('expense-trend-chart');
  if (!chartContainer) return;
  const filtered = expenses.filter((expense) => {
    const d = new Date(expense.date).toISOString().split('T')[0];
    return d >= startDate && d <= endDate;
  });
  const byDay = {};
  filtered.forEach((e) => {
    const d = new Date(e.date).toISOString().split('T')[0];
    if (!byDay[d]) byDay[d] = 0;
    byDay[d] += e.amount;
  });
  const dates = Object.keys(byDay).sort();
  const values = dates.map((date) => byDay[date]);
  if (dates.length === 0) {
    chartContainer.innerHTML = '<p>No expense data for the selected period</p>';
    return;
  }
  let maxValue = Math.max(...values);
  let chartHTML = '<div class="simple-line-chart">';
  chartHTML += '<div class="chart-y-axis">';
  for (let i = 5; i >= 0; i--) {
    const value = (maxValue / 5) * i;
    chartHTML += `<div class="y-label">${formatCurrency(value)}</div>`;
  }
  chartHTML += '</div>';
  chartHTML += '<div class="chart-content">';
  chartHTML += '<div class="chart-grid">';
  for (let i = 0; i <= 5; i++) {
    chartHTML += `<div class="grid-line" style="bottom: ${
      (100 / 5) * i
    }%"></div>`;
  }
  chartHTML += '</div>';
  chartHTML += '<div class="chart-data">';
  dates.forEach((date, index) => {
    const value = byDay[date];
    const percentage = (value / maxValue) * 100;
    if (index > 0) {
      const prevValue = byDay[dates[index - 1]];
      const prevPercentage = (prevValue / maxValue) * 100;
      chartHTML += `
                <svg class="chart-line" style="position: absolute; left: ${
                  (100 / (dates.length - 1)) * (index - 1)
                }%; width: ${
        100 / (dates.length - 1)
      }%; height: 100%; top: 0; pointer-events: none;">
                    <line x1="0" y1="${100 - prevPercentage}%" x2="100%" y2="${
        100 - percentage
      }%" stroke="#4adc6f" stroke-width="2" />
                </svg>
            `;
    }
    chartHTML += `
            <div class="chart-point" style="left: ${
              (100 / (dates.length - 1)) * index
            }%; bottom: ${percentage}%" title="${date}: ${formatCurrency(
      value
    )}">
                <div class="point"></div>
                <div class="point-label">${formatDate(date, true)}</div>
            </div>
        `;
  });
  chartHTML += '</div>';
  chartHTML += '</div>';
  chartHTML += '</div>';
  chartContainer.innerHTML = chartHTML;
}

function createTopProductsChart(startDate, endDate) {
  const chartContainer = document.getElementById('top-products-chart');
  if (!chartContainer) return;

  // Filter sales by date range
  const filteredSales = sales.filter((sale) => {
    if (sale.deleted || sale.deleted_at || sale.deletedAt) return false;
    const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
    return saleDate >= startDate && saleDate <= endDate;
  });

  // Calculate total quantity sold for each product
  const productSales = {};

  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSales[item.id]) {
        productSales[item.id] = {
          id: item.id,
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
      }

      productSales[item.id].quantity += item.quantity;
      productSales[item.id].revenue += item.price * item.quantity;
    });
  });

  // Sort by quantity sold
  const sortedProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // Top 5 products

  if (sortedProducts.length === 0) {
    chartContainer.innerHTML = '<p>No sales data for the selected period</p>';
    return;
  }

  // Create a simple bar chart
  let maxQuantity = Math.max(...sortedProducts.map((p) => p.quantity));

  let chartHTML = '<div class="simple-bar-chart">';

  sortedProducts.forEach((product) => {
    const percentage = (product.quantity / maxQuantity) * 100;
    chartHTML += `
            <div class="bar-item">
                <div class="bar-label">${product.name}</div>
                <div class="bar-container">
                    <div class="bar" style="width: ${percentage}%"></div>
                </div>
                <div class="bar-value">${product.quantity} units</div>
            </div>
        `;
  });

  chartHTML += '</div>';
  chartContainer.innerHTML = chartHTML;
}

function getProfitLossRange() {
  const today = new Date();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  const periodEl = document.getElementById('profit-loss-period');
  const period = periodEl ? periodEl.value : 'month';
  let start = new Date(today.getFullYear(), today.getMonth(), 1);

  if (period === 'week') {
    const day = (today.getDay() + 6) % 7;
    start = new Date(today);
    start.setDate(today.getDate() - day);
  } else if (period === 'quarter') {
    start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  } else if (period === 'year') {
    start = new Date(today.getFullYear(), 0, 1);
  } else if (period === 'custom') {
    const startValue = document.getElementById('profit-loss-start-date').value;
    const endValue = document.getElementById('profit-loss-end-date').value;
    const customStart = startValue ? new Date(startValue) : null;
    const customEnd = endValue ? new Date(endValue) : null;
    if (customStart && !isNaN(customStart.getTime())) start = customStart;
    if (customEnd && !isNaN(customEnd.getTime())) {
      end.setTime(customEnd.getTime());
      end.setHours(23, 59, 59, 999);
    }
  }

  start.setHours(0, 0, 0, 0);
  return { start, end, period };
}

function addProfitLossRow(weeks, dateValue, field, amount) {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || isNaN(date.getTime())) return;
  const weekStart = new Date(date);
  const day = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const key = weekStart.toISOString().slice(0, 10);
  const row = weeks.get(key) || {
    start: weekStart,
    end: weekEnd,
    sales: 0,
    purchases: 0,
    expenses: 0,
  };
  row[field] += Number(amount) || 0;
  weeks.set(key, row);
}

function renderProfitLossWeeklyBreakdown(filteredSales, filteredPurchases, filteredExpenses) {
  const body = document.getElementById('profit-loss-weekly-body');
  if (!body) return;
  const weeks = new Map();
  filteredSales.forEach((sale) => addProfitLossRow(weeks, sale.created_at, 'sales', sale.total));
  filteredPurchases.forEach((purchase) =>
    addProfitLossRow(weeks, purchase.date, 'purchases', purchase.amount)
  );
  filteredExpenses.forEach((expense) =>
    addProfitLossRow(weeks, expense.date, 'expenses', expense.amount)
  );
  const rows = Array.from(weeks.values()).sort((a, b) => b.start - a.start);
  if (rows.length === 0) {
    body.innerHTML =
      '<tr><td colspan="5" style="text-align: center;">No figures for this period</td></tr>';
    return;
  }
  body.innerHTML = rows
    .map((row) => {
      const net = row.sales - row.purchases - row.expenses;
      return `
        <tr>
          <td>${formatDate(row.start, true)} - ${formatDate(row.end, true)}</td>
          <td>${formatCurrency(row.sales)}</td>
          <td>${formatCurrency(row.purchases)}</td>
          <td>${formatCurrency(row.expenses)}</td>
          <td class="${net < 0 ? 'loss-value' : 'profit-value'}">${formatCurrency(net)}</td>
        </tr>
      `;
    })
    .join('');
}

async function loadProfitLossReport(refresh = false) {
  const loading = document.getElementById('profit-loss-loading');
  if (loading) loading.style.display = 'flex';
  try {
    if (refresh) {
      const [fetchedSales, fetchedExpenses, fetchedPurchases] = await Promise.all([
        DataModule.fetchSales(),
        DataModule.fetchExpenses(),
        DataModule.fetchPurchases(),
      ]);
      sales = fetchedSales;
      expenses = fetchedExpenses;
      purchases = fetchedPurchases;
    }
    const { start, end } = getProfitLossRange();
    const filteredSales = (Array.isArray(sales) ? sales : []).filter((sale) => {
      if (!sale || sale.deleted || sale.deleted_at || sale.deletedAt) return false;
      return isDateInReportRange(sale.created_at, start, end);
    });
    const filteredPurchases = (Array.isArray(purchases) ? purchases : []).filter(
      (purchase) => purchase && isDateInReportRange(purchase.date, start, end)
    );
    const filteredExpenses = (Array.isArray(expenses) ? expenses : []).filter(
      (expense) => expense && isDateInReportRange(expense.date, start, end)
    );
    const revenue = filteredSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const purchaseCost = filteredPurchases.reduce(
      (sum, purchase) => sum + (Number(purchase.amount) || 0),
      0
    );
    const expenseCost = filteredExpenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0),
      0
    );
    const net = revenue - purchaseCost - expenseCost;
    const margin = revenue > 0 ? ((net / revenue) * 100).toFixed(2) : '0.00';
    [
      ['profit-loss-revenue', formatCurrency(revenue)],
      ['profit-loss-purchases', formatCurrency(purchaseCost)],
      ['profit-loss-expenses', formatCurrency(expenseCost)],
      ['profit-loss-result', formatCurrency(net)],
      ['profit-loss-margin', `${margin}%`],
      ['profit-loss-sales-count', filteredSales.length],
      ['profit-loss-purchase-count', filteredPurchases.length],
      ['profit-loss-expense-count', filteredExpenses.length],
    ].forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    const result = document.getElementById('profit-loss-result');
    if (result) result.classList.toggle('loss-value', net < 0);
    const resultLabel = document.getElementById('profit-loss-result-label');
    if (resultLabel) resultLabel.textContent = net < 0 ? 'Net Loss' : 'Net Profit';
    const range = document.getElementById('profit-loss-range');
    if (range) {
      range.textContent = `${formatDate(start, true)} to ${formatDate(
        end,
        true
      )}. Inventory purchase/expenses are stock costs recorded in the period.`;
    }
    renderProfitLossWeeklyBreakdown(filteredSales, filteredPurchases, filteredExpenses);
  } catch (error) {
    console.error('Error loading profit and loss report:', error);
    showNotification('Error loading profit and loss report', 'error');
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function handleProfitLossPeriodChange() {
  const periodEl = document.getElementById('profit-loss-period');
  const customRange = document.getElementById('profit-loss-custom-range');
  const isCustom = periodEl && periodEl.value === 'custom';
  if (customRange) customRange.style.display = isCustom ? 'flex' : 'none';
  if (isCustom) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const startEl = document.getElementById('profit-loss-start-date');
    const endEl = document.getElementById('profit-loss-end-date');
    if (startEl && !startEl.value) startEl.valueAsDate = monthStart;
    if (endEl && !endEl.value) endEl.valueAsDate = today;
  }
  loadProfitLossReport();
}

async function refreshProfitLossReport() {
  await loadProfitLossReport(true);
  showNotification('Profit and loss report refreshed', 'success');
}

function restockProduct(productId) {
  const product = products.find((p) => p.id === productId);
  if (product) {
    openProductModal(product);
  }
}

function viewProduct(productId) {
  const product = products.find((p) => p.id === productId);
  if (product) {
    showPage('inventory');
    loadInventory();

    // Highlight the product in the table
    setTimeout(() => {
      const rows = document.querySelectorAll('#inventory-table-body tr');
      for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].querySelector('td:first-child');
        if (cell && String(cell.textContent).trim() === String(productId)) {
          rows[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
          rows[i].classList.add('highlight');
          setTimeout(() => rows[i].classList.remove('highlight'), 3000);
          break;
        }
      }
    }, 500);
  }
}

function removeProduct(productId) {
  if (
    !confirm(
      'Are you sure you want to remove this expired product from inventory?'
    )
  ) {
    return;
  }

  deleteProduct(productId);
}

// Event Listeners
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    AuthModule.signIn(email, password);
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const role = document.getElementById('register-role').value;
    if (password !== confirmPassword) {
      const registerError = document.getElementById('register-error');
      if (registerError) {
        registerError.style.display = 'block';
        registerError.textContent = 'Passwords do not match';
      }
      return;
    }
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    registerSubmitBtn.classList.add('loading');
    registerSubmitBtn.disabled = true;
    AuthModule.signUp(email, password, name, role)
      .then((result) => {
        if (result.success) {
          const loginTab = document.querySelector('[data-tab="login"]');
          if (loginTab) loginTab.click();
          registerForm.reset();
        }
      })
      .finally(() => {
        registerSubmitBtn.classList.remove('loading');
        registerSubmitBtn.disabled = false;
      });
  });
}

// Login tabs
document.querySelectorAll('.login-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');

    document
      .querySelectorAll('.login-tab')
      .forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.remove('active');
      if (
        content.id === `${tabName}-tab` ||
        content.id === `${tabName}-content`
      ) {
        content.classList.add('active');
      }
    });

    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    if (loginError) loginError.style.display = 'none';
    if (registerError) registerError.style.display = 'none';
  });
});

// Navigation
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const pageName = link.getAttribute('data-page');
    if (!canAccessPage(pageName)) {
      showNotification('Only admins can access inventory', 'error');
      showPage('pos');
      return;
    }
    showPage(pageName);
  });
});

// Mobile menu
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      AuthModule.signOut();
    }
  });
}

// Product search
function applyProductSearch(searchTerm) {
  const term = (searchTerm || '').toString().trim().toLowerCase();
  const seq = ++productSearchSeq;
  if (!term) {
    loadProducts();
    return;
  }
  if (isOnline) {
    (async () => {
      try {
        let query = supabaseClient
          .from('products')
          .select('id,name,category,price,stock,expirydate,barcode,deleted')
          .or(
            `name.ilike.%${term}%,category.ilike.%${term}%,barcode.ilike.%${term}%`
          )
          .range(0, PRODUCTS_PAGE_SIZE - 1);
        try {
          query = query.eq('deleted', false);
        } catch (_) {}
        const { data, error } = await query;
        if (!error && data) {
          if (seq !== productSearchSeq) return;
          const normalized = (data || [])
            .map((p) => {
              if (p.expirydate && !p.expiryDate) p.expiryDate = p.expirydate;
              return p;
            })
            .filter((p) => !p.deleted);
          const localMatches = products.filter((product) =>
            matchesProductSearch(product, term)
          );
          renderFilteredProducts(
            mergeProductListsBySignature(normalized, localMatches)
          );
          return;
        }
      } catch (e) {
        console.warn('Online search failed, falling back:', e);
      }
      if (seq !== productSearchSeq) return;
      renderLocal();
    })();
  } else {
    if (seq !== productSearchSeq) return;
    renderLocal();
  }
  function renderLocal() {
    const filtered = products.filter((product) =>
      matchesProductSearch(product, term)
    );
    renderFilteredProducts(filtered);
  }
}

const searchBtn = document.getElementById('search-btn');
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const productSearchEl = document.getElementById('product-search');
    const searchTerm = productSearchEl ? productSearchEl.value : '';
    applyProductSearch(searchTerm);
  });
}

const productSearchEl = document.getElementById('product-search');
if (productSearchEl) {
  const handler = debounce(() => {
    applyProductSearch(productSearchEl.value);
  }, 150);
  productSearchEl.addEventListener('input', handler);
  productSearchEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tryHandleDirectProductEntry(productSearchEl.value)) {
        return;
      }
      applyProductSearch(productSearchEl.value);
    }
  });
  productSearchEl.addEventListener('blur', () => {
    focusPosSearch({ defer: true });
  });
}

function renderFilteredProducts(list) {
  const filteredProducts = Array.isArray(list)
    ? list.filter((p) => p && !p.deleted)
    : [];
  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No products found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
    return;
  }
  productsGrid.innerHTML = '';
  const chunkSize = 100;
  let index = 0;
  function renderChunk() {
    const fragment = document.createDocumentFragment();
    const today = new Date();
    for (
      let i = 0;
      i < chunkSize && index < filteredProducts.length;
      i++, index++
    ) {
      const product = filteredProducts[index];
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      const expiryDate = new Date(product.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );
      let expiryWarning = '';
      let productNameStyle = '';
      if (daysUntilExpiry < 0) {
        expiryWarning = `<div class="expiry-warning"><i class="fas fa-exclamation-triangle"></i> Expired</div>`;
        productNameStyle = 'style="color: red; font-weight: bold;"';
      } else if (daysUntilExpiry <= settings.expiryWarningDays) {
        expiryWarning = `<div class="expiry-warning"><i class="fas fa-clock"></i> Expires in ${daysUntilExpiry} days</div>`;
        productNameStyle = 'style="color: red; font-weight: bold;"';
      }
      let stockClass = 'stock-high';
      if (product.stock <= 0) {
        stockClass = 'stock-low';
      } else if (product.stock <= settings.lowStockThreshold) {
        stockClass = 'stock-medium';
      }
      productCard.innerHTML = `
                    <div class="product-img">
                        <i class="fas fa-box"></i>
                    </div>
                    <h4 ${productNameStyle}>${product.name}</h4>
                    <div class="price">${formatCurrency(product.price)}</div>
                    <div class="stock ${stockClass}">Stock: ${product.stock}</div>
                    ${expiryWarning}
                `;
      productCard.addEventListener('click', () => addToCart(product));
      fragment.appendChild(productCard);
    }
    productsGrid.appendChild(fragment);
    if (index < filteredProducts.length) {
      setTimeout(renderChunk, 0);
    }
  }
  renderChunk();
}
// Inventory search
function applyInventorySearch(searchTerm) {
  const term = (searchTerm || '').toString().trim().toLowerCase();
  inventorySearchTerm = term;
  loadInventory(false);
}

function renderInventoryList(list) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const todayTs = Date.now();
  const chunkSize = 400;
  let index = 0;
  const mySeq = ++inventoryRenderSeq;
  inventoryTableBody.innerHTML = '';
  const seenKeys = new Set();
  function renderChunk() {
    if (mySeq !== inventoryRenderSeq) return;
    let html = '';
    for (let i = 0; i < chunkSize && index < list.length; i++, index++) {
      const product = list[index];
      if (!product) continue;
      const key = productKeyNCP(product);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      if (product.deleted) continue;
      const expiryTs =
        product.expiryTs || (product.expiryTs = Date.parse(product.expiryDate));
      const daysUntilExpiry = Math.ceil((expiryTs - todayTs) / msPerDay);
      let rowClass = '';
      let stockBadgeClass = 'stock-high';
      let stockBadgeText = 'In Stock';
      let productNameStyle = '';
      if (product.stock <= 0) {
        stockBadgeClass = 'stock-low';
        stockBadgeText = 'Out of Stock';
      } else if (product.stock <= settings.lowStockThreshold) {
        stockBadgeClass = 'stock-medium';
        stockBadgeText = 'Low Stock';
      }
      let expiryBadgeClass = 'expiry-good';
      let expiryBadgeText = 'Good';
      if (daysUntilExpiry < 0) {
        expiryBadgeClass = 'expiry-expired';
        expiryBadgeText = 'Expired';
        rowClass = 'expired';
        productNameStyle = 'style="color: red; font-weight: bold;"';
      } else if (daysUntilExpiry <= settings.expiryWarningDays) {
        expiryBadgeClass = 'expiry-warning';
        expiryBadgeText = 'Expiring Soon';
        rowClass = 'expiring-soon';
        productNameStyle = 'style="color: red; font-weight: bold;"';
      }
      let actionButtons = '';
      if (AuthModule.isAdmin()) {
        actionButtons = `
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
      } else {
        actionButtons = '<span class="no-permission">Admin only</span>';
      }
      html += `
                <tr ${rowClass ? `class=\"${rowClass}\"` : ''}>
                    <td>${product.id}</td>
                    <td ${productNameStyle}>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${product.stock}</td>
                    <td>${formatDate(product.expiryDate)}</td>
                    <td>
                        <span class="stock-badge ${stockBadgeClass}">${stockBadgeText}</span>
                        <span class="expiry-badge ${expiryBadgeClass}">${expiryBadgeText}</span>
                    </td>
                    <td>
                        ${actionButtons}
                    </td>
                </tr>
            `;
    }
    if (mySeq !== inventoryRenderSeq) return;
    if (html) inventoryTableBody.insertAdjacentHTML('beforeend', html);
    if (index < list.length) {
      requestAnimationFrame(renderChunk);
    }
  }
  requestAnimationFrame(renderChunk);
}

function updateInventoryTotalFromAllProducts() {
  const inventoryTotalValue = document.getElementById('inventory-total-value');
  if (inventoryTotalValue) {
    const totalValue = products
      .filter((p) => !p.deleted)
      .reduce(
        (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
        0
      );
    inventoryTotalValue.textContent = formatCurrency(totalValue);
  }
}

const inventorySearchBtn = document.getElementById('inventory-search-btn');
if (inventorySearchBtn) {
  inventorySearchBtn.addEventListener('click', () => {
    const inventorySearchEl = document.getElementById('inventory-search');
    const searchTerm = inventorySearchEl ? inventorySearchEl.value : '';
    applyInventorySearch(searchTerm);
  });
}

const inventorySearchEl = document.getElementById('inventory-search');
if (inventorySearchEl) {
  const handler = debounce(() => {
    applyInventorySearch(inventorySearchEl.value);
  }, 150);
  inventorySearchEl.addEventListener('input', handler);
}

// Product buttons
const addProductBtn = document.getElementById('add-product-btn');
if (addProductBtn) {
  addProductBtn.addEventListener('click', () => {
    openProductModal();
  });
}

const addInventoryBtn = document.getElementById('add-inventory-btn');
if (addInventoryBtn) {
  addInventoryBtn.addEventListener('click', () => {
    openProductModal();
  });
}

const saveProductBtn = document.getElementById('save-product-btn');
if (saveProductBtn) {
  saveProductBtn.addEventListener('click', saveProduct);
}

const generateBarcodeBtn = document.getElementById('generate-barcode-btn');
if (generateBarcodeBtn) {
  generateBarcodeBtn.addEventListener('click', () => {
    const productForm = document.getElementById('product-form');
    const productBarcodeEl = document.getElementById('product-barcode');
    if (!productBarcodeEl) return;
    productBarcodeEl.value = generateUniqueProductBarcode(
      productForm ? productForm.dataset.productId : ''
    );
  });
}

const printProductLabelBtn = document.getElementById('print-product-label-btn');
if (printProductLabelBtn) {
  printProductLabelBtn.addEventListener('click', () => {
    const productId = printProductLabelBtn.dataset.productId;
    if (productId) printProductLabel(productId);
  });
}

const cancelProductBtn = document.getElementById('cancel-product-btn');
if (cancelProductBtn) {
  cancelProductBtn.addEventListener('click', closeProductModal);
}

// Cart buttons
const clearCartBtn = document.getElementById('clear-cart-btn');
if (clearCartBtn) {
  clearCartBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear cart?')) {
      clearCart();
    }
  });
}

const completeSaleBtn = document.getElementById('complete-sale-btn');
if (completeSaleBtn) {
  completeSaleBtn.addEventListener('click', completeSale);
}
if (cartItems) {
  cartItems.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="update-cart-quantity"]');
    if (!button) return;

    const { productId, change } = button.dataset;
    if (!productId || !change) return;

    updateQuantity(productId, Number(change));
  });
}
if (paymentMethodSelect) {
  paymentMethodSelect.addEventListener('change', syncCustomerDisplayState);
}
if (saleDiscountInput) {
  saleDiscountInput.addEventListener('input', updateCart);
}
if (openCustomerViewBtn) {
  openCustomerViewBtn.addEventListener('click', () => {
    openCustomerView();
  });
}
if (closeCustomerViewBtn) {
  closeCustomerViewBtn.addEventListener('click', closeCustomerView);
}
updateCustomerViewButtons();
syncCustomerDisplayState();

// Receipt modal buttons
const printReceiptBtn = document.getElementById('print-receipt-btn');
if (printReceiptBtn) {
  printReceiptBtn.addEventListener('click', printReceipt);
}

const newSaleBtn = document.getElementById('new-sale-btn');
if (newSaleBtn) {
  newSaleBtn.addEventListener('click', () => {
    receiptModal.style.display = 'none';
    focusPosSearch({ defer: true, select: true });
  });
}

// Report generation
const generateReportBtn = document.getElementById('generate-report-btn');
if (generateReportBtn) {
  generateReportBtn.addEventListener('click', generateReport);
}

// Manual sync button
const manualSyncBtn = document.getElementById('manual-sync-btn');
if (manualSyncBtn) {
  manualSyncBtn.addEventListener('click', () => {
    if (isOnline && syncQueue.length > 0) {
      processSyncQueue();
    } else if (!isOnline) {
      showNotification('Cannot sync while offline', 'warning');
    } else {
      showNotification('No data to sync', 'info');
    }
  });
}

const refreshStockBtn = document.getElementById('refresh-stock-btn');
if (refreshStockBtn) {
  refreshStockBtn.addEventListener('click', () => {
    loadStockCheck();
  });
}
const printStockCheckBtn = document.getElementById('print-stock-check-btn');
if (printStockCheckBtn) {
  printStockCheckBtn.addEventListener('click', printStockCheck);
}

// Refresh report button
const refreshReportBtn = document.getElementById('refresh-report-btn');
if (refreshReportBtn) {
  refreshReportBtn.addEventListener('click', async () => {
    const reportsLoading = document.getElementById('reports-loading');
    if (reportsLoading) reportsLoading.style.display = 'flex';

    try {
      await refreshAllData();
      generateReport();
      showNotification('Report data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing report data:', error);
      showNotification('Error refreshing report data', 'error');
    } finally {
      if (reportsLoading) reportsLoading.style.display = 'none';
    }
  });
}

// Modal close buttons
document.querySelectorAll('.modal-close').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').style.display = 'none';
    focusPosSearch({ defer: true });
  });
});

// Change password form
const changePasswordForm = document.getElementById('change-password-form');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPasswordEl = document.getElementById('current-password');
    const newPasswordEl = document.getElementById('new-password');
    const confirmPasswordEl = document.getElementById('confirm-new-password');

    const currentPassword = currentPasswordEl ? currentPasswordEl.value : '';
    const newPassword = newPasswordEl ? newPasswordEl.value : '';
    const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';

    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    const changePasswordBtn = document.getElementById('change-password-btn');
    changePasswordBtn.classList.add('loading');
    changePasswordBtn.disabled = true;

    try {
      const { error } = await withTimeout(
        supabaseClient.auth.signInWithPassword({
          email: currentUser.email,
          password: currentPassword,
        }),
        REMOTE_WRITE_TIMEOUT_MS,
        'Confirm password'
      );

      if (error) throw error;

      const { error: updateError } = await withTimeout(
        supabaseClient.auth.updateUser({
          password: newPassword,
        }),
        REMOTE_WRITE_TIMEOUT_MS,
        'Update password'
      );

      if (updateError) throw updateError;

      showNotification('Password changed successfully', 'success');
      changePasswordForm.reset();
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification('Failed to change password: ' + error.message, 'error');
    } finally {
      changePasswordBtn.classList.remove('loading');
      changePasswordBtn.disabled = false;
    }
  });
}

// Expense page event listeners
{
  const a1 = document.getElementById('add-expense-btn');
  if (a1) a1.addEventListener('click', openExpenseModal);
  const a2 = document.getElementById('refresh-expenses-btn');
  if (a2) a2.addEventListener('click', refreshExpenses);
  const a3 = document.getElementById('expense-search');
  if (a3) a3.addEventListener('input', filterExpenses);
  const a4 = document.getElementById('expense-filter-category');
  if (a4) a4.addEventListener('change', filterExpenses);
  const a5 = document.getElementById('expense-filter-date');
  if (a5) a5.addEventListener('change', filterExpenses);
}

// Purchase page event listeners
{
  const p1 = document.getElementById('add-purchase-btn');
  if (p1) p1.addEventListener('click', () => openPurchaseModal());
  const p2 = document.getElementById('refresh-purchases-btn');
  if (p2) p2.addEventListener('click', refreshPurchases);
  const p3 = document.getElementById('purchase-search');
  if (p3) p3.addEventListener('input', filterPurchases);
  const p4 = document.getElementById('purchase-filter-date');
  if (p4) p4.addEventListener('change', filterPurchases);
  ['purchase-quantity', 'purchase-cost-price', 'purchase-selling-price'].forEach(
    (id) => {
      const field = document.getElementById(id);
      if (field) field.addEventListener('input', updatePurchaseEstimate);
    }
  );
  const purchaseProductSearch = document.getElementById('purchase-product-search');
  if (purchaseProductSearch) {
    purchaseProductSearch.addEventListener(
      'input',
      debounce(() => renderPurchaseProductSuggestions(purchaseProductSearch.value), 120)
    );
    purchaseProductSearch.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const firstMatch = getPurchaseProductMatches(purchaseProductSearch.value)[0];
        if (firstMatch) selectPurchaseProduct(firstMatch.id);
      }
    });
  }
  const purchaseSuggestions = document.getElementById('purchase-product-suggestions');
  if (purchaseSuggestions) {
    purchaseSuggestions.addEventListener('click', (event) => {
      const option = event.target.closest('[data-product-id]');
      if (option) selectPurchaseProduct(option.dataset.productId);
    });
  }
}

// Analytics page event listeners
{
  const profitLossRefresh = document.getElementById('refresh-profit-loss-btn');
  if (profitLossRefresh)
    profitLossRefresh.addEventListener('click', refreshProfitLossReport);
  const profitLossPeriod = document.getElementById('profit-loss-period');
  if (profitLossPeriod)
    profitLossPeriod.addEventListener('change', handleProfitLossPeriodChange);
  const profitLossStart = document.getElementById('profit-loss-start-date');
  if (profitLossStart) profitLossStart.addEventListener('change', loadProfitLossReport);
  const profitLossEnd = document.getElementById('profit-loss-end-date');
  if (profitLossEnd) profitLossEnd.addEventListener('change', loadProfitLossReport);
}

// Requests page event listeners
{
  const r1 = document.getElementById('refresh-requests-btn');
  if (r1) r1.addEventListener('click', loadRequestsPage);

  const rSearchInput = document.getElementById('finished-product-search');
  if (rSearchInput) {
    rSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleFinishedProductSearch();
      }
    });
    rSearchInput.addEventListener('input', () => {
      if (!rSearchInput.value.trim()) {
        populateFinishedProductOptions('');
      }
    });
  }

  const rSearchBtn = document.getElementById('finished-product-search-btn');
  if (rSearchBtn) rSearchBtn.addEventListener('click', handleFinishedProductSearch);

  const r2 = document.getElementById('finished-product-form');
  if (r2) r2.addEventListener('submit', saveFinishedProductReport);

  const r3 = document.getElementById('customer-request-form');
  if (r3) r3.addEventListener('submit', saveCustomerRequest);

  const r4 = document.getElementById('finished-products-table-body');
  if (r4) {
    r4.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      if (button.dataset.action === 'delete-finished-report' && button.dataset.id) {
        deleteFinishedProductReport(button.dataset.id);
      }
    });
  }

  const r5 = document.getElementById('customer-requests-table-body');
  if (r5) {
    r5.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button || !button.dataset.id) return;
      if (button.dataset.action === 'toggle-customer-request') {
        toggleCustomerRequest(button.dataset.id);
      } else if (button.dataset.action === 'delete-customer-request') {
        deleteCustomerRequest(button.dataset.id);
      }
    });
  }
}

// Treatments page event listeners
{
  const t1 = document.getElementById('refresh-treatments-btn');
  if (t1) t1.addEventListener('click', loadTreatmentsPage);

  const t2 = document.getElementById('treatment-record-form');
  if (t2) t2.addEventListener('submit', saveTreatmentRecord);

  const t3 = document.getElementById('treatment-search');
  if (t3) t3.addEventListener('input', filterTreatments);

  const t4 = document.getElementById('treatment-status-filter');
  if (t4) t4.addEventListener('change', filterTreatments);

  const t5 = document.getElementById('treatments-table-body');
  if (t5) {
    t5.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button || !button.dataset.id) return;
      if (button.dataset.action === 'toggle-treatment-status') {
        toggleTreatmentRecordStatus(button.dataset.id);
      } else if (button.dataset.action === 'delete-treatment-record') {
        deleteTreatmentRecord(button.dataset.id);
      }
    });
  }
}

// Tab switching for alert tabs retained in hidden legacy alert markup.
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');

    document
      .querySelectorAll('.tab-btn')
      .forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    document
      .querySelectorAll('.tab-pane')
      .forEach((pane) => pane.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// Modal event listeners
{
  const el1 = document.querySelector('#expense-modal .modal-close');
  if (el1) el1.addEventListener('click', closeExpenseModal);
  const el2 = document.getElementById('cancel-expense-btn');
  if (el2) el2.addEventListener('click', closeExpenseModal);
  const el3 = document.getElementById('save-expense-btn');
  if (el3) el3.addEventListener('click', saveExpense);
}

{
  const el4 = document.querySelector('#purchase-modal .modal-close');
  if (el4) el4.addEventListener('click', closePurchaseModal);
  const el5 = document.getElementById('cancel-purchase-btn');
  if (el5) el5.addEventListener('click', closePurchaseModal);
  const el6 = document.getElementById('save-purchase-btn');
  if (el6) el6.addEventListener('click', savePurchase);
}

// Initialize app
async function init() {
  configurePosInputs();
  startAppUpdateWatcher();
  mergeExpensesIntoInventory();
  removeEmbeddedSalesReportProfitLoss();
  await resetCachedBusinessDataForProject();
  loadFromLocalStorage();
  loadSyncQueue();
  await restorePersistentStateIfNeeded();
  applyStoreBranding();
  saveToLocalStorage({ skipBackup: true });
  validateDataStructure();
  cleanupDuplicateSales();
  validateSalesData();
  cleanupSyncQueue();

  await requireExplicitLogin();

  // Check for stock alerts on initialization
  checkAndGenerateAlerts();
  if (currentUser && (!navigator.onLine || supabaseIsStub || !isOnline)) {
    await showApp();
    showNotification('Offline mode: using saved data.', 'info');
  } else {
    showLogin();
    showPage('pos');
    focusPosSearch({ defer: true, select: true });
  }

  if (isOnline) {
    checkSupabaseConnection();
  }

  // Infinite scroll for products
  window.addEventListener('scroll', () => {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
    if (nearBottom && isOnline && productsHasMore && !isLoadingProducts) {
      loadMoreProducts();
    }
  });

  // Refresh session every 30 minutes
  setInterval(async () => {
    if (currentUser && isOnline && !supabaseIsStub && navigator.onLine) {
      try {
        const { error } = await withTimeout(
          supabaseClient.auth.refreshSession(),
          CONNECTION_CHECK_TIMEOUT_MS,
          'Refresh session'
        );
        if (error) {
          console.warn('Session refresh failed:', error);
          showNotification('Connection issue while refreshing session', 'info');
        }
      } catch (e) {
        console.warn('Session refresh exception:', e);
      }
    }
  }, 30 * 60 * 1000);

  setInterval(() => {
    if (currentUser && isOnline && !document.hidden) {
      setupRealtimeListeners();
      scheduleLiveDataRefresh('all', { notify: false });
    }
  }, 25000);
}

window.addEventListener('pagehide', () => {
  saveToLocalStorage();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveToLocalStorage();
  } else {
    checkForAppFileUpdates();
    if (currentUser && isOnline) {
      setupRealtimeListeners();
      scheduleLiveDataRefresh('all', { notify: false });
    }
  }
});

// Start app
init();

async function loadMoreProducts() {
  try {
    isLoadingProducts = true;
    const newList = await DataModule.fetchProducts(
      productsOffset,
      PRODUCTS_PAGE_SIZE
    );
    if (Array.isArray(newList) && newList.length > 0) {
      loadProducts();
      if (currentPage === 'inventory') {
        loadInventory(false);
      }
    }
  } catch (e) {
    console.warn('Load more products failed:', e);
  } finally {
    isLoadingProducts = false;
  }
}

window.viewSale = viewSale;
window.deleteSale = deleteSale;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.printProductLabel = printProductLabel;
window.filterInventoryByCategory = filterInventoryByCategory;
window.updateQuantity = updateQuantity;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.editPurchase = editPurchase;
window.deletePurchase = deletePurchase;
window.viewProduct = viewProduct;
window.acknowledgeAlert = acknowledgeAlert;
window.resolveDiscrepancy = resolveDiscrepancy;
