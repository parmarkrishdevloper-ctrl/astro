// Astro encyclopedia — canonical entries for every rashi, nakshatra, planet,
// house, and Jaimini karaka. Used by the Learning page for teaching mode and
// hover-to-explain interactions across the chart UI.
//
// Content is deliberately compressed — one line of Sanskrit attribution,
// 1-2 sentences of meaning, a few keywords. Consistent shape makes it easy
// to render a unified encyclopedia viewer.

export interface EncEntry {
  id: string;
  kind: 'planet' | 'rashi' | 'nakshatra' | 'house' | 'karaka';
  name: string;
  sanskrit?: string;
  // Short one-sentence definition
  oneliner: string;
  // 2-4 sentence explanation
  description: string;
  // Keywords for quick scanning
  keywords: string[];
  // Optional: ruler / element / dignity info
  meta?: Record<string, string | number>;
  // Classical source reference
  source?: string;
}

// ─── Planets (9 grahas) ─────────────────────────────────────────────────────
export const PLANETS: EncEntry[] = [
  { id: 'SU', kind: 'planet', name: 'Sun', sanskrit: 'सूर्य Surya',
    oneliner: 'आत्मा, जीवन शक्ति, पिता, अधिकार, अहंकार।',
    description: 'स्वयं, पिता, सरकार, हड्डियों, हृदय और जीवन शक्ति का कारक। सिंह राशि का स्वामी। मेष (10°) में उच्च का, तुला में नीच का। गति ~1°/दिन। वैदिक विचार में सूर्य आत्मा का स्थान है और जो कुछ भी पहचान और सार्वजनिक मान्यता देता है, उसे दर्शाता है।',
    keywords: ['आत्मा','अहंकार','पिता','अधिकार','जीवन शक्ति','प्रसिद्धि','सरकार','स्वास्थ्य','हृदय'],
    meta: { rules: 'Leo', exaltedIn: 'Aries 10°', debilitatedIn: 'Libra 10°' },
    source: 'BPHS Ch.3' },
  { id: 'MO', kind: 'planet', name: 'Moon', sanskrit: 'चंद्र Chandra',
    oneliner: 'मन, माता, भावनाएं, जनता, ग्रहणशीलता।',
    description: 'मन, माता, घर, खुशी का कारक। कर्क राशि का स्वामी। वृषभ (3°) में उच्च का, वृश्चिक में नीच का। शुक्ल पक्ष का चंद्रमा = शुभ; सूर्य से 72° से कम दूरी पर कृष्ण पक्ष का चंद्रमा = तटस्थ/पाप। चौथे भाव में सबसे बलवान।',
    keywords: ['मन','माता','भावना','घर','जनता','ग्रहणशील','स्मृति'],
    meta: { rules: 'Cancer', exaltedIn: 'Taurus 3°', debilitatedIn: 'Scorpio 3°' },
    source: 'BPHS Ch.3' },
  { id: 'MA', kind: 'planet', name: 'Mars', sanskrit: 'मंगल Mangala',
    oneliner: 'योद्धा ऊर्जा — साहस, भाई, कर्म, संघर्ष।',
    description: 'छोटे भाई-बहनों, भूमि, शक्ति, क्रोध का कारक। मेष और वृश्चिक का स्वामी। मकर (28°) में उच्च का, कर्क में नीच का। इसकी चौथी और आठवीं दृष्टि विशेष रूप से तीक्ष्ण होती है।',
    keywords: ['साहस','भाई-बहन','भूमि','योद्धा','कर्म','क्रोध','खेल'],
    meta: { rules: 'Aries, Scorpio', exaltedIn: 'Capricorn 28°', debilitatedIn: 'Cancer 28°' },
    source: 'BPHS Ch.3' },
  { id: 'ME', kind: 'planet', name: 'Mercury', sanskrit: 'बुध Budha',
    oneliner: 'बुद्धि, वाणी, वाणिज्य, छोटी यात्राएं।',
    description: 'संचार, शिक्षा, मित्रों, गणित, व्यापार का कारक। मिथुन और कन्या का स्वामी। कन्या (15°) में उच्च का, मीन में नीच का। यह जिस ग्रह के साथ युति करता है, उसकी प्रकृति ले लेता है।',
    keywords: ['बुद्धि','वाणी','वाणिज्य','तर्क','मित्र','लेखन','व्यापार'],
    meta: { rules: 'Gemini, Virgo', exaltedIn: 'Virgo 15°', debilitatedIn: 'Pisces 15°' },
    source: 'BPHS Ch.3' },
  { id: 'JU', kind: 'planet', name: 'Jupiter', sanskrit: 'गुरु / बृहस्पति Guru',
    oneliner: 'ज्ञान, गुरु, धर्म, संतान, धन।',
    description: 'संतान, पति (स्त्री कुण्डली में), धन, ज्ञान, धर्म का कारक। धनु और मीन का स्वामी। कर्क (5°) में उच्च का, मकर में नीच का। सबसे शुभ प्राकृतिक ग्रह; 5वीं और 9वीं दृष्टि विशेष रूप से आशीर्वाद देने वाली होती है।',
    keywords: ['ज्ञान','गुरु','धर्म','संतान','धन','धर्म','विस्तार'],
    meta: { rules: 'Sagittarius, Pisces', exaltedIn: 'Cancer 5°', debilitatedIn: 'Capricorn 5°' },
    source: 'BPHS Ch.3' },
  { id: 'VE', kind: 'planet', name: 'Venus', sanskrit: 'शुक्र Shukra',
    oneliner: 'प्रेम, सौंदर्य, कला, जीवनसाथी (पुरुष कुण्डली), विलासिता।',
    description: 'विवाह (पुरुष कुण्डली), कला, वाहन, आराम का कारक। वृषभ और तुला का स्वामी। मीन (27°) में उच्च का, कन्या में नीच का। असुरों के गुरु — तंत्र और सूक्ष्म ज्ञान के विशेषज्ञ।',
    keywords: ['प्रेम','सौंदर्य','कला','जीवनसाथी','विलासिता','संगीत','कूटनीति'],
    meta: { rules: 'Taurus, Libra', exaltedIn: 'Pisces 27°', debilitatedIn: 'Virgo 27°' },
    source: 'BPHS Ch.3' },
  { id: 'SA', kind: 'planet', name: 'Saturn', sanskrit: 'शनि Shani',
    oneliner: 'अनुशासन, आयु, सेवक, विलंब, कर्म।',
    description: 'आयु, अनुशासन, कड़ी मेहनत, बुढ़ापे, नौकरों, पुरानी बीमारी का कारक। मकर और कुंभ का स्वामी। तुला (20°) में उच्च का, मेष में नीच का। सबसे धीमी गति वाला; स्वयं समय का प्रतिनिधित्व करता है।',
    keywords: ['अनुशासन','आयु','कर्म','विलंब','सेवक','बुढ़ापा','न्याय'],
    meta: { rules: 'Capricorn, Aquarius', exaltedIn: 'Libra 20°', debilitatedIn: 'Aries 20°' },
    source: 'BPHS Ch.3' },
  { id: 'RA', kind: 'planet', name: 'Rahu', sanskrit: 'राहु',
    oneliner: 'उत्तरी चंद्र नोड — महत्वाकांक्षा, जुनून, विदेश।',
    description: 'छाया ग्रह; सर्प का सिर। अपरंपरागत मार्गों, विदेशों, धोखे, जुनून, अचानक लाभ का कारक। हमेशा वक्री। शास्त्रीय ग्रंथों में कोई राशि स्वामित्व नहीं; आधुनिक परंपरा कुंभ राशि सौंपती है।',
    keywords: ['महत्वाकांक्षा','विदेश','अपरंपरागत','जुनून','भ्रम','अचानक'],
    meta: { alwaysRetrograde: 'yes', modernRules: 'Aquarius' },
    source: 'BPHS Ch.3' },
  { id: 'KE', kind: 'planet', name: 'Ketu', sanskrit: 'केतु',
    oneliner: 'दक्षिणी चंद्र नोड — वैराग्य, मोक्ष, पिछले जन्म का कौशल।',
    description: 'छाया ग्रह; सर्प की पूंछ। मोक्ष (मुक्ति), आध्यात्मिकता, छिपे हुए ज्ञान, पिछले जन्म की महारत, अचानक वैराग्य का कारक। हमेशा वक्री। आधुनिक परंपरा वृश्चिक राशि सौंपती है।',
    keywords: ['मोक्ष','वैराग्य','आध्यात्मिकता','पिछले जन्म','रहस्यमय','हानि'],
    meta: { alwaysRetrograde: 'yes', modernRules: 'Scorpio' },
    source: 'BPHS Ch.3' },
];

