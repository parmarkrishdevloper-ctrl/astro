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
    oneliner: 'The soul (atma), vitality, father, authority, ego.',
    description: 'Karaka for self, father, government, bones, heart, and life-force. Rules Leo. Exalted in Aries (10°), debilitated in Libra. Moves ~1°/day. In Vedic thought the Sun is the seat of the atma and signifies whatever gives identity and public recognition.',
    keywords: ['soul','ego','father','authority','vitality','fame','government','health','heart'],
    meta: { rules: 'Leo', exaltedIn: 'Aries 10°', debilitatedIn: 'Libra 10°' },
    source: 'BPHS Ch.3' },
  { id: 'MO', kind: 'planet', name: 'Moon', sanskrit: 'चंद्र Chandra',
    oneliner: 'Mind (manas), mother, emotions, public, receptivity.',
    description: 'Karaka for mind, mother, home, happiness. Rules Cancer. Exalted in Taurus (3°), debilitated in Scorpio. Waxing Moon = benefic; waning Moon below 72° from Sun = neutral/malefic. Strongest in the 4th house.',
    keywords: ['mind','mother','emotion','home','public','receptive','memory'],
    meta: { rules: 'Cancer', exaltedIn: 'Taurus 3°', debilitatedIn: 'Scorpio 3°' },
    source: 'BPHS Ch.3' },
  { id: 'MA', kind: 'planet', name: 'Mars', sanskrit: 'मंगल Mangala',
    oneliner: 'Warrior energy — courage, brothers, action, conflict.',
    description: 'Karaka for siblings (younger), land, strength, anger. Rules Aries and Scorpio. Exalted in Capricorn (28°), debilitated in Cancer. Its 4th and 8th aspects make it especially piercing.',
    keywords: ['courage','siblings','land','warrior','action','anger','sports'],
    meta: { rules: 'Aries, Scorpio', exaltedIn: 'Capricorn 28°', debilitatedIn: 'Cancer 28°' },
    source: 'BPHS Ch.3' },
  { id: 'ME', kind: 'planet', name: 'Mercury', sanskrit: 'बुध Budha',
    oneliner: 'Intellect, speech, commerce, short journeys.',
    description: 'Karaka for communication, education, friends, mathematics, trade. Rules Gemini and Virgo. Exalted in Virgo (15°), debilitated in Pisces. Takes the nature of the planet it is conjunct.',
    keywords: ['intellect','speech','commerce','logic','friends','writing','trade'],
    meta: { rules: 'Gemini, Virgo', exaltedIn: 'Virgo 15°', debilitatedIn: 'Pisces 15°' },
    source: 'BPHS Ch.3' },
  { id: 'JU', kind: 'planet', name: 'Jupiter', sanskrit: 'गुरु / बृहस्पति Guru',
    oneliner: 'Wisdom, teacher, dharma, children, wealth.',
    description: 'Karaka for children, husband (female chart), wealth, wisdom, religion. Rules Sagittarius and Pisces. Exalted in Cancer (5°), debilitated in Capricorn. The most auspicious natural benefic; 5th and 9th aspects are especially blessing.',
    keywords: ['wisdom','teacher','dharma','children','wealth','religion','expansion'],
    meta: { rules: 'Sagittarius, Pisces', exaltedIn: 'Cancer 5°', debilitatedIn: 'Capricorn 5°' },
    source: 'BPHS Ch.3' },
  { id: 'VE', kind: 'planet', name: 'Venus', sanskrit: 'शुक्र Shukra',
    oneliner: 'Love, beauty, art, spouse (male chart), luxury.',
    description: 'Karaka for marriage (male chart), art, vehicles, comfort. Rules Taurus and Libra. Exalted in Pisces (27°), debilitated in Virgo. Guru of the asuras — specialist in tantra, subtle knowledge.',
    keywords: ['love','beauty','art','spouse','luxury','music','diplomacy'],
    meta: { rules: 'Taurus, Libra', exaltedIn: 'Pisces 27°', debilitatedIn: 'Virgo 27°' },
    source: 'BPHS Ch.3' },
  { id: 'SA', kind: 'planet', name: 'Saturn', sanskrit: 'शनि Shani',
    oneliner: 'Discipline, longevity, servants, delay, karma.',
    description: 'Karaka for longevity, discipline, hard work, old age, servants, chronic illness. Rules Capricorn and Aquarius. Exalted in Libra (20°), debilitated in Aries. The slowest-moving; represents time itself.',
    keywords: ['discipline','longevity','karma','delay','servants','old age','justice'],
    meta: { rules: 'Capricorn, Aquarius', exaltedIn: 'Libra 20°', debilitatedIn: 'Aries 20°' },
    source: 'BPHS Ch.3' },
  { id: 'RA', kind: 'planet', name: 'Rahu', sanskrit: 'राहु',
    oneliner: 'North lunar node — ambition, obsession, foreign.',
    description: 'Shadow planet; head of the serpent. Karaka for unconventional paths, foreign lands, deception, obsession, sudden gains. Always retrograde. No sign rulership in classical texts; modern tradition assigns Aquarius.',
    keywords: ['ambition','foreign','unconventional','obsession','illusion','sudden'],
    meta: { alwaysRetrograde: 'yes', modernRules: 'Aquarius' },
    source: 'BPHS Ch.3' },
  { id: 'KE', kind: 'planet', name: 'Ketu', sanskrit: 'केतु',
    oneliner: 'South lunar node — detachment, moksha, past-life skill.',
    description: 'Shadow planet; tail of the serpent. Karaka for moksha (liberation), spirituality, hidden knowledge, past-life mastery, sudden detachment. Always retrograde. Modern tradition assigns Scorpio.',
    keywords: ['moksha','detachment','spirituality','past-life','mystical','loss'],
    meta: { alwaysRetrograde: 'yes', modernRules: 'Scorpio' },
    source: 'BPHS Ch.3' },
];

