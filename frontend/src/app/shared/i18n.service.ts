import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export type Lang = 'en' | 'hi';

/**
 * Two-language UI, plus the two switches that decide whether this app is usable
 * on a ₹6,000 phone on a 2G tower:
 *
 *  - **language** — a shopkeeper in a kasba reads Devanagari far faster than
 *    English. Getting this wrong loses the user on the first screen.
 *  - **lite mode** — skips map tiles, photos and animation. Leaflet pulls a few
 *    hundred kilobytes of tiles per pan, which is real money on a data pack and
 *    minutes of waiting on a weak signal.
 *  - **big text** — one tap for anyone who is holding the phone at arm's length.
 *
 * All three persist locally so they survive a reload without a round trip.
 */

const DICT: Record<string, { en: string; hi: string }> = {
  // ---- brand & nav ----
  'app.name': { en: 'RideFleet', hi: 'राइडफ्लीट' },
  'app.tagline': { en: 'Your town, delivered', hi: 'आपका शहर, आपके द्वार' },
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.shops': { en: 'Shops', hi: 'दुकानें' },
  'nav.order': { en: 'Order', hi: 'ऑर्डर' },
  'nav.orders': { en: 'My orders', hi: 'मेरे ऑर्डर' },
  'nav.emergency': { en: 'Emergency', hi: 'आपातकाल' },
  'nav.khata': { en: 'Khata', hi: 'खाता' },
  'nav.refills': { en: 'Refills', hi: 'रिफिल' },
  'nav.myStore': { en: 'My shop', hi: 'मेरी दुकान' },
  'nav.riderHub': { en: 'Rider hub', hi: 'राइडर हब' },
  'nav.supply': { en: 'Supply chain', hi: 'सप्लाई' },
  'nav.sales': { en: 'Field sales', hi: 'फील्ड सेल्स' },
  'nav.admin': { en: 'Admin console', hi: 'एडमिन' },
  'nav.logout': { en: 'Logout', hi: 'लॉगआउट' },
  'nav.login': { en: 'Log in', hi: 'लॉगिन' },
  'nav.register': { en: 'Register', hi: 'रजिस्टर' },
  'nav.more': { en: 'More', hi: 'और' },

  // ---- common ----
  'common.back': { en: 'Back', hi: 'वापस' },
  'common.home': { en: 'Home', hi: 'होम' },
  'common.dashboard': { en: 'My dashboard', hi: 'मेरा डैशबोर्ड' },
  'common.call': { en: 'Call', hi: 'कॉल करें' },
  'common.whatsapp': { en: 'WhatsApp', hi: 'व्हाट्सएप' },
  'common.directions': { en: 'Directions', hi: 'रास्ता' },
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.save': { en: 'Save', hi: 'सेव करें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.add': { en: 'Add', hi: 'जोड़ें' },
  'common.close': { en: 'Close', hi: 'बंद करें' },
  'common.open': { en: 'Open', hi: 'खुला' },
  'common.closed': { en: 'Closed', hi: 'बंद' },
  'common.openNow': { en: 'Open now', hi: 'अभी खुला' },
  'common.closedNow': { en: 'Closed now', hi: 'अभी बंद' },
  'common.all': { en: 'All', hi: 'सभी' },
  'common.loading': { en: 'Loading…', hi: 'लोड हो रहा है…' },
  'common.none': { en: 'Nothing here yet.', hi: 'अभी कुछ नहीं है।' },
  'common.km': { en: 'km', hi: 'कि.मी.' },
  'common.total': { en: 'Total', hi: 'कुल' },
  'common.today': { en: 'Today', hi: 'आज' },
  'common.phone': { en: 'Mobile number', hi: 'मोबाइल नंबर' },
  'common.name': { en: 'Name', hi: 'नाम' },
  'common.amount': { en: 'Amount', hi: 'रकम' },
  'common.note': { en: 'Note', hi: 'नोट' },
  'common.delete': { en: 'Delete', hi: 'हटाएँ' },
  'common.landmark': { en: 'Landmark (near…)', hi: 'लैंडमार्क (के पास…)' },
  'common.area': { en: 'Area / mohalla', hi: 'एरिया / मोहल्ला' },
  'common.pincode': { en: 'Pincode', hi: 'पिनकोड' },
  'common.city': { en: 'City / town', hi: 'शहर / कस्बा' },

  // ---- prefs ----
  'prefs.language': { en: 'Language', hi: 'भाषा' },
  'prefs.lite': { en: 'Data saver', hi: 'डेटा बचाओ' },
  'prefs.liteOn': { en: 'Data saver is on — maps and photos are off.', hi: 'डेटा बचाओ चालू है — नक्शा और फोटो बंद हैं।' },
  'prefs.bigText': { en: 'Bigger text', hi: 'बड़े अक्षर' },

  // ---- shop directory ----
  'dir.title': { en: 'Shops in your town', hi: 'आपके शहर की दुकानें' },
  'dir.subtitle': {
    en: 'Find any shop and call it directly — no account needed.',
    hi: 'कोई भी दुकान खोजें और सीधे कॉल करें — अकाउंट ज़रूरी नहीं।',
  },
  'dir.searchPlaceholder': { en: 'Shop name, item, mohalla or pincode', hi: 'दुकान, सामान, मोहल्ला या पिनकोड' },
  'dir.filterOpen': { en: 'Open now', hi: 'अभी खुला' },
  'dir.filter24x7': { en: '24 hours', hi: '24 घंटे' },
  'dir.filterUdhaar': { en: 'Gives udhaar', hi: 'उधार देते हैं' },
  'dir.filterDelivery': { en: 'Home delivery', hi: 'होम डिलीवरी' },
  'dir.empty': {
    en: 'No shops match yet. Try a different type, or clear the filters.',
    hi: 'कोई दुकान नहीं मिली। दूसरा प्रकार चुनें या फ़िल्टर हटाएँ।',
  },
  'dir.allTypes': { en: 'All shop types', hi: 'सभी प्रकार की दुकानें' },
  'dir.rateList': { en: 'Rate list', hi: 'रेट लिस्ट' },
  'dir.udhaarOk': { en: 'Udhaar available', hi: 'उधार मिलता है' },
  'dir.minOrder': { en: 'Min order', hi: 'कम से कम ऑर्डर' },

  // ---- emergency ----
  'sos.title': { en: 'Emergency help', hi: 'आपातकालीन मदद' },
  'sos.subtitle': {
    en: 'Free government helplines work from any phone, even with no balance.',
    hi: 'सरकारी हेल्पलाइन हर फ़ोन से मुफ़्त लगती हैं, बैलेंस न हो तो भी।',
  },
  'sos.national': { en: 'Government helplines', hi: 'सरकारी हेल्पलाइन' },
  'sos.local': { en: 'Local numbers', hi: 'स्थानीय नंबर' },
  'sos.open24': { en: 'Open 24 hours near you', hi: 'आपके पास 24 घंटे खुला' },
  'sos.tips': { en: 'Do this first', hi: 'पहले यह करें' },
  'sos.raise': { en: 'Ask for help nearby', hi: 'आस-पास मदद माँगें' },
  'sos.raiseHint': {
    en: 'Sends your location to riders and shops near you. Use it along with a helpline call, not instead of one.',
    hi: 'आपकी लोकेशन आस-पास के राइडर और दुकानों को भेजता है। हेल्पलाइन कॉल के साथ इसका उपयोग करें, उसकी जगह नहीं।',
  },
  'sos.sent': { en: 'Help request sent to people nearby.', hi: 'आस-पास के लोगों को मदद का संदेश भेज दिया गया।' },
  'sos.noLocal': {
    en: 'No local numbers added for this area yet. The government helplines above still work.',
    hi: 'इस इलाके के स्थानीय नंबर अभी नहीं जोड़े गए। ऊपर दी सरकारी हेल्पलाइन काम करती हैं।',
  },
  'sos.verified': { en: 'Verified', hi: 'जाँचा हुआ' },
  'sos.unverified': { en: 'Not verified yet', hi: 'अभी जाँचा नहीं' },
  'sos.alerts': { en: 'Help requests nearby', hi: 'आस-पास मदद की पुकार' },
  'sos.acknowledge': { en: "I'm going", hi: 'मैं जा रहा हूँ' },
  'sos.resolve': { en: 'Resolved', hi: 'हल हो गया' },

  // ---- customer ----
  'cust.greeting': { en: 'What do you need today?', hi: 'आज क्या चाहिए?' },
  'cust.quickNeeds': { en: 'Quick needs', hi: 'तुरंत चाहिए' },
  'cust.myLocation': { en: 'Deliver to', hi: 'डिलीवरी यहाँ' },
  'cust.findShops': { en: 'Find shops near me', hi: 'आस-पास की दुकानें' },
  'cust.pickShop': { en: 'Choose a shop', hi: 'दुकान चुनें' },
  'cust.list': { en: 'Your list', hi: 'आपकी लिस्ट' },
  'cust.listHint': { en: 'One item per line — write it the way you say it.', hi: 'एक लाइन में एक सामान — जैसे बोलते हैं वैसे लिखें।' },
  'cust.photo': { en: 'Or send a photo of your list', hi: 'या लिस्ट की फोटो भेजें' },
  'cust.place': { en: 'Place order', hi: 'ऑर्डर करें' },
  'cust.placing': { en: 'Placing…', hi: 'भेज रहे हैं…' },
  'cust.payCod': { en: 'Cash on delivery', hi: 'नकद (कैश)' },
  'cust.payUdhaar': { en: 'On my khata', hi: 'मेरे खाते में' },
  'cust.payOnline': { en: 'Pay online', hi: 'ऑनलाइन' },
  'cust.reorder': { en: 'Order the same again', hi: 'वही दोबारा' },
  'cust.myKhata': { en: 'My khata', hi: 'मेरा खाता' },
  'cust.khataOwed': { en: 'You owe', hi: 'आप पर बाकी' },
  'cust.myRefills': { en: 'My repeat orders', hi: 'मेरे नियमित ऑर्डर' },
  'cust.addRefill': { en: 'Set a repeat order', hi: 'नियमित ऑर्डर लगाएँ' },
  'cust.nextOn': { en: 'Next on', hi: 'अगली बार' },
  'cust.snooze': { en: 'Later', hi: 'बाद में' },
  'cust.track': { en: 'Track', hi: 'ट्रैक' },
  'cust.invoice': { en: 'Bill', hi: 'बिल' },
  'cust.noShops': {
    en: 'No shops found nearby. Try the shop directory, or search by pincode.',
    hi: 'आस-पास दुकान नहीं मिली। दुकान सूची देखें या पिनकोड से खोजें।',
  },

  // ---- store owner ----
  'store.title': { en: 'My shop', hi: 'मेरी दुकान' },
  'store.tabOrders': { en: 'Orders', hi: 'ऑर्डर' },
  'store.tabKhata': { en: 'Udhaar khata', hi: 'उधार खाता' },
  'store.tabRefills': { en: 'Repeat orders', hi: 'नियमित ऑर्डर' },
  'store.tabRates': { en: 'Rate list', hi: 'रेट लिस्ट' },
  'store.tabStaff': { en: 'Staff', hi: 'स्टाफ' },
  'store.tabProfile': { en: 'Shop details', hi: 'दुकान की जानकारी' },
  'store.create': { en: 'Register your shop', hi: 'अपनी दुकान जोड़ें' },
  'store.shutterOpen': { en: 'Shop is open', hi: 'दुकान खुली है' },
  'store.shutterClosed': { en: 'Closed for today', hi: 'आज बंद है' },
  'store.shutterHint': {
    en: 'Turn this off when you shut the shutter — customers stop seeing you as open.',
    hi: 'शटर बंद करते समय इसे बंद कर दें — ग्राहक आपको खुला नहीं देखेंगे।',
  },
  'store.awaitingApproval': {
    en: 'Waiting for admin approval. You can set everything up meanwhile.',
    hi: 'एडमिन की मंज़ूरी बाकी है। तब तक आप सब सेट कर सकते हैं।',
  },
  'store.khataOutstanding': { en: 'Total udhaar outstanding', hi: 'कुल बाकी उधार' },
  'store.khataCustomers': { en: 'Khata customers', hi: 'खाता ग्राहक' },
  'store.addCredit': { en: 'Goods on udhaar', hi: 'उधार दिया' },
  'store.addPayment': { en: 'Payment received', hi: 'पैसा मिला' },
  'store.balance': { en: 'Balance', hi: 'बाकी' },
  'store.dueToday': { en: 'Due today', hi: 'आज देना है' },
  'store.markDelivered': { en: 'Delivered', hi: 'पहुँचा दिया' },
  'store.addRate': { en: 'Add item', hi: 'सामान जोड़ें' },
  'store.publishRates': { en: 'Publish rate list', hi: 'रेट लिस्ट सेव करें' },
  'store.addStaff': { en: 'Add staff by mobile or email', hi: 'मोबाइल/ईमेल से स्टाफ जोड़ें' },
  'store.staffHint': {
    en: 'Your helper registers as "Shop staff", then you add them here. They can take orders and write khata, but cannot change shop settings.',
    hi: 'आपका सहायक "दुकान स्टाफ" के रूप में रजिस्टर करे, फिर उसे यहाँ जोड़ें। वह ऑर्डर और खाता कर सकता है, दुकान की सेटिंग नहीं।',
  },
  'store.findRider': { en: 'Find a rider', hi: 'राइडर खोजें' },

  // ---- sales agent ----
  'sales.title': { en: 'Field sales', hi: 'फील्ड सेल्स' },
  'sales.pipeline': { en: 'My shops pipeline', hi: 'मेरी दुकानों की सूची' },
  'sales.addLead': { en: 'Add a shop I visited', hi: 'दौरा की गई दुकान जोड़ें' },
  'sales.logVisit': { en: 'Log visit', hi: 'दौरा दर्ज करें' },
  'sales.followUps': { en: 'Follow-ups due', hi: 'दोबारा जाना है' },
  'sales.onboarded': { en: 'Shops onboarded', hi: 'जुड़ी दुकानें' },
  'sales.live': { en: 'Live on platform', hi: 'चालू दुकानें' },
  'sales.incentive': { en: 'Estimated incentive', hi: 'अनुमानित इंसेंटिव' },

  // ---- register ----
  'reg.title': { en: 'Create your account', hi: 'अकाउंट बनाएँ' },
  'reg.whoAreYou': { en: 'Who are you?', hi: 'आप कौन हैं?' },
  'reg.needApproval': { en: 'Needs admin approval before going live', hi: 'चालू होने से पहले एडमिन की मंज़ूरी' },
};