export const RASHIS: EncEntry[] = [
  { id: 'rashi-1',  kind: 'rashi', name: 'Aries',       sanskrit: 'मेष Mesha',
    oneliner: 'पहली राशि — गतिशील, अग्रणी, योद्धा।',
    description: 'मंगल द्वारा शासित चर, अग्नि, पुरुष राशि। पहल, सिर (शरीर का अंग), साहस, आवेगपूर्ण कार्य का प्रतिनिधित्व करता है। राशि चक्र यहाँ 0° नाक्षत्र से शुरू होता है।',
    keywords: ['अग्रणी','अग्नि','योद्धा','आवेगपूर्ण','सिर'],
    meta: { ruler: 'Mars', quality: 'Movable', element: 'Fire' } },
  { id: 'rashi-2',  kind: 'rashi', name: 'Taurus',      sanskrit: 'वृषभ Vrishabha',
    oneliner: 'स्थिर, कामुक, पृथ्वी से जुड़ा — मूल्य संचित करता है।',
    description: 'शुक्र द्वारा शासित स्थिर, पृथ्वी, स्त्री राशि। धैर्य, संसाधन, गला/चेहरा, सौंदर्य, कृषि का प्रतिनिधित्व करता है।',
    keywords: ['स्थिर','कामुक','धन','कृषि','कला','जिद्दी'],
    meta: { ruler: 'Venus', quality: 'Fixed', element: 'Earth' } },
  { id: 'rashi-3',  kind: 'rashi', name: 'Gemini',      sanskrit: 'मिथुन Mithuna',
    oneliner: 'संचारकर्ता — जुड़वां द्वैत, जिज्ञासा, शब्द।',
    description: 'बुध द्वारा शासित द्विस्वभाव, वायु, पुरुष राशि। वाणी, हाथ, भाई-बहन, वाणिज्य, छोटी यात्राओं, मीडिया का प्रतिनिधित्व करता है।',
    keywords: ['शब्द','जिज्ञासा','द्वैत','मीडिया','भाई-बहन','व्यापार'],
    meta: { ruler: 'Mercury', quality: 'Dual', element: 'Air' } },
  { id: 'rashi-4',  kind: 'rashi', name: 'Cancer',      sanskrit: 'कर्क Karka',
    oneliner: 'भावना, घर, माता — ज्वारीय गहराई।',
    description: 'चंद्रमा द्वारा शासित चर, जल, स्त्री राशि। माता, पालन-पोषण, घर, छाती/हृदय का प्रतिनिधित्व करता है। यहाँ गुरु उच्च का होता है।',
    keywords: ['माता','घर','भावना','पोषण','स्मृति'],
    meta: { ruler: 'Moon', quality: 'Movable', element: 'Water' } },
  { id: 'rashi-5',  kind: 'rashi', name: 'Leo',         sanskrit: 'सिंह Simha',
    oneliner: 'शाही, रचनात्मक, संप्रभु स्वयं।',
    description: 'सूर्य द्वारा शासित स्थिर, अग्नि, पुरुष राशि। अधिकार, रचनात्मकता, नेतृत्व, रीढ़ का प्रतिनिधित्व करता है।',
    keywords: ['शाही','रचनात्मक','नेता','गर्व','हृदय'],
    meta: { ruler: 'Sun', quality: 'Fixed', element: 'Fire' } },
  { id: 'rashi-6',  kind: 'rashi', name: 'Virgo',       sanskrit: 'कन्या Kanya',
    oneliner: 'विश्लेषणात्मक सेवक — सटीकता, सेवा, स्वास्थ्य।',
    description: 'बुध द्वारा शासित द्विस्वभाव, पृथ्वी, स्त्री राशि। यहाँ बुध उच्च का होता है। सेवा, पाचन, विवेक का प्रतिनिधित्व करता है।',
    keywords: ['विश्लेषण','सेवा','स्वास्थ्य','विवरण','कार्य'],
    meta: { ruler: 'Mercury', quality: 'Dual', element: 'Earth' } },
  { id: 'rashi-7',  kind: 'rashi', name: 'Libra',       sanskrit: 'तुला Tula',
    oneliner: 'साझेदारी, संतुलन, व्यापार — तराजू।',
    description: 'शुक्र द्वारा शासित चर, वायु, पुरुष राशि। यहाँ शनि उच्च का होता है। संबंध, अनुबंध, बाजार, गुर्दे का प्रतिनिधित्व करता है।',
    keywords: ['संतुलन','साझेदारी','व्यापार','कूटनीति','न्याय'],
    meta: { ruler: 'Venus', quality: 'Movable', element: 'Air' } },
  { id: 'rashi-8',  kind: 'rashi', name: 'Scorpio',     sanskrit: 'वृश्चिक Vrishchika',
    oneliner: 'गहरा, परिवर्तनकारी, गुप्त — बिच्छू।',
    description: 'मंगल द्वारा शासित स्थिर, जल, स्त्री राशि। परिवर्तन, जननांग, छिपे हुए धन, जांच का प्रतिनिधित्व करता है।',
    keywords: ['परिवर्तन','गुप्त','रहस्य','शक्ति','कामुकता'],
    meta: { ruler: 'Mars', quality: 'Fixed', element: 'Water' } },
  { id: 'rashi-9',  kind: 'rashi', name: 'Sagittarius', sanskrit: 'धनु Dhanu',
    oneliner: 'अन्वेषक — दर्शन, धर्म, लंबी यात्राएं।',
    description: 'गुरु द्वारा शासित द्विस्वभाव, अग्नि, पुरुष राशि। उच्च शिक्षा, धर्म, लंबी यात्रा, जांघों का प्रतिनिधित्व करता है।',
    keywords: ['दर्शन','धर्म','यात्रा','गुरु','भाग्य'],
    meta: { ruler: 'Jupiter', quality: 'Dual', element: 'Fire' } },
  { id: 'rashi-10', kind: 'rashi', name: 'Capricorn',   sanskrit: 'मकर Makara',
    oneliner: 'कार्यकर्ता — संरचना, महत्वाकांक्षा, धीमी चढ़ाई।',
    description: 'शनि द्वारा शासित चर, पृथ्वी, स्त्री राशि। यहाँ मंगल उच्च का होता है। करियर, पदानुक्रम, घुटनों, अनुशासित निष्पादन का प्रतिनिधित्व करता है।',
    keywords: ['संरचना','महत्वाकांक्षा','करियर','धैर्य','अधिकार'],
    meta: { ruler: 'Saturn', quality: 'Movable', element: 'Earth' } },
  { id: 'rashi-11', kind: 'rashi', name: 'Aquarius',    sanskrit: 'कुंभ Kumbha',
    oneliner: 'नवप्रवर्तक — समूह, आदर्श, अपरंपरागत।',
    description: 'शनि (आधुनिक: राहु) द्वारा शासित स्थिर, वायु, पुरुष राशि। बड़े सिस्टम, प्रौद्योगिकी, पिंडलियों, दोस्ती का प्रतिनिधित्व करता है।',
    keywords: ['नवाचार','समूह','आदर्श','अपरंपरागत','प्रौद्योगिकी'],
    meta: { ruler: 'Saturn', quality: 'Fixed', element: 'Air' } },
  { id: 'rashi-12', kind: 'rashi', name: 'Pisces',      sanskrit: 'मीन Meena',
    oneliner: 'रहस्यवादी — विघटन, करुणा, मोक्ष।',
    description: 'गुरु द्वारा शासित द्विस्वभाव, जल, स्त्री राशि। यहाँ शुक्र उच्च का होता है। आध्यात्मिकता, पैर, करुणा, कल्पना का प्रतिनिधित्व करता है।',
    keywords: ['रहस्यवादी','मोक्ष','करुणा','कल्पना','विघटन'],
    meta: { ruler: 'Jupiter', quality: 'Dual', element: 'Water' } },
];

