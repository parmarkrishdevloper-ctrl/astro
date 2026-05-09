// Curated catalogue of famous, verified-birth-data charts.
//
// Sources: Astro-Databank (Rodden rating AA/A wherever available); times
// given in local civil time with explicit TZ offset. These are stable test
// fixtures — changing one invalidates regression snapshots intentionally.

export interface FamousChart {
  id: string;
  name: string;
  datetime: string;        // ISO-8601 WITH explicit offset
  tzOffsetHours: number;
  lat: number;
  lng: number;
  placeName: string;
  category: 'statesman' | 'scientist' | 'entrepreneur' | 'artist' | 'mystic' | 'writer';
  rodden?: 'AA' | 'A' | 'B' | 'C';
  note?: string;
}

export const FAMOUS_CHARTS: FamousChart[] = [
  {
    id: 'gandhi',
    name: 'Mahatma Gandhi',
    datetime: '1869-10-02T07:12:00+04:51',
    tzOffsetHours: 4 + 51/60,
    lat: 21.6417, lng: 69.6293,
    placeName: 'Porbandar, India',
    category: 'statesman', rodden: 'AA',
    note: 'Libra rising, Moon in Leo; classical Raja-yoga chart.',
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    datetime: '1879-03-14T11:30:00+00:53',
    tzOffsetHours: 0 + 53/60,
    lat: 48.4, lng: 10.0,
    placeName: 'Ulm, Germany',
    category: 'scientist', rodden: 'AA',
    note: 'Cancer rising; Mercury-Venus-Saturn conjunction in Pisces.',
  },
  {
    id: 'jobs',
    name: 'Steve Jobs',
    datetime: '1955-02-24T19:15:00-08:00',
    tzOffsetHours: -8,
    lat: 37.7749, lng: -122.4194,
    placeName: 'San Francisco, USA',
    category: 'entrepreneur', rodden: 'AA',
    note: 'Virgo rising; Sun in Aquarius; strong Mars-Saturn.',
  },
  {
    id: 'ramana',
    name: 'Ramana Maharshi',
    datetime: '1879-12-30T01:00:00+05:21',
    tzOffsetHours: 5 + 21/60,
    lat: 9.5916, lng: 78.1196,
    placeName: 'Tiruchuli, India',
    category: 'mystic', rodden: 'A',
    note: 'Virgo rising; classical moksha chart with strong 12th.',
  },
  {
    id: 'viveka',
    name: 'Swami Vivekananda',
    datetime: '1863-01-12T06:33:00+05:53',
    tzOffsetHours: 5 + 53/60,
    lat: 22.5726, lng: 88.3639,
    placeName: 'Calcutta, India',
    category: 'mystic', rodden: 'A',
    note: 'Sagittarius rising; Sun exalted in Aries at birth.',
  },
  {
    id: 'tagore',
    name: 'Rabindranath Tagore',
    datetime: '1861-05-07T02:51:00+05:53',
    tzOffsetHours: 5 + 53/60,
    lat: 22.5726, lng: 88.3639,
    placeName: 'Calcutta, India',
    category: 'writer', rodden: 'A',
    note: 'Pisces rising; Nobel laureate poet-philosopher.',
  },
  {
    id: 'newton',
    name: 'Isaac Newton',
    datetime: '1643-01-04T01:38:00+00:00',
    tzOffsetHours: 0,
    lat: 52.8, lng: -0.6,
    placeName: 'Woolsthorpe, England',
    category: 'scientist', rodden: 'B',
    note: 'Libra rising (Julian→Gregorian adjusted); Capricorn Sun.',
  },
  {
    id: 'mozart',
    name: 'Wolfgang Amadeus Mozart',
    datetime: '1756-01-27T20:00:00+00:52',
    tzOffsetHours: 0 + 52/60,
    lat: 47.7998, lng: 13.0439,
    placeName: 'Salzburg, Austria',
    category: 'artist', rodden: 'A',
    note: 'Virgo rising; Aquarius Sun-Mercury; Venus in Capricorn.',
  },
];

export function findChart(id: string): FamousChart | undefined {
  return FAMOUS_CHARTS.find((c) => c.id === id);
}
