// SHARED.JS - FINAL (RECWS)
// Firebase + LocalStorage Hybrid Backend (SAFE VERSION)

/************ FIREBASE INIT (COMPAT SDK) ************/
const firebaseConfig = {
  apiKey: "AIzaSyAZeREUcf4QD17uFyXBNN4Gwq0fbvhWa7o",
  authDomain: "recws-prototype.firebaseapp.com",
  projectId: "recws-prototype",
  storageBucket: "recws-prototype.firebasestorage.app",
  messagingSenderId: "738647234612",
  appId: "1:738647234612:web:3dd3bec932a4d482209261"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/************ OPTIONAL NODE BACKEND (MOCK) ************/
function callBackend(api, data){
  //optional
  }

/************ DEMO DATA ************/
const DEMO_STORES = [
  { id: 0, name: "S Mart", cash: 12000, commission: 0 },
  { id: 1, name: "More Retail Store", cash: 8500, commission: 0 },
  { id: 2, name: "Sitarama Book Store", cash: 7500, commission: 0 },
  { id: 3, name: "Jyothi Sweet Shop", cash: 9300, commission: 0 },
  { id: 4, name: "Rani Hardware", cash: 11000, commission: 0 },
  { id: 5, name: "DS Kirana Store", cash: 10050, commission: 0 }
];

const DEMO_USERS = {
  customers: [
    { username: "siddu_2512", password: "Siddu@2004", name: "Siddardha", bank:{name:"HDFC Bank", last4:"9214"}, pin:"1111" },
    { username: "mms_2005", password: "Mms@2005", name: "Mohan Sai", bank:{name:"SBI", last4:"3842"}, pin:"2222" }
  ],
  retailers: [
    { username: "ret0", password: "ret0pass", storeId: 0, name: "S Mart - Retailer" },
    { username: "ret1", password: "ret1pass", storeId: 1, name: "More Retail - Retailer" }
  ],
  admins: [
    { username: "admin", password: "adminpass", name: "System Admin" }
  ]
};

/************ STORAGE KEYS ************/
const KEY = {
  STORES:"rw_stores_vfinal",
  TX:"rw_tx_vfinal",
  USERS:"rw_users_vfinal",
  CURRENT_CUSTOMER:"rw_current_customer_vfinal",
  CURRENT_RETAILER:"rw_current_retailer_vfinal",
  CURRENT_ADMIN:"rw_current_admin_vfinal",
  LOGIN_OTP:"rw_login_otp_vfinal",
  WITHDRAW_CODES:"rw_withdraw_codes_vfinal"
};

/************ INIT ************/
function initSeed(){
  if(!localStorage.getItem(KEY.STORES)) localStorage.setItem(KEY.STORES, JSON.stringify(DEMO_STORES));
  if(!localStorage.getItem(KEY.TX)) localStorage.setItem(KEY.TX, JSON.stringify([]));
  if(!localStorage.getItem(KEY.USERS)) localStorage.setItem(KEY.USERS, JSON.stringify(DEMO_USERS));
  if(!localStorage.getItem(KEY.LOGIN_OTP)) localStorage.setItem(KEY.LOGIN_OTP, JSON.stringify({}));
  if(!localStorage.getItem(KEY.WITHDRAW_CODES)) localStorage.setItem(KEY.WITHDRAW_CODES, JSON.stringify({}));
}
initSeed();

/************ HELPERS ************/
function getStores(){ return JSON.parse(localStorage.getItem(KEY.STORES)||"[]"); }
function saveStores(d){ localStorage.setItem(KEY.STORES, JSON.stringify(d)); }
function getTx(){ return JSON.parse(localStorage.getItem(KEY.TX)||"[]"); }
function saveTx(d){ localStorage.setItem(KEY.TX, JSON.stringify(d)); }
function getUsers(){ return JSON.parse(localStorage.getItem(KEY.USERS)); }
function _rand6(){ return Math.floor(100000+Math.random()*900000).toString(); }

/************ AUTH + OTP ************/
function sendLoginOTP(u){
  const otp=_rand6();
  const o=JSON.parse(localStorage.getItem(KEY.LOGIN_OTP)||"{}");
  o[u]={otp,expires:Date.now()+2*60*1000};
  localStorage.setItem(KEY.LOGIN_OTP,JSON.stringify(o));
  return otp;
}
function verifyLoginOTP(u,e){
  const o=JSON.parse(localStorage.getItem(KEY.LOGIN_OTP)||"{}");
  if(!o[u]||Date.now()>o[u].expires) return false;
  const ok=o[u].otp===e; delete o[u];
  localStorage.setItem(KEY.LOGIN_OTP,JSON.stringify(o));
  return ok;
}
function verifyCredentials(r,u,p){
  const us=getUsers();
  if(r==="customer") return us.customers.find(x=>x.username===u&&x.password===p);
  if(r==="retailer") return us.retailers.find(x=>x.username===u&&x.password===p);
  if(r==="admin") return us.admins.find(x=>x.username===u&&x.password===p);
  return null;
}
function completeLogin(r,u){
  const us=getUsers();
  const k=r==="customer"?KEY.CURRENT_CUSTOMER:r==="retailer"?KEY.CURRENT_RETAILER:KEY.CURRENT_ADMIN;
  const arr=r==="customer"?us.customers:r==="retailer"?us.retailers:us.admins;
  const obj=arr.find(x=>x.username===u);
  if(obj) localStorage.setItem(k,JSON.stringify(obj));
}

/************ CURRENT USERS ************/
function getCurrentCustomer(){ return JSON.parse(localStorage.getItem(KEY.CURRENT_CUSTOMER)||"null"); }
function getCurrentRetailer(){ return JSON.parse(localStorage.getItem(KEY.CURRENT_RETAILER)||"null"); }
function getCurrentAdmin(){ return JSON.parse(localStorage.getItem(KEY.CURRENT_ADMIN)||"null"); }

/************ LOGOUT ************/
function logoutCustomer(){ localStorage.removeItem(KEY.CURRENT_CUSTOMER); }
function logoutRetailer(){ localStorage.removeItem(KEY.CURRENT_RETAILER); }
function logoutAdmin(){ localStorage.removeItem(KEY.CURRENT_ADMIN); }

/************ PIN + WITHDRAW CODE ************/
function validatePinForCustomer(username,pin){
  const u=getUsers().customers.find(x=>x.username===username);
  return u && String(u.pin)===String(pin);
}
function generateWithdrawCode(txId){
  const code=_rand6();
  const c=JSON.parse(localStorage.getItem(KEY.WITHDRAW_CODES)||"{}");
  c[txId]={code,expires:Date.now()+12*60*60*1000};
  localStorage.setItem(KEY.WITHDRAW_CODES,JSON.stringify(c));
  return code;
}

/************ RETAILER ACTIONS ************/
function retailerVerifyCode(txId, entered){
  const codes = JSON.parse(localStorage.getItem(KEY.WITHDRAW_CODES) || "{}");
  const entry = codes[txId];
  if(!entry) return { ok:false, msg:"Withdrawal code not found" };
  if(String(entry.code) !== String(entered)) return { ok:false, msg:"Invalid withdrawal code" };

  const txs = getTx();
  const tx = txs.find(t => t.id === txId);
  if(!tx) return { ok:false, msg:"Transaction not found" };

  const stores = getStores();
  const store = stores.find(s => s.id === tx.storeId);
  if(!store) return { ok:false, msg:"Store not found" };
  if(store.cash < tx.amount) return { ok:false, msg:"Insufficient cash in store" };

  // 🔹 Update local data
  store.cash -= tx.amount;
  store.commission = (store.commission || 0) + 5;
  tx.status = "Success";
  tx.completedAt = Date.now();

  // 🔥 Update EXACT Firestore document
  if(tx.firebaseId){
    db.collection("transactions")
      .doc(tx.firebaseId)
      .update({
        status: "Success",
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  }

  saveTx(txs);
  saveStores(stores);

  delete codes[txId];
  localStorage.setItem(KEY.WITHDRAW_CODES, JSON.stringify(codes));

  return { ok:true, tx };
}

function retailerCancel(txId){
  const txs = getTx();
  const tx = txs.find(t => t.id === txId);
  if(!tx) return { ok:false, msg:"Transaction not found" };
  if(tx.status !== "Pending") return { ok:false, msg:"Only pending transactions can be cancelled" };

  tx.status = "Failed";
  tx.cancelledAt = Date.now();
  saveTx(txs);

  const codes = JSON.parse(localStorage.getItem(KEY.WITHDRAW_CODES) || "{}");
  delete codes[txId];
  localStorage.setItem(KEY.WITHDRAW_CODES, JSON.stringify(codes));

  return { ok:true, tx };
}

/************ RESET ALL (ADMIN) ************/
function resetAll(){
  localStorage.removeItem(KEY.STORES);
  localStorage.removeItem(KEY.TX);
  localStorage.removeItem(KEY.USERS);
  localStorage.removeItem(KEY.CURRENT_CUSTOMER);
  localStorage.removeItem(KEY.CURRENT_RETAILER);
  localStorage.removeItem(KEY.CURRENT_ADMIN);
  localStorage.removeItem(KEY.LOGIN_OTP);
  localStorage.removeItem(KEY.WITHDRAW_CODES);
  initSeed();
  alert("All system data has been reset.");
  location.reload();
}

/************ TRANSACTION (🔥 FIREBASE BACKEND) ************/
function createTransaction(customerName, bankDisplay, storeId, amount){

  // 🔥 Create Firestore document with known ID
  const docRef = db.collection("transactions").doc();

  docRef.set({
    customerName,
    bank: bankDisplay,
    storeId,
    amount,
    status: "Pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    completedAt: null
  });

  // 🔹 Local transaction (cache)
  const txs = getTx();
  const tx = {
    id: "tx_" + Date.now(),
    firebaseId: docRef.id,   // ⭐ IMPORTANT
    customerName,
    bank: bankDisplay,
    storeId,
    amount,
    status: "Pending",
    ts: Date.now()
  };

  txs.unshift(tx);
  saveTx(txs);

  return tx;
}

/************ UTIL ************/
function formatINR(x){ return "₹"+Number(x).toLocaleString("en-IN"); }

/************ EXPORT ************/
window.RW={
  KEY,
  getStores,saveStores,getTx,saveTx,getUsers,
  verifyCredentials,sendLoginOTP,verifyLoginOTP,completeLogin,
  getCurrentCustomer,getCurrentRetailer,getCurrentAdmin,
  logoutCustomer,logoutRetailer,logoutAdmin,
  validatePinForCustomer,generateWithdrawCode,
  retailerVerifyCode,retailerCancel,
  resetAll,
  createTransaction,formatINR
};