// ─── Nakshatras (27) ────────────────────────────────────────────────────────
// Each is 13°20' wide, four padas of 3°20'. Source classical deity & symbol.
type NakData = {
  name: string; sanskrit: string; lord: string; deity: string; symbol: string; keywords: string[];
};
const NAK_ROWS: NakData[] = [
  { name: 'Ashwini',       sanskrit: 'अश्विनी',       lord: 'KE', deity: 'Ashvin Kumaras', symbol: 'Horse head', keywords: ['healer','swift','beginner','pioneering'] },
  { name: 'Bharani',       sanskrit: 'भरणी',         lord: 'VE', deity: 'Yama',            symbol: 'Yoni',       keywords: ['death-rebirth','creation','discipline'] },
  { name: 'Krittika',      sanskrit: 'कृत्तिका',      lord: 'SU', deity: 'Agni',            symbol: 'Flame / Razor', keywords: ['purify','cutting','leader'] },
  { name: 'Rohini',        sanskrit: 'रोहिणी',       lord: 'MO', deity: 'Brahma',          symbol: 'Cart / Chariot', keywords: ['growth','beauty','fertility'] },
  { name: 'Mrigashira',    sanskrit: 'मृगशिरा',      lord: 'MA', deity: 'Soma',            symbol: "Deer's head", keywords: ['searching','curious','sensitive'] },
  { name: 'Ardra',         sanskrit: 'आर्द्रा',       lord: 'RA', deity: 'Rudra',           symbol: 'Teardrop',    keywords: ['storm','transform','intensity'] },
  { name: 'Punarvasu',     sanskrit: 'पुनर्वसु',     lord: 'JU', deity: 'Aditi',           symbol: 'Quiver',       keywords: ['return','restore','abundance'] },
  { name: 'Pushya',        sanskrit: 'पुष्य',         lord: 'SA', deity: 'Brihaspati',      symbol: "Cow's udder", keywords: ['nourish','protect','spiritual'] },
  { name: 'Ashlesha',      sanskrit: 'आश्लेषा',      lord: 'ME', deity: 'Nagas',           symbol: 'Serpent',      keywords: ['cunning','hypnotic','mystical'] },
  { name: 'Magha',         sanskrit: 'मघा',          lord: 'KE', deity: 'Pitris',          symbol: 'Throne',       keywords: ['royal','ancestors','pride'] },
  { name: 'Purva Phalguni',sanskrit: 'पूर्व फाल्गुनी',lord: 'VE', deity: 'Bhaga',           symbol: 'Hammock',      keywords: ['enjoy','romance','rest'] },
  { name: 'Uttara Phalguni',sanskrit:'उत्तर फाल्गुनी',lord: 'SU', deity: 'Aryaman',         symbol: 'Bed',          keywords: ['partnership','generous','contract'] },
  { name: 'Hasta',         sanskrit: 'हस्त',          lord: 'MO', deity: 'Savitr',          symbol: 'Hand',         keywords: ['skill','craft','dexterity'] },
  { name: 'Chitra',        sanskrit: 'चित्रा',       lord: 'MA', deity: 'Vishvakarman',    symbol: 'Pearl',         keywords: ['beauty','architect','shining'] },
  { name: 'Swati',         sanskrit: 'स्वाति',       lord: 'RA', deity: 'Vayu',            symbol: 'Coral',         keywords: ['independent','adapt','diplomatic'] },
  { name: 'Vishakha',      sanskrit: 'विशाखा',       lord: 'JU', deity: 'Indra-Agni',      symbol: 'Archway',       keywords: ['focus','ambition','determined'] },
  { name: 'Anuradha',      sanskrit: 'अनुराधा',      lord: 'SA', deity: 'Mitra',           symbol: 'Lotus',         keywords: ['friendship','devotion','harmonize'] },
  { name: 'Jyeshtha',      sanskrit: 'ज्येष्ठा',      lord: 'ME', deity: 'Indra',           symbol: 'Umbrella',      keywords: ['eldest','protector','power'] },
  { name: 'Mula',          sanskrit: 'मूल',           lord: 'KE', deity: 'Nirriti',         symbol: 'Root',          keywords: ['investigate','upheaval','root-out'] },
  { name: 'Purva Ashadha', sanskrit: 'पूर्व आषाढ़ा',  lord: 'VE', deity: 'Apas',            symbol: 'Fan',           keywords: ['invigorate','purify','inspire'] },
  { name: 'Uttara Ashadha',sanskrit: 'उत्तर आषाढ़ा',  lord: 'SU', deity: 'Vishvadevas',     symbol: 'Tusk',          keywords: ['victorious','leader','grand'] },
  { name: 'Shravana',      sanskrit: 'श्रवण',         lord: 'MO', deity: 'Vishnu',          symbol: 'Ear',           keywords: ['listen','connect','fame'] },
  { name: 'Dhanishta',     sanskrit: 'धनिष्ठा',      lord: 'MA', deity: 'Vasus',           symbol: 'Drum',          keywords: ['rhythm','wealth','music'] },
  { name: 'Shatabhisha',   sanskrit: 'शतभिषा',       lord: 'RA', deity: 'Varuna',          symbol: 'Empty circle',  keywords: ['heal','secrecy','unusual'] },
  { name: 'Purva Bhadrapada',sanskrit:'पूर्व भाद्रपद',lord: 'JU', deity: 'Aja Ekapada',     symbol: 'Front legs',    keywords: ['transform','intense','ascetic'] },
  { name: 'Uttara Bhadrapada',sanskrit:'उत्तर भाद्रपद',lord: 'SA', deity: 'Ahir Budhnya',   symbol: 'Back legs',     keywords: ['depths','wisdom','serpent'] },
  { name: 'Revati',        sanskrit: 'रेवती',        lord: 'ME', deity: 'Pushan',          symbol: 'Fish',          keywords: ['nurture','journey','gentle'] },
];
export const NAKSHATRAS: EncEntry[] = NAK_ROWS.map((r, i) => ({
  id: `nak-${i + 1}`,
  kind: 'nakshatra',
  name: r.name,
  sanskrit: r.sanskrit,
  oneliner: `देवता: ${r.deity} · प्रतीक: ${r.symbol}। स्वामी: ${r.lord}।`,
  description: `नक्षत्र #${i + 1}। प्रत्येक नक्षत्र 13°20' चौड़ा होता है (3°20' के 4 चरण)। देवता ${r.deity}; प्रतीक ${r.symbol}; ${r.lord} द्वारा शासित (विंशोत्तरी दशा अनुक्रम)।`,
  keywords: r.keywords,
  meta: { number: i + 1, lord: r.lord, deity: r.deity, symbol: r.symbol },
}));

