import React, { useMemo, useId, useRef, useState } from 'react';
import { Star, TrendingUp, Minus, TrendingDown, XCircle, Plus, X, Edit2, Trash2, AlertTriangle, Crown, Pencil, Check, ListOrdered } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { toPng } from 'html-to-image';

/** --- FONTS --- **/

// Единый явный шрифт для всех устройств и браузеров (вместо системного font-sans, который у каждой ОС свой).
const APP_FONT_FAMILY = "'Inter', sans-serif";
const FONT_LINK_ID = 'app-inter-font';
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap';

// Шрифт метаданных релизов (название и артист). Alegreya Sans SC: гротеск без засечек, настоящая капитель (строчные буквы рисуются капителью), кириллица, настоящие начертания 400 и 900.
const META_FONT_FAMILY = "'Alegreya Sans SC', sans-serif";
const META_FONT_LINK_ID = 'app-alegreya-sans-sc-font';
const META_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Alegreya+Sans+SC:wght@400;900&display=swap';

// Латиница в метаданных набирается Space Mono (у него нет кириллицы, поэтому кириллица остаётся за Alegreya Sans SC).
// Капитель: font-variant-caps берёт настоящую капитель шрифта, если она есть, иначе браузер синтезирует её (font-synthesis: small-caps).
const META_LATIN_FONT_FAMILY = "'Space Mono', 'Alegreya Sans SC', monospace";
const META_LATIN_LINK_ID = 'app-space-mono-font';
const META_LATIN_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap';

// Амперсанд в метаданных рисуется отдельным шрифтом с классическим начертанием «&».
// Подгружается подмножество шрифта Archivo, содержащее только символ & (text=%26), поэтому остальной текст этот шрифт не затрагивает.
// Эти константы используются только полем ввода в форме (input.meta-input).
const META_AMP_FONT_FAMILY = "'Archivo', sans-serif";
const META_AMP_LINK_ID = 'app-archivo-amp-font';
const META_AMP_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;900&text=%26&display=swap';

// Амперсанд в карточках релизов: отдельный шрифт с классическим начертанием «&» (антиква).
// Подгружается подмножество, содержащее только символ & (text=%26). Поле ввода в форме эти константы не использует.
const CARD_AMP_FONT_FAMILY = "'Libre Baskerville', serif";
const CARD_AMP_LINK_ID = 'app-libre-baskerville-amp-font';
const CARD_AMP_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&text=%26&display=swap';

// В поле ввода нельзя выделить латиницу отдельным span, поэтому используется стек шрифтов: латиница берётся из Space Mono, кириллица из Alegreya Sans SC.
// Пробелы в таком стеке рисует Space Mono (шире, чем в карточках, где пробелы за Alegreya Sans SC), поэтому расстояние между словами уменьшается отрицательным word-spacing.
const META_INPUT_WORD_SPACING = '-0.25em';

const FONT_CSS = `
  :root { --app-font: ${APP_FONT_FAMILY}; }
  html, body, #root, button, input, textarea, select, .font-sans, svg text, svg tspan {
    font-family: var(--app-font) !important;
  }
  input.meta-input {
    font-family: ${META_AMP_FONT_FAMILY.replace(", sans-serif", "")}, ${META_LATIN_FONT_FAMILY} !important;
    font-variant-caps: small-caps;
    font-synthesis: small-caps;
  }
  html, body {
    font-synthesis: none;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
`;

const useAppFont = () => {
  React.useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    const metaLink = document.createElement('link');
    metaLink.id = META_FONT_LINK_ID;
    metaLink.rel = 'stylesheet';
    metaLink.href = META_FONT_HREF;
    const latinLink = document.createElement('link');
    latinLink.id = META_LATIN_LINK_ID;
    latinLink.rel = 'stylesheet';
    latinLink.href = META_LATIN_FONT_HREF;
    const ampLink = document.createElement('link');
    ampLink.id = META_AMP_LINK_ID;
    ampLink.rel = 'stylesheet';
    ampLink.href = META_AMP_FONT_HREF;
    const cardAmpLink = document.createElement('link');
    cardAmpLink.id = CARD_AMP_LINK_ID;
    cardAmpLink.rel = 'stylesheet';
    cardAmpLink.href = CARD_AMP_FONT_HREF;
    document.head.append(preconnect1, preconnect2, link, metaLink, latinLink, ampLink, cardAmpLink);
  }, []);
};

/** --- UTILS --- **/

const exportElement = async (ref, fileName) => {
  if (!ref.current) return;
  try {
    if (document.fonts?.load) {
      // Явно догружаем оба шрифта (латиница + кириллица) до рендера PNG, чтобы экспорт не ушёл на запасной шрифт
      await Promise.all([
        document.fonts.load("900 1em 'Inter'", 'AaБб'),
        document.fonts.load("400 1em 'Inter'", 'AaБб'),
        document.fonts.load("900 1em 'Alegreya Sans SC'", 'AaБб'),
        document.fonts.load("400 1em 'Alegreya Sans SC'", 'AaБб'),
        document.fonts.load("700 1em 'Space Mono'", 'AaBb'),
        document.fonts.load("400 1em 'Space Mono'", 'AaBb'),
        document.fonts.load("900 1em 'Archivo'", '&'),
        document.fonts.load("400 1em 'Archivo'", '&'),
        document.fonts.load("700 1em 'Libre Baskerville'", '&'),
        document.fonts.load("400 1em 'Libre Baskerville'", '&'),
      ]).catch(() => {});
    }
    if (document.fonts?.ready) await document.fonts.ready;
    const dataUrl = await toPng(ref.current, {
      quality: 1, pixelRatio: 3, backgroundColor: '#000000', cacheBust: true, skipFonts: false,
    });
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Export failed', err);
  }
};

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getWeekDates = (date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startDate = new Date(d);
  startDate.setDate(d.getDate() + diff);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return { startDate, endDate };
};

const formatWeekDateRange = (startDate, endDate) => {
  const options = { month: 'short' };
  const startMonth = startDate.toLocaleDateString('en-US', { ...options, month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { ...options, month: 'short' });
  const year = endDate.getFullYear();
  return startDate.getMonth() === endDate.getMonth() 
    ? `${startMonth} ${startDate.getDate()} – ${endDate.getDate()}, ${year}`
    : `${startMonth} ${startDate.getDate()} – ${endMonth} ${endDate.getDate()}, ${year}`;
};


const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const STORAGE_KEY = 'fresh_pack_session';

const isValidWeekNumber = (value) => Number.isInteger(value) && value >= 1 && value <= 53;
const isValidWeekYear = (value) => Number.isInteger(value) && value >= 2000 && value <= 2100;

const getWeekYear = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
};