// ─── Rashis (12 signs) ──────────────────────────────────────────────────────
export const RASHIS: EncEntry[] = [
  { id: 'rashi-1',  kind: 'rashi', name: 'Aries',       sanskrit: 'मेष Mesha',
    oneliner: 'The first sign — dynamic, pioneering, warrior.',
    description: 'Movable, fiery, male sign ruled by Mars. Represents initiative, head (body part), courage, impulsive action. The zodiac begins here at 0° sidereal.',
    keywords: ['pioneer','fiery','warrior','impulsive','head'],
    meta: { ruler: 'Mars', quality: 'Movable', element: 'Fire' } },
  { id: 'rashi-2',  kind: 'rashi', name: 'Taurus',      sanskrit: 'वृषभ Vrishabha',
    oneliner: 'Steady, sensual, earth-bound — accumulates value.',
    description: 'Fixed, earthy, female sign ruled by Venus. Represents patience, resources, throat/face, beauty, agriculture.',
    keywords: ['steady','sensual','wealth','agriculture','art','stubborn'],
    meta: { ruler: 'Venus', quality: 'Fixed', element: 'Earth' } },
  { id: 'rashi-3',  kind: 'rashi', name: 'Gemini',      sanskrit: 'मिथुन Mithuna',
    oneliner: 'Communicator — twin duality, curiosity, words.',
    description: 'Dual (mutable), airy, male sign ruled by Mercury. Represents speech, hands, siblings, commerce, short trips, media.',
    keywords: ['words','curiosity','duality','media','siblings','trade'],
    meta: { ruler: 'Mercury', quality: 'Dual', element: 'Air' } },
  { id: 'rashi-4',  kind: 'rashi', name: 'Cancer',      sanskrit: 'कर्क Karka',
    oneliner: 'Feeling, home, mother — tidal depths.',
    description: 'Movable, watery, female sign ruled by Moon. Represents mother, nurturing, home, chest/heart. Exalts Jupiter.',
    keywords: ['mother','home','emotion','nurture','memory'],
    meta: { ruler: 'Moon', quality: 'Movable', element: 'Water' } },
  { id: 'rashi-5',  kind: 'rashi', name: 'Leo',         sanskrit: 'सिंह Simha',
    oneliner: 'Royal, creative, sovereign self.',
    description: 'Fixed, fiery, male sign ruled by Sun. Represents authority, creativity, leadership, spine.',
    keywords: ['royal','creative','leader','pride','heart'],
    meta: { ruler: 'Sun', quality: 'Fixed', element: 'Fire' } },
  { id: 'rashi-6',  kind: 'rashi', name: 'Virgo',       sanskrit: 'कन्या Kanya',
    oneliner: 'Analytical servant — precision, service, health.',
    description: 'Dual, earthy, female sign ruled by Mercury. Exalts Mercury. Represents service, digestion, discernment.',
    keywords: ['analysis','service','health','detail','work'],
    meta: { ruler: 'Mercury', quality: 'Dual', element: 'Earth' } },
  { id: 'rashi-7',  kind: 'rashi', name: 'Libra',       sanskrit: 'तुला Tula',
    oneliner: 'Partnership, balance, trade — the scales.',
    description: 'Movable, airy, male sign ruled by Venus. Exalts Saturn. Represents relationships, contracts, markets, kidneys.',
    keywords: ['balance','partnership','trade','diplomacy','justice'],
    meta: { ruler: 'Venus', quality: 'Movable', element: 'Air' } },
  { id: 'rashi-8',  kind: 'rashi', name: 'Scorpio',     sanskrit: 'वृश्चिक Vrishchika',
    oneliner: 'Deep, transformative, occult — the scorpion.',
    description: 'Fixed, watery, female sign ruled by Mars. Represents transformation, genitals, hidden wealth, investigation.',
    keywords: ['transformation','occult','secrets','power','sexuality'],
    meta: { ruler: 'Mars', quality: 'Fixed', element: 'Water' } },
  { id: 'rashi-9',  kind: 'rashi', name: 'Sagittarius', sanskrit: 'धनु Dhanu',
    oneliner: 'Seeker — philosophy, dharma, long journeys.',
    description: 'Dual, fiery, male sign ruled by Jupiter. Represents higher learning, religion, long travel, thighs.',
    keywords: ['philosophy','dharma','journey','teacher','fortune'],
    meta: { ruler: 'Jupiter', quality: 'Dual', element: 'Fire' } },
  { id: 'rashi-10', kind: 'rashi', name: 'Capricorn',   sanskrit: 'मकर Makara',
    oneliner: 'Worker — structure, ambition, slow climb.',
    description: 'Movable, earthy, female sign ruled by Saturn. Exalts Mars. Represents career, hierarchy, knees, disciplined execution.',
    keywords: ['structure','ambition','career','patience','authority'],
    meta: { ruler: 'Saturn', quality: 'Movable', element: 'Earth' } },
  { id: 'rashi-11', kind: 'rashi', name: 'Aquarius',    sanskrit: 'कुंभ Kumbha',
    oneliner: 'Innovator — groups, ideals, unconventional.',
    description: 'Fixed, airy, male sign ruled by Saturn (modern: Rahu). Represents large systems, technology, calves, friendships.',
    keywords: ['innovation','groups','ideals','unconventional','technology'],
    meta: { ruler: 'Saturn', quality: 'Fixed', element: 'Air' } },
  { id: 'rashi-12', kind: 'rashi', name: 'Pisces',      sanskrit: 'मीन Meena',
    oneliner: 'Mystic — dissolution, compassion, moksha.',
    description: 'Dual, watery, female sign ruled by Jupiter. Exalts Venus. Represents spirituality, feet, compassion, imagination.',
    keywords: ['mystic','moksha','compassion','imagination','dissolution'],
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
  oneliner: `${r.deity} · ${r.symbol}. Lord: ${r.lord}.`,
  description: `Nakshatra #${i + 1}. Each nakshatra is 13°20' wide (4 padas of 3°20'). Deity ${r.deity}; symbol ${r.symbol}; ruled by ${r.lord} (Vimshottari dasha sequence).`,
  keywords: r.keywords,
  meta: { number: i + 1, lord: r.lord, deity: r.deity, symbol: r.symbol },
}));