// ─── Houses (12 bhavas) ─────────────────────────────────────────────────────
export const HOUSES: EncEntry[] = [
  { id: 'house-1',  kind: 'house', name: '1st — Tanu Bhava',  sanskrit: 'तनु',
    oneliner: 'स्वयं, शरीर, रूप, जीवन की समग्र दिशा।',
    description: 'लग्न — उदय राशि भाव। भौतिक शरीर, सिर, रंग, व्यक्तित्व और जीवन-फोकस को नियंत्रित करता है। लग्नेश की शक्ति = पूरी कुण्डली की शक्ति।',
    keywords: ['स्वयं','शरीर','व्यक्तित्व','लग्न','सिर'], meta: { houseNum: 1 } },
  { id: 'house-2',  kind: 'house', name: '2nd — Dhana Bhava', sanskrit: 'धन',
    oneliner: 'धन, वाणी, परिवार, भोजन।',
    description: 'संचित धन, आवाज, चेहरा, निकट परिवार, भोजन का सेवन। एक मारक भाव — दूसरे भाव का स्वामी अपनी दशा के दौरान बीमारी पैदा कर सकता है।',
    keywords: ['धन','वाणी','परिवार','भोजन','मारक'], meta: { houseNum: 2 } },
  { id: 'house-3',  kind: 'house', name: '3rd — Sahaja Bhava',sanskrit: 'सहज',
    oneliner: 'भाई-बहन, साहस, छोटी यात्राएं, प्रयास।',
    description: 'छोटे भाई-बहन, व्यक्तिगत पहल, हाथ/भुजाएं, लेखन, छोटी यात्राएं। एक उपचय भाव — यहाँ की कठिनाइयाँ समय के साथ सुधरती हैं।',
    keywords: ['भाई-बहन','साहस','प्रयास','लेखन','पहल'], meta: { houseNum: 3, upachaya: 'yes' } },
  { id: 'house-4',  kind: 'house', name: '4th — Sukha Bhava', sanskrit: 'सुख',
    oneliner: 'घर, माता, वाहन, भावनात्मक आधार।',
    description: 'कुण्डली का हृदय। घर, माता, संपत्ति, वाहन, मन की शांति, शिक्षा। चंद्रमा के लिए सबसे मजबूत केंद्र।',
    keywords: ['घर','माता','संपत्ति','हृदय','सुख'], meta: { houseNum: 4, kendra: 'yes' } },
  { id: 'house-5',  kind: 'house', name: '5th — Putra Bhava', sanskrit: 'पुत्र',
    oneliner: 'संतान, रचनात्मकता, बुद्धि, पूर्व जन्म के कर्म।',
    description: 'संतान, रचनात्मक बुद्धि, रोमांस, सट्टा, पूर्व-जन्म पुण्य। पहले और नौवें भाव के साथ एक त्रिकोण (सर्वश्रेष्ठ) भाव।',
    keywords: ['संतान','रचनात्मकता','बुद्धि','रोमांस','पूर्व-पुण्य'], meta: { houseNum: 5, trikona: 'yes' } },
  { id: 'house-6',  kind: 'house', name: '6th — Ripu Bhava',  sanskrit: 'रिपु',
    oneliner: 'शत्रु, ऋण, रोग, सेवा, दैनिक कार्य।',
    description: 'षड्रिपु (6 आंतरिक शत्रु), मुकदमेबाजी, ऋण, दैनिक सेवा-कार्य, मातृ पक्ष के रिश्तेदार। एक उपचय भाव; यहाँ की कठिनाइयाँ समय के साथ सुधरती हैं।',
    keywords: ['शत्रु','ऋण','रोग','सेवा','प्रतिस्पर्धा'], meta: { houseNum: 6, upachaya: 'yes', dusthana: 'yes' } },
  { id: 'house-7',  kind: 'house', name: '7th — Yuvati Bhava',sanskrit: 'युवति',
    oneliner: 'जीवनसाथी, साझेदारी, अनुबंध, जनता।',
    description: 'विवाह, व्यापार साझेदारी, विदेशी निवास, सार्वजनिक व्यवहार, खुले शत्रु। एक मारक और एक केंद्र भाव।',
    keywords: ['जीवनसाथी','साझेदारी','विवाह','जनता','मारक'], meta: { houseNum: 7, kendra: 'yes', maraka: 'yes' } },
  { id: 'house-8',  kind: 'house', name: '8th — Randhra Bhava',sanskrit: 'रंध्र',
    oneliner: 'मृत्यु, परिवर्तन, छिपे हुए संसाधन, आयु।',
    description: 'कट्टरपंथी परिवर्तन का दुःस्थान। विरासत, जीवनसाथी का धन, पुरानी बीमारी, गुप्त विद्या, दीर्घायु। प्रकृति में मंगल के समान।',
    keywords: ['परिवर्तन','मृत्यु','गुप्त','रहस्य','आयु'], meta: { houseNum: 8, dusthana: 'yes' } },
  { id: 'house-9',  kind: 'house', name: '9th — Dharma Bhava',sanskrit: 'धर्म',
    oneliner: 'पिता, भाग्य, उच्च शिक्षा, धर्म।',
    description: 'सर्वोच्च त्रिकोण। पिता, शिक्षक, लंबी तीर्थयात्रा, धर्म, पिछले जन्म का पुण्य भाग्य (भाग्य) के रूप में फलित होता है।',
    keywords: ['पिता','भाग्य','धर्म','शिक्षक','पुण्य'], meta: { houseNum: 9, trikona: 'yes' } },
  { id: 'house-10', kind: 'house', name: '10th — Karma Bhava',sanskrit: 'कर्म',
    oneliner: 'करियर, सार्वजनिक स्थिति, अधिकार, कर्म।',
    description: 'पेशा, प्रतिष्ठा, सरकार, दुनिया में स्थिति। सबसे दृश्यमान केंद्र; करियर को परिभाषित करने वाले ग्रह यहाँ होते हैं।',
    keywords: ['करियर','स्थिति','अधिकार','प्रसिद्धि','कर्म'], meta: { houseNum: 10, kendra: 'yes' } },
  { id: 'house-11', kind: 'house', name: '11th — Labha Bhava',sanskrit: 'लाभ',
    oneliner: 'लाभ, बड़े भाई-बहन, नेटवर्क, पूर्ति।',
    description: 'लाभ के सभी रूप: आय, इच्छाओं की पूर्ति, मित्र, बड़े भाई-बहन, बड़े समूह। एक उपचय भाव; हमेशा सुधरता है।',
    keywords: ['लाभ','मित्र','पूर्ति','नेटवर्क','आय'], meta: { houseNum: 11, upachaya: 'yes' } },
  { id: 'house-12', kind: 'house', name: '12th — Vyaya Bhava',sanskrit: 'व्यय',
    oneliner: 'हानि, व्यय, मोक्ष, विदेश।',
    description: 'मुक्ति का दुःस्थान: व्यय, विदेश निवास, आध्यात्मिकता, शयन सुख, बाईं आंख, पैर, अस्पताल में भर्ती।',
    keywords: ['हानि','व्यय','मोक्ष','विदेश','नींद'], meta: { houseNum: 12, dusthana: 'yes' } },
];

