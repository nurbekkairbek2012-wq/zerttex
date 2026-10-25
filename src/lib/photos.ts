/**
 * Real photos from Wikimedia Commons (free licences). Served from Wikimedia's CDN in standard
 * thumbnail widths. Every photo keeps its author and licence for the credits on /about.
 */
export interface PhotoInfo {
  path: string; // "a/ab/File_name.jpg" (URL-encoded file name)
  alt: string;
  author: string;
  license: string;
  place: string;
}

const P = (path: string, alt: string, author: string, license: string, place: string): PhotoInfo => ({ path, alt, author, license, place });

export const photos = {
  kolsai: P('2/2c/Kolsay_Lake.jpeg', 'Lower Kolsai lake between spruce-covered mountains', 'Нұрлан Рахымжанов', 'CC0', 'Kolsai Lakes'),
  kolsai2: P('a/af/Kolsay_Lake%2C_2022.jpg', 'Kolsai lake on a summer day', 'TakingOver', 'CC0', 'Kolsai Lakes'),
  kolsai3: P('5/56/First_Kolsay_lake_2023.jpg', 'First Kolsai lake seen from the trail', 'Lfvelynis', 'CC BY-SA 4.0', 'Kolsai Lakes'),
  kaindy: P('2/26/Kaindy_lake_south-east_Kazakhstan.jpg', 'Sunken spruce trunks rising from turquoise Kaindy lake', 'Jonas Satkauskas', 'Attribution', 'Kaindy Lake'),
  kaindy2: P('8/8b/Kaindy_lake.jpg', 'Kaindy lake with the drowned forest', 'Katariyakartikey', 'CC0', 'Kaindy Lake'),
  charyn: P('7/74/Charyn_Canyon_26.jpg', 'Red rock towers in the Valley of Castles, Charyn Canyon', 'Adam Harangozó', 'CC BY-SA 4.0', 'Charyn Canyon'),
  charyn2: P('8/8d/Charyn_Canyon_18.jpg', 'Charyn canyon walls under a blue sky', 'Adam Harangozó', 'CC BY-SA 4.0', 'Charyn Canyon'),
  charyn3: P('b/b3/Charyn_Canyon_15.jpg', 'A lone rock pillar in Charyn Canyon', 'Adam Harangozó', 'CC BY-SA 4.0', 'Charyn Canyon'),
  charyn4: P('b/ba/Charyn_Canyon_13.jpg', 'View over the layered Charyn canyon', 'Adam Harangozó', 'CC BY-SA 4.0', 'Charyn Canyon'),
  charyn5: P('5/5c/Charyn_Canyon_28.jpg', 'Charyn river at the bottom of the canyon', 'Adam Harangozó', 'CC BY-SA 4.0', 'Charyn Canyon'),
  yasawi: P('6/6c/Mausoleum_of_Khoja_Ahmed_Yasawi_in_Hazrat-e_Turkestan%2C_Kazakhstan.jpg', 'Turquoise dome of the Mausoleum of Khoja Ahmed Yasawi', 'Petar Milošević', 'CC BY-SA 4.0', 'Turkestan'),
  yasawi2: P('f/f5/Mausoleum_of_Khoja_Ahmed_Yasavi_in_Turkestan%2C_Kazakhstan.jpg', 'Main portal of the Yasawi mausoleum', 'Petar Milošević', 'CC BY-SA 4.0', 'Turkestan'),
  yasawi3: P('7/75/Mausoleum_of_Khoja_Ahmed_Yasawi_in_Turkistan_2.jpg', 'Yasawi mausoleum and the old city walls', 'Adam Harangozó', 'CC BY-SA 4.0', 'Turkestan'),
  sauran: P('a/ab/Sawran%2C_Kazakhstan_02.jpg', 'Walls of the ancient Silk Road city of Sauran', 'Man77', 'CC BY-SA 3.0', 'Sauran'),
  burabay: P('0/0c/%D0%9E%D0%BA%D0%B6%D0%B5%D1%82%D0%BF%D0%B5%D1%81_%D0%B2%D0%B8%D0%B4_%D1%81_%D0%BE%D0%B7%D0%B5%D1%80%D0%B0.jpg', 'Okzhetpes rock above Lake Burabay', 'Yelena Shander', 'CC BY-SA 4.0', 'Burabay'),
  burabay2: P('4/45/Burabay_lakes.jpg', 'Burabay lakes at sunset', 'Yerdeshkyzy', 'CC BY-SA 4.0', 'Burabay'),
  burabay3: P('d/d5/Lake_Burabai.jpg', 'Pine forest on the shore of Lake Burabai', 'Kul-Tegin Makishev', 'CC BY-SA 4.0', 'Burabay'),
  bigAlmaty: P('3/3a/Big_Almaty_Lake_%28Bolshaya_Almatinka%29_in_June.jpg', 'Big Almaty Lake under snowy peaks', 'Ds02006', 'Public domain', 'Almaty'),
  shymbulak: P('a/a5/Shymbulak_Ile_Alatau_Mountains_in_Almaty_08.jpg', 'Snowy Ile Alatau peaks above Almaty', 'Ninaras', 'CC BY 4.0', 'Almaty'),
  yurt: P('0/02/Yurt_in_Tekeli.JPG', 'A Kazakh yurt in a mountain meadow', 'Stomac', 'CC BY 3.0', 'Zhetysu'),
} satisfies Record<string, PhotoInfo>;

export type PhotoId = keyof typeof photos;

/** Wikimedia serves these standard thumbnail widths. */
export type Width = 500 | 960 | 1280 | 1920;

// Originals narrower than 1920 px: Wikimedia cannot upscale, so cap their width.
const maxWidth: Partial<Record<PhotoId, Width>> = { kaindy: 1280, sauran: 1280, burabay2: 1280 };

export function photoUrl(id: PhotoId, width: Width = 1280): string {
  const cap = maxWidth[id];
  if (cap && width > cap) width = cap;
  const p = photos[id].path;
  const file = p.split('/').pop()!;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${p}/${width}px-${file}`;
}

export function photoSrcSet(id: PhotoId): string {
  const cap = maxWidth[id] ?? 1920;
  return ([500, 960, 1280, 1920] as Width[]).filter((w) => w <= cap).map((w) => `${photoUrl(id, w)} ${w}w`).join(', ');
}

export function commonsPage(id: PhotoId): string {
  return `https://commons.wikimedia.org/wiki/File:${photos[id].path.split('/').pop()}`;
}

/** Photos per trip: cover first, then gallery. */
export const tripPhotos: Record<string, PhotoId[]> = {
  'kolsai-kaindy': ['kolsai', 'kaindy', 'kolsai2', 'kaindy2', 'kolsai3'],
  'charyn-canyon': ['charyn', 'charyn2', 'charyn3', 'charyn4', 'charyn5'],
  turkestan: ['yasawi', 'yasawi2', 'sauran', 'yasawi3'],
  burabay: ['burabay', 'burabay2', 'burabay3'],
  'great-steppe': ['bigAlmaty', 'charyn4', 'kaindy', 'yasawi', 'yurt', 'shymbulak'],
};

export const coverOf = (tripId: string): PhotoId => tripPhotos[tripId]?.[0] ?? 'kolsai';
