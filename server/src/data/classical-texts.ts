// Classical text reader — seed corpus of key slokas.
//
// This is NOT the full Brihat Parashara — that's thousands of slokas under
// active translation. We seed the most-cited rules that the engine itself
// references (Mahapurusha, Raja yogas, Dhana yogas, core house principles,
// Jaimini aphorisms). Each sloka is tied to a topic and source so the
// Learning page can cross-link "why is this yoga here?" to the original.

export interface Sloka {
  id: string;
  text: string;                // original (Devanagari, if available)
  translit?: string;           // IAST / roman transliteration (optional)
  english: string;             // modern English gloss
  source: string;              // e.g. 'Brihat Parashara Hora Shastra 36.5'
  topic: string;               // normalised tag: 'mahapurusha', 'raja', 'dhana', …
  tags: string[];              // extra keywords
}

export const SLOKAS: Sloka[] = [
  // ─── Pancha Mahapurusha ────────────────────────────────────────────────
  {
    id: 'bphs-36-5',
    text: 'भौमे स्वोच्चे स्वगृहे केन्द्रे रुचकं नाम जायते।',
    translit: 'bhaume svocche svagṛhe kendre rucakaṃ nāma jāyate',
    english: 'When Mars is in its own sign or exaltation in a kendra from the lagna, Ruchaka Yoga is formed.',
    source: 'Brihat Parashara Hora Shastra 36.5',
    topic: 'mahapurusha',
    tags: ['ruchaka','mars','kendra','pancha-mahapurusha'],
  },
  {
    id: 'bphs-36-6',
    text: 'बुधे स्वोच्चे स्वगृहे केन्द्रे भद्रं नाम जायते।',
    translit: 'budhe svocche svagṛhe kendre bhadraṃ nāma jāyate',
    english: 'Bhadra Yoga arises when Mercury is own-sign or exalted in a kendra.',
    source: 'Brihat Parashara Hora Shastra 36.6',
    topic: 'mahapurusha',
    tags: ['bhadra','mercury','kendra','pancha-mahapurusha'],
  },
  {
    id: 'bphs-36-7',
    text: 'गुरौ स्वोच्चे स्वगृहे केन्द्रे हंसः प्रकीर्तितः।',
    translit: 'gurau svocche svagṛhe kendre haṃsaḥ prakīrtitaḥ',
    english: 'When Jupiter is own-sign or exalted in a kendra, Hamsa Yoga is declared.',
    source: 'Brihat Parashara Hora Shastra 36.7',
    topic: 'mahapurusha',
    tags: ['hamsa','jupiter','kendra','pancha-mahapurusha'],
  },
  {
    id: 'bphs-36-8',
    text: 'शुक्रे स्वोच्चे स्वगृहे केन्द्रे मालव्यं नाम कथ्यते।',
    translit: 'śukre svocche svagṛhe kendre mālavyaṃ nāma kathyate',
    english: 'Venus own-sign or exalted in a kendra produces Malavya Yoga.',
    source: 'Brihat Parashara Hora Shastra 36.8',
    topic: 'mahapurusha',
    tags: ['malavya','venus','kendra','pancha-mahapurusha'],
  },
  {
    id: 'bphs-36-9',
    text: 'शनौ स्वोच्चे स्वगृहे केन्द्रे शशं नाम जायते।',
    translit: 'śanau svocche svagṛhe kendre śaśaṃ nāma jāyate',
    english: 'Saturn own-sign or exalted in a kendra forms Shasha Yoga.',
    source: 'Brihat Parashara Hora Shastra 36.9',
    topic: 'mahapurusha',
    tags: ['shasha','saturn','kendra','pancha-mahapurusha'],
  },

  // ─── Lunar & Solar yogas ─────────────────────────────────────────────────
  {
    id: 'sar-33-8',
    text: 'केन्द्रे गुरौ चंद्राच्चेद्गजकेसरी नाम योगः।',
    translit: 'kendre gurau candrācced gajakesarī nāma yogaḥ',
    english: 'When Jupiter is in a kendra from the Moon, Gajakesari Yoga arises.',
    source: 'Saravali 33.8',
    topic: 'lunar',
    tags: ['gajakesari','jupiter','moon','kendra'],
  },
  {
    id: 'bphs-40-1',
    text: 'चंद्राच्चन्यः पापाः केन्द्रस्था यदा सुनफा नामकः।',
    translit: 'candrāc-canyaḥ pāpāḥ kendrasthā yadā sunaphā nāmakaḥ',
    english: 'Planets other than Sun in a kendra from the Moon form Sunapha Yoga.',
    source: 'Brihat Parashara Hora Shastra 40.1',
    topic: 'lunar',
    tags: ['sunapha','moon','kendra'],
  },
  {
    id: 'bphs-40-5',
    text: 'द्वादशे द्वितीये च शुक्राच्यदि न पापाः। चंद्रस्थायाद्यदा केमद्रुम योगो विपद्करः।',
    translit: 'dvādaśe dvitīye ca śukrāc-yadi na pāpāḥ…',
    english: 'When no planets (other than Sun, Rahu, Ketu) occupy 2nd or 12th from the Moon, Kemadruma Yoga — an afflictive combination — is formed.',
    source: 'Brihat Parashara Hora Shastra 40.5',
    topic: 'arishta',
    tags: ['kemadruma','moon','affliction'],
  },

  // ─── Raja & Dhana ────────────────────────────────────────────────────────
  {
    id: 'bphs-34-10',
    text: 'लग्नेशे केन्द्रत्रिकोणे राजयोगः प्रकीर्तितः।',
    translit: 'lagneśe kendra-trikoṇe rājayogaḥ prakīrtitaḥ',
    english: 'When the lord of the lagna occupies a kendra or trikona, a Raja Yoga is declared.',
    source: 'Brihat Parashara Hora Shastra 34.10',
    topic: 'raja',
    tags: ['raja','lagna-lord','kendra','trikona'],
  },
  {
    id: 'bphs-36-karma-dharma',
    text: 'नवमेशो दशमस्थो धर्मकर्माधिपयोगः।',
    translit: 'navameśo daśamastho dharmakarmādhipayogaḥ',
    english: 'When the 9th lord sits in the 10th (or vice versa), Dharma-Karma-Adhipati — one of the most powerful Raja Yogas — arises.',
    source: 'Brihat Parashara Hora Shastra 36 (dharma-karma combination)',
    topic: 'raja',
    tags: ['dharma-karma','9th-lord','10th-lord'],
  },
  {
    id: 'phaladeepika-6-lakshmi',
    text: 'पंचमेशो नवमेशं संयोगे लक्ष्मीयोगः।',
    translit: 'pañcameśo navameśaṃ saṃyoge lakṣmīyogaḥ',
    english: 'Connection (conjunction / aspect / exchange) between the 5th and 9th lords forms the Lakshmi Yoga — wealth with fortune.',
    source: 'Phaladeepika 6 (Lakshmi Yoga)',
    topic: 'dhana',
    tags: ['lakshmi','5th-lord','9th-lord','dhana'],
  },

  // ─── Jaimini aphorisms ──────────────────────────────────────────────────
  {
    id: 'jaimini-1-1-1',
    text: 'स्वांशे आत्मकारकः।',
    translit: 'svāṃśe ātmakārakaḥ',
    english: 'The planet at the highest degree within its sign is the Atmakaraka (soul-indicator).',
    source: 'Jaimini Sutras 1.1.1',
    topic: 'jaimini',
    tags: ['atmakaraka','jaimini'],
  },
  {
    id: 'jaimini-chara',
    text: 'लग्नाद्राशिः प्रथमदशा।',
    translit: 'lagnād rāśiḥ prathama-daśā',
    english: 'The first Chara Dasha period begins with the sign of the lagna.',
    source: 'Jaimini tradition (Rangacharya commentary)',
    topic: 'jaimini',
    tags: ['chara-dasha','lagna'],
  },

  // ─── General house principles ────────────────────────────────────────────
  {
    id: 'bphs-10-kendra',
    text: 'केन्द्रं विष्णुस्थानम्।',
    translit: 'kendraṃ viṣṇusthānam',
    english: 'The kendras (1, 4, 7, 10) are the seats of Vishnu — sustaining and strong.',
    source: 'Brihat Parashara Hora Shastra 10 (house classification)',
    topic: 'houses',
    tags: ['kendra','house-classification'],
  },
  {
    id: 'bphs-10-trikona',
    text: 'त्रिकोणं लक्ष्मीस्थानम्।',
    translit: 'trikoṇaṃ lakṣmīsthānam',
    english: 'The trikonas (1, 5, 9) are the seats of Lakshmi — fortune and dharma.',
    source: 'Brihat Parashara Hora Shastra 10',
    topic: 'houses',
    tags: ['trikona','house-classification'],
  },
  {
    id: 'bphs-10-dusthana',
    text: 'षष्ठाष्टव्ययस्थानानि दुःस्थानानि।',
    translit: 'ṣaṣṭhāṣṭa-vyaya-sthānāni duḥsthānāni',
    english: 'The 6th, 8th, and 12th are dusthanas — difficult houses indicating struggle, dissolution, and loss.',
    source: 'Brihat Parashara Hora Shastra 10',
    topic: 'houses',
    tags: ['dusthana','house-classification'],
  },
];

export function slokasByTopic(topic: string): Sloka[] {
  return SLOKAS.filter((s) => s.topic === topic);
}

export function searchSlokas(query: string): Sloka[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SLOKAS.filter((s) =>
    s.english.toLowerCase().includes(q) ||
    s.translit?.toLowerCase().includes(q) ||
    s.source.toLowerCase().includes(q) ||
    s.tags.some((t) => t.toLowerCase().includes(q)),
  );
}