const getDatesFromWeekNumber = (weekNumber, year) => {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;

  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const startUTC = new Date(mondayOfWeek1);
  startUTC.setUTCDate(mondayOfWeek1.getUTCDate() + (weekNumber - 1) * 7);

  const endUTC = new Date(startUTC);
  endUTC.setUTCDate(startUTC.getUTCDate() + 6);

  return {
    startDate: new Date(startUTC.getUTCFullYear(), startUTC.getUTCMonth(), startUTC.getUTCDate()),
    endDate: new Date(endUTC.getUTCFullYear(), endUTC.getUTCMonth(), endUTC.getUTCDate()),
  };
};

const getCurrentWeekInfo = () => {
  const now = new Date();
  return {
    weekNumber: getWeekNumber(now),
    weekYear: getWeekYear(now),
  };
};

// Ключ для проверки дубликатов: название + артист (без учёта регистра и лишних пробелов)
const normalizeKeyPart = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const getReleaseKey = (title, artist) => `${normalizeKeyPart(title)}\u0000${normalizeKeyPart(artist)}`;

// Релизы без оценки (score === null) идут в конец
const compareReleases = (a, b) => (b.score ?? -1) - (a.score ?? -1);

// Оценки хранятся в списке release.ratings в 1000-балльной шкале (с десятыми долями).
// Итоговая оценка релиза (release.score, 5-балльная шкала) = среднее по списку / 200.
const clampRating = (value) => Math.max(0, Math.min(1000, value));

// Текст из поля ввода -> число 0–1000 (или null, если ввод некорректен)
const parseRating = (text) => {
  const n = parseFloat(String(text ?? '').trim().replace(',', '.'));
  return Number.isFinite(n) ? clampRating(n) : null;
};

// Число 0–1000 -> текст для поля ввода, без float-мусора
const ratingToText = (value) =>
  value === null || value === undefined ? '' : String(parseFloat(Number(value).toFixed(6)));

// Список оценок (1000-балльная шкала) -> итоговая 5-балльная оценка (null, если оценок нет)
const computeScore = (ratings) => {
  if (!Array.isArray(ratings) || ratings.length === 0) return null;
  const mean = ratings.reduce((acc, v) => acc + v, 0) / ratings.length;
  return Math.max(0, Math.min(5, mean / 200));
};

const normalizeRelease = (item) => {
  let ratings = [];

  if (Array.isArray(item?.ratings)) {
    ratings = item.ratings
      .filter(v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)))
      .map(v => clampRating(Number(v)));
  } else {
    // Старый формат (одиночная оценка): превращаем в список из одной оценки
    const rawScore = item?.score;
    const hasScore =
      rawScore !== null && rawScore !== undefined && rawScore !== '' && Number.isFinite(Number(rawScore));
    if (hasScore) {
      const fromScore = Math.max(0, Math.min(5, Number(rawScore))) * 200;
      const parsedInput = parseFloat(item?.inputScore);
      const useInput = Number.isFinite(parsedInput) && Math.abs(clampRating(parsedInput) - fromScore) < 1e-6;
      ratings = [useInput ? clampRating(parsedInput) : parseFloat(fromScore.toFixed(6))];
    }
  }

  return {
    title: typeof item?.title === 'string' ? item.title : '',
    artist: typeof item?.artist === 'string' ? item.artist : '',
    coverLink: typeof item?.coverLink === 'string' ? item.coverLink : '',
    ratings,
    score: computeScore(ratings),
  };
};