// ─── Jaimini karakas ────────────────────────────────────────────────────────
export const KARAKAS: EncEntry[] = [
  { id: 'karaka-AK',  kind: 'karaka', name: 'Atmakaraka (AK)', sanskrit: 'आत्मकारक',
    oneliner: 'आत्मा का सूचक — अपनी राशि में सबसे अधिक अंशों वाला ग्रह।',
    description: '7 चर ग्रहों (सूर्य..शनि) में सबसे अधिक अंश। कुण्डली का स्वामी। मुख्य विषय प्रदान करता है जिस पर आपकी आत्मा काम करने आई है।', keywords: ['आत्मा','मूल','उन्नति','कर्म'] },
  { id: 'karaka-AmK', kind: 'karaka', name: 'Amatyakaraka (AmK)',sanskrit: 'अमात्यकारक',
    oneliner: 'मंत्री — करियर, उपलब्धि, दाहिने हाथ का कौशल।',
    description: 'दूसरे सबसे अधिक अंश। करियर, प्रतिभा की अभिव्यक्ति, व्यावसायिक मार्ग, आत्मकारक (AK) की सेवा।', keywords: ['करियर','मंत्री','कौशल'] },
  { id: 'karaka-BK',  kind: 'karaka', name: 'Bhratrikaraka (BK)',sanskrit: 'भ्रातृकारक',
    oneliner: 'भाई-बहन, सहोदर।', description: 'तीसरे सबसे अधिक अंश। भाई-बहन और साथियों का समूह।', keywords: ['भाई-बहन','साथी'] },
  { id: 'karaka-MK',  kind: 'karaka', name: 'Matrikaraka (MK)',  sanskrit: 'मातृकारक',
    oneliner: 'माता, पालन-पोषण।', description: 'चौथे सबसे अधिक अंश। माता की परिस्थितियां और कुण्डली का भावनात्मक आधार।', keywords: ['माता','पोषण'] },
  { id: 'karaka-PK',  kind: 'karaka', name: 'Putrakaraka (PK)',  sanskrit: 'पुत्रकारक',
    oneliner: 'संतान, रचनात्मक कार्य।', description: 'पांचवें सबसे अधिक अंश। संतति के मामले और व्यक्ति की रचनात्मक या बौद्धिक उपज।', keywords: ['संतान','रचनात्मक'] },
  { id: 'karaka-GK',  kind: 'karaka', name: 'Gnatikaraka (GK)',  sanskrit: 'ज्ञातिकारक',
    oneliner: 'चचेरे भाई, प्रतिद्वंद्वी।', description: 'छठे सबसे अधिक अंश। रक्त संबंधी रिश्तेदार, प्रतिद्वंद्वी, दूर करने वाली बाधाएं।', keywords: ['प्रतिद्वंद्वी','रिश्तेदार','बाधाएं'] },
  { id: 'karaka-DK',  kind: 'karaka', name: 'Darakaraka (DK)',   sanskrit: 'दारकारक',
    oneliner: 'जीवनसाथी।', description: 'सबसे कम अंश वाला चर ग्रह। जीवनसाथी और साझेदारी का कर्म।', keywords: ['जीवनसाथी','साथी'] },
];