// ─── Houses (12 bhavas) ─────────────────────────────────────────────────────
export const HOUSES: EncEntry[] = [
  { id: 'house-1',  kind: 'house', name: '1st — Tanu Bhava',  sanskrit: 'तनु',
    oneliner: 'Self, body, appearance, overall life direction.',
    description: 'The Lagna — rising sign house. Governs the physical body, head, complexion, personality, and life-focus. Strength of the 1st lord = strength of the whole chart.',
    keywords: ['self','body','personality','lagna','head'], meta: { houseNum: 1 } },
  { id: 'house-2',  kind: 'house', name: '2nd — Dhana Bhava', sanskrit: 'धन',
    oneliner: 'Wealth, speech, family, food.',
    description: 'Accumulated wealth, voice, face, near family, food intake. A maraka (killing) house — 2nd lord can cause disease during its dasha.',
    keywords: ['wealth','speech','family','food','maraka'], meta: { houseNum: 2 } },
  { id: 'house-3',  kind: 'house', name: '3rd — Sahaja Bhava',sanskrit: 'सहज',
    oneliner: 'Siblings, courage, short trips, effort.',
    description: 'Younger siblings, personal initiative, hands/arms, writing, short journeys. An upachaya (improving) house — difficulties here improve over time.',
    keywords: ['siblings','courage','effort','writing','initiative'], meta: { houseNum: 3, upachaya: 'yes' } },
  { id: 'house-4',  kind: 'house', name: '4th — Sukha Bhava', sanskrit: 'सुख',
    oneliner: 'Home, mother, vehicles, emotional base.',
    description: 'Heart of the chart. Home, mother, property, vehicles, inner peace, education. Strongest angle for Moon.',
    keywords: ['home','mother','property','heart','comfort'], meta: { houseNum: 4, kendra: 'yes' } },
  { id: 'house-5',  kind: 'house', name: '5th — Putra Bhava', sanskrit: 'पुत्र',
    oneliner: 'Children, creativity, intellect, past-life karma.',
    description: 'Children, creative intelligence, romance, speculation, past-life purva-punya. A trikona (best) house along with 1st and 9th.',
    keywords: ['children','creativity','intellect','romance','purva-punya'], meta: { houseNum: 5, trikona: 'yes' } },
  { id: 'house-6',  kind: 'house', name: '6th — Ripu Bhava',  sanskrit: 'रिपु',
    oneliner: 'Enemies, debts, disease, service, work routines.',
    description: 'Shadripus (6 internal enemies), litigation, debts, daily service-work, maternal relatives. An upachaya; difficulties here improve over time.',
    keywords: ['enemies','debts','disease','service','competition'], meta: { houseNum: 6, upachaya: 'yes', dusthana: 'yes' } },
  { id: 'house-7',  kind: 'house', name: '7th — Yuvati Bhava',sanskrit: 'युवति',
    oneliner: 'Spouse, partnership, contracts, public.',
    description: 'Marriage, business partnership, foreign residence, public dealings, open enemies. A maraka and a kendra.',
    keywords: ['spouse','partnership','marriage','public','maraka'], meta: { houseNum: 7, kendra: 'yes', maraka: 'yes' } },
  { id: 'house-8',  kind: 'house', name: '8th — Randhra Bhava',sanskrit: 'रंध्र',
    oneliner: 'Death, transformation, hidden resources, longevity.',
    description: 'The dusthana of radical change. Inheritance, spouse\'s money, chronic illness, occult, longevity. Mars-like in nature.',
    keywords: ['transformation','death','hidden','occult','longevity'], meta: { houseNum: 8, dusthana: 'yes' } },
  { id: 'house-9',  kind: 'house', name: '9th — Dharma Bhava',sanskrit: 'धर्म',
    oneliner: 'Father, luck, higher learning, dharma.',
    description: 'The highest trikona. Father, teacher, long pilgrimage, religion, past-life virtue flowering as luck (bhagya).',
    keywords: ['father','luck','dharma','teacher','bhagya'], meta: { houseNum: 9, trikona: 'yes' } },
  { id: 'house-10', kind: 'house', name: '10th — Karma Bhava',sanskrit: 'कर्म',
    oneliner: 'Career, public status, authority, action.',
    description: 'Occupation, reputation, government, position in the world. The most visible angle; career-defining planets here.',
    keywords: ['career','status','authority','fame','action'], meta: { houseNum: 10, kendra: 'yes' } },
  { id: 'house-11', kind: 'house', name: '11th — Labha Bhava',sanskrit: 'लाभ',
    oneliner: 'Gains, elder siblings, networks, fulfilment.',
    description: 'All forms of gain: income, desires fulfilled, friends, elder siblings, large groups. An upachaya; always improves.',
    keywords: ['gains','friends','fulfilment','networks','income'], meta: { houseNum: 11, upachaya: 'yes' } },
  { id: 'house-12', kind: 'house', name: '12th — Vyaya Bhava',sanskrit: 'व्यय',
    oneliner: 'Losses, expenses, moksha, foreign lands.',
    description: 'Dusthana of release: expenditure, foreign residence, spirituality, bed-pleasures, left eye, feet, hospitalisation.',
    keywords: ['loss','expense','moksha','foreign','sleep'], meta: { houseNum: 12, dusthana: 'yes' } },
];