const sanitizeReleases = (items) => {
  if (!Array.isArray(items)) return [];

  const seen = new Set();

  return items
    .map(normalizeRelease)
    .filter(item => item.title && item.artist)
    .filter(item => {
      const key = getReleaseKey(item.title, item.artist);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(compareReleases);
};

const downloadJsonFile = (data, fileName) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.json`;
  link.click();

  URL.revokeObjectURL(url);
};

const getInitialSessionState = () => {
  const fallbackWeek = getCurrentWeekInfo();

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        releases: [],
        weekNumber: fallbackWeek.weekNumber,
        weekYear: fallbackWeek.weekYear,
      };
    }

    const parsed = JSON.parse(raw);

    const weekNumber = isValidWeekNumber(parsed.weekNumber)
      ? parsed.weekNumber
      : fallbackWeek.weekNumber;

    const weekYear = isValidWeekYear(parsed.weekYear)
      ? parsed.weekYear
      : fallbackWeek.weekYear;

    return {
      releases: sanitizeReleases(parsed.releases),
      weekNumber,
      weekYear,
    };
  } catch (err) {
    console.error('Failed to load session data', err);
    return {
      releases: [],
      weekNumber: fallbackWeek.weekNumber,
      weekYear: fallbackWeek.weekYear,
    };
  }
};


const hexToHsl = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      default: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
};

const hslToHex = (h, s, l) => {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
};

const getTierFooterColor = (rowBgColor, headerBgColor, tierCount, totalCount) => {
  const rowHsl = hexToHsl(rowBgColor);
  const headerHsl = hexToHsl(headerBgColor);
  const factor = totalCount > 0 ? Math.max(0, Math.min(1, tierCount / totalCount)) : 0;
  return hslToHex(headerHsl.h, rowHsl.s + (headerHsl.s - rowHsl.s) * factor, rowHsl.l + (headerHsl.l - rowHsl.l) * factor);
};

const interpolateColor = (color1, color2, factor) => {
  const r1 = parseInt(color1.substring(1, 3), 16), g1 = parseInt(color1.substring(3, 5), 16), b1 = parseInt(color1.substring(5, 7), 16);
  const r2 = parseInt(color2.substring(1, 3), 16), g2 = parseInt(color2.substring(3, 5), 16), b2 = parseInt(color2.substring(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * factor), g = Math.round(g1 + (g2 - g1) * factor), b = Math.round(b1 + (b2 - b1) * factor);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const getDynamicColor = (score) => {
  const scale = [{ t: 0, c: '#B91C1C' }, { t: 1, c: '#EA580C' }, { t: 2, c: '#F59E0B' }, { t: 3.75, c: '#7D9A3A' }, { t: 4.5, c: '#059669' }];
  if (score <= 0) return scale[0].c;
  if (score >= 5) return scale[4].c;
  for (let i = 0; i < scale.length - 1; i++) {
    if (score >= scale[i].t && score <= scale[i + 1].t) return interpolateColor(scale[i].c, scale[i + 1].c, (score - scale[i].t) / (scale[i + 1].t - scale[i].t));
  }
  return scale[4].c;
};

const getRankLabel = (score, isNA) => isNA ? "N/A" : score >= 4.5 ? "TOP" : score >= 3.75 ? "POP" : score >= 2.5 ? "MOP" : score >= 1 ? "FLOP" : "STOP";

/** --- TIER RATIO WEIGHTS --- **/

// Вес одного релиза в категории. Ratio считается как сумма весов релизов категории / сумма весов всех релизов,
// поэтому он в первую очередь зависит от КОЛИЧЕСТВА релизов, а вес категории лишь слегка смещает его в пользу высшей.
// При равном числе релизов Ratio всегда выше у более высокой категории (TOP > POP > MOP > FLOP > STOP).
const categoryWeights = { TOP: 1.10, POP: 1.05, MOP: 1.00, FLOP: 0.95, STOP: 0.90 };

// Границы оценок (шкала 0–5) для каждой категории
const tierScoreRanges = {
  TOP: [4.5, 5],
  POP: [3.75, 4.5],
  MOP: [2.5, 3.75],
  FLOP: [1, 2.5],
  STOP: [0, 1],
};

// Насколько оценка внутри категории может сдвинуть вес релиза (±QUALITY_SPREAD / 2).
// Должно быть меньше шага между соседними весами в categoryWeights (0.05), чтобы диапазоны категорий не пересекались.
const QUALITY_SPREAD = 0.04;

const getReleaseWeight = (score, label) => {
  const [min, max] = tierScoreRanges[label];
  const position = max > min ? Math.max(0, Math.min(1, (score - min) / (max - min))) : 0.5;
  return categoryWeights[label] + QUALITY_SPREAD * (position - 0.5);
};

/** --- MODALS --- **/

// 1. Форма добавления/редактирования (с крестиком)
const ReleaseFormModal = ({ isOpen, onClose, onSave, initialData, releases = [] }) => {
  const [formData, setFormData] = useState({ title: '', artist: '', coverLink: '' });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  React.useEffect(() => { 
    setError('');
    if (initialData) {
      setFormData({
        title: initialData.title,
        artist: initialData.artist,
        coverLink: initialData.coverLink || ''
      });
    } else {
      setFormData({ title: '', artist: '', coverLink: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, coverLink: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = formData.title.trim();
    const artist = formData.artist.trim();

    if (!title || !artist) { 
      setError('Fill title and artist'); 
      return; 
    }

    // Запрет на добавление релизов с одинаковыми названием и артистом
    const newKey = getReleaseKey(title, artist);
    const originalKey = initialData ? getReleaseKey(initialData.title, initialData.artist) : null;
    const isDuplicate = releases.some(r => {
      const key = getReleaseKey(r.title, r.artist);
      return key === newKey && key !== originalKey;
    });
    if (isDuplicate) {
      setError('Release already exists');
      return;
    }

    const payload = { title, artist, coverLink: formData.coverLink };

    onSave(payload);
    
    setFormData({ title: '', artist: '', coverLink: '' });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-xs rounded-[2rem] border border-white/10 shadow-2xl font-sans overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
            {initialData ? 'Edit Release' : 'New Entry'}
          </span>
          <button 
            onClick={onClose} 
            className="text-white/30 hover:text-white hover:bg-white/5 p-1 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col items-center">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <div 
              onClick={() => fileInputRef.current.click()} 
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden group"
            >
              {formData.coverLink ? (
                <img src={formData.coverLink} className="w-full h-full object-cover" alt="" />
              ) : (
                <Plus size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <input 
              className="meta-input w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white tracking-tight text-[10px] focus:outline-none focus:border-white/20" 
              style={{ fontWeight: 900, wordSpacing: META_INPUT_WORD_SPACING }}
              placeholder="TITLE" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
            <input 
              className="meta-input w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white tracking-tight text-[10px] focus:outline-none focus:border-white/20" 
              style={{ fontWeight: 400, wordSpacing: META_INPUT_WORD_SPACING }}
              placeholder="ARTIST" 
              value={formData.artist} 
              onChange={e => setFormData({...formData, artist: e.target.value})} 
            />
          </div>

          {error && <p className="text-red-500 text-[8px] font-black uppercase text-center">{error}</p>}

          <button 
            type="submit" 
            className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/20 transition-all text-[10px] border border-white/5"
          >
            {initialData ? 'Update' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 2. Меню действий (Оценить/Оценки/Изменить/Удалить)
const ActionMenuModal = ({ isOpen, onClose, onRate, onScores, ratingsCount = 0, onEdit, onDelete }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-[200px] rounded-3xl border border-white/10 shadow-2xl p-2 font-sans">
        <button onClick={onRate} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl transition-all text-white/80 hover:text-white">
          <Star size={18} /> <span className="text-xs font-black uppercase tracking-widest">Rate</span>
        </button>
        <button onClick={onScores} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl transition-all text-white/80 hover:text-white">
          <ListOrdered size={18} /> <span className="text-xs font-black uppercase tracking-widest">Scores</span>
          <span className="ml-auto text-[10px] font-black text-white/30">{ratingsCount}</span>
        </button>
        <button onClick={onEdit} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl transition-all text-white/80 hover:text-white">
          <Edit2 size={18} /> <span className="text-xs font-black uppercase tracking-widest">Edit</span>
        </button>
        <button onClick={onDelete} className="w-full flex items-center gap-3 p-4 hover:bg-red-500/10 rounded-2xl transition-all text-red-500/80 hover:text-red-500">
          <Trash2 size={18} /> <span className="text-xs font-black uppercase tracking-widest">Delete</span>
        </button>
        <button onClick={onClose} className="w-full mt-2 p-3 text-[10px] font-black uppercase text-white/20 hover:text-white transition-all">Cancel</button>
      </div>
    </div>
  );
};

// 3. Подтверждение удаления
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#111] w-full max-w-xs rounded-[2.5rem] border border-red-500/20 shadow-2xl p-8 text-center font-sans">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-2">Delete Release?</h2>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed mb-8">This action cannot be undone. The entry will be permanently removed from the pack.</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-4 bg-red-500 hover:bg-red-600 rounded-2xl font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-red-500/20">Confirm Delete</button>
          <button onClick={onClose} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-white/40 transition-all">Go Back</button>
        </div>
      </div>
    </div>
  );
};

// 4. Добавление оценки (одно поле: оценка в 1000-балльной шкале, допускаются десятые доли)
const RateModal = ({ isOpen, onClose, onSave }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    setValue('');
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const rating = parseRating(value);
    if (rating === null) {
      setError('Invalid score');
      return;
    }
    onSave(rating);
    setValue('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-xs rounded-[2rem] border border-white/10 shadow-2xl font-sans overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Rate Release</span>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white hover:bg-white/5 p-1 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="1000"
              step="0.1"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-black text-[10px] focus:outline-none focus:border-white/20"
              placeholder="SCORE (0-1000)"
              value={value}
              onChange={e => setValue(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] text-white/20 font-black">/1000</span>
          </div>

          {error && <p className="text-red-500 text-[8px] font-black uppercase text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/20 transition-all text-[10px] border border-white/5"
          >
            Add Score
          </button>
        </form>
      </div>
    </div>
  );
};

// 5. Список оценок релиза (строки заблокированы, пока не нажат карандаш; галочка сохраняет, крестик удаляет;
// в режиме редактирования крестик очищает поле). Кнопки расположены внутри поля у его правого края.
const ScoresModal = ({ isOpen, onClose, release, onUpdate, onDelete }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const editInputRef = useRef(null);

  React.useEffect(() => {
    setEditingIndex(null);
    setDraft('');
    setError('');
  }, [isOpen]);

  // При входе в режим редактирования фокус переходит в разблокированное поле
  React.useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingIndex]);

  if (!isOpen || !release) return null;

  const ratings = release.ratings || [];
  const hasScore = release.score !== null && release.score !== undefined;
  const scoreText = hasScore ? (release.score.toFixed(3).endsWith('0') ? release.score.toFixed(2) : release.score.toFixed(3)) : '—';

  const startEdit = (index) => {
    setEditingIndex(index);
    setDraft(ratingToText(ratings[index]));
    setError('');
  };

  const confirmEdit = () => {
    const rating = parseRating(draft);
    if (rating === null) {
      setError('Invalid score');
      return;
    }
    onUpdate(editingIndex, rating);
    setEditingIndex(null);
    setDraft('');
    setError('');
  };

  const handleDeleteRow = (index) => {
    onDelete(index);
    setEditingIndex(null);
    setDraft('');
    setError('');
  };

  // В режиме редактирования крестик очищает поле
  const handleClearDraft = () => {
    setDraft('');
    setError('');
    if (editInputRef.current) editInputRef.current.focus();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-xs rounded-[2rem] border border-white/10 shadow-2xl font-sans overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Scores</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-widest" style={{ color: hasScore ? getDynamicColor(release.score) : '#4B5563' }}>{scoreText}</span>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white hover:bg-white/5 p-1 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {ratings.length === 0 && (
            <p className="text-center text-gray-500/80 font-black uppercase text-[10px] tracking-widest py-4">NO SCORES YET</p>
          )}

          {ratings.map((rating, index) => {
            const isEditingRow = editingIndex === index;
            return (
              <div key={index} className="flex items-center gap-2">
                <span className="w-5 text-[9px] font-black text-white/30 text-right">{index + 1}</span>
                <div className="relative flex-grow">
                  <input
                    ref={isEditingRow ? editInputRef : null}
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    disabled={!isEditingRow}
                    className={`w-full border rounded-xl pl-3 pr-16 py-2 font-black text-[10px] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingRow ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/50 cursor-not-allowed'}`}
                    value={isEditingRow ? draft : ratingToText(rating)}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && isEditingRow) { e.preventDefault(); confirmEdit(); } }}
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {isEditingRow ? (
                      <button
                        onClick={confirmEdit}
                        className="p-1.5 rounded-full text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      >
                        <Check size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(index)}
                        className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    <button
                      onClick={isEditingRow ? handleClearDraft : () => handleDeleteRow(index)}
                      className="p-1.5 rounded-full text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {error && <p className="text-red-500 text-[8px] font-black uppercase text-center pt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
};

