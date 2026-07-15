import React, { useMemo, useId, useRef, useState } from 'react';
import { Star, TrendingUp, Minus, TrendingDown, XCircle, Plus, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { toPng } from 'html-to-image';

/** --- UTILS --- **/

const exportElement = async (ref, fileName) => {
  if (!ref.current) return;
  try {
    const dataUrl = await toPng(ref.current, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: '#000000',
      cacheBust: true,
      skipFonts: false,
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
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startMonth} ${startDate.getDate()} – ${endDate.getDate()}, ${year}`;
  }
  return `${startMonth} ${startDate.getDate()} – ${endMonth} ${endDate.getDate()}, ${year}`;
};

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
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
  if (h >= 0 && h < 60) [r1, g1, b1] = [c, x, 0];
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
  const saturation = rowHsl.s + (headerHsl.s - rowHsl.s) * factor;
  const lightness = rowHsl.l + (headerHsl.l - rowHsl.l) * factor;
  return hslToHex(headerHsl.h, saturation, lightness);
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

const getRankLabel = (score, isNA) => isNA ? "N/A" : score >= 4.25 ? "TOP" : score >= 3.75 ? "POP" : score >= 2.5 ? "MOP" : score >= 1 ? "FLOP" : "STOP";

/** --- MODAL COMPONENT --- **/

const AddReleaseModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({ title: '', artist: '', score: '', coverLink: '' });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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
    const s = parseFloat(formData.score);
    if (!formData.title || !formData.artist || isNaN(s)) {
      setError('Please fill all fields');
      return;
    }
    onAdd({ ...formData, score: Math.max(0, Math.min(5, s)) });
    setFormData({ title: '', artist: '', score: '', coverLink: '' });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#111] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-gradient-to-r from-gray-900 to-black">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">New Submission</h2>
          <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* File Picker Area */}
          <div className="flex flex-col items-center">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <div 
              onClick={() => fileInputRef.current.click()} 
              className="w-full aspect-square rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:bg-white/10 transition-all"
            >
              {formData.coverLink ? (
                <img src={formData.coverLink} className="w-full h-full object-cover" alt="" />
              ) : (
                <>
                  <Plus size={40} className="text-gray-700 group-hover:text-gray-500 mb-2 transition-colors" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Artwork</span>
                </>
              )}
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1 ml-1">Release Title</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white uppercase font-black text-sm focus:outline-none focus:border-white/30 tracking-tight" placeholder="DARK TIMES" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1 ml-1">Artist Name</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white uppercase font-black text-sm focus:outline-none focus:border-white/30 tracking-tight" placeholder="THE WEEKND" value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1 ml-1">Rating Score (0.00 - 5.00)</label>
              <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-black text-sm focus:outline-none focus:border-white/30" placeholder="4.77" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} />
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest">{error}</p>}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full py-5 rounded-3xl font-black uppercase tracking-[0.25em] text-white bg-white/10 hover:bg-white/20 transition-all shadow-xl active:scale-95 border border-white/5"
          >
            Confirm Entry
          </button>
        </form>
      </div>
    </div>
  );
};

/** --- REST OF COMPONENTS --- **/

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

const RankFooter = ({ avgScore, isNAState, tierRatio, tierLabel, labelText, computedColor, onRankClick }) => {
  const footerStarPercentage = isNAState ? 100 : tierRatio * 100;
  return (
    <div className="flex flex-row items-center justify-center p-4 select-none bg-black rounded-2xl border border-white/10 backdrop-blur-md mt-2 gap-8 text-center font-sans">
      <div className="flex-shrink-0 font-bold">{labelText}</div>
      <div className="flex flex-col items-center gap-1">
        <GradientStar percentage={footerStarPercentage} score={avgScore} sizeClass="size-10 sm:size-12" isNA={false} starColor={computedColor} onStarClick={onRankClick} />
        {!isNAState && <span className="font-sans text-base sm:text-lg font-black tracking-tighter" style={{ color: computedColor }}>{(tierRatio * 100).toFixed(2)}%</span>}
      </div>
    </div>
  );
};

const ReleaseItem = ({ title, artist, score, coverLink }) => {
  const color = getDynamicColor(score);
  return (
    <div className="relative group w-full aspect-square rounded-xl overflow-hidden bg-white/10 border border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 text-left font-sans">
      <img src={coverLink || 'https://via.placeholder.com/300?text=NO+IMAGE'} crossOrigin="anonymous" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute top-0 right-0 bg-black px-2 py-1 rounded-tr-xl rounded-bl-md shadow-xl z-20 border-l border-b border-white/10 min-w-[28px] text-center">
        <span className="font-sans text-[9px] sm:text-[10px] font-extrabold tracking-tighter" style={{ color }}>{score.toFixed(2)}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90" />
      <div className="absolute bottom-0 left-0 w-full p-2.5 flex flex-col justify-end items-start overflow-hidden font-sans">
        <h3 className="text-white text-[10px] sm:text-[12px] font-extrabold tracking-tight leading-tight w-full break-words uppercase">{title}</h3>
        <p className="text-white/80 text-[8px] sm:text-[10px] font-medium leading-tight mt-1 w-full break-words uppercase">{artist}</p>
      </div>
    </div>
  );
};

const Header = ({ weekNumber, dateRangeText }) => {
  const ref = useRef(null);
  return (
    <header ref={ref} className="flex flex-col items-center mb-10 text-center select-none pb-4 font-sans relative">
      <div className="absolute inset-0 z-50 opacity-0 cursor-pointer" onClick={() => exportElement(ref, 'Header')} />
      <h1 className="font-black tracking-tighter uppercase bg-clip-text text-transparent leading-[1.2] px-8" style={{ 
          backgroundImage: 'linear-gradient(to right, #059669, #7d9a3a, #f59e0b, #ea580c, #b91c1c)', 
          whiteSpace: 'nowrap', WebkitBackgroundClip: 'text', backgroundClip: 'text', fontSize: 'clamp(1.5rem, 8.5vw, 5rem)' 
        }}>FRESH PACK O'FLOW</h1>
      <p className="text-lg sm:text-2xl font-bold mt-2 text-gray-400">{dateRangeText}</p>
      <p className="text-sm sm:text-base font-extrabold tracking-widest text-gray-600 mt-1 uppercase">WEEK {weekNumber}</p>
    </header>
  );
};

const TierRow = ({ label, icon: Icon, bgColor, rowBgColor, textColorClass, releases, computedColor, tierRatio, onRowClick }) => {
  const rowRef = useRef(null);
  const avg = releases.length ? releases.reduce((acc, r) => acc + r.score, 0) / releases.length : 0;

  return (
    <section className="w-full mb-8 last:mb-0 pb-8 font-sans">
      <div className="bg-black p-0.5 rounded-3xl"> 
        <div className={`flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-white/10 shadow-md relative group/row transition-all`} style={{ background: `${rowBgColor}` }}>
          <div className={`flex flex-col items-center justify-center py-6 sm:py-0 sm:w-28 md:w-32 flex-shrink-0 gap-1 ${textColorClass} shadow-xl cursor-pointer hover:brightness-110 transition-all`} 
               onClick={() => exportElement(rowRef, `Tier-${label}`)} style={{ background: `${bgColor}` }}>
            {Icon && <Icon className="size-6 sm:size-7 opacity-90" />}
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-center leading-none">{label}</h2>
          </div>
          <div className="flex flex-wrap justify-center p-4 gap-3 flex-grow min-h-44 cursor-crosshair relative" 
               onClick={(e) => { if (e.target === e.currentTarget || e.target.id === 'empty-slot') onRowClick(); }}>
            {releases.length ? (
              releases.map((rel, idx) => (
                <div key={idx} className="w-[calc(50%-0.75rem)] xs:w-[calc(33.33%-0.75rem)] sm:w-32 md:w-36 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  <ReleaseItem {...rel} />
                </div>
              ))
            ) : (
              <div id="empty-slot" className="flex items-center justify-center w-full h-36 border-2 border-dashed border-gray-400/40 rounded-xl px-4 text-center text-gray-500/80 font-black uppercase text-xs tracking-widest">NO SUCH RELEASES</div>
            )}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/row:opacity-100 pointer-events-none transition-opacity flex items-center justify-center"><Plus className="text-white/20" size={48} /></div>
          </div>
        </div>
      </div>
      <RankFooter avgScore={avg} isNAState={!releases.length} tierRatio={tierRatio} tierLabel={label} computedColor={computedColor} onRankClick={() => exportElement(rowRef, `Footer-${label}`)}
                  labelText={<div className="flex flex-col items-start uppercase font-black tracking-widest text-sm leading-tight"><span style={{ color: computedColor }}>{label}</span><span className="text-gray-400">RATIO</span></div>} />
    </section>
  );
};

const MusicRankingFooter = ({ avgScore, isNAState, pieData, dominantLabel, dominantColor, tierBase, tierStats }) => {
  const footerRef = useRef(null);
  const finalPieData = useMemo(() => isNAState ? [{ name: "EMPTY", value: 1, fill: "#4B5563" }] : pieData.filter(d => d.value > 0).map(d => ({ ...d, fill: d.color })), [isNAState, pieData]);
  const activeCount = finalPieData.length;
  const filteredActiveIndex = useMemo(() => isNAState ? -1 : finalPieData.findIndex(d => d.name === dominantLabel), [finalPieData, dominantLabel, isNAState]);
  const customGradientStops = useMemo(() => {
    if (isNAState || !tierStats.length) return null;
    let cumulative = 0; const stops = [];
    const ordered = tierBase.map(b => tierStats.find(s => s.label === b.label)).filter(Boolean);
    ordered.forEach((s, i) => { if (s.ratio > 0) { stops.push({ offset: (cumulative * 100).toFixed(2), color: s.computedColor }); if (i < ordered.length - 1) cumulative += s.ratio; } });
    if (stops.length) { if (cumulative < 1) stops.push({ offset: "100.00", color: stops[stops.length-1].color }); if (parseFloat(stops[0].offset) > 0) stops.unshift({ offset: "0.00", color: stops[0].color }); }
    return stops;
  }, [isNAState, tierStats, tierBase]);

  const textGradientStyle = useMemo(() => customGradientStops ? `linear-gradient(to right, ${customGradientStops.map(s => `${s.color} ${s.offset}%`).join(', ')})` : 'none', [customGradientStops]);
  const reverseRankLabelGradient = useMemo(() => customGradientStops ? `linear-gradient(to right, ${[...customGradientStops].reverse().map((s, i) => `${s.color} ${(i/(customGradientStops.length-1 || 1))*100}%`).join(', ')})` : 'none', [customGradientStops]);

  const renderCustomizedLabel = (props) => {
    const { cx, cy, innerRadius, outerRadius, percent, name, midAngle } = props;
    const RADIAN = Math.PI / 180;
    if (isNAState || activeCount === 1) return null;
    const radius = (innerRadius + outerRadius) / 2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN), y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <g transform={`translate(${x}, ${y})`}>
        <text x={0} y={0} fill="white" textAnchor="middle" dominantBaseline="central" className="font-sans font-black uppercase tracking-tighter pointer-events-none" style={{ fontSize: activeCount > 3 ? '9px' : '11px' }}>
          <tspan x={0} dy="-0.6em" className="fill-white/90">{name}</tspan>
          <tspan x={0} dy="1.2em" style={{ fontSize: '8px' }} className="fill-white/70">{(percent * 100).toFixed(1)}%</tspan>
        </text>
      </g>
    );
  };

  const captions = { 'TOP': 'EXCESSIVE REPLAY SYNDROME', 'POP': 'CERTIFIED FRESH', 'MOP': 'NGNT | (NOT GREAT, NOT TERRIBLE)', 'FLOP': 'SKIP-FRIENDLY', 'STOP': 'COMPLETELY ARGGH' };
  const captionLines = (captions[dominantLabel] || 'READY FOR RUSH...').split(' | ');

  return (
    <footer ref={footerRef} className="mt-12 w-full flex flex-col items-center justify-center select-none overflow-hidden mb-12 font-sans bg-black">
      <div className="w-full bg-white/5 border-t border-x border-white/10 px-4 sm:px-10 flex flex-col items-center min-h-[620px]" style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}>
        <div className="w-full pt-8 flex flex-col items-center">
          <div className="w-64 h-64 sm:w-96 sm:h-96 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={finalPieData} innerRadius={0} outerRadius="80%" dataKey="value" label={renderCustomizedLabel} labelLine={false} stroke="none" activeIndex={filteredActiveIndex} activeShape={ActiveSector}>{finalPieData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}</Pie></PieChart>
            </ResponsiveContainer>
            {!isNAState && activeCount === 1 && <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"><h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter" style={{ color: finalPieData[0].fill }}>{finalPieData[0].name}</h2><span className="text-xl text-white/80 font-black">100%</span></div>}
          </div>
          <div className="mt-12 mb-10 w-full flex row items-center gap-4 justify-center">
            <div className="flex flex-col items-end leading-tight text-gray-500 font-black text-[10px] tracking-widest uppercase"><span>MAIN VIBE</span><span>OF THE WEEK:</span></div>
            <div className="flex flex-col items-start leading-[0.85]">{captionLines.map((l, i) => <span key={i} className="font-black uppercase -tracking-widest text-3xl" style={{ color: dominantColor, fontSize: l.includes('(') ? '0.75rem' : undefined }}>{l}</span>)}</div>
          </div>
        </div>
        <div className="pb-16 flex flex-col items-center w-full">
          <span className="text-xl font-black uppercase text-gray-700 tracking-widest mb-4">Week Rank</span>
          <div className="flex flex-row items-center gap-6 sm:gap-12">
            <div className="flex flex-col items-center gap-2">
              <GradientStar percentage={100} score={avgScore} sizeClass="size-20 sm:size-32" isNA={isNAState} customGradientStops={customGradientStops} starColor={dominantColor} onStarClick={() => exportElement(footerRef, 'Main-Rank')} />
              {!isNAState && <span className="text-2xl sm:text-4xl font-black tracking-tighter" style={{ backgroundImage: textGradientStyle, color: customGradientStops ? 'transparent' : dominantColor, WebkitBackgroundClip: customGradientStops ? 'text' : 'border-box', backgroundClip: 'text' }}>{avgScore.toFixed(2)}</span>}
            </div>
            <span className="text-5xl sm:text-9xl font-black uppercase tracking-tighter" style={{ backgroundImage: reverseRankLabelGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: isNAState ? '#4B5563' : 'transparent' }}>{getRankLabel(avgScore, isNAState)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

/** --- MAIN APP --- **/

const FreshPackOFlow = () => {
  const weekInfo = useMemo(() => { const { startDate, endDate } = getWeekDates(new Date()); return { weekNumber: getWeekNumber(startDate), dateRangeText: formatWeekDateRange(startDate, endDate) }; }, []);
  const [releases, setReleases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const tierBase = useMemo(() => [
    { label: "TOP", icon: Star, bgColor: "#059669", rowBgColor: "#4bf9c2", textColorClass: "text-white" },
    { label: "POP", icon: TrendingUp, bgColor: "#7d9a3a", rowBgColor: "#d5fe70", textColorClass: "text-white" },
    { label: "MOP", icon: Minus, bgColor: "#f59e0b", rowBgColor: "#ffe089", textColorClass: "text-white" },
    { label: "FLOP", icon: TrendingDown, bgColor: "#ea580c", rowBgColor: "#f9b18b", textColorClass: "text-white" },
    { label: "STOP", icon: XCircle, bgColor: "#ef4444", rowBgColor: "#fc8585", textColorClass: "text-white" }
  ], []);

  const metrics = useMemo(() => {
    const grouped = { TOP: [], POP: [], MOP: [], FLOP: [], STOP: [] };
    releases.forEach(r => grouped[getRankLabel(r.score, false)].push(r));
    const totalW = releases.reduce((acc, r) => acc + (r.score + { TOP: 1, POP: 2, MOP: 3, FLOP: 4, STOP: 5 }[getRankLabel(r.score, false)]), 0);
    const tierStats = tierBase.map(t => {
      const rels = grouped[t.label], count = rels.length;
      const wNum = rels.reduce((acc, r) => acc + (r.score + { TOP: 1, POP: 2, MOP: 3, FLOP: 4, STOP: 5 }[t.label]), 0);
      return { label: t.label, ratio: totalW > 0 ? wNum / totalW : 0, val: wNum, computedColor: getTierFooterColor(t.rowBgColor, t.bgColor, count, releases.length) };
    });
    return {
      grouped, colors: tierStats.reduce((a, s) => ({ ...a, [s.label]: s.computedColor }), {}),
      ratios: tierStats.reduce((a, s) => ({ ...a, [s.label]: s.ratio }), {}),
      pie: tierStats.map(s => ({ name: s.label, value: s.val, color: s.computedColor })),
      dominant: tierStats.reduce((p, c) => (c.val > p.val ? c : p), { val: -1 }),
      avg: releases.length ? releases.reduce((a, b) => a + b.score, 0) / releases.length : 0, tierStats
    };
  }, [releases, tierBase]);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Header {...weekInfo} />
        <main className="space-y-4">
          {tierBase.map(t => (
             <TierRow 
               key={t.label} {...t} 
               releases={metrics.grouped[t.label]} 
               tierRatio={metrics.ratios[t.label]} 
               computedColor={metrics.colors[t.label]} 
               onRowClick={() => setIsModalOpen(true)} 
             />
          ))}
        </main>
        <MusicRankingFooter avgScore={metrics.avg} isNAState={!releases.length} pieData={metrics.pie} dominantLabel={metrics.dominant.label} dominantColor={metrics.colors[metrics.dominant.label]} tierBase={tierBase} tierStats={metrics.tierStats} />
      </div>
      <AddReleaseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={(r) => setReleases(prev => [...prev, r].sort((a,b) => b.score - a.score))} 
      />
    </div>
  );
};

export default FreshPackOFlow;