const LANG_KEY = 'rf_lang';
const LITE_KEY = 'rf_lite';
const BIG_KEY = 'rf_bigtext';

@Injectable({ providedIn: 'root' })
export class I18nService {
  /** Signals so components re-render the moment a preference flips. */
  readonly lang = signal<Lang>(this.readLang());
  readonly lite = signal<boolean>(localStorage.getItem(LITE_KEY) === '1');
  readonly bigText = signal<boolean>(localStorage.getItem(BIG_KEY) === '1');

  constructor(private api: ApiService, private auth: AuthService) {
    // No local choice on this device yet? Adopt the language saved on the
    // account, so a shopkeeper who set Hindi on their phone still gets Hindi
    // on the shared counter tablet.
    if (!localStorage.getItem(LANG_KEY)) {
      const saved = this.auth.currentUser?.preferredLanguage;
      if (saved === 'hi' || saved === 'en') this.lang.set(saved);
    }
    this.applyBodyFlags();
  }

  private readLang(): Lang {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'hi' || saved === 'en') return saved;
    // First visit: follow the device. A Hindi phone almost certainly means a
    // Hindi reader, and they should not have to hunt for the switch.
    const nav = (navigator.language || '').toLowerCase();
    return nav.startsWith('hi') || nav.startsWith('mr') ? 'hi' : 'en';
  }

  /** Translate a key. Unknown keys fall back to the key itself, never blank. */
  t(key: string): string {
    const row = DICT[key];
    if (!row) return key;
    return this.lang() === 'hi' ? row.hi : row.en;
  }

  /** Picks the right field off an object that carries both languages. */
  pick(en?: string | null, hi?: string | null): string {
    if (this.lang() === 'hi') return (hi || en || '').trim();
    return (en || hi || '').trim();
  }

  setLang(lang: Lang) {
    this.lang.set(lang);
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;

    // Remember it on the account too, so the choice follows the person to any
    // device. Fire-and-forget: the UI has already switched, and a failed save
    // must never block the toggle.
    if (this.auth.isLoggedIn && this.auth.currentUser?.preferredLanguage !== lang) {
      this.auth.patchUser({ preferredLanguage: lang });
      this.api.patch('me/language', { preferredLanguage: lang }).subscribe({
        error: () => {},
      });
    }
  }

  toggleLang() {
    this.setLang(this.lang() === 'en' ? 'hi' : 'en');
  }

  toggleLite() {
    const next = !this.lite();
    this.lite.set(next);
    localStorage.setItem(LITE_KEY, next ? '1' : '0');
    this.applyBodyFlags();
  }

  toggleBigText() {
    const next = !this.bigText();
    this.bigText.set(next);
    localStorage.setItem(BIG_KEY, next ? '1' : '0');
    this.applyBodyFlags();
  }

  private applyBodyFlags() {
    document.body.classList.toggle('rf-lite', this.lite());
    document.body.classList.toggle('rf-big', this.bigText());
    document.documentElement.lang = this.lang();
  }
}