/** --- SUB-COMPONENTS --- **/

// Золотой металлик для релизов с максимальной оценкой (1000/1000)
const GOLD_METALLIC = 'linear-gradient(135deg, #8a6414 0%, #f7e08a 18%, #d4af37 36%, #fff6c4 50%, #c9a227 64%, #f1d36b 82%, #8a6414 100%)';
const isPerfectScore = (score) => score !== null && score !== undefined && score >= 5;

// Латинские фрагменты (вместе с внутренними пробелами и знаками препинания) выделяются в отдельные span со шрифтом Space Mono и капителью
const META_LATIN_RUN = /[A-Za-z0-9\u00C0-\u024F]+(?:['’][A-Za-z\u00C0-\u024F]+)*/g;

// Латинские буквы, внешне неотличимые от кириллических (частая причина «неправильной» у/У и подобных букв в кириллических словах).
// Только для отображения: данные релиза не меняются.
const LATIN_TO_CYRILLIC_LOOKALIKES = {
  A: 'А', B: 'В', C: 'С', E: 'Е', H: 'Н', K: 'К', M: 'М', O: 'О', P: 'Р', T: 'Т', X: 'Х', Y: 'У',
  a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', x: 'х', y: 'у',
};
const META_WORD_RE = /[A-Za-z\u0400-\u04FF]+/g;
const META_CYRILLIC_RE = /[\u0400-\u04FF]/;

// Если в слове есть кириллица, латинские двойники внутри него заменяются на кириллические буквы
const normalizeMixedScript = (str) =>
  str.replace(META_WORD_RE, (word) =>
    META_CYRILLIC_RE.test(word)
      ? word.replace(/[A-Za-z]/g, (ch) => LATIN_TO_CYRILLIC_LOOKALIKES[ch] ?? ch)
      : word
  );

const MetaText = ({ text }) => {
  const str = normalizeMixedScript(String(text ?? ''));
  const parts = [];

  // Разбор фрагмента без амперсандов: латиница выделяется в span со шрифтом Space Mono и капителью
  const pushSegment = (segment, offset) => {
    let last = 0;
    for (const m of segment.matchAll(META_LATIN_RUN)) {
      if (m.index > last) parts.push(segment.slice(last, m.index));
      parts.push(
        <span
          key={`l-${offset + m.index}`}
          style={{ fontFamily: META_LATIN_FONT_FAMILY, fontVariantCaps: 'small-caps', fontSynthesis: 'small-caps' }}
        >{m[0]}</span>
      );
      last = m.index + m[0].length;
    }
    if (last < segment.length) parts.push(segment.slice(last));
  };

  // Амперсанд в карточках выделяется в отдельный span с шрифтом, у которого классическое начертание «&»
  let pos = 0;
  str.split('&').forEach((segment, i, arr) => {
    pushSegment(segment, pos);
    pos += segment.length;
    if (i < arr.length - 1) {
      parts.push(
        <span key={`a-${pos}`} style={{ fontFamily: CARD_AMP_FONT_FAMILY, fontVariantCaps: 'normal', fontStyle: 'normal' }}>&amp;</span>
      );
      pos += 1;
    }
  });

  return <>{parts}</>;
};

const ReleaseItem = ({ title, artist, score, coverLink, onClick }) => {
  const hasScore = score !== null && score !== undefined;
  const isPerfect = isPerfectScore(score);
  const color = hasScore ? getDynamicColor(score) : undefined;
  const scoreText = hasScore ? (score.toFixed(3).endsWith('0') ? score.toFixed(2) : score.toFixed(3)) : '';

  return (
    <div
      onClick={onClick}
      className={`relative group w-full aspect-square transition-transform duration-300 hover:scale-105 active:scale-95 text-left font-sans cursor-pointer ${isPerfect ? 'rounded-[1.25rem]' : 'rounded-xl'}`}
      style={isPerfect ? { background: GOLD_METALLIC, padding: '6px', boxShadow: '0 0 22px rgba(247, 224, 138, 0.45)' } : undefined}
    >
      <div className={`relative w-full h-full overflow-hidden bg-white/10 ${isPerfect ? 'rounded-2xl border border-black/50' : 'rounded-xl border border-white/20 shadow-lg'}`}>
        <img src={coverLink || 'https://via.placeholder.com/300?text=NO+IMAGE'} crossOrigin="anonymous" alt="" className="absolute inset-0 w-full h-full object-cover" />
        {isPerfect && (
          <div className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 sm:p-2 flex items-center justify-center">
            <Crown className="size-5 sm:size-6" fill="#f7d774" stroke="#8a6414" strokeWidth={1.5} />
          </div>
        )}
        {hasScore && (
          <div
            className={`absolute top-0 right-0 z-20 text-center border-l border-b ${isPerfect ? 'px-3 py-1.5 rounded-bl-xl border-black/40' : 'bg-black px-2 py-1 rounded-tr-xl rounded-bl-md border-white/10 min-w-[28px]'}`}
            style={isPerfect ? { background: GOLD_METALLIC } : undefined}
          >
            <span
              className={`font-sans font-extrabold tracking-tighter ${isPerfect ? 'text-xs sm:text-sm' : 'text-[9px]'}`}
              style={{ color: isPerfect ? "#bcf0e8": color }}
            >{scoreText}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90" />
        <div className={`absolute bottom-0 left-0 w-full flex flex-col justify-end items-start overflow-hidden font-sans ${isPerfect ? 'p-4' : 'p-2.5'}`}>
          <h3
            className={`text-white tracking-tight leading-tight w-full break-words ${isPerfect ? 'text-2xl sm:text-2xl' : 'text-[10px]'}`}
            style={{ fontFamily: META_FONT_FAMILY, fontWeight: 900, wordSpacing: '0.15em' }}
          >{<MetaText text={title} />}</h3>
          <p
            className={`text-white/80 leading-tight mt-1 w-full break-words ${isPerfect ? 'text-xl sm:text-xl' : 'text-[8px]'}`}
            style={{ fontFamily: META_FONT_FAMILY, fontWeight: 400, wordSpacing: '0.15em' }}
          >{<MetaText text={artist} />}</p>
        </div>
      </div>
    </div>
  );
};

const TierRow = ({ label, icon: Icon, bgColor, rowBgColor, textColorClass, isNop = false, releases, computedColor, tierRatio, onRowClick, onReleaseClick }) => {
  const rowRef = useRef(null);
  const avg = releases.length ? releases.reduce((acc, r) => acc + (r.score ?? 0), 0) / releases.length : 0;
  return (
    <section ref={rowRef} className="w-full mb-8 last:mb-0 pb-8 font-sans">
      <div classNa11me="bg-black p-0.5 rounded-3xl"> 
        <div className={`flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-white/10 shadow-md relative group/row transition-all`} style={{ background: `${rowBgColor}` }}>
          <div className={`flex flex-col items-center justify-center py-6 sm:py-0 sm:w-28 md:w-32 flex-shrink-0 gap-1 ${textColorClass} shadow-xl ${isNop ? '' : 'cursor-pointer hover:brightness-110'}`} 
               onClick={isNop ? undefined : () => exportElement(rowRef, `Tier-${label}`)} style={{ background: `${bgColor}` }}>
            {Icon && <Icon className="size-6 sm:size-7 opacity-90" />}
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-center leading-none">{label}</h2>
          </div>
          <div className="flex flex-wrap justify-center p-4 gap-3 flex-grow min-h-44 cursor-crosshair relative" onClick={(e) => { if (e.target === e.currentTarget || e.target.id === 'empty-slot') onRowClick(); }}>
            {releases.length ? releases.map((rel, idx) => {
              const perfect = isPerfectScore(rel.score);
              const item = <ReleaseItem {...rel} onClick={(e) => { e.stopPropagation(); onReleaseClick(rel); }} />;
              // Релиз с оценкой 1000 занимает всю строку: увеличенная карточка по центру, остальные переносятся на другие строки
              return perfect ? (
                <div key={idx} className="w-full flex justify-center pointer-events-auto py-2">
                  <div className="w-full max-w-[16rem] sm:max-w-[20rem]">{item}</div>
                </div>
              ) : (
                <div key={idx} className="w-[calc(50%-0.75rem)] xs:w-[calc(33.33%-0.75rem)] sm:w-32 md:w-36 pointer-events-auto">
                  {item}
                </div>
              );
            }) : <div id="empty-slot" className="flex items-center justify-center w-full h-36 border-2 border-dashed border-gray-400/40 rounded-xl px-4 text-center text-gray-500/80 font-black uppercase text-xs tracking-widest">NO SUCH RELEASES</div>}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/row:opacity-100 pointer-events-none flex items-center justify-center transition-opacity"><Plus className="text-white/20" size={48} /></div>
          </div>
        </div>
      </div>
      {!isNop && (
        <RankFooter avgScore={avg} isNAState={!releases.length} tierRatio={tierRatio} tierLabel={label} computedColor={computedColor}
                    labelText={<div className="flex flex-col items-start uppercase font-black tracking-widest text-sm leading-tight"><span style={{ color: computedColor }}>{label}</span><span className="text-gray-400">RATIO</span></div>} />
      )}
    </section>
  );
};

const GradientStar = ({ percentage, score, sizeClass = 'size-7', isNA = false, customGradientStops = null, starColor, onStarClick }) => {
  const uniqueId = useId().replace(/:/g, "");
  const fillPercent = Math.max(0, Math.min(100, percentage));
  const activeColor = starColor || (isNA ? '#4B5563' : getDynamicColor(score));
  const { starPath, facets } = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? 90 : 40;
      pts.push({ x: 100 + r * Math.cos(a), y: 100 + r * Math.sin(a) });
    }
    return {
      starPath: `M ${pts[0].x},${pts[0].y} ` + pts.map(p => `L ${p.x},${p.y}`).join(" ") + " Z",
      facets: pts.map((p, i) => `M 100,100 L ${p.x},${p.y} L ${pts[(i + 1) % 10].x},${pts[(i + 1) % 10].y} Z`)
    };
  }, []);
  return (
    <span className={`${sizeClass} inline-flex items-center justify-center relative cursor-pointer`} onClick={onStarClick}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.5))' }}>
        <defs>
          <clipPath id={`clip-${uniqueId}`}><path d={starPath} /></clipPath>
          <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            {customGradientStops ? customGradientStops.map((s, i) => <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />) :
              <><stop offset="0%" stopColor={activeColor} /><stop offset={`${fillPercent}%`} stopColor={activeColor} /><stop offset={`${fillPercent}%`} stopColor="#374151" /><stop offset="100%" stopColor="#374151" /></>}
          </linearGradient>
        </defs>
        <path d={starPath} fill={`url(#grad-${uniqueId})`} />
        <g clipPath={`url(#clip-${uniqueId})`}>
          {facets.map((d, i) => <path key={i} d={d} fill={i % 2 === 0 ? "white" : "black"} fillOpacity={i % 2 === 0 ? 0.07 : 0.12} />)}
        </g>
        <path d={starPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      </svg>
    </span>
  );
};