// ─── Aggregator ─────────────────────────────────────────────────────────────
export const ENCYCLOPEDIA: EncEntry[] = [
  ...PLANETS, ...RASHIS, ...NAKSHATRAS, ...HOUSES, ...KARAKAS,
];

import { Locale, p } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

/** Resolve an encyclopedia entry into the requested locale.
 *  - `name` uses the existing astro-labels (planets / rashis / nakshatras /
 *    houses by id) where applicable; falls back to English.
 *  - `oneliner` is resolved via phrasebook key `enc.<id>.oneliner`; falls
 *    back to the English text.
 *  - `description` and `keywords[]` are kept English (deferred — large prose
 *    volume; the client can show them tagged with lang="en").
 *  - `sanskrit` and `source` are reference fields and stay verbatim. */
export function localizeEntry(e: EncEntry, locale: Locale): EncEntry {
  if (locale === 'en') return e;
  const al = astroLabels(locale);
  let name = e.name;
  switch (e.kind) {
    case 'planet':    name = al.planet(e.id); break;
    case 'rashi': {
      const num = Number(e.id.replace('rashi-', ''));
      if (Number.isFinite(num) && num >= 1 && num <= 12) name = al.rashi(num);
      break;
    }
    case 'nakshatra': {
      const num = Number(e.id.replace('nak-', ''));
      if (Number.isFinite(num) && num >= 1 && num <= 27) name = al.nakshatra(num);
      break;
    }
    case 'house': {
      const num = Number(e.id.replace('house-', ''));
      if (Number.isFinite(num) && num >= 1 && num <= 12) name = al.house(num);
      break;
    }
    case 'karaka': {
      const code = e.id.replace('karaka-', '');
      name = al.karaka(code);
      break;
    }
  }
  return {
    ...e,
    name,
    oneliner: p(`enc.${e.id}.oneliner`, locale, e.oneliner),
  };
}

export function findEntry(kind: EncEntry['kind'], id: string, locale: Locale = 'en'): EncEntry | undefined {
  const e = ENCYCLOPEDIA.find((x) => x.kind === kind && (x.id === id || x.name === id));
  return e ? localizeEntry(e, locale) : undefined;
}

export function searchEntries(query: string, locale: Locale = 'en'): EncEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matched = ENCYCLOPEDIA.filter((e) =>
    e.name.toLowerCase().includes(q) ||
    e.id.toLowerCase().includes(q) ||
    e.sanskrit?.toLowerCase().includes(q) ||
    e.keywords.some((k) => k.toLowerCase().includes(q)) ||
    e.oneliner.toLowerCase().includes(q),
  );
  return locale === 'en' ? matched : matched.map((e) => localizeEntry(e, locale));
}

export function listEntries(kind: EncEntry['kind'], locale: Locale = 'en'): EncEntry[] {
  const matched = ENCYCLOPEDIA.filter((e) => e.kind === kind);
  return locale === 'en' ? matched : matched.map((e) => localizeEntry(e, locale));
}