// ─── Jaimini karakas ────────────────────────────────────────────────────────
export const KARAKAS: EncEntry[] = [
  { id: 'karaka-AK',  kind: 'karaka', name: 'Atmakaraka (AK)', sanskrit: 'आत्मकारक',
    oneliner: 'The soul-indicator — planet most advanced in its sign.',
    description: 'Highest degree-in-sign among the 7 chara planets (Sun..Saturn). Ruler of the chart. Gives the central theme your soul came to work on.', keywords: ['soul','core','advancement','karma'] },
  { id: 'karaka-AmK', kind: 'karaka', name: 'Amatyakaraka (AmK)',sanskrit: 'अमात्यकारक',
    oneliner: 'Minister — career, achievement, right-hand skills.',
    description: 'Second-most advanced. Career, expression of talent, vocational path, service to AK.', keywords: ['career','minister','skill'] },
  { id: 'karaka-BK',  kind: 'karaka', name: 'Bhratrikaraka (BK)',sanskrit: 'भ्रातृकारक',
    oneliner: 'Siblings, co-borns.', description: 'Third-most advanced. Siblings and group of peers.', keywords: ['siblings','peers'] },
  { id: 'karaka-MK',  kind: 'karaka', name: 'Matrikaraka (MK)',  sanskrit: 'मातृकारक',
    oneliner: 'Mother, nurturing.', description: 'Fourth-most advanced. Mother\'s circumstances and the chart\'s emotional ground.', keywords: ['mother','nurture'] },
  { id: 'karaka-PK',  kind: 'karaka', name: 'Putrakaraka (PK)',  sanskrit: 'पुत्रकारक',
    oneliner: 'Children, creative work.', description: 'Fifth-most advanced. Matters of progeny and one\'s creative or intellectual output.', keywords: ['children','creative'] },
  { id: 'karaka-GK',  kind: 'karaka', name: 'Gnatikaraka (GK)',  sanskrit: 'ज्ञातिकारक',
    oneliner: 'Cousins, rivals.', description: 'Sixth-most advanced. Relatives by blood, rivals, obstacles to overcome.', keywords: ['rivals','relatives','obstacles'] },
  { id: 'karaka-DK',  kind: 'karaka', name: 'Darakaraka (DK)',   sanskrit: 'दारकारक',
    oneliner: 'Spouse.', description: 'Least-advanced chara planet. Spouse and partnership karma.', keywords: ['spouse','partner'] },
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