const RankFooter = ({ avgScore, isNAState, tierRatio, tierLabel, labelText, computedColor }) => {
  const footerStarPercentage = isNAState ? 100 : tierRatio * 100;
  return (
    <div className="flex flex-row items-center justify-center p-4 select-none bg-black rounded-2xl border border-white/10 backdrop-blur-md mt-2 gap-8 text-center font-sans">
      <div className="flex-shrink-0 font-bold">{labelText}</div>
      <div className="flex flex-col items-center gap-1">
        <GradientStar percentage={footerStarPercentage} score={avgScore} sizeClass="size-10 sm:size-12" isNA={false} starColor={computedColor}/>
        {!isNAState && <span className="font-sans text-base sm:text-lg font-black tracking-tighter" style={{ color: computedColor }}>{(tierRatio * 100).toFixed(2)}%</span>}
      </div>
    </div>
  );
};

const ActiveSector = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const RADIAN = Math.PI / 180;
  const nx = cx + 12 * Math.cos(-midAngle * RADIAN), ny = cy + 12 * Math.sin(-midAngle * RADIAN);
  return (
    <g transform={`translate(${nx - cx}, ${ny - cy})`}>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

const invertColor = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const toHex = (v) => (255 - v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getLabelColor = (hex) => {
  const lightness = hexToHsl(hex).l;
  if (lightness < 50) return '#ffffff';
  else if (lightness > 55) return '#111827';
  else return invertColor(hex);
};

const MusicRankingFooter = ({ avgScore, isNAState, pieData, dominantIndex, dominantLabel, dominantColor, tierBase, tierStats }) => {
  const footerRef = useRef(null);

  const finalPieData = useMemo(() => {
    if (isNAState) return [{ name: "EMPTY", value: 1, fill: "#4B5563" }];
    return pieData
      .filter(data => data.value > 0)
      .map(data => ({ ...data, fill: data.color }));
  }, [isNAState, pieData]);

  const activeCount = finalPieData.length;

  const filteredActiveIndex = useMemo(() => {
    if (isNAState || dominantIndex === -1) return -1;
    return finalPieData.findIndex(d => d.name === dominantLabel);
  }, [finalPieData, dominantLabel, isNAState, dominantIndex]);

  const customGradientStops = useMemo(() => {
    if (isNAState || !tierStats || tierStats.length === 0) return null;

    let cumulativeOffset = 0;
    const stops = [];
    const orderedTierStats = tierBase.map(baseTier => tierStats.find(stat => stat.label === baseTier.label))
                                    .filter(stat => stat !== undefined);

    orderedTierStats.forEach((stat, index) => {
      if (stat.ratio > 0) {
        const color = stat.computedColor;
        const offset = cumulativeOffset * 100;
        stops.push({ offset: Math.max(0, offset).toFixed(2), color: color });
        if (index < orderedTierStats.length - 1) {
          cumulativeOffset += stat.ratio;
        }
      }
    });

    if (cumulativeOffset < 1 && stops.length > 0) {
        stops.push({ offset: "100.00", color: stops[stops.length - 1].color });
    }

    if (stops.length > 0 && parseFloat(stops[0].offset) > 0) {
        stops.unshift({ offset: "0.00", color: stops[0].color });
    }

    return stops;
  }, [isNAState, tierStats, tierBase]);

  const textGradientStyle = useMemo(() => {
    if (!customGradientStops) return 'none';
    const stops = customGradientStops.map(s => `${s.color} ${s.offset}%`).join(', ');
    return `linear-gradient(to right, ${stops})`;
  }, [customGradientStops]);

  const reverseRankLabelGradient = useMemo(() => {
    if (!customGradientStops) return 'none';
    const reversedColors = [...customGradientStops].reverse();
    const stops = reversedColors.map((s, idx) => {
      const offset = (idx / (reversedColors.length - 1)) * 100;
      return `${s.color} ${offset}%`;
    }).join(', ');
    return `linear-gradient(to right, ${stops})`;
  }, [customGradientStops]);

  const renderCustomizedLabel = (props) => {
    const { cx, cy, innerRadius, outerRadius, percent, name, startAngle, endAngle, fill } = props;
    const labelColor = getLabelColor(fill);
    const RADIAN = Math.PI / 180;
    if (isNAState || (activeCount === 1 && !isNAState)) return null;
    const midAngle = (startAngle + endAngle) / 2;
    const tierRatio = percent * 100;
    const radius = (innerRadius + outerRadius) / 2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (tierRatio < 5) return null;
    const baseFontSize = activeCount > 3 ? 9 : 11;
    const isOneLine = tierRatio <= 10;
    const rotationAngle = isOneLine ? -midAngle : 0;
    return (
      <g transform={`translate(${x}, ${y})`}>
        <text
          x={0} y={0} fill={labelColor} textAnchor="middle" dominantBaseline="central"
          transform={`rotate(${rotationAngle})`}
          className="font-sans font-black uppercase tracking-tighter pointer-events-none"
          style={{ fontSize: `${baseFontSize}px` }}
        >
          {isOneLine ? (
            <tspan x={0} dy="0.3em" style={{ fill: labelColor, opacity: 0.9 }}>{`${name} ${tierRatio.toFixed(1)}%`}</tspan>
          ) : (<>
              <tspan x={0} dy="-0.6em" className="fill-white/90" style={{ fill: labelColor, opacity: 0.9 }}
>{name}</tspan>
              <tspan x={0} dy="1.2em" style={{ fontSize: `${baseFontSize - 1}px`, fontWeight: 700,  fill: labelColor, opacity: 0.9 }}
>{`${tierRatio.toFixed(1)}%`}</tspan>
            </>
          )}
        </text>
      </g>
    );
  };

  const captions = {
    'TOP': 'EXCESSIVE REPLAY SYNDROME',
    'POP': 'CERTIFIED FRESH',
    'MOP': 'NGNT | (NOT GREAT, NOT TERRIBLE)',
    'FLOP': 'SKIP-FRIENDLY',
    'STOP': 'COMPLETELY ARGGH'
  };

  const currentCaption = isNAState ? 'READY FOR RUSH…' : captions[dominantLabel];
  const captionLines = currentCaption.split(' | ');

  return (
    <footer ref={footerRef} className="mt-12 w-full flex flex-col items-center justify-center select-none overflow-hidden mb-12 font-sans bg-black">
      <div className="w-full bg-white/5 border-t border-x border-white/10 px-4 sm:px-10 flex flex-col items-center min-h-[620px]" style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}>
        <div className="w-full flex flex-col items-center pt-8">
          <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={finalPieData} innerRadius={0} outerRadius="80%" dataKey="value" label={renderCustomizedLabel} labelLine={false} stroke="none" activeIndex={filteredActiveIndex} activeShape={ActiveSector}>
                  {finalPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {!isNAState && activeCount === 1 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center">
                <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none" style={{ color: finalPieData[0].fill }}>{finalPieData[0].name}</h2>
                <span className="text-xl sm:text-2xl font-black text-white/80 tracking-widest mt-1">100%</span>
              </div>
            )}
          </div>
          <div className="mt-12 mb-10 w-full flex flex-row items-center gap-4 justify-center px-4 pl-0 sm:pl-12">
            <div className="flex flex-col items-end sm:items-start leading-tight text-right sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 whitespace-nowrap">MAIN VIBE</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 whitespace-nowrap">OF THE WEEK:</span>
            </div>
            <div className="flex flex-col items-start leading-[0.85]">
              {captionLines.map((line, idx) => {
                const isSubtext = line.includes('(');
                return <span key={idx} className={`font-black uppercase -tracking-widest ${isSubtext ? '' : 'text-3xl sm:text-3xl'}`} style={{ color: dominantColor, fontSize: isSubtext ? '0.75rem' : undefined, lineHeight: isSubtext ? '1.2' : undefined, marginTop: isSubtext ? '0.25rem' : undefined }}>{line}</span>
              })}
            </div>
          </div>
        </div>
        <div className="pb-16 flex flex-col items-center w-full">
          <span className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-4" style={{ color: isNAState ? '#4B5563' : 'rgb(55, 65, 81)' }}>Week Rank</span>
          <div className="flex flex-row items-center gap-6 sm:gap-12">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <GradientStar percentage={100} score={avgScore} sizeClass="size-15 sm:size-15" isNA={isNAState} customGradientStops={customGradientStops} starColor={isNAState ? '#647280' : dominantColor} onStarClick={() => exportElement(footerRef, 'Main-Rank')} />
              </div>
              {!isNAState && <span className="text-2xl sm:text-4xl font-black tracking-tighter leading-none" style={{ backgroundImage: textGradientStyle, color: customGradientStops ? 'transparent' : dominantColor, WebkitBackgroundClip: customGradientStops ? 'text' : 'border-box', backgroundClip: customGradientStops ? 'text' : 'border-box' }}>{avgScore.toFixed(3).endsWith('0') ? avgScore.toFixed(2) : avgScore.toFixed(3)}</span>}
            </div>
            <span className="text-5xl sm:text-9xl font-black uppercase tracking-tighter" style={{ backgroundImage: reverseRankLabelGradient !== 'none' ? reverseRankLabelGradient : 'none', WebkitBackgroundClip: reverseRankLabelGradient !== 'none' ? 'text' : 'border-box', backgroundClip: reverseRankLabelGradient !== 'none' ? 'text' : 'border-box', color: isNAState ? '#4B5563' : (reverseRankLabelGradient !== 'none' ? 'transparent' : dominantColor) }}>{getRankLabel(avgScore, isNAState)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Header = ({ weekNumber, dateRangeText }) => {
  const ref = useRef(null);
  return (
    <header ref={ref} className="flex flex-col items-center mb-10 text-center select-none pb-4 font-sans relative">
      <div className="absolute inset-0 z-50 opacity-0 cursor-pointer" onClick={() => exportElement(ref, 'Header')} />
      <h1 className="font-black tracking-tighter uppercase bg-clip-text text-transparent leading-[1.2] px-8" style={{ backgroundImage: 'linear-gradient(to right, #059669, #7d9a3a, #f59e0b, #ea580c, #b91c1c)', whiteSpace: 'nowrap', WebkitBackgroundClip: 'text', backgroundClip: 'text', fontSize: 'clamp(1.5rem, 8.5vw, 5rem)' }}>FRESH PACK O'FLOW</h1>
      <p className="text-lg sm:text-2xl font-bold mt-2 text-gray-400">{dateRangeText}</p>
      <p className="text-sm sm:text-base font-extrabold tracking-widest text-gray-600 mt-1 uppercase">WEEK {weekNumber}</p>
    </header>
  );
};

/** --- MAIN APP --- **/

// Временная категория для релизов без оценки (без иконки, не участвует в статистике и скачивании)
const NOP_TIER = { label: "NOP", icon: null, bgColor: "#585855", rowBgColor: "#b0afac", textColorClass: "text-white", isNop: true };

const FreshPackOFlow = () => {
  useAppFont();
  const initialSession = useMemo(() => getInitialSessionState(), []);
  const importInputRef = useRef(null);

  const [releases, setReleases] = useState(initialSession.releases);
  const [weekNumber, setWeekNumber] = useState(initialSession.weekNumber);
  const [weekYear, setWeekYear] = useState(initialSession.weekYear);
  
  // States for Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [isScoresOpen, setIsScoresOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Актуальная версия выбранного релиза (после изменения списка оценок selectedRelease устаревает)
  const currentRelease = useMemo(() => {
    if (!selectedRelease) return null;
    return releases.find(r => r.title === selectedRelease.title && r.artist === selectedRelease.artist) || selectedRelease;
  }, [releases, selectedRelease]);

  const weekInfo = useMemo(() => {
    const { startDate, endDate } = getDatesFromWeekNumber(weekNumber, weekYear);
    return {
      weekNumber,
      dateRangeText: formatWeekDateRange(startDate, endDate),
    };
  }, [weekNumber, weekYear]);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          weekNumber,
          weekYear,
          releases,
        })
      );
    } catch (err) {
      console.error('Failed to save session data', err);
    }
  }, [weekNumber, weekYear, releases]);

  const tierBase = useMemo(() => [
    { label: "TOP", icon: Star, bgColor: "#059669", rowBgColor: "#4df9c3", textColorClass: "text-white" },
    { label: "POP", icon: TrendingUp, bgColor: "#7d9a3a", rowBgColor: "#ecffbd", textColorClass: "text-white" },
    { label: "MOP", icon: Minus, bgColor: "#f59e0b", rowBgColor: "#ffe089", textColorClass: "text-white" },
    { label: "FLOP", icon: TrendingDown, bgColor: "#ea580c", rowBgColor: "#f9b18b", textColorClass: "text-white" },
    { label: "STOP", icon: XCircle, bgColor: "#ef4444", rowBgColor: "#fc8585", textColorClass: "text-white" }
  ], []);

  const metrics = useMemo(() => {
    const grouped = { TOP: [], POP: [], MOP: [], FLOP: [], STOP: [], NOP: [] };
    const scored = releases.filter(r => r.score !== null);
    releases.forEach(r => grouped[r.score === null ? 'NOP' : getRankLabel(r.score, false)].push(r));

    const totalW = scored.reduce(
      (acc, r) => acc + getReleaseWeight(r.score, getRankLabel(r.score, false)),
      0
    );

    const tierStats = tierBase.map(t => {
      const rels = grouped[t.label];
      const count = rels.length;
      const wNum = rels.reduce(
        (acc, r) => acc + getReleaseWeight(r.score, t.label),
        0
      );

      return {
        label: t.label,
        ratio: totalW > 0 ? wNum / totalW : 0,
        val: wNum,
        computedColor: getTierFooterColor(t.rowBgColor, t.bgColor, count, scored.length),
      };
    });

    return {
      grouped,
      colors: tierStats.reduce((a, s) => ({ ...a, [s.label]: s.computedColor }), {}),
      ratios: tierStats.reduce((a, s) => ({ ...a, [s.label]: s.ratio }), {}),
      pie: tierStats.map(s => ({ name: s.label, value: s.val, color: s.computedColor })),
      dominant: tierStats.reduce((p, c) => (c.val > p.val ? c : p), { val: -1 }),
      avg: scored.length ? scored.reduce((a, b) => a + b.score, 0) / scored.length : 0,
      scoredCount: scored.length,
      tierStats
    };
  }, [releases, tierBase]);

  const handleSave = (data) => {
    if (isEditing) {
      // При редактировании названия/артиста/обложки список оценок сохраняется
      setReleases(prev =>
        prev
          .map(r => (
            r.title === selectedRelease.title && r.artist === selectedRelease.artist
              ? { ...data, ratings: r.ratings || [], score: r.score ?? null }
              : r
          ))
          .sort(compareReleases)
      );
    } else {
      // Новый релиз создаётся без оценок (категория NOP), оценки добавляются через пункт меню Rate
      setReleases(prev => [...prev, { ...data, ratings: [], score: null }].sort(compareReleases));
    }

    setIsEditing(false);
    setSelectedRelease(null);
  };

  const handleDelete = () => {
    setReleases(prev =>
      prev.filter(r => !(r.title === selectedRelease.title && r.artist === selectedRelease.artist))
    );
    setIsConfirmOpen(false);
    setSelectedRelease(null);
  };

  // Изменение списка оценок выбранного релиза; итоговая оценка пересчитывается как среднее
  const updateSelectedRatings = (updater) => {
    if (!selectedRelease) return;
    setReleases(prev =>
      prev
        .map(r => {
          if (!(r.title === selectedRelease.title && r.artist === selectedRelease.artist)) return r;
          const ratings = updater(r.ratings || []);
          return { ...r, ratings, score: computeScore(ratings) };
        })
        .sort(compareReleases)
    );
  };

  const handleAddRating = (value) => {
    updateSelectedRatings(ratings => [...ratings, value]);
  };

  const handleUpdateRating = (index, value) => {
    updateSelectedRatings(ratings => ratings.map((v, i) => (i === index ? value : v)));
  };

  const handleDeleteRating = (index) => {
    updateSelectedRatings(ratings => ratings.filter((_, i) => i !== index));
  };

  const handleExportJson = () => {
    const payload = {
      version: 1,
      weekNumber,
      weekYear,
      releases,
    };

    downloadJsonFile(
      payload,
      `fresh-pack-week-${weekYear}-${String(weekNumber).padStart(2, '0')}`
    );
  };

  const handleImportJson = (e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);

        const nextWeekNumber = Number(parsed.weekNumber);
        const nextWeekYear = Number(parsed.weekYear);

        if (!isValidWeekNumber(nextWeekNumber)) {
          throw new Error('Invalid week number');
        }

        if (!isValidWeekYear(nextWeekYear)) {
          throw new Error('Invalid week year');
        }

        const nextReleases = sanitizeReleases(parsed.releases);

        setReleases(nextReleases);
        setWeekNumber(nextWeekNumber);
        setWeekYear(nextWeekYear);

        setIsFormOpen(false);
        setIsMenuOpen(false);
        setIsConfirmOpen(false);
        setIsRateOpen(false);
        setIsScoresOpen(false);
        setSelectedRelease(null);
        setIsEditing(false);
      } catch (err) {
        console.error('Import failed', err);
        alert('Invalid JSON file');
      } finally {
        input.value = '';
      }
    };

    reader.onerror = () => {
      alert('Could not read file');
      input.value = '';
    };

    reader.readAsText(file);
  };

  const handleResetAll = () => {
    const shouldReset = window.confirm(
      'Clear all releases and return week to current?'
    );

    if (!shouldReset) return;

    const currentWeek = getCurrentWeekInfo();

    setReleases([]);
    setWeekNumber(currentWeek.weekNumber);
    setWeekYear(currentWeek.weekYear);

    setIsFormOpen(false);
    setIsMenuOpen(false);
    setIsConfirmOpen(false);
    setIsRateOpen(false);
    setIsScoresOpen(false);
    setSelectedRelease(null);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans">
      <style>{FONT_CSS}</style>
      <div className="max-w-5xl mx-auto">
        <Header {...weekInfo} />

        {/* CONTROLS BAR */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            onClick={handleExportJson}
            className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Export JSON
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Import JSON
          </button>

          <button
            onClick={handleResetAll}
            className="px-5 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Reset
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportJson}
          />
        </div>

        <main className="space-y-4">
          {(metrics.grouped.NOP.length ? [...tierBase, NOP_TIER] : tierBase).map(t => (
            <TierRow
              key={t.label}
              {...t}
              releases={metrics.grouped[t.label]}
              tierRatio={metrics.ratios[t.label]}
              computedColor={metrics.colors[t.label]}
              onRowClick={() => {
                setIsEditing(false);
                setSelectedRelease(null);
                setIsFormOpen(true);
              }}
              onReleaseClick={(rel) => {
                setSelectedRelease(rel);
                setIsMenuOpen(true);
              }}
            />
          ))}
        </main>

        <MusicRankingFooter
          avgScore={metrics.avg}
          isNAState={!metrics.scoredCount}
          pieData={metrics.pie}
          dominantLabel={metrics.dominant.label}
          dominantColor={!metrics.scoredCount ? '#647280' : metrics.colors[metrics.dominant.label]}
          tierBase={tierBase}
          tierStats={metrics.tierStats}
        />
      </div>

      {/* MODALS FLOW */}
      <ActionMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        ratingsCount={currentRelease?.ratings?.length ?? 0}
        onRate={() => {
          setIsMenuOpen(false);
          setIsRateOpen(true);
        }}
        onScores={() => {
          setIsMenuOpen(false);
          setIsScoresOpen(true);
        }}
        onEdit={() => {
          setIsMenuOpen(false);
          setIsEditing(true);
          setIsFormOpen(true);
        }}
        onDelete={() => {
          setIsMenuOpen(false);
          setIsConfirmOpen(true);
        }}
      />

      <ReleaseFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditing(false);
          setSelectedRelease(null);
        }}
        onSave={handleSave}
        initialData={isEditing ? selectedRelease : null}
        releases={releases}
      />

      <RateModal
        isOpen={isRateOpen}
        onClose={() => {
          setIsRateOpen(false);
          setSelectedRelease(null);
        }}
        onSave={handleAddRating}
      />

      <ScoresModal
        isOpen={isScoresOpen}
        onClose={() => {
          setIsScoresOpen(false);
          setSelectedRelease(null);
        }}
        release={currentRelease}
        onUpdate={handleUpdateRating}
        onDelete={handleDeleteRating}
      />

      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default FreshPackOFlow;
