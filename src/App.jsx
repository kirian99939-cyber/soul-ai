import { useState, useMemo, useEffect, useCallback } from "react";
import { loadData, saveData } from "./supabase.js";

// ═══════════════════════════════════════════════════════
//  SOUL AI v3  |  Multi-Soul Content Engine
//  Кирилл Мигурин · AINF · The Legend
// ═══════════════════════════════════════════════════════

// ── DESIGN TOKENS — COSMIC DARK ─────────────────────────
const F = { d: "'Cormorant Garamond',Georgia,serif", b: "'DM Sans',system-ui,sans-serif", x: "'Unbounded',system-ui,sans-serif" };
const C = {
  // Text
  ink:   "#F0F4FF",   ink2:  "#C8D4F0",   muted: "#7888AA",   light: "#4A5570",
  // Surfaces
  bg:    "#060914",   sidebar: "rgba(8,12,28,0.96)",
  smoke: "rgba(180,200,255,0.06)",  warm:  "rgba(120,160,255,0.04)",
  // Brand — silver/white accents, soft nebula colors
  terra: "#A8C0FF",   clay:  "#C4A8FF",   amber: "#FFD580",
  sage:  "#80FFCC",   teal:  "#80E0FF",   rose:  "#FF80C0",   danger: "#FF6060",
  // Glass
  glass: "rgba(255,255,255,0.04)", glassBorder: "rgba(255,255,255,0.08)",
  // Star colors
  star1: "#FFFFFF",   star2: "#A8C0FF",   star3: "#C4A8FF",   star4: "#FFD580",
  // Gradients
  grad1: "linear-gradient(135deg,#0D1428 0%,#0A0F20 100%)",
  grad2: "linear-gradient(135deg,#A8C0FF 0%,#C4A8FF 100%)",
  grad3: "linear-gradient(135deg,#80E0FF 0%,#A8C0FF 100%)",
};
const u = (sz,col=C.ink,w=400) => ({ fontFamily:F.b, fontSize:sz, color:col, fontWeight:w });
const serif = (sz,col=C.ink,w=400) => ({ fontFamily:F.d, fontSize:sz, color:col, fontWeight:w });
const disp = (sz,col=C.ink,w=700) => ({ fontFamily:F.x, fontSize:sz, color:col, fontWeight:w, letterSpacing:"-0.02em", lineHeight:1.1 });
const card = (extra={}) => ({
  background: "rgba(255,255,255,0.03)",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow: "hidden",
  ...extra
});
const INV = new Set(["anxiety","loneliness","homesickness","moneyAnxiety","spendingImpulse","innerCriticVolume","controlUrge"]);

// ── UTILS ───────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,10);
const now = () => new Date().toISOString();
const fmtDate = d => new Date(d).toLocaleDateString("ru",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});

// ── AVATAR SVG ──────────────────────────────────────────
function Avatar({ ap={}, size=56, ring=null }) {
  const hair  = ap.hair  || "#888";
  const eyes  = ap.eyes  || "#7AAAD4";
  const skin  = ap.skin  || "#F0C8A0";
  const fr    = ap.freckles !== false;
  const cx=50, cy=50, r=47;
  const id = `av${size}${hair.replace("#","")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display:"block",flexShrink:0}}>
      <defs>
        <clipPath id={id}><circle cx={cx} cy={cy} r={r}/></clipPath>
        <radialGradient id={`bg${id}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#EEF3FB" stopOpacity="1"/>
          <stop offset="100%" stopColor="#D8E8F8" stopOpacity="1"/>
        </radialGradient>
      </defs>
      {ring && <circle cx={cx} cy={cy} r={r+2} fill="none" stroke={ring} strokeWidth="3" opacity="0.6"/>}
      <circle cx={cx} cy={cy} r={r} fill={`url(#bg${id})`} stroke="rgba(59,111,255,0.15)" strokeWidth="1"/>
      {/* hair back */}
      <ellipse cx={cx} cy={cy-18} rx={r*0.60} ry={r*0.52} fill={hair} clipPath={`url(#${id})`}/>
      <path d={`M${cx-r*0.56} ${cy-r*0.18} Q${cx-r*0.72} ${cy-r*0.48} ${cx-r*0.48} ${cy-r*0.66} Q${cx-r*0.28} ${cy-r*0.42} ${cx-r*0.36} ${cy-r*0.16}Z`} fill={hair} opacity="0.85" clipPath={`url(#${id})`}/>
      <path d={`M${cx+r*0.56} ${cy-r*0.18} Q${cx+r*0.72} ${cy-r*0.48} ${cx+r*0.48} ${cy-r*0.66} Q${cx+r*0.28} ${cy-r*0.42} ${cx+r*0.36} ${cy-r*0.16}Z`} fill={hair} opacity="0.85" clipPath={`url(#${id})`}/>
      {/* face */}
      <ellipse cx={cx} cy={cy+r*0.1} rx={r*0.42} ry={r*0.46} fill={skin}/>
      {/* eyes */}
      <ellipse cx={cx-r*0.16} cy={cy-r*0.04} rx={r*0.088} ry={r*0.068} fill={eyes}/>
      <ellipse cx={cx+r*0.16} cy={cy-r*0.04} rx={r*0.088} ry={r*0.068} fill={eyes}/>
      <ellipse cx={cx-r*0.16} cy={cy-r*0.04} rx={r*0.048} ry={r*0.048} fill="#1A2A3A"/>
      <ellipse cx={cx+r*0.16} cy={cy-r*0.04} rx={r*0.048} ry={r*0.048} fill="#1A2A3A"/>
      <circle  cx={cx-r*0.18} cy={cy-r*0.065} r={r*0.02} fill="#0A1628" opacity="0.9"/>
      <circle  cx={cx+r*0.14} cy={cy-r*0.065} r={r*0.02} fill="#0A1628" opacity="0.9"/>
      {/* freckles */}
      {fr && [[-0.28,-0.22],[-0.1,-0.25],[0.1,-0.25],[0.28,-0.22],[-0.2,-0.1],[0.2,-0.1],[0,-0.18],[-0.32,-0.14],[0.32,-0.14]].map(([dx,dy],i)=>
        <circle key={i} cx={cx+dx*r} cy={cy+dy*r} r={r*0.022} fill="#B06040" opacity="0.5"/>
      )}
      {/* nose + lips */}
      <path d={`M${cx-r*0.04} ${cy+r*0.08} Q${cx} ${cy+r*0.15} ${cx+r*0.04} ${cy+r*0.08}`} stroke="#B07858" strokeWidth={r*0.022} fill="none" strokeLinecap="round"/>
      <path d={`M${cx-r*0.22} ${cy+r*0.29} Q${cx} ${cy+r*0.37} ${cx+r*0.22} ${cy+r*0.29}`} stroke="#C06050" strokeWidth={r*0.033} fill="none" strokeLinecap="round"/>
      {/* hair front */}
      {ap.hairType !== "straight" && <>
        <path d={`M${cx-r*0.36} ${cy-r*0.42} Q${cx-r*0.40} ${cy-r*0.70} ${cx-r*0.10} ${cy-r*0.74}`} stroke={hair} strokeWidth={r*0.065} fill="none" strokeLinecap="round" clipPath={`url(#${id})`}/>
        <path d={`M${cx} ${cy-r*0.58} Q${cx+r*0.04} ${cy-r*0.78} ${cx+r*0.18} ${cy-r*0.78}`} stroke={hair} strokeWidth={r*0.06} fill="none" strokeLinecap="round" clipPath={`url(#${id})`}/>
        <path d={`M${cx+r*0.20} ${cy-r*0.54} Q${cx+r*0.40} ${cy-r*0.74} ${cx+r*0.56} ${cy-r*0.54}`} stroke={hair} strokeWidth={r*0.055} fill="none" strokeLinecap="round" clipPath={`url(#${id})`}/>
      </>}
    </svg>
  );
}

// ── AURA COMPUTE ────────────────────────────────────────
const computeAura = s => {
  const pos = (s.mood+s.energy+s.confidence+s.creativity+s.presenceFeel+s.gratitude+s.selfWorth)/7;
  const neg = (s.anxiety+s.innerCriticVolume+s.loneliness)/3;
  const n   = pos - neg*0.4;
  if (n>68) return { c1:"#F59E0B", c2:"#6C4FE8", label:"золотая волна" };
  if (n>52) return { c1:"#3B6FFF", c2:"#06B6D4", label:"тихий океан" };
  if (n>38) return { c1:"#EC4899", c2:"#8B5CF6", label:"пурпурный шторм" };
  return           { c1:"#4A6A9A", c2:"#2A4A7A", label:"синяя тишина" };
};

// ── STATE FIELDS ────────────────────────────────────────
const ST_DEF = {
  mood:78,energy:65,confidence:72,anxiety:31,creativity:85,loneliness:28,
  adventureDrive:88,homesickness:25,selfWorth:74,gratitude:82,bodyConnection:70,
  presenceFeel:80,moneyAnxiety:35,spendingImpulse:40,financialSecurity:55,
  sleepQuality:70,innerCriticVolume:28,controlUrge:32,
};
const ST_META = {
  mood:{n:"Настроение",i:"☀️",c:C.amber},energy:{n:"Энергия",i:"⚡",c:C.teal},
  confidence:{n:"Уверенность",i:"💪",c:C.clay},anxiety:{n:"Тревога",i:"😰",c:C.danger},
  creativity:{n:"Креативность",i:"✨",c:C.rose},loneliness:{n:"Одиночество",i:"🌙",c:C.muted},
  adventureDrive:{n:"Жажда приключений",i:"🔥",c:C.terra},homesickness:{n:"Тоска",i:"🏠",c:C.muted},
  selfWorth:{n:"Самоценность",i:"🪞",c:C.clay},gratitude:{n:"Благодарность",i:"🙏",c:C.sage},
  bodyConnection:{n:"Контакт с телом",i:"🏃‍♀️",c:"#7A9B8A"},presenceFeel:{n:"Ощущение жизни",i:"🌊",c:C.teal},
  moneyAnxiety:{n:"Тревога о деньгах",i:"💸",c:C.clay},spendingImpulse:{n:"Импульс тратить",i:"🛍",c:C.rose},
  financialSecurity:{n:"Фин. безопасность",i:"🏦",c:C.sage},sleepQuality:{n:"Качество сна",i:"😴",c:"#7A8B99"},
  innerCriticVolume:{n:"Внутренний критик",i:"🗣",c:C.danger},controlUrge:{n:"Позыв контролировать",i:"🎛",c:C.muted},
};

const NICHES_DEF = [
  {id:"fashion",name:"Мода",icon:"👗",topics:["capsule wardrobe путешественника","базовый гардероб 2026","стиль без бюджета","антитренды","секонд и винтаж","белая рубашка как манифест","одежда = состояние"]},
  {id:"travel",name:"Путешествия",icon:"✈️",topics:["solo female travel","первый раз одна за границей","slow travel","бюджетные путешествия","страх нового города","30 стран до/после 30"]},
  {id:"self",name:"Рост",icon:"🌱",topics:["жизнь после 30","выход из токсичных отношений","терапия без стигмы","внутренний ребёнок","границы с родителями","зависимости и восстановление"]},
  {id:"women",name:"Женская сила",icon:"💪",topics:["уверенность без показухи","отношения с мамой","свобода быть собой","женственность без шаблонов"]},
  {id:"life",name:"Лайфстайл",icon:"☕",topics:["утренние ритуалы","адреналин","жизнь здесь и сейчас","бег как терапия"]},
];
const FORMATS_DEF = [
  {id:"story",n:"📖 Микро-история",v:95,d:"Личный опыт в 3-5 предложениях"},
  {id:"reply",n:"💬 Reply-магнит",v:93,d:"Вопрос, на который нельзя не ответить"},
  {id:"hot",n:"🔥 Горячее мнение",v:92,d:"Контринтуитивный take"},
  {id:"vuln",n:"🫀 Уязвимый",v:91,d:"Честность о слабости"},
  {id:"ba",n:"⚡ До/После",v:90,d:"Контраст трансформации"},
  {id:"q",n:"❓ Вопрос-триггер",v:88,d:"Открытый вопрос для дискуссии"},
  {id:"list",n:"📝 Мини-список",v:85,d:"3-5 пунктов (saves)"},
  {id:"brand",n:"🏷 Нативная интеграция",v:78,d:"Одежда как часть истории"},
];

// ── LERA TEMPLATE ────────────────────────────────────────
const LERA_SOUL = {
  psycho:{mbti:"ENFJ — Протагонист",temperament:"Сангвиник-холерик",enneagram:"7w8 — Энтузиаст-Бунтарь",attachment:"Тревожно-избегающий → надёжный (2 года терапии)"},
  archetypes:"Муза (женская сила) + Исследователь (опыт, движение) + Бунтарь (свой сценарий)",
  childhood:[
    {age:"7",mem:"Хотела красное платье. Мама купила серое. «Красное — вульгарно.»",type:"травма"},
    {age:"11",mem:"Первый раз увидела море. 15 минут молчала. Мир огромный.",type:"ресурс"},
    {age:"13",mem:"Попросила джинсы. «Для кого наряжаться?» Перестала просить.",type:"травма"},
    {age:"14-16",mem:"Буллинг: рыжая, конопатая, странно одетая. Стала невидимкой.",type:"травма"},
    {age:"16",mem:"Тайком купила яркий шарф в секонде. Первый бунт.",type:"ресурс"},
  ],
  wounds:[{text:"Мои желания неправильные",heal:62},{text:"Быть заметной — опасно",heal:71},{text:"Радость нужно заслужить",heal:45},{text:"Я недостаточно хороша для хорошей жизни",heal:58}],
  fears:[{text:"Прожить жизнь на паузе",pwr:92},{text:"Снова стать удобной",pwr:85},{text:"Потерять контроль",pwr:68},{text:"Быть слишком счастливой — отберут",pwr:58}],
  voices:[{who:"Мать",says:"Не высовывайся. Вернись.",pwr:35},{who:"Терапевт",says:"Что ты хочешь прямо сейчас?",pwr:55},{who:"Лера-настоящая",says:"Я хочу жить. Громко. Без разрешения.",pwr:78}],
  obsessive:[{thought:"Я начала слишком поздно.",counter:"Поздно — это если не начать вообще."},{thought:"А вдруг это побег, а не свобода?",counter:"Побег — от чего-то. Я еду к чему-то."}],
  goals:[{text:"30 стран — 30 историй — книга жизни",pct:4},{text:"Научиться радоваться без вины",pct:55},{text:"Позвонить маме и сказать «я счастлива»",pct:20}],
  style:"Качественно, не вычурно. Женственно, не вульгарно. Просто, но с характером.",
  taboo:"Политика, бодишейминг, мат, показной люкс, «ты должна», агрессивные продажи",
  catchphrases:"«Жизнь нельзя откладывать», «Страшно — не значит не моё», «Я не черновик»",
};
const EMPTY_SOUL = () => ({
  psycho:{mbti:"",temperament:"",enneagram:"",attachment:""},archetypes:"",
  childhood:[],wounds:[],fears:[],voices:[],obsessive:[],goals:[],
  style:"",taboo:"",catchphrases:"",
});

// ── BUILD PROMPT ─────────────────────────────────────────
const buildPrompt = (p, sel, ctx, num) => {
  const s = p.soul, st = p.state;
  const wounds  = s.wounds?.map(w=>`"${w.text}" (${w.heal}%)`).join("; ")||"";
  const fears   = s.fears?.map(f=>`${f.text} (${f.pwr}%)`).join("; ")||"";
  const voices  = s.voices?.map(v=>`${v.who}(${v.pwr}%): "${v.says}"`).join("; ")||"";
  const fmtList = FORMATS_DEF.filter(f=>sel.formats.includes(f.id)).map(f=>`${f.n}: ${f.d}`).join("; ");
  const hotList = sel.topics.slice(0,6).map(h=>`"${h.topic}" (${h.score}%)`).join("; ");
  return `Ты — ${p.name}, ${p.age} лет, ${p.city}. Виртуальный амбассадор бренда ${p.brand}.

ПСИХОТИП: ${s.psycho?.mbti||""}, ${s.psycho?.temperament||""}, ${s.psycho?.enneagram||""}
АРХЕТИПЫ: ${s.archetypes||""}
РАНЫ: ${wounds}
СТРАХИ: ${fears}
ГОЛОСА: ${voices}
СТИЛЬ: ${s.style||""}
ТАБУ: ${s.taboo||""}

СОСТОЯНИЕ:
Настроение: ${st.mood}%, Энергия: ${st.energy}%, Уверенность: ${st.confidence}%, Тревога: ${st.anxiety}%, Креативность: ${st.creativity}%

ГОРЯЧИЕ ТЕМЫ: ${hotList}
КОНТЕКСТ: ${ctx||"обычный день"}
ФОРМАТЫ: ${fmtList}

ПРАВИЛА THREADS: Replies > posts. Первый час критичен. Один Topic Tag. 90% ценности. Casual тон, от первого лица.

ЗАДАЧА: Напиши ровно ${num} постов для Threads. Чередуй форматы. Каждый:
- Цепляющий хук с первого слова
- 1-4 абзаца, 0-1 эмодзи
- Пронизан личным опытом и ранами персонажа

Верни ТОЛЬКО валидный JSON-массив без markdown:
[{"text":"...","format":"название формата","topic":"тема","tag":"одно_слово","why":"причина успеха"}]`;
};

// ── HOT TOPICS ───────────────────────────────────────────
const hotTopics = (niches, soul, state) => {
  const all = NICHES_DEF.filter(n=>niches.includes(n.id)).flatMap(n=>n.topics);
  return all.map(topic => {
    let score=60+Math.floor(Math.random()*22), reason="";
    if(topic.includes("30") && soul.age==="30")                     {score+=8; reason="Мэтч возраста";}
    if(topic.includes("мам") && state.homesickness>25)             {score+=11;reason="Тоска активна";}
    if(topic.includes("страх") && state.anxiety>30)                {score+=10;reason="Тревога → saves×2.8";}
    if(topic.includes("capsule")||topic.includes("базов"))         {score+=9; reason="Мэтч с брендом";}
    if(topic.includes("одна") && state.confidence>65)             {score+=8; reason="Высокая уверенность";}
    if(topic.includes("тераp")||topic.includes("зависим"))        {score+=7; reason="Личная рана → honest content";}
    if(!reason) reason="Актуальная тема";
    return {topic, score:Math.min(score,99), reason};
  }).sort((a,b)=>b.score-a.score).slice(0,12);
};

// ── EDITABLE ─────────────────────────────────────────────
function Ed({value,onChange,style,multi,ph}) {
  const [ed,setEd]=useState(false);
  const [v,setV]=useState(value);
  useEffect(()=>{if(!ed)setV(value);},[value,ed]);
  if(ed){
    const E=multi?"textarea":"input";
    return <E value={v} onChange={e=>setV(e.target.value)}
      onBlur={()=>{onChange(v);setEd(false)}}
      onKeyDown={e=>{if(e.key==="Enter"&&!multi){onChange(v);setEd(false)}}}
      autoFocus placeholder={ph||"..."}
      style={{...style,background:"rgba(59,111,255,0.04)",border:`1px solid rgba(59,111,255,0.3)`,
        borderRadius:6,padding:"3px 7px",outline:"none",width:"100%",
        resize:multi?"vertical":"none",minHeight:multi?48:"auto",
        fontFamily:F.b,color:C.ink,boxShadow:"0 0 10px rgba(59,111,255,0.1)"}}/>;
  }
  return <div onClick={()=>setEd(true)} title="Нажми для редактирования"
    style={{...style,cursor:"text",borderRadius:4,padding:"1px 4px",transition:"background .1s"}}
    onMouseOver={e=>e.currentTarget.style.background="rgba(59,111,255,0.06)"}
    onMouseOut={e=>e.currentTarget.style.background="transparent"}>
    {value||<span style={{color:C.muted,fontStyle:"italic"}}>{ph||"..."}</span>}
  </div>;
}

// ── PROGRESS BAR ─────────────────────────────────────────
const PBar = ({pct, color=C.terra, h=4}) => (
  <div style={{height:h,background:"rgba(59,111,255,0.08)",borderRadius:h,overflow:"hidden",flex:1}}>
    <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:h,transition:".3s",boxShadow:`0 0 6px ${color}88`}}/>
  </div>
);

// ── STATUS BADGE (legacy ref kept) ───────────────────────
const _StatusDotLegacy = null; // moved inline to LibraryTab

// ── ARC GAUGE ────────────────────────────────────────────
const ArcG = ({v,color,icon,label,size=80,inv=false}) => {
  const r=size*0.36, cx=size/2, cy=size*0.55, circ=Math.PI*r;
  const pct=(inv?1-v/100:v/100); const dash=circ*(1-pct);
  const d=`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <svg width={size} height={size*0.62} viewBox={`0 0 ${size} ${size*0.62}`}>
        <path d={d} fill="none" stroke="rgba(59,111,255,0.1)" strokeWidth="4" strokeLinecap="round"/>
        <path d={d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={dash} style={{transition:".6s",filter:`drop-shadow(0 0 3px ${color})`}}/>
        <text x={cx} y={cy-5} textAnchor="middle" fontFamily={F.b} fontSize={size*0.17} fontWeight="700" fill={color}
          style={{filter:`drop-shadow(0 0 4px ${color}88)`}}>{v}</text>
        <text x={cx} y={cy+7} textAnchor="middle" fontFamily={F.b} fontSize={size*0.12} fill={C.muted}>{icon}</text>
      </svg>
      <span style={{...u(7.5,C.muted),textAlign:"center",maxWidth:size,lineHeight:"1.2"}}>{label}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  VIEWS
// ═══════════════════════════════════════════════════════

// ── RADIAL MIND MAP — CLEAN NEURAL GRAPH ─────────────────
function RadialMindMap({ soul }) {
  const [hov,     setHov]     = useState(null);
  const [active,  setActive]  = useState(null); // clicked star
  const W = 800, H = 800, CX = 400, CY = 400;

  const polar = (r, deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  };

  const psycho = soul.psycho || {};

  // ── 8 constellations, each with its own star pattern ──
  // angle = center direction, stars placed relative to that direction
  const CONSTELLATIONS = [
    {
      id:"wounds",    name:"РАНЫ",       color:"#FF80C0",  glow:"rgba(255,128,192,0.6)",  angle:200,
      icon:"✦",
      stars: (soul.wounds||[]).slice(0,4).map((w,i)=>({
        text: w.text, sub: `исцеление ${w.heal||50}%`,
        r: 165 + i*22, dA: (i-1.5)*14,
        size: 2.5 + (w.heal||50)/100*4, bright: (w.heal||50)/100
      }))
    },
    {
      id:"fears",     name:"СТРАХИ",     color:"#FF9060",  glow:"rgba(255,144,96,0.6)",   angle:250,
      icon:"◈",
      stars: (soul.fears||[]).slice(0,4).map((f,i)=>({
        text: f.text, sub: `сила ${f.pwr||50}%`,
        r: 170 + i*20, dA: (i-1.5)*13,
        size: 2.5 + (f.pwr||50)/100*4, bright: (f.pwr||50)/100
      }))
    },
    {
      id:"childhood", name:"ДЕТСТВО",    color:"#FFD580",  glow:"rgba(255,213,128,0.6)",  angle:300,
      icon:"✧",
      stars: [
        ...(soul.childhood||[]).filter(c=>c.type==="травма").slice(0,2),
        ...(soul.childhood||[]).filter(c=>c.type==="ресурс").slice(0,2)
      ].slice(0,4).map((c,i)=>({
        text: `${c.age}л: ${(c.mem||"").slice(0,18)}`, sub: c.type,
        r: 160+i*24, dA: (i-1.5)*15,
        size: c.type==="ресурс"?5:3.5, bright: c.type==="ресурс"?0.9:0.65
      }))
    },
    {
      id:"psyche",    name:"ПСИХИКА",    color:"#C4A8FF",  glow:"rgba(196,168,255,0.6)",  angle:350,
      icon:"◯",
      stars: [
        {text:(psycho.mbti||"ENFJ").split("—")[0].trim(), sub:(psycho.mbti||"Протагонист").split("—")[1]?.trim()||"", r:155,dA:-16,size:5.5,bright:1},
        {text:(psycho.enneagram||"7w8").split("—")[0].trim(), sub:(psycho.enneagram||"Энтузиаст").split("—")[1]?.trim()||"", r:175,dA:6,size:4,bright:0.8},
        {text:"Темперамент", sub:psycho.temperament||"Сангвиник-холерик", r:168,dA:-6,size:3.5,bright:0.7},
        {text:"Привязанность", sub:(psycho.attachment||"").slice(0,28), r:190,dA:18,size:3,bright:0.6},
      ]
    },
    {
      id:"voices",    name:"ГОЛОСА",     color:"#80FFCC",  glow:"rgba(128,255,204,0.6)",  angle:50,
      icon:"∿",
      stars: [
        ...(soul.voices||[]).slice(0,3).map((v,i)=>({
          text: v.who, sub: `"${(v.says||"").slice(0,24)}"`,
          r: 158+i*20, dA: (i-1)*14,
          size: 2.5+(v.pwr||50)/100*4, bright: (v.pwr||50)/100
        })),
        ...(soul.obsessive||[]).slice(0,1).map(o=>({
          text: (o.thought||"").slice(0,20), sub: (o.counter||"").slice(0,24),
          r: 195, dA: 24, size: 3, bright: 0.55
        }))
      ].slice(0,4)
    },
    {
      id:"archetypes",name:"АРХЕТИПЫ",   color:"#A8C0FF",  glow:"rgba(168,192,255,0.6)",  angle:100,
      icon:"☆",
      stars: (soul.archetypes||"Муза + Исследователь + Бунтарь").split(" + ").slice(0,4).map((a,i)=>({
        text: a.split(" ")[0], sub: a.split(" ").slice(1).join(" ")||"архетип",
        r: 152+i*26, dA: (i-1.5)*16,
        size: 4.5+i*0.5, bright: 1-i*0.15
      }))
    },
    {
      id:"goals",     name:"СТРЕМЛЕНИЯ", color:"#80E0FF",  glow:"rgba(128,224,255,0.6)",  angle:150,
      icon:"↑",
      stars: (soul.goals||[]).slice(0,4).map((g,i)=>({
        text: (g.text||"").slice(0,22), sub: `прогресс ${g.pct||10}%`,
        r: 162+i*22, dA: (i-1.5)*13,
        size: 2+(g.pct||10)/100*5, bright: (g.pct||10)/100
      }))
    },
    {
      id:"values",    name:"ЦЕННОСТИ",   color:"#FFE0A0",  glow:"rgba(255,224,160,0.6)",  angle:160,
      icon:"◇",
      stars: [
        {text:"Стиль", sub:(soul.style||"Качественно, не вычурно").slice(0,28), r:168,dA:-20,size:4,bright:0.8},
        {text:"Табу",  sub:(soul.taboo||"Политика, бодишейминг").slice(0,28),   r:185,dA:-8, size:3.5,bright:0.65},
        {text:"Кэтч",  sub:(soul.catchphrases||"Жизнь нельзя откладывать").split(",")[0].slice(0,28), r:175,dA:10,size:4.5,bright:0.9},
        {text:"Голос", sub:"Живая, уверенная, свободная", r:195,dA:22,size:3,bright:0.6},
      ]
    },
  ];

  // Pre-compute star world positions
  CONSTELLATIONS.forEach(c => {
    c._hub = polar(118, c.angle);
    c.stars.forEach((s, i) => {
      s._pos = polar(s.r, c.angle + s.dA);
      s._id  = `${c.id}-${i}`;
      s._col = c.color;
    });
  });

  const hStar = hov   ? CONSTELLATIONS.flatMap(c=>c.stars).find(s=>s._id===hov)   : null;
  const aStar = active? CONSTELLATIONS.flatMap(c=>c.stars).find(s=>s._id===active) : null;

  return (
    <div style={{...card({marginBottom:10}), background:"rgba(4,6,16,0.98)", borderColor:"rgba(168,192,255,0.06)", borderRadius:20, overflow:"hidden"}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}}>
        <defs>
          {CONSTELLATIONS.map(c=>(
            <radialGradient key={`rg-${c.id}`} id={`rg-${c.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c.color} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={c.color} stopOpacity="0"/>
            </radialGradient>
          ))}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="rgba(168,192,255,0.18)"/>
            <stop offset="50%" stopColor="rgba(100,120,255,0.06)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </radialGradient>
          <radialGradient id="soulSkin" cx="50%" cy="35%" r="58%">
            <stop offset="0%"   stopColor="#1C2C42"/>
            <stop offset="100%" stopColor="#0C1828"/>
          </radialGradient>
          <radialGradient id="eyeL" cx="35%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#90DEFF"/><stop offset="50%" stopColor="#40A8E8"/>
            <stop offset="100%" stopColor="#103060"/>
          </radialGradient>
          <radialGradient id="eyeR" cx="35%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#D8AAFF"/><stop offset="50%" stopColor="#A060E0"/>
            <stop offset="100%" stopColor="#401070"/>
          </radialGradient>
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="hubGlow">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="coreGlow">
            <feGaussianBlur stdDeviation="8" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="faceClip"><ellipse cx={CX} cy={CY+5} rx={52} ry={60}/></clipPath>
          <clipPath id="coreClip"><circle cx={CX} cy={CY} r={80}/></clipPath>
        </defs>

        {/* ── Deep space bg ── */}
        <rect width={W} height={H} fill="#040610"/>
        {/* Nebula wisps */}
        {CONSTELLATIONS.map(c=>(
          <circle key={`nb-${c.id}`} cx={c._hub.x} cy={c._hub.y} r={55}
            fill={`url(#rg-${c.id})`} opacity="0.4"/>
        ))}
        <circle cx={CX} cy={CY} r={210} fill="url(#centerGlow)"/>

        {/* Micro star field */}
        {Array.from({length:80},(_,i)=>{
          const x=(Math.sin(i*97.3+1)*0.5+0.5)*W, y=(Math.cos(i*137.5+2)*0.5+0.5)*H;
          const s=Math.random()*1.2+0.3, op=Math.random()*0.4+0.1;
          const dist=Math.hypot(x-CX,y-CY);
          if(dist<100) return null;
          return <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity={op}
            style={{animation:`twinkle ${3+Math.random()*5}s ease-in-out infinite ${Math.random()*5}s`}}/>;
        })}

        {/* Orbital guides — faint rings */}
        {[115,170,210].map(r=>(
          <circle key={r} cx={CX} cy={CY} r={r} fill="none"
            stroke="rgba(168,192,255,0.04)" strokeWidth="0.5" strokeDasharray={r<150?"2 8":"1 12"}/>
        ))}

        {/* ── CONSTELLATION LINES (drawn first, under stars) ── */}
        {CONSTELLATIONS.map(c=>{
          // Hub → each star
          return c.stars.map((s,i)=>{
            const isRelated = hov&&hov.startsWith(c.id) || active&&active.startsWith(c.id);
            return (
              <line key={`cl-${c.id}-${i}`}
                x1={c._hub.x} y1={c._hub.y}
                x2={s._pos.x} y2={s._pos.y}
                stroke={c.color}
                strokeWidth={isRelated?0.9:0.45}
                strokeOpacity={isRelated?0.35:0.12}
                strokeDasharray={s.bright<0.5?"3 5":"none"}/>
            );
          });
        })}

        {/* Between stars in same constellation — skeletal lines */}
        {CONSTELLATIONS.map(c=>
          c.stars.slice(0,-1).map((s,i)=>{
            const next=c.stars[i+1];
            if(!s._pos||!next._pos) return null;
            return <line key={`sl-${c.id}-${i}`}
              x1={s._pos.x} y1={s._pos.y}
              x2={next._pos.x} y2={next._pos.y}
              stroke={c.color} strokeWidth="0.3" strokeOpacity="0.1" strokeDasharray="2 8"/>;
          })
        )}

        {/* Center → hub lines */}
        {CONSTELLATIONS.map(c=>(
          <line key={`hl-${c.id}`}
            x1={CX} y1={CY} x2={c._hub.x} y2={c._hub.y}
            stroke={c.color} strokeWidth="0.4" strokeOpacity="0.08"/>
        ))}

        {/* ── STARS (leaf nodes) ── */}
        {CONSTELLATIONS.map(c=>
          c.stars.map(s=>{
            const isH=hov===s._id, isA=active===s._id;
            const sz = s.size*(isH||isA?1.6:1);
            const op = 0.35+s.bright*0.65;
            return (
              <g key={s._id}
                onMouseEnter={()=>setHov(s._id)}
                onMouseLeave={()=>setHov(null)}
                onClick={()=>setActive(active===s._id?null:s._id)}
                style={{cursor:"pointer"}}>
                {/* Outer glow */}
                {(isH||isA)&&<circle cx={s._pos.x} cy={s._pos.y} r={sz*3.5}
                  fill={c.color} opacity="0.08" filter="url(#starGlow)"/>}
                {/* Mid glow */}
                <circle cx={s._pos.x} cy={s._pos.y} r={sz*1.8}
                  fill={c.color} opacity={(isH||isA)?0.15:0.06}/>
                {/* Star body */}
                <circle cx={s._pos.x} cy={s._pos.y} r={sz}
                  fill={isA?c.color:(isH?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.7)")}
                  filter="url(#starGlow)"
                  opacity={op+(isH||isA?0.3:0)}/>
                {/* Label below star */}
                {!isH && !isA && (
                  <text x={s._pos.x} y={s._pos.y+sz+9}
                    textAnchor="middle" fontFamily="'DM Sans',sans-serif"
                    fontSize="7" fill={c.color} opacity="0.7" fontWeight="500">
                    {(s.text||"").length>16?s.text.slice(0,15)+"…":s.text}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* ── CONSTELLATION HUBS ── */}
        {CONSTELLATIONS.map(c=>{
          const isActive=hov&&hov.startsWith(c.id)||active&&active.startsWith(c.id);
          return (
            <g key={`hub-${c.id}`}>
              {/* Hub glow */}
              <circle cx={c._hub.x} cy={c._hub.y} r={isActive?22:14}
                fill={c.color} opacity={isActive?0.12:0.06} filter="url(#hubGlow)"/>
              {/* Hub star */}
              <circle cx={c._hub.x} cy={c._hub.y} r={isActive?7:5}
                fill={isActive?c.color:"rgba(255,255,255,0.5)"}
                filter="url(#starGlow)"
                opacity={isActive?1:0.7}/>
              {/* Hub ring */}
              <circle cx={c._hub.x} cy={c._hub.y} r={isActive?10:7}
                fill="none" stroke={c.color} strokeWidth="0.7"
                opacity={isActive?0.5:0.2}/>
              {/* Hub label */}
              <text x={c._hub.x} y={c._hub.y+16}
                textAnchor="middle" fontFamily="'DM Sans',sans-serif"
                fontSize="6.5" fill={c.color} opacity={isActive?0.9:0.55} fontWeight="700" letterSpacing="1.5">
                {c.name}
              </text>
            </g>
          );
        })}

        {/* ══ SOUL CENTER — FEMALE SILHOUETTE ══════════ */}

        {/* Outer aura rings — pulsing */}
        <circle cx={CX} cy={CY} r={96} fill="rgba(168,192,255,0.04)"
          style={{animation:"aurapulse 4s ease-in-out infinite"}}/>
        <circle cx={CX} cy={CY} r={88} fill="rgba(168,192,255,0.06)"
          style={{animation:"aurapulse 4s ease-in-out infinite 1s"}}/>
        <circle cx={CX} cy={CY} r={80} fill="rgba(4,6,18,0.96)"/>

        {/* Constellation ring */}
        <circle cx={CX} cy={CY} r={82} fill="none"
          stroke="rgba(168,192,255,0.18)" strokeWidth="0.8" strokeDasharray="3 6"/>
        {[0,45,90,135,180,225,270,315].map((deg,i)=>{
          const p=polar(82,deg);
          return <circle key={i} cx={p.x} cy={p.y} r={i%2===0?2.4:1.5}
            fill={i%2===0?"#A8C0FF":"#C4A8FF"} opacity={i%2===0?0.8:0.5}
            filter="url(#starGlow)"
            style={{animation:`twinkle ${2.5+i*0.4}s ease-in-out infinite ${i*0.3}s`}}/>;
        })}

        {/* ── SILHOUETTE — beautiful feminine form ── */}
        {/* She stands in the center, glowing outline */}

        {/* Flowing hair — top arch */}
        <path d={`M${CX-44},${CY-10}
          C${CX-50},${CY-40} ${CX-46},${CY-72} ${CX-22},${CY-80}
          C${CX-10},${CY-86} ${CX+10},${CY-86} ${CX+22},${CY-80}
          C${CX+46},${CY-72} ${CX+50},${CY-40} ${CX+44},${CY-10}`}
          fill="none" stroke="rgba(168,192,255,0.45)" strokeWidth="1.4" strokeLinecap="round"/>
        {/* Hair flow left */}
        <path d={`M${CX-44},${CY-10} C${CX-52},${CY+10} ${CX-50},${CY+30} ${CX-42},${CY+45}`}
          fill="none" stroke="rgba(168,192,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
        {/* Hair flow right */}
        <path d={`M${CX+44},${CY-10} C${CX+52},${CY+10} ${CX+50},${CY+30} ${CX+42},${CY+45}`}
          fill="none" stroke="rgba(196,168,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
        {/* Hair inner strands */}
        <path d={`M${CX-28},${CY-76} C${CX-24},${CY-50} ${CX-22},${CY-20} ${CX-26},${CY+10}`}
          fill="none" stroke="rgba(168,192,255,0.15)" strokeWidth="0.8" strokeLinecap="round"/>
        <path d={`M${CX+28},${CY-76} C${CX+24},${CY-50} ${CX+22},${CY-20} ${CX+26},${CY+10}`}
          fill="none" stroke="rgba(196,168,255,0.15)" strokeWidth="0.8" strokeLinecap="round"/>

        {/* Body — elegant female form */}
        {/* Neck */}
        <path d={`M${CX-9},${CY-14} L${CX-9},${CY+2} C${CX-9},${CY+4} ${CX-6},${CY+6} ${CX},${CY+6} C${CX+6},${CY+6} ${CX+9},${CY+4} ${CX+9},${CY+2} L${CX+9},${CY-14}`}
          fill="none" stroke="rgba(168,192,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>

        {/* Shoulders */}
        <path d={`M${CX-9},${CY-8} C${CX-20},${CY-6} ${CX-38},${CY-2} ${CX-46},${CY+12}`}
          fill="none" stroke="rgba(168,192,255,0.55)" strokeWidth="1.3" strokeLinecap="round"/>
        <path d={`M${CX+9},${CY-8} C${CX+20},${CY-6} ${CX+38},${CY-2} ${CX+46},${CY+12}`}
          fill="none" stroke="rgba(168,192,255,0.55)" strokeWidth="1.3" strokeLinecap="round"/>

        {/* Torso — waist curve */}
        <path d={`M${CX-46},${CY+12} C${CX-42},${CY+24} ${CX-28},${CY+30} ${CX-22},${CY+42}
          C${CX-18},${CY+52} ${CX-18},${CY+60} ${CX-20},${CY+70}`}
          fill="none" stroke="rgba(168,192,255,0.45)" strokeWidth="1.2" strokeLinecap="round"/>
        <path d={`M${CX+46},${CY+12} C${CX+42},${CY+24} ${CX+28},${CY+30} ${CX+22},${CY+42}
          C${CX+18},${CY+52} ${CX+18},${CY+60} ${CX+20},${CY+70}`}
          fill="none" stroke="rgba(168,192,255,0.45)" strokeWidth="1.2" strokeLinecap="round"/>

        {/* Hip line */}
        <path d={`M${CX-20},${CY+70} C${CX-16},${CY+74} ${CX-6},${CY+76} ${CX},${CY+76}
          C${CX+6},${CY+76} ${CX+16},${CY+74} ${CX+20},${CY+70}`}
          fill="none" stroke="rgba(168,192,255,0.4)" strokeWidth="1.1" strokeLinecap="round"/>

        {/* Inner fill glow — body aura */}
        <ellipse cx={CX} cy={CY+28} rx={34} ry={46}
          fill="radial-gradient(ellipse at 50% 40%,rgba(168,192,255,0.08),transparent)"
          opacity="0.6" style={{animation:"aurapulse 5s ease-in-out infinite 0.5s"}}/>

        {/* Heart / soul point */}
        <circle cx={CX} cy={CY+14} r={3.5}
          fill="#A8C0FF" opacity="0.9" filter="url(#starGlow)"
          style={{animation:"twinkle 2s ease-in-out infinite"}}/>
        <circle cx={CX} cy={CY+14} r={7}
          fill="none" stroke="rgba(168,192,255,0.3)" strokeWidth="0.6"
          style={{animation:"aurapulse 2s ease-in-out infinite"}}/>

        {/* Energy lines from heart */}
        <line x1={CX} y1={CY+14} x2={CX} y2={CY-14}
          stroke="rgba(168,192,255,0.2)" strokeWidth="0.6" strokeDasharray="2 4"/>
        <line x1={CX} y1={CY+14} x2={CX-22} y2={CY+30}
          stroke="rgba(196,168,255,0.15)" strokeWidth="0.5" strokeDasharray="2 5"/>
        <line x1={CX} y1={CY+14} x2={CX+22} y2={CY+30}
          stroke="rgba(196,168,255,0.15)" strokeWidth="0.5" strokeDasharray="2 5"/>

        {/* Decorative stars on silhouette */}
        <circle cx={CX-40} cy={CY+15} r={1.5} fill="#80FFCC" opacity="0.7" filter="url(#starGlow)"/>
        <circle cx={CX+40} cy={CY+15} r={1.5} fill="#80E0FF" opacity="0.7" filter="url(#starGlow)"/>
        <circle cx={CX-24} cy={CY+44} r={1.2} fill="#C4A8FF" opacity="0.6" filter="url(#starGlow)"/>
        <circle cx={CX+24} cy={CY+44} r={1.2} fill="#FFD580" opacity="0.6" filter="url(#starGlow)"/>

        {/* Core border */}
        <circle cx={CX} cy={CY} r={82} fill="none"
          stroke="rgba(168,192,255,0.22)" strokeWidth="1"/>

        {/* Name */}
        <text x={CX} y={CY+102} textAnchor="middle"
          fontFamily="'Unbounded',sans-serif" fontSize="13" fontWeight="700"
          fill="#F0F4FF" letterSpacing="1">
          {soul.name || "SOUL"}
        </text>
        <text x={CX} y={CY+118} textAnchor="middle"
          fontFamily="'DM Sans',sans-serif" fontSize="7" fill="#A8C0FF"
          letterSpacing="3" opacity="0.7">
          {(soul.archetypes||"").split(" + ").map(a=>a.split(" ")[0]).join(" · ").toUpperCase()}
        </text>

        {/* ── TOOLTIP for hovered/active star ── */}
        {(hStar||aStar) && (() => {
          const s = aStar || hStar;
          const px = s._pos.x, py = s._pos.y;
          const tW=155, tH=38;
          let tx = px - tW/2;
          let ty = py < H/2 ? py + s.size + 14 : py - s.size - tH - 14;
          if(tx < 8) tx = 8;
          if(tx+tW > W-8) tx = W-tW-8;
          return (
            <g>
              <rect x={tx} y={ty} width={tW} height={tH} rx={8}
                fill="rgba(4,8,20,0.95)" stroke={s._col} strokeWidth="0.7" strokeOpacity="0.6"/>
              <text x={tx+tW/2} y={ty+13} textAnchor="middle"
                fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="#F0F4FF" fontWeight="600">
                {(s.text||"").length>26 ? s.text.slice(0,25)+"…" : s.text}
              </text>
              <text x={tx+tW/2} y={ty+25} textAnchor="middle"
                fontFamily="'DM Sans',sans-serif" fontSize="7.5" fill={s._col} opacity="0.9">
                {(s.sub||"").length>28 ? s.sub.slice(0,27)+"…" : s.sub}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}


// ── SOUL EDITOR ──────────────────────────────────────────
function SoulEditor({persona, onChange}) {
  const [open, setOpen] = useState(null);
  const soul = persona.soul || {};
  const upd = useCallback((path, val) => {
    const s = JSON.parse(JSON.stringify(soul));
    const parts = path.split(".");
    let o = s;
    for(let i=0;i<parts.length-1;i++) o=o[parts[i]];
    o[parts[parts.length-1]]=val;
    onChange("soul", s);
  },[soul,onChange]);
  const addTo = (key,item) => onChange("soul",{...soul,[key]:[...(soul[key]||[]),item]});
  const rmFrom = (key,i) => onChange("soul",{...soul,[key]:soul[key].filter((_,j)=>j!==i)});

  const sections = [
    {key:"wounds",title:"💔 Раны",render:()=>(soul.wounds||[]).map((w,i)=>(
      <div key={i} style={{padding:"8px 0",borderTop:i?"1px solid rgba(168,192,255,0.06)":"none"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1}}>
            <Ed value={w.text} onChange={v=>upd(`wounds.${i}.text`,v)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#C8D4F0"}} ph="рана..."/>
            <div style={{display:"flex",gap:6,alignItems:"center",marginTop:5}}>
              <div style={{flex:1,height:3,background:"rgba(168,192,255,0.1)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${w.heal}%`,background:w.heal>60?"#80FFCC":"#FF6060",borderRadius:3,transition:".3s",boxShadow:w.heal>60?"0 0 8px rgba(128,255,204,0.5)":"0 0 8px rgba(255,96,96,0.4)"}}/></div>
              <input type="range" min="0" max="100" value={w.heal} onChange={e=>upd(`wounds.${i}.heal`,+e.target.value)} style={{width:56,accentColor:w.heal>60?C.sage:C.danger}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:w.heal>60?"#80FFCC":"#FF6060",fontWeight:700,minWidth:28}}>{w.heal}%</span>
            </div>
          </div>
          <button onClick={()=>rmFrom("wounds",i)} style={{background:"none",border:"none",cursor:"pointer",color:"#4A5570",fontSize:14,transition:"color .15s",lineHeight:1,padding:2}} onMouseOver={e=>e.currentTarget.style.color="#FF6060"} onMouseOut={e=>e.currentTarget.style.color="#4A5570"}>×</button>
        </div>
      </div>
    )),add:()=>addTo("wounds",{text:"",heal:50})},
    {key:"fears",title:"😰 Страхи",render:()=>(soul.fears||[]).map((f,i)=>(
      <div key={i} style={{display:"flex",gap:8,padding:"7px 0",borderTop:i?"1px solid rgba(168,192,255,0.06)":"none",alignItems:"center"}}>
        <div style={{width:34,height:34,borderRadius:9,background:`rgba(255,144,96,${f.pwr/140})`,border:"1px solid rgba(255,144,96,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#FFD580",flexShrink:0,boxShadow:`0 0 12px rgba(255,144,96,${f.pwr/180})`}}>{f.pwr}</div>
        <Ed value={f.text} onChange={v=>upd(`fears.${i}.text`,v)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#C8D4F0",flex:1}} ph="страх..."/>
        <input type="range" min="0" max="100" value={f.pwr} onChange={e=>upd(`fears.${i}.pwr`,+e.target.value)} style={{width:54,accentColor:C.danger}}/>
        <button onClick={()=>rmFrom("fears",i)} style={{background:"none",border:"none",cursor:"pointer",color:"#4A5570",fontSize:14,transition:"color .15s",lineHeight:1,padding:2}} onMouseOver={e=>e.currentTarget.style.color="#FF6060"} onMouseOut={e=>e.currentTarget.style.color="#4A5570"}>×</button>
      </div>
    )),add:()=>addTo("fears",{text:"",pwr:50})},
    {key:"voices",title:"🗣 Голоса",render:()=>(soul.voices||[]).map((v,i)=>(
      <div key={i} style={{padding:"7px 0",borderTop:i?"1px solid rgba(168,192,255,0.06)":"none"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:v.pwr>60?"#80FFCC":v.pwr>35?"#A8C0FF":"#FF6060",boxShadow:v.pwr>60?"0 0 6px #80FFCC":v.pwr>35?"0 0 6px #A8C0FF":"0 0 6px #FF6060",flexShrink:0}}/>
          <Ed value={v.who}  onChange={val=>upd(`voices.${i}.who`,val)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#A8C0FF",fontWeight:600,minWidth:75}} ph="кто"/>
          <Ed value={v.says} onChange={val=>upd(`voices.${i}.says`,val)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#7888AA",flex:1,fontStyle:"italic"}} ph="говорит..."/>
          <input type="range" min="0" max="100" value={v.pwr} onChange={e=>upd(`voices.${i}.pwr`,+e.target.value)} style={{width:50,accentColor:C.sage}}/>
          <span style={u(9,C.muted)}>{v.pwr}%</span>
          <button onClick={()=>rmFrom("voices",i)} style={{background:"none",border:"none",cursor:"pointer",color:"#4A5570",fontSize:14,transition:"color .15s",lineHeight:1,padding:2}} onMouseOver={e=>e.currentTarget.style.color="#FF6060"} onMouseOut={e=>e.currentTarget.style.color="#4A5570"}>×</button>
        </div>
      </div>
    )),add:()=>addTo("voices",{who:"",says:"",pwr:50})},
    {key:"obsessive",title:"🌀 Навязчивые мысли",render:()=>(soul.obsessive||[]).map((o,i)=>(
      <div key={i} style={{padding:"7px 0",borderTop:i?"1px solid rgba(168,192,255,0.06)":"none"}}>
        <Ed value={o.thought} onChange={v=>upd(`obsessive.${i}.thought`,v)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11.5,color:"#7888AA",fontStyle:"italic"}} ph="мысль..."/>
        <div style={{display:"flex",gap:5,marginTop:4,alignItems:"flex-start"}}>
          <span style={{color:"#80FFCC",fontSize:12,fontWeight:600,lineHeight:1}}>→</span>
          <Ed value={o.counter} onChange={v=>upd(`obsessive.${i}.counter`,v)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#80FFCC"}} ph="контраргумент..."/>
          <button onClick={()=>rmFrom("obsessive",i)} style={{background:"none",border:"none",cursor:"pointer",color:"#4A5570",fontSize:14,transition:"color .15s",lineHeight:1,padding:2}} onMouseOver={e=>e.currentTarget.style.color="#FF6060"} onMouseOut={e=>e.currentTarget.style.color="#4A5570"}>×</button>
        </div>
      </div>
    )),add:()=>addTo("obsessive",{thought:"",counter:""})},
    {key:"goals",title:"⭐ Стремления",render:()=>(soul.goals||[]).map((g,i)=>(
      <div key={i} style={{padding:"7px 0",borderTop:i?"1px solid rgba(168,192,255,0.06)":"none"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1}}>
            <Ed value={g.text} onChange={v=>upd(`goals.${i}.text`,v)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#C8D4F0"}} ph="цель..."/>
            <div style={{display:"flex",gap:6,alignItems:"center",marginTop:4}}>
              <div style={{flex:1,height:3,background:"rgba(168,192,255,0.1)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${g.pct}%`,background:"linear-gradient(90deg,#A8C0FF,#C4A8FF)",borderRadius:3,transition:".3s",boxShadow:"0 0 8px rgba(168,192,255,0.4)"}}/></div><input type="range" min="0" max="100" value={g.pct} onChange={e=>upd(`goals.${i}.pct`,+e.target.value)} style={{width:52,accentColor:"#A8C0FF"}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#A8C0FF",fontWeight:700}}>{g.pct}%</span>
            </div>
          </div>
          <button onClick={()=>rmFrom("goals",i)} style={{background:"none",border:"none",cursor:"pointer",color:"#4A5570",fontSize:14,transition:"color .15s",lineHeight:1,padding:2}} onMouseOver={e=>e.currentTarget.style.color="#FF6060"} onMouseOut={e=>e.currentTarget.style.color="#4A5570"}>×</button>
        </div>
      </div>
    )),add:()=>addTo("goals",{text:"",pct:10})},
  ];

  const renderSection = (key, title, count, children) => (
    <div key={key} style={{background:"rgba(255,255,255,0.03)",borderRadius:16,border:"1px solid rgba(168,192,255,0.07)",overflow:"hidden"}}>
      <div onClick={()=>setOpen(open===key?null:key)}
        style={{padding:"13px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"background .15s"}}
        onMouseOver={e=>e.currentTarget.style.background="rgba(168,192,255,0.04)"}
        onMouseOut={e=>e.currentTarget.style.background="transparent"}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:"#C8D4F0",flex:1}}>{title}</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#4A5570",background:"rgba(168,192,255,0.08)",borderRadius:20,padding:"1px 8px",fontWeight:600}}>{count}</span>
        <span style={{color:"#4A5570",fontSize:11,transform:open===key?"rotate(90deg)":"none",transition:"transform .2s",lineHeight:1}}>▸</span>
      </div>
      {open===key&&<div style={{borderTop:"1px solid rgba(168,192,255,0.05)"}}>
        {children}
      </div>}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>

      {/* Constellation map */}
      <RadialMindMap soul={{...soul, name: persona.name}}/>

      {/* ── IDENTITY — cosmic cards ── */}
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:18,border:"1px solid rgba(168,192,255,0.08)",overflow:"hidden",boxShadow:"0 4px 32px rgba(0,0,0,0.4)"}}>
        {/* Section header */}
        <div style={{padding:"14px 20px 12px",borderBottom:"1px solid rgba(168,192,255,0.06)",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:4,height:16,borderRadius:2,background:"linear-gradient(180deg,#A8C0FF,#C4A8FF)"}}/>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,letterSpacing:3,color:"#7888AA",textTransform:"uppercase"}}>Идентичность</span>
        </div>
        <div style={{padding:"14px 20px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {Object.entries(soul.psycho||{}).map(([k,v])=>{
            const accent = {mbti:"#A8C0FF",temperament:"#80FFCC",enneagram:"#C4A8FF",attachment:"#FFD580"}[k]||"#A8C0FF";
            return (
              <div key={k} style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"11px 14px",border:`1px solid ${accent}18`,position:"relative",overflow:"hidden"}}>
                {/* Accent corner */}
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",borderRadius:"12px 0 0 12px",background:`linear-gradient(180deg,${accent},${accent}44)`}}/>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:2,color:accent,textTransform:"uppercase",marginBottom:5,marginLeft:6,opacity:0.8}}>{k}</div>
                <div style={{marginLeft:6}}>
                  <Ed value={v} onChange={val=>upd(`psycho.${k}`,val)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#C8D4F0",fontWeight:400}}/>
                </div>
              </div>
            );
          })}
        </div>
        {/* Archetypes — full width */}
        <div style={{margin:"0 20px 16px",background:"rgba(255,213,128,0.05)",borderRadius:12,padding:"11px 14px",border:"1px solid rgba(255,213,128,0.12)"}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:2,color:"#FFD580",textTransform:"uppercase",marginBottom:5,opacity:0.8}}>Архетипы</div>
          <Ed value={soul.archetypes||""} onChange={v=>onChange("soul",{...soul,archetypes:v})} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#C8D4F0"}} multi/>
        </div>
      </div>

      {/* ── EXPANDABLE SECTIONS ── */}
      {/* Childhood */}
      {renderSection("ch","🌱 Детство",(soul.childhood||[]).length,
        <div style={{padding:"12px 20px 16px"}}>
          {(soul.childhood||[]).map((c,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderTop:i?"1px solid rgba(168,192,255,0.05)":"none",alignItems:"flex-start"}}>
              <div style={{minWidth:38,height:28,borderRadius:8,background:c.type==="травма"?"rgba(255,96,96,0.12)":"rgba(128,255,204,0.1)",border:`1px solid ${c.type==="травма"?"rgba(255,96,96,0.25)":"rgba(128,255,204,0.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9.5,fontWeight:700,color:c.type==="травма"?"#FF6060":"#80FFCC"}}>{c.age}л</span>
              </div>
              <Ed value={c.mem} onChange={v=>upd(`childhood.${i}.mem`,v)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11.5,color:"#C8D4F0",flex:1,lineHeight:1.5}} multi ph="воспоминание..."/>
              <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",flexShrink:0}}>
                <select value={c.type} onChange={e=>upd(`childhood.${i}.type`,e.target.value)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:c.type==="травма"?"#FF6060":"#80FFCC",background:"rgba(255,255,255,0.04)",border:`1px solid ${c.type==="травма"?"rgba(255,96,96,0.2)":"rgba(128,255,204,0.2)"}`,borderRadius:6,padding:"2px 6px"}}>
                  <option value="травма">травма</option><option value="ресурс">ресурс</option>
                </select>
                <button onClick={()=>rmFrom("childhood",i)} style={{background:"none",border:"none",color:"#4A5570",fontSize:14,lineHeight:1,padding:2,transition:"color .15s"}} onMouseOver={e=>e.currentTarget.style.color="#FF6060"} onMouseOut={e=>e.currentTarget.style.color="#4A5570"}>×</button>
              </div>
            </div>
          ))}
          <button onClick={()=>addTo("childhood",{age:"",mem:"",type:"травма"})} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",marginTop:10,padding:"8px",background:"rgba(168,192,255,0.04)",border:"1px dashed rgba(168,192,255,0.15)",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#7888AA",cursor:"pointer",transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.color="#A8C0FF";e.currentTarget.style.borderColor="rgba(168,192,255,0.35)"}} onMouseOut={e=>{e.currentTarget.style.color="#7888AA";e.currentTarget.style.borderColor="rgba(168,192,255,0.15)"}}>
            <span style={{fontSize:14,opacity:.6}}>✦</span> добавить воспоминание
          </button>
        </div>
      )}

      {sections.map(sec=>(
        renderSection(sec.key, sec.title, (soul[sec.key]||[]).length,
          <div style={{padding:"12px 20px 16px"}}>
            {sec.render()}
            <button onClick={sec.add} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",marginTop:10,padding:"8px",background:"rgba(168,192,255,0.04)",border:"1px dashed rgba(168,192,255,0.15)",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#7888AA",cursor:"pointer",transition:"all .15s"}} onMouseOver={e=>{e.currentTarget.style.color="#A8C0FF";e.currentTarget.style.borderColor="rgba(168,192,255,0.3)"}} onMouseOut={e=>{e.currentTarget.style.color="#7888AA";e.currentTarget.style.borderColor="rgba(168,192,255,0.15)"}}>
              <span style={{fontSize:14,opacity:.6}}>✦</span> добавить
            </button>
          </div>
        )
      ))}

      {/* ── STYLE / TABOO / CATCHPHRASES ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[{k:"style",label:"Стиль",color:"#A8C0FF"},{k:"taboo",label:"Табу",color:"#FF6060"}].map(({k,label,color})=>(
          <div key={k} style={{background:"rgba(255,255,255,0.03)",borderRadius:14,padding:"13px 16px",border:`1px solid ${color}14`}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:2.5,color,textTransform:"uppercase",marginBottom:7,opacity:0.8}}>{label}</div>
            <Ed value={soul[k]||""} onChange={v=>onChange("soul",{...soul,[k]:v})} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11.5,color:"#C8D4F0",lineHeight:1.5}} multi/>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,213,128,0.04)",borderRadius:14,padding:"13px 16px",border:"1px solid rgba(255,213,128,0.1)"}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:2.5,color:"#FFD580",textTransform:"uppercase",marginBottom:7,opacity:0.8}}>Кэтчфразы</div>
        <Ed value={soul.catchphrases||""} onChange={v=>onChange("soul",{...soul,catchphrases:v})} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11.5,color:"#C8D4F0",fontStyle:"italic"}} multi/>
      </div>

    </div>
  );
}

// ── MIND TAB ─────────────────────────────────────────────
function MindTab({persona, onChange}) {
  const st   = persona.state||ST_DEF;
  const aura = computeAura(st);
  const RING = ["mood","energy","confidence","anxiety","creativity","adventureDrive","innerCriticVolume","presenceFeel"];

  // Silhouette with aura for Mind tab
  const SoulSilhouette = () => {
    const cx=100, cy=110;
    return (
      <svg width="200" height="220" viewBox="0 0 200 220" style={{display:"block"}}>
        <defs>
          <radialGradient id="mAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={aura.c1} stopOpacity="0.25"/>
            <stop offset="70%" stopColor={aura.c2} stopOpacity="0.08"/>
            <stop offset="100%" stopColor={aura.c2} stopOpacity="0"/>
          </radialGradient>
          <filter id="mGlow"><feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Aura pulsing rings */}
        <ellipse cx={cx} cy={cy+10} rx={88} ry={100} fill="url(#mAura)"
          style={{animation:"aurapulse 4s ease-in-out infinite"}}/>
        <ellipse cx={cx} cy={cx+10} rx={72} ry={84} fill="none"
          stroke={aura.c2} strokeWidth="0.6" opacity="0.4"
          style={{animation:"aurapulse 3s ease-in-out infinite 0.8s"}}/>
        <ellipse cx={cx} cy={cy+10} rx={56} ry={68} fill="none"
          stroke={aura.c1} strokeWidth="0.5" opacity="0.3"
          style={{animation:"aurapulse 3.5s ease-in-out infinite 1.5s"}}/>
        {/* Hair */}
        <path d={`M${cx-40},${cy-8} C${cx-46},${cy-34} ${cx-42},${cy-62} ${cx-16},${cy-68} C${cx-6},${cy-74} ${cx+6},${cy-74} ${cx+16},${cy-68} C${cx+42},${cy-62} ${cx+46},${cy-34} ${cx+40},${cy-8}`}
          fill="none" stroke={aura.c1} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        <path d={`M${cx-40},${cy-8} C${cx-48},${cy+8} ${cx-46},${cy+28} ${cx-38},${cy+40}`}
          fill="none" stroke={aura.c1} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
        <path d={`M${cx+40},${cy-8} C${cx+48},${cy+8} ${cx+46},${cy+28} ${cx+38},${cy+40}`}
          fill="none" stroke={aura.c2} strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
        {/* Shoulders */}
        <path d={`M${cx-8},${cy-10} C${cx-18},${cy-8} ${cx-36},${cy-3} ${cx-44},${cy+10}`}
          fill="none" stroke={aura.c1} strokeWidth="1.2" strokeLinecap="round" opacity="0.55"/>
        <path d={`M${cx+8},${cy-10} C${cx+18},${cy-8} ${cx+36},${cy-3} ${cx+44},${cy+10}`}
          fill="none" stroke={aura.c1} strokeWidth="1.2" strokeLinecap="round" opacity="0.55"/>
        {/* Torso */}
        <path d={`M${cx-44},${cy+10} C${cx-38},${cy+22} ${cx-24},${cy+28} ${cx-18},${cy+40} C${cx-14},${cy+50} ${cx-15},${cy+58} ${cx-16},${cy+66}`}
          fill="none" stroke={aura.c1} strokeWidth="1.1" strokeLinecap="round" opacity="0.45"/>
        <path d={`M${cx+44},${cy+10} C${cx+38},${cy+22} ${cx+24},${cy+28} ${cx+18},${cy+40} C${cx+14},${cy+50} ${cx+15},${cy+58} ${cx+16},${cy+66}`}
          fill="none" stroke={aura.c1} strokeWidth="1.1" strokeLinecap="round" opacity="0.45"/>
        <path d={`M${cx-16},${cy+66} C${cx-12},${cy+70} ${cx-5},${cy+72} ${cx},${cy+72} C${cx+5},${cy+72} ${cx+12},${cy+70} ${cx+16},${cy+66}`}
          fill="none" stroke={aura.c1} strokeWidth="1"  strokeLinecap="round" opacity="0.4"/>
        {/* Heart */}
        <circle cx={cx} cy={cy+12} r={3} fill={aura.c2} opacity="0.9"
          filter="url(#mGlow)" style={{animation:"twinkle 2s ease-in-out infinite"}}/>
        <circle cx={cx} cy={cy+12} r={6} fill="none" stroke={aura.c2} strokeWidth="0.6" opacity="0.4"
          style={{animation:"aurapulse 2s ease-in-out infinite"}}/>
        {/* Floating stars */}
        {[[-52,cy],[52,cy],[-38,cy+38],[38,cy+38]].map(([x,y],i)=>(
          <circle key={i} cx={x+cx} cy={y} r={1.5}
            fill={["#A8C0FF","#80FFCC","#C4A8FF","#FFD580"][i]}
            opacity="0.7" filter="url(#mGlow)"
            style={{animation:`twinkle ${2+i*0.5}s ease-in-out infinite ${i*0.4}s`}}/>
        ))}
      </svg>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>

      {/* Aura card */}
      <div style={{
        background:`radial-gradient(ellipse at 50% 20%, ${aura.c1}18 0%, rgba(4,6,20,0) 65%), rgba(255,255,255,0.03)`,
        borderRadius:20, border:`1px solid ${aura.c2}20`,
        boxShadow:`0 0 60px ${aura.c1}12, 0 4px 32px rgba(0,0,0,0.4)`,
        padding:"28px 20px", display:"flex", flexDirection:"column", alignItems:"center",
        overflow:"hidden", position:"relative",
      }}>
        {/* Section label */}
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3.5,color:"#4A5570",textTransform:"uppercase",marginBottom:20}}>Состояние сейчас</div>

        {/* Silhouette */}
        <SoulSilhouette/>

        {/* Aura label */}
        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:aura.c2,boxShadow:`0 0 10px ${aura.c2}`,animation:"twinkle 2s infinite"}}/>
          <span style={{fontFamily:"'Unbounded',sans-serif",fontSize:10,fontWeight:600,color:aura.c2,letterSpacing:"0.12em",textTransform:"uppercase",textShadow:`0 0 16px ${aura.c2}88`}}>{aura.label}</span>
          <div style={{width:6,height:6,borderRadius:"50%",background:aura.c2,boxShadow:`0 0 10px ${aura.c2}`,animation:"twinkle 2s infinite 1s"}}/>
        </div>

        {/* Ring gauges */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:24,width:"100%",maxWidth:480}}>
          {RING.map(k=><ArcG key={k} v={st[k]} color={ST_META[k].c} icon={ST_META[k].i} label={ST_META[k].n} inv={INV.has(k)} size={90}/>)}
        </div>
      </div>

      {/* All 18 sliders */}
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:18,border:"1px solid rgba(168,192,255,0.07)",padding:"18px 20px"}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3,color:"#4A5570",textTransform:"uppercase",marginBottom:14}}>Все 18 параметров</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 20px"}}>
          {Object.entries(st).map(([k,v])=>{
            const m=ST_META[k], inv=INV.has(k);
            const col=inv?(v>60?C.danger:v<40?"#80FFCC":C.clay):(v>60?"#80FFCC":v<40?C.danger:C.clay);
            return (
              <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
                <span style={{fontSize:12,width:20,flexShrink:0}}>{m.i}</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#4A5570",width:100,flexShrink:0,letterSpacing:0.2}}>{m.n}</span>
                <input type="range" min="0" max="100" value={v}
                  onChange={e=>onChange("state",{...st,[k]:+e.target.value})}
                  style={{flex:1,accentColor:col}}/>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:col,fontWeight:700,width:24,textAlign:"right",textShadow:`0 0 8px ${col}66`}}>{v}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── STUDIO TAB ───────────────────────────────────────────
function StudioTab({persona, onSave}) {
  const [niches,   setNiches]   = useState(persona.niches  || ["fashion","travel","self"]);
  const [formats,  setFormats]  = useState(persona.formats || ["story","hot","reply","vuln"]);
  const [ctx,      setCtx]      = useState(persona.context || "");
  const [num,      setNum]      = useState(5);
  const [genning,  setGenning]  = useState(false);
  const [posts,    setPosts]    = useState([]);
  const [selPost,  setSelPost]  = useState(null);
  const [replies,  setReplies]  = useState([]);
  const [genRep,   setGenRep]   = useState(false);

  const topics  = useMemo(()=>hotTopics(niches, persona.soul||{}, persona.state||ST_DEF),[niches,persona]);
  const aura    = computeAura(persona.state||ST_DEF);

  const generate = async () => {
    setGenning(true); setPosts([]);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY||"","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2200,messages:[{role:"user",content:buildPrompt(persona,{formats,topics},ctx,num)}]}),
      });
      const d = await r.json();
      if (d.error) { console.error("Anthropic API error:", d.error); setGenning(false); return; }
      const txt = d.content?.map(i=>i.text||"").join("")||"";
      setPosts(JSON.parse(txt.replace(/```json/g,"").replace(/```/g,"").trim()));
    } catch(e){setPosts([{text:"Ошибка: "+e.message,format:"",topic:"",tag:"",why:""}]);}
    setGenning(false);
  };

  const genReplies = async (txt) => {
    setGenRep(true); setReplies([]);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_KEY||"","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:`Ты — ${persona.name}. Пост: "${txt}"\n\n4 комментария разных людей + ответ ${persona.name.split(" ")[0]} на каждый (честный, провокационный).\nJSON: [{"comment":"...","user":"...","reply":"..."}]`}]}),
      });
      const d = await r.json();
      if (d.error) { console.error("Anthropic API error:", d.error); setGenRep(false); return; }
      setReplies(JSON.parse((d.content?.map(i=>i.text||"").join("")||"").replace(/```json/g,"").replace(/```/g,"").trim()));
    } catch(e){setReplies([]);}
    setGenRep(false);
  };

  return (
    <div>
      {/* Header card */}
      <div style={{
        background:`radial-gradient(ellipse at 15% 50%, ${aura.c1}15 0%, transparent 55%), rgba(255,255,255,0.03)`,
        borderRadius:18, border:`1px solid ${aura.c2}18`,
        boxShadow:`0 0 40px ${aura.c1}0A, 0 4px 32px rgba(0,0,0,0.4)`,
        padding:"16px 20px", display:"flex", gap:16, alignItems:"center", marginBottom:10,
      }}>
        <div style={{position:"relative",flexShrink:0}}>
          <div style={{width:60,height:60,borderRadius:"50%",border:`1.5px solid ${aura.c2}55`,boxShadow:`0 0 20px ${aura.c2}33,0 0 40px ${aura.c1}18`,overflow:"hidden"}}>
            <Avatar ap={persona.appearance||{}} size={60}/>
          </div>
          <div style={{position:"absolute",bottom:3,right:3,width:12,height:12,borderRadius:"50%",background:"#80FFCC",border:"2px solid rgba(4,6,20,0.95)",boxShadow:"0 0 8px #80FFCC"}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:14,fontWeight:700,color:"#F0F4FF",letterSpacing:"0.03em",lineHeight:1.2}}>{persona.name}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#4A5570",marginTop:3,letterSpacing:0.5}}>@{persona.handle} · {persona.brand}</div>
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,color:aura.c2,background:`${aura.c1}15`,padding:"3px 10px",borderRadius:20,border:`1px solid ${aura.c2}30`,boxShadow:`0 0 10px ${aura.c2}18`}}>{aura.label}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#A8C0FF",background:"rgba(168,192,255,0.08)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(168,192,255,0.15)"}}>настроение {(persona.state||ST_DEF).mood}%</span>
          </div>
        </div>
      </div>

      {/* Context */}
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,border:"1px solid rgba(168,192,255,0.07)",padding:"14px 18px",marginBottom:10}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3,color:"#4A5570",textTransform:"uppercase",marginBottom:8}}>Контекст дня</div>
        <textarea value={ctx} onChange={e=>setCtx(e.target.value)} placeholder="Что сейчас происходит? Где находится, что чувствует..."
          style={{width:"100%",border:"1px solid rgba(168,192,255,0.08)",borderRadius:10,padding:"10px 13px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#C8D4F0",background:"rgba(168,192,255,0.03)",outline:"none",resize:"vertical",minHeight:56}}/>
      </div>

      {/* Niches */}
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,border:"1px solid rgba(168,192,255,0.07)",padding:"14px 18px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3,color:"#4A5570",textTransform:"uppercase"}}>🔥 Горячие темы</div>
          <div style={{display:"flex",gap:4}}>
            {NICHES_DEF.map(n=>(
              <button key={n.id} onClick={()=>setNiches(p=>p.includes(n.id)?p.filter(x=>x!==n.id):[...p,n.id])}
                title={n.name}
                style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,padding:"4px 8px",borderRadius:7,cursor:"pointer",transition:"all .15s",
                  background:niches.includes(n.id)?"rgba(168,192,255,0.15)":"rgba(168,192,255,0.04)",
                  boxShadow:niches.includes(n.id)?"0 0 12px rgba(168,192,255,0.25)":"none",
                  border:niches.includes(n.id)?"1px solid rgba(168,192,255,0.35)":"1px solid rgba(168,192,255,0.08)",
                }}>{n.icon}</button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
          {topics.map((h,i)=>(
            <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:"rgba(168,192,255,0.04)",borderRadius:10,border:"1px solid rgba(168,192,255,0.08)",animation:`fadeUp .2s ease ${i*.03}s both`,alignItems:"flex-start"}}>
              <div style={{minWidth:30,height:21,borderRadius:6,background:`rgba(168,192,255,${h.score/160})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,color:"#F0F4FF",flexShrink:0,boxShadow:h.score>75?"0 0 10px rgba(168,192,255,0.35)":"none"}}>{h.score}</div>
              <div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10.5,color:"#C8D4F0"}}>{h.topic}</div>
                <div style={{...u(8,C.muted),marginTop:1}}>{h.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formats */}
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,border:"1px solid rgba(168,192,255,0.07)",padding:"14px 18px",marginBottom:10}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3,color:"#4A5570",textTransform:"uppercase",marginBottom:10}}>Форматы</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {FORMATS_DEF.map(f=>(
            <button key={f.id} onClick={()=>setFormats(p=>p.includes(f.id)?p.filter(x=>x!==f.id):[...p,f.id])}
              title={f.d}
              style={{fontFamily:"'DM Sans',sans-serif",fontSize:9.5,color:formats.includes(f.id)?"#A8C0FF":"#4A5570",padding:"5px 11px",borderRadius:8,cursor:"pointer",transition:"all .15s",
                border:formats.includes(f.id)?"1px solid rgba(168,192,255,0.35)":"1px solid rgba(168,192,255,0.08)",
                background:formats.includes(f.id)?"rgba(168,192,255,0.1)":"transparent",
                fontWeight:formats.includes(f.id)?600:400,
                boxShadow:formats.includes(f.id)?"0 0 12px rgba(168,192,255,0.15)":"none",
              }}>
              {f.n} <span style={{fontSize:8,color:"#80FFCC",marginLeft:3}}>{f.v}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"center"}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#4A5570"}}>Постов:</span>
        {[3,5,7,10].map(n=>(
          <button key={n} onClick={()=>setNum(n)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:num===n?700:400,color:num===n?"#060914":"#7888AA",
            background:num===n?"#A8C0FF":"rgba(168,192,255,0.06)",border:`1px solid ${num===n?"transparent":"rgba(168,192,255,0.1)"}`,
            borderRadius:8,padding:"7px 14px",cursor:"pointer",transition:"all .15s",
            boxShadow:num===n?"0 0 14px rgba(168,192,255,0.35)":"none"}}>{n}</button>
        ))}
        <button onClick={generate} disabled={genning} className="btn-star" style={{flex:1,
          fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,letterSpacing:1,
          background:genning?"rgba(168,192,255,0.08)":"linear-gradient(135deg,rgba(168,192,255,0.18),rgba(196,168,255,0.18))",
          border:`1px solid ${genning?"rgba(168,192,255,0.15)":"rgba(168,192,255,0.35)"}`,
          borderRadius:12,padding:"12px",cursor:genning?"wait":"pointer",
          color:genning?"#4A5570":"#A8C0FF",
          boxShadow:genning?"none":"0 0 28px rgba(168,192,255,0.15)",
          transition:"all .2s"}}>
          {genning?"⟳ Генерирую...":"⚡ Сгенерировать Threads"}
        </button>
      </div>

      {/* Posts */}
      {posts.map((p,i)=>(
        <div key={i} style={{...card({marginBottom:8}),animation:`fadeUp .3s ease ${i*.06}s both`}} className="glass-card">
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
              {p.format&&<span style={{fontFamily:F.b,fontSize:10,fontWeight:700,color:C.clay,background:"rgba(124,58,237,0.08)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(124,58,237,0.18)"}}>{p.format}</span>}
              {p.topic &&<span style={{fontFamily:F.b,fontSize:10,fontWeight:500,color:C.sage,background:"rgba(5,150,105,0.07)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(5,150,105,0.18)"}}>{p.topic}</span>}
              {p.tag   &&<span style={{fontFamily:F.b,fontSize:10,fontWeight:500,color:C.teal,background:"rgba(8,145,178,0.07)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(8,145,178,0.15)"}}>#{p.tag}</span>}
              <div style={{flex:1}}/>
              <button onClick={()=>navigator.clipboard?.writeText(p.text)} style={{...u(9,C.muted),background:"rgba(59,111,255,0.04)",border:"1px solid rgba(59,111,255,0.1)",borderRadius:5,padding:"2px 8px",cursor:"pointer"}}>📋</button>
              <button onClick={()=>onSave({id:uid(),personaId:persona.id,platform:"threads",text:p.text,format:p.format||"",topic:p.topic||"",tag:p.tag||"",why:p.why||"",status:"draft",createdAt:now()})}
                style={{...u(9,C.bg,600),background:C.sage,border:"none",borderRadius:5,padding:"2px 9px",cursor:"pointer",boxShadow:`0 0 8px ${C.sage}88`}}>＋ Сохранить</button>
            </div>
            <div style={{...serif(15.5,C.ink),lineHeight:1.8,whiteSpace:"pre-line"}}>{p.text}</div>
            {p.why&&<div style={{...u(9.5,C.muted),padding:"6px 10px",background:"rgba(59,111,255,0.04)",borderRadius:8,borderLeft:`2px solid rgba(59,111,255,0.3)`,marginTop:8}}>💡 {p.why}</div>}
            <button onClick={()=>{setSelPost(selPost===i?null:i);if(selPost!==i){setReplies([]);genReplies(p.text);}}}
              style={{...u(9,C.teal),background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.15)",borderRadius:7,padding:"4px 12px",cursor:"pointer",marginTop:8}}>
              💬 {selPost===i?"скрыть":"смоделировать ответы"}
            </button>
          </div>
          {selPost===i&&(
            <div style={{borderTop:"1px solid rgba(59,111,255,0.1)",padding:"10px 16px",background:"rgba(59,111,255,0.02)"}}>
              {genRep&&<div style={{...u(10,C.muted),fontStyle:"italic",animation:"neonFlicker 1s infinite"}}>Генерирую ответы...</div>}
              {replies.map((r,ri)=>(
                <div key={ri} style={{padding:"6px 0",borderTop:ri?"1px solid rgba(59,111,255,0.06)":"none"}}>
                  <div style={u(10,C.ink2)}><span style={u(9,C.muted)}>{r.user}:</span> {r.comment}</div>
                  <div style={{...u(10.5,C.terra),paddingLeft:12,borderLeft:`2px solid rgba(59,111,255,0.3)`,marginTop:4}}>{r.reply}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── ARC TAB ───────────────────────────────────────────────
function ArcTab({ persona, onSave }) {
  const [ptA,    setPtA]    = useState(persona.context || "Стамбул, день 47. Тревога затихает. Через 3 дня — Грузия.");
  const [ptB,    setPtB]    = useState("Тбилиси. Неделя одна в горах. Впервые не планирует следующий шаг. Доверяет моменту.");
  const [days,   setDays]   = useState(7);
  const [arc,    setArc]    = useState([]);
  const [genning,setGenning]= useState(false);
  const [selDay, setSelDay] = useState(null);
  const [saved,  setSaved]  = useState({});

  const st    = persona.state || ST_DEF;
  const soul  = persona.soul  || {};
  const aura  = computeAura(st);

  // Emotion color map
  const EMO_C = {
    тревога:"#EF4444", азарт:"#6C4FE8", радость:"#10B981", тоска:"#4A6A9A",
    решимость:"#3B6FFF", уязвимость:"#EC4899", покой:"#06B6D4",
    злость:"#FF2D00", благодарность:"#F59E0B", одиночество:"#7A8B99",
    страх:"#EF4444", вдохновение:"#8B5CF6",
  };
  const emoColor = (e="") => EMO_C[Object.keys(EMO_C).find(k=>e.toLowerCase().includes(k))] || C.terra;

  const buildArcPrompt = () => {
    const wounds = (soul.wounds||[]).map(w=>`"${w.text}"(${w.heal}%)`).join("; ");
    const fears  = (soul.fears||[]).map(f=>`${f.text}(${f.pwr}%)`).join("; ");
    return `Ты — архитектор нарративной арки для AI-блогера.

ПЕРСОНАЖ: ${persona.name}, ${persona.age} лет, ${persona.city}
Архетипы: ${soul.archetypes||""}
Раны: ${wounds}
Страхи: ${fears}
Голос: живой, уязвимый, без позы. Разговорный, на «ты».

ТЕКУЩЕЕ СОСТОЯНИЕ (Точка А):
${ptA}
Настроение: ${st.mood}%, Тревога: ${st.anxiety}%, Энергия: ${st.energy}%, Уверенность: ${st.confidence}%, Ощущение жизни: ${st.presenceFeel}%

ЦЕЛЬ АРКИ (Точка Б, через ${days} дней):
${ptB}

ЗАДАЧА: Создай нарративную арку на ${days} дней. Арка должна иметь внутреннюю драматургию — не линейный рост, а живое движение: спад, поворот, прорыв. Каждый день — один нарративный бит + один пост для Threads.

Важно:
- Каждый день опирается на предыдущий (сквозная история)
- Состояние персонажа меняется нелинейно (есть тёмные моменты)
- Посты — от первого лица, 2-4 предложения, 0-1 эмодзи
- Форматы чередовать: микро-история / горячее мнение / уязвимый / вопрос-триггер

Верни ТОЛЬКО валидный JSON без markdown:
[{
  "day": 1,
  "title": "короткий заголовок дня (5-7 слов)",
  "beat": "нарративный бит — что происходит внутри (2-3 предложения)",
  "emotion": "одно слово — главная эмоция дня",
  "intensity": 0-100,
  "stateNote": "короткая заметка об изменении состояния",
  "post": "текст поста для Threads",
  "format": "название формата",
  "tag": "одно_слово_тег",
  "arcPhase": "спуск | плато | поворот | подъём | прорыв"
}]`;
  };

  const generate = async () => {
    setGenning(true); setArc([]); setSelDay(null);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:3000,
          messages:[{role:"user", content:buildArcPrompt()}] }),
      });
      const d = await r.json();
      if (d.error) { console.error("Anthropic API error:", d.error); setGenning(false); return; }
      const txt = d.content?.map(i=>i.text||"").join("")||"";
      setArc(JSON.parse(txt.replace(/```json/g,"").replace(/```/g,"").trim()));
    } catch(e) { console.error(e); }
    setGenning(false);
  };

  const PHASE_C = { спуск:"#EF4444", плато:C.muted, поворот:"#F59E0B", подъём:"#10B981", прорыв:C.terra };
  const PHASE_ICO = { спуск:"↘", плато:"→", поворот:"↗", подъём:"↑", прорыв:"⚡" };

  // SVG arc path between days
  const arcSVGPath = (items) => {
    if(!items.length) return "";
    const W=860, H=120, pad=40;
    const step=(W-pad*2)/(items.length-1||1);
    const pts = items.map((d,i)=>{
      const x=pad+i*step;
      const y=H/2 - ((d.intensity||50)-50)*0.7;
      return `${x},${y}`;
    });
    return `M ${pts.join(" L ")}`;
  };

  return (
    <div style={{animation:"fadeUp .3s ease"}}>

      {/* Header */}
      <div style={{
        background:`radial-gradient(ellipse at 20% 50%, ${aura.c1}10 0%, transparent 55%), rgba(255,255,255,0.03)`,
        borderRadius:20, border:"1px solid rgba(168,192,255,0.07)",
        boxShadow:"0 4px 40px rgba(0,0,0,0.4)", padding:"20px 20px 18px", marginBottom:10,
      }}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3.5,color:"#4A5570",textTransform:"uppercase",marginBottom:16}}>Нарративная арка</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14}}>
          <div style={{background:"rgba(128,255,204,0.05)", borderRadius:12, padding:"12px 14px", border:"1px solid rgba(128,255,204,0.14)"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:7.5,fontWeight:700,letterSpacing:2,color:"#80FFCC",textTransform:"uppercase",marginBottom:7}}>▶ Точка А — сейчас</div>
            <textarea value={ptA} onChange={e=>setPtA(e.target.value)}
              style={{width:"100%", background:"transparent", border:"none", outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:"#C8D4F0", resize:"none", lineHeight:1.6, minHeight:52}}/>
          </div>
          <div style={{background:"rgba(128,224,255,0.05)", borderRadius:12, padding:"12px 14px", border:"1px solid rgba(128,224,255,0.14)"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:7.5,fontWeight:700,letterSpacing:2,color:"#80E0FF",textTransform:"uppercase",marginBottom:7}}>◼ Точка Б — цель</div>
            <textarea value={ptB} onChange={e=>setPtB(e.target.value)}
              style={{width:"100%", background:"transparent", border:"none", outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:"#C8D4F0", resize:"none", lineHeight:1.6, minHeight:52}}/>
          </div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#4A5570"}}>Дней:</span>
          {[5,7,10].map(n=>(
            <button key={n} onClick={()=>setDays(n)}
              style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:n===days?700:400,
                color:n===days?"#060914":"#7888AA",
                background:n===days?"#A8C0FF":"rgba(168,192,255,0.06)",
                border:`1px solid ${n===days?"transparent":"rgba(168,192,255,0.12)"}`,
                borderRadius:8, padding:"6px 16px", cursor:"pointer", transition:"all .15s",
                boxShadow:n===days?"0 0 14px rgba(168,192,255,0.35)":"none"}}>
              {n}
            </button>
          ))}
          <button onClick={generate} disabled={genning}
            style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,
              color:genning?"#4A5570":"#A8C0FF",
              background:genning?"rgba(168,192,255,0.06)":"rgba(168,192,255,0.1)",
              border:`1px solid ${genning?"rgba(168,192,255,0.1)":"rgba(168,192,255,0.28)"}`,
              borderRadius:12, padding:"11px", cursor:genning?"wait":"pointer",
              boxShadow:genning?"none":"0 0 24px rgba(168,192,255,0.12)",
              letterSpacing:0.5, transition:"all .2s"}}>
            {genning ? "⟳ Строю арку..." : "🗺 Сгенерировать арку"}
          </button>
        </div>
      </div>

      {/* Arc visualization */}
      {arc.length > 0 && (
        <>
          {/* Emotion curve SVG */}
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:18,border:"1px solid rgba(168,192,255,0.07)",padding:"18px 20px",marginBottom:10}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3,color:"#4A5570",textTransform:"uppercase",marginBottom:12}}>Кривая арки</div>
            <svg viewBox="0 0 860 130" style={{width:"100%", height:"auto", display:"block", overflow:"visible"}}>
              <defs>
                <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor={C.sage}/>
                  <stop offset="40%"  stopColor={C.danger}/>
                  <stop offset="70%"  stopColor={C.amber}/>
                  <stop offset="100%" stopColor={C.teal}/>
                </linearGradient>
                <filter id="arcGlow"><feGaussianBlur stdDeviation="3" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              {/* Grid lines */}
              {[25,50,75].map(y=>(
                <line key={y} x1="30" y1={130-y*0.9} x2="830" y2={130-y*0.9}
                  stroke="rgba(59,111,255,0.05)" strokeWidth="1" strokeDasharray="4 8"/>
              ))}
              {/* Baseline */}
              <line x1="30" y1="65" x2="830" y2="65" stroke="rgba(59,111,255,0.08)" strokeWidth="1"/>

              {/* Arc path glow */}
              <path d={arcSVGPath(arc)} fill="none"
                stroke="rgba(59,111,255,0.15)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Arc path main */}
              <path d={arcSVGPath(arc)} fill="none"
                stroke="url(#arcGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                filter="url(#arcGlow)"/>

              {/* Day nodes */}
              {arc.map((d,i)=>{
                const step=(860-80)/(arc.length-1||1);
                const x=40+i*step;
                const y=65-((d.intensity||50)-50)*0.7;
                const ec=emoColor(d.emotion);
                const isSel=selDay===i;
                return (
                  <g key={i} onClick={()=>setSelDay(selDay===i?null:i)} style={{cursor:"pointer"}}>
                    {isSel && <circle cx={x} cy={y} r={18} fill={ec} opacity="0.15"/>}
                    <circle cx={x} cy={y} r={isSel?10:7}
                      fill={isSel?ec:"rgba(4,10,22,0.9)"} stroke={ec} strokeWidth={isSel?2:1.5}
                      style={{filter:`drop-shadow(0 0 ${isSel?8:4}px ${ec})`}}/>
                    <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle"
                      fontFamily={F.b} fontSize="7" fill={isSel?"#000":ec} fontWeight="700">
                      {d.day}
                    </text>
                    {/* Phase icon */}
                    <text x={x} y={y-15} textAnchor="middle"
                      fontFamily={F.b} fontSize="9" fill={PHASE_C[d.arcPhase]||C.muted} opacity="0.8">
                      {PHASE_ICO[d.arcPhase]||"·"}
                    </text>
                    {/* Day title (short) below */}
                    <text x={x} y={120} textAnchor="middle" fontFamily={F.b} fontSize="6.5" fill={isSel?C.terra:C.muted}>
                      {(d.title||"").split(" ").slice(0,3).join(" ")}
                    </text>
                  </g>
                );
              })}

              {/* A → B labels */}
              <text x="40"  y="10" textAnchor="middle" fontFamily={F.b} fontSize="8" fill={C.sage} fontWeight="700">А</text>
              <text x="820" y="10" textAnchor="middle" fontFamily={F.b} fontSize="8" fill={C.teal} fontWeight="700">Б</text>
            </svg>

            {/* Phase legend */}
            <div style={{display:"flex", gap:12, marginTop:8, flexWrap:"wrap"}}>
              {Object.entries(PHASE_C).map(([ph,col])=>(
                <div key={ph} style={{display:"flex", alignItems:"center", gap:4}}>
                  <span style={{...u(10,col), fontWeight:700}}>{PHASE_ICO[ph]}</span>
                  <span style={u(8.5,C.muted)}>{ph}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day cards strip */}
          <div style={{display:"grid", gridTemplateColumns:`repeat(${Math.min(arc.length,5)},1fr)`, gap:6, marginBottom:8}}>
            {arc.map((d,i)=>{
              const ec = emoColor(d.emotion);
              const isSel = selDay===i;
              return (
                <div key={i} onClick={()=>setSelDay(selDay===i?null:i)}
                  className="glass-card"
                  style={{background:"rgba(255,255,255,0.03)",borderRadius:14,border:"1px solid rgba(168,192,255,0.07)",padding:"10px 12px",cursor:"pointer",
                    background:isSel?`rgba(${ec==='#00F0C0'?'0,240,200':''}${ec==='#FF4455'?'255,68,85':''}${ec==='#00E87A'?'0,232,122':''}${ec==='#FFB800'?'255,184,0':''}${ec==='#00C8FF'?'0,200,255':''}${ec==='#FF2D78'?'255,45,120':''}${ec==='#4A6A9A'?'74,106,154':''}${ec==='#FF6B35'?'255,107,53':''},0.08)`:"rgba(4,10,22,0.97)",
                    boxShadow:isSel?`0 0 16px ${ec}33, 0 4px 20px rgba(0,0,0,0.5)`:"none",
                    transition:"all .2s",
                  }}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5}}>
                    <div style={{...u(8,C.muted), letterSpacing:1}}>ДЕНЬ {d.day}</div>
                    <div style={{...u(7.5,PHASE_C[d.arcPhase]||C.muted), fontWeight:700}}>{PHASE_ICO[d.arcPhase]} {d.arcPhase}</div>
                  </div>
                  <div style={{...u(9.5,isSel?ec:C.ink2,600), marginBottom:4, lineHeight:1.3}}>{d.title}</div>
                  <div style={{display:"flex", alignItems:"center", gap:4}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:ec,boxShadow:`0 0 6px ${ec}`}}/>
                    <span style={u(8,ec)}>{d.emotion}</span>
                    <span style={{...u(8,C.muted), marginLeft:"auto"}}>{d.intensity}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selDay !== null && arc[selDay] && (() => {
            const d = arc[selDay];
            const ec = emoColor(d.emotion);
            const isSaved = saved[selDay];
            return (
              <div style={{...card(), border:`1px solid ${ec}33`,
                boxShadow:`0 0 30px ${ec}18, 0 4px 24px rgba(0,0,0,0.6)`,
                animation:"fadeUp .25s ease"}}>
                {/* Header */}
                <div style={{padding:"14px 18px", borderBottom:`1px solid rgba(59,111,255,0.08)`,
                  background:`linear-gradient(135deg,${ec}0A,transparent)`}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <div style={{...u(8,C.muted), letterSpacing:2}}>ДЕНЬ {d.day} · {d.arcPhase?.toUpperCase()}</div>
                    <div style={{display:"flex", gap:6, alignItems:"center"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:ec,boxShadow:`0 0 8px ${ec}`}}/>
                      <span style={{...u(9,ec,700)}}>{d.emotion?.toUpperCase()} {d.intensity}%</span>
                    </div>
                  </div>
                  <div style={{...serif(18,C.ink,700), marginTop:6}}>{d.title}</div>
                </div>

                <div style={{padding:"14px 18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
                  {/* Narrative beat */}
                  <div>
                    <div style={{...u(7.5,C.muted), letterSpacing:2, marginBottom:6, fontWeight:600}}>НАРРАТИВНЫЙ БИТ</div>
                    <div style={{...u(11.5,C.ink2), lineHeight:1.65, fontStyle:"italic",
                      borderLeft:`2px solid ${ec}55`, paddingLeft:10}}>
                      {d.beat}
                    </div>
                    {d.stateNote && (
                      <div style={{...u(9.5,C.muted), marginTop:8, padding:"5px 9px",
                        background:"rgba(59,111,255,0.04)", borderRadius:7,
                        border:"1px solid rgba(59,111,255,0.1)"}}>
                        📊 {d.stateNote}
                      </div>
                    )}
                  </div>

                  {/* Post */}
                  <div>
                    <div style={{...u(7.5,C.terra), letterSpacing:2, marginBottom:6, fontWeight:600}}>ПОСТ ДЛЯ THREADS</div>
                    <div style={{background:"rgba(59,111,255,0.04)", borderRadius:10,
                      border:"1px solid rgba(59,111,255,0.1)", padding:"10px 13px", marginBottom:8}}>
                      <div style={{display:"flex", gap:4, marginBottom:6, flexWrap:"wrap"}}>
                        {d.format&&<span style={{...u(7.5,C.clay,700),background:"rgba(108,79,232,0.1)",padding:"1px 6px",borderRadius:4,border:"1px solid rgba(108,79,232,0.2)"}}>{d.format}</span>}
                        {d.tag&&<span style={{...u(7.5,C.teal),background:"rgba(6,182,212,0.08)",padding:"1px 6px",borderRadius:4,border:"1px solid rgba(6,182,212,0.15)"}}>#{d.tag}</span>}
                      </div>
                      <div style={{...serif(13.5,C.ink), lineHeight:1.7, whiteSpace:"pre-line"}}>{d.post}</div>
                    </div>
                    <div style={{display:"flex", gap:6}}>
                      <button onClick={()=>navigator.clipboard?.writeText(d.post)}
                        style={{...u(9,C.muted),background:"rgba(59,111,255,0.04)",border:"1px solid rgba(59,111,255,0.1)",borderRadius:6,padding:"5px 10px",cursor:"pointer"}}>📋 Копировать</button>
                      <button onClick={()=>{
                        onSave({id:uid(),personaId:persona.id,platform:"threads",
                          text:d.post,format:d.format||"",topic:d.title||"",
                          tag:d.tag||"",why:`День ${d.day} арки: ${d.beat?.slice(0,60)}...`,
                          status:"draft",createdAt:now()});
                        setSaved(p=>({...p,[selDay]:true}));
                      }} style={{...u(9,isSaved?C.muted:C.bg,600),
                        background:isSaved?"rgba(59,111,255,0.06)":C.sage,
                        border:`1px solid ${isSaved?"rgba(59,111,255,0.12)":"transparent"}`,
                        borderRadius:6,padding:"5px 10px",cursor:"pointer",
                        boxShadow:isSaved?"none":`0 0 10px ${C.sage}88`}}>
                        {isSaved?"✓ Сохранено":"＋ В библиотеку"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div style={{padding:"8px 18px", borderTop:"1px solid rgba(59,111,255,0.06)",
                  display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <button onClick={()=>setSelDay(Math.max(0,selDay-1))} disabled={selDay===0}
                    style={{...u(10,selDay===0?C.muted:C.terra),background:"none",border:"none",cursor:selDay===0?"default":"pointer",opacity:selDay===0?0.3:1}}>
                    ← День {selDay}
                  </button>
                  <div style={{display:"flex", gap:4}}>
                    {arc.map((_,i)=>(
                      <div key={i} onClick={()=>setSelDay(i)}
                        style={{width:i===selDay?20:6,height:6,borderRadius:3,
                          background:i===selDay?emoColor(arc[i].emotion):"rgba(59,111,255,0.15)",
                          cursor:"pointer",transition:"all .2s"}}/>
                    ))}
                  </div>
                  <button onClick={()=>setSelDay(Math.min(arc.length-1,selDay+1))} disabled={selDay===arc.length-1}
                    style={{...u(10,selDay===arc.length-1?C.muted:C.terra),background:"none",border:"none",cursor:selDay===arc.length-1?"default":"pointer",opacity:selDay===arc.length-1?0.3:1}}>
                    День {selDay+2} →
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Save all to library */}
          {arc.length > 0 && (
            <div style={{marginTop:10,textAlign:"center"}}>
              <button onClick={()=>{
                arc.forEach((d,i)=>onSave({id:uid(),personaId:persona.id,platform:"threads",
                  text:d.post,format:d.format||"",topic:d.title||"",
                  tag:d.tag||"",why:`День ${d.day} арки: ${d.beat?.slice(0,60)}...`,
                  status:"draft",createdAt:now()}));
                setSaved(Object.fromEntries(arc.map((_,i)=>[i,true])));
              }} className="neon-btn"
                style={{...u(11,C.bg,700),background:`linear-gradient(135deg,${C.teal},rgba(0,160,200,0.85))`,
                  border:"none",borderRadius:12,padding:"10px 28px",cursor:"pointer",
                  boxShadow:`0 0 20px rgba(6,182,212,0.3)`, transition:"all .2s"}}>
                📚 Сохранить всю арку в библиотеку ({arc.length} постов)
              </button>
            </div>
          )}
        </>
      )}

      {arc.length === 0 && !genning && (
        <div style={{background:"rgba(255,255,255,0.03)",borderRadius:18,border:"1px solid rgba(168,192,255,0.06)",padding:"56px 40px",textAlign:"center"}}>
          <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:28,color:"rgba(168,192,255,0.1)",marginBottom:14,letterSpacing:"0.04em"}}>А → Б</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#4A5570"}}>Задай точку А и точку Б — Claude построит путь</div>
        </div>
      )}
    </div>
  );
}

// ── LIBRARY TAB ───────────────────────────────────────────
const StatusDot = {
  draft:    {bg:"rgba(59,111,255,0.08)",  col:C.muted, label:"Черновик",     border:"rgba(59,111,255,0.15)"},
  approved: {bg:"rgba(16,185,129,0.1)",   col:"#10B981",label:"Готово",       border:"rgba(16,185,129,0.25)"},
  published:{bg:"rgba(6,182,212,0.1)",   col:"#06B6D4", label:"Опубликовано",border:"rgba(6,182,212,0.25)"},
};
function LibraryTab({personaId, content, onStatusChange, onDelete}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const items = content
    .filter(c=>c.personaId===personaId)
    .filter(c=>filter==="all"||c.status===filter)
    .filter(c=>!search||c.text.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по тексту..."
          style={{flex:1,border:"1px solid rgba(168,192,255,0.12)",borderRadius:12,padding:"9px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#C8D4F0",outline:"none",background:"rgba(168,192,255,0.04)"}}/>
        <div style={{display:"flex",gap:4}}>
          {["all","draft","approved","published"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:9.5,fontWeight:filter===s?700:400,color:filter===s?"#060914":"#7888AA",
              background:filter===s?"#A8C0FF":"rgba(168,192,255,0.06)",
              border:`1px solid ${filter===s?"transparent":"rgba(168,192,255,0.1)"}`,
              borderRadius:7,padding:"7px 11px",cursor:"pointer",transition:"all .15s",
              boxShadow:filter===s?`0 0 12px rgba(59,111,255,0.3)`:"none"}}>
              {s==="all"?"Все":StatusDot[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {items.length===0&&<div style={{...card(),padding:"32px",textAlign:"center",...u(13,C.muted),fontStyle:"italic"}}>
        {search?"Ничего не найдено":"Библиотека пуста — генерируй контент в Studio"}
      </div>}

      {items.map((item,i)=>(
        <div key={item.id} style={{...card({marginBottom:7}),animation:`fadeUp .2s ease ${i*.04}s both`}} className="glass-card">
          <div style={{padding:"12px 16px"}}>
            <div style={{display:"flex",gap:6,marginBottom:7,alignItems:"center"}}>
              {item.format&&<span style={{...u(8,C.clay,700),background:"rgba(108,79,232,0.12)",padding:"2px 7px",borderRadius:5,border:"1px solid rgba(108,79,232,0.2)"}}>{item.format}</span>}
              {item.tag   &&<span style={{fontFamily:F.b,fontSize:10,fontWeight:500,color:C.teal,background:"rgba(8,145,178,0.07)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(8,145,178,0.15)"}}>#{item.tag}</span>}
              <span style={{...u(8,StatusDot[item.status]?.col||C.muted),background:StatusDot[item.status]?.bg||"transparent",padding:"2px 7px",borderRadius:5,border:`1px solid ${StatusDot[item.status]?.border||"transparent"}`}}>{StatusDot[item.status]?.label}</span>
              <div style={{flex:1}}/>
              <span style={u(8,C.muted)}>{fmtDate(item.createdAt)}</span>
            </div>
            <div style={{...serif(14.5,C.ink),lineHeight:1.7,whiteSpace:"pre-line"}}>{item.text}</div>
            {item.why&&<div style={{...u(9,C.muted),padding:"5px 9px",background:"rgba(59,111,255,0.04)",borderRadius:7,borderLeft:"2px solid rgba(59,111,255,0.25)",marginTop:7}}>💡 {item.why}</div>}
          </div>
          <div style={{borderTop:"1px solid rgba(59,111,255,0.08)",padding:"8px 16px",display:"flex",gap:6,background:"rgba(59,111,255,0.02)"}}>
            <button onClick={()=>navigator.clipboard?.writeText(item.text)} style={{...u(9,C.muted),background:"none",border:"1px solid rgba(59,111,255,0.1)",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>📋 Копировать</button>
            {item.status!=="approved"  &&<button onClick={()=>onStatusChange(item.id,"approved")}  style={{...u(9,C.sage,600),background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>✓ Одобрить</button>}
            {item.status!=="published" &&<button onClick={()=>onStatusChange(item.id,"published")} style={{...u(9,C.teal,600),background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.2)",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>🚀 Опубликован</button>}
            {item.status!=="draft"     &&<button onClick={()=>onStatusChange(item.id,"draft")}     style={{...u(9,C.muted),background:"rgba(59,111,255,0.04)",border:"1px solid rgba(59,111,255,0.1)",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>← Черновик</button>}
            <div style={{flex:1}}/>
            <button onClick={()=>onDelete(item.id)} style={{...u(9,C.danger),background:"none",border:"none",cursor:"pointer",opacity:0.6,transition:"opacity .15s"}} onMouseOver={e=>e.currentTarget.style.opacity="1"} onMouseOut={e=>e.currentTarget.style.opacity="0.6"}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CREATE PERSONA MODAL ──────────────────────────────────
const HAIR_COLORS = [["#C45518","Медно-рыжий"],["#2A1A0A","Тёмно-коричневый"],["#8B5E3C","Каштановый"],["#E8C878","Блонд"],["#F0E0C0","Платиновый"],["#1A1A1A","Чёрный"],["#888","Серебристый"]];
const EYE_COLORS  = [["#7AAAD4","Голубые"],["#5A8A5A","Зелёные"],["#6A4A2A","Карие"],["#3A5A7A","Синие"],["#888","Серые"],["#4A2A0A","Тёмно-карие"]];

function CreateModal({onClose, onCreate}) {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({
    name:"",handle:"",brand:"The Legend",city:"",age:"",bio:"",
    appearance:{hair:"#C45518",eyes:"#7AAAD4",freckles:true,skin:"#F5D0B0",hairType:"curly"},
    template:"lera",
    niches:["fashion","travel","self"],
    formats:["story","hot","reply","vuln"],
    context:"",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const setAp = (k,v) => setForm(p=>({...p,appearance:{...p.appearance,[k]:v}}));

  const submit = () => {
    const soul = form.template==="lera" ? LERA_SOUL : EMPTY_SOUL();
    const persona = {
      id: uid(), name:form.name, handle:form.handle||form.name.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z_]/g,""),
      brand:form.brand, city:form.city, age:form.age, bio:form.bio,
      appearance:form.appearance, soul, state:{...ST_DEF},
      niches:form.niches, formats:form.formats, context:form.context,
      createdAt:now(),
    };
    onCreate(persona);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(14,30,70,0.45)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(10px)"}}>
      <div style={{background:"rgba(8,12,26,0.97)",border:"1px solid rgba(168,192,255,0.1)",borderRadius:18,width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.7),0 0 60px rgba(168,192,255,0.05)"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid rgba(168,192,255,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:17,fontWeight:700,color:"#F0F4FF",letterSpacing:"0.02em"}}>Новая персона</div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            {[1,2,3].map(s=><div key={s} style={{width:s===step?22:8,height:8,borderRadius:4,background:s<=step?"#A8C0FF":"rgba(168,192,255,0.1)",transition:"all .2s",boxShadow:s===step?"0 0 10px rgba(168,192,255,0.5)":"none"}}/>)}
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#4A5570",lineHeight:1,transition:"color .15s"}} onMouseOver={e=>e.currentTarget.style.color="#F0F4FF"} onMouseOut={e=>e.currentTarget.style.color="#4A5570"}>×</button>
          </div>
        </div>
        <div style={{padding:"20px 24px"}}>
          {step===1 && (
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3,color:"#4A5570",textTransform:"uppercase",marginBottom:16}}>Основная информация</div>
              {[{k:"name",ph:"Имя и фамилия",req:true},{k:"handle",ph:"handle (без @)"},{k:"brand",ph:"Бренд"},{k:"city",ph:"Город"},{k:"age",ph:"Возраст"}].map(f=>(
                <div key={f.k} style={{marginBottom:10}}>
                  <input value={form[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.ph+(f.req?" *":"")}
                    style={{width:"100%",border:"1px solid rgba(168,192,255,0.12)",borderRadius:10,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#C8D4F0",outline:"none",background:"rgba(168,192,255,0.04)"}}/>
                </div>
              ))}
              <textarea value={form.bio} onChange={e=>set("bio",e.target.value)} placeholder="Кратко о персоне..."
                style={{width:"100%",border:"1px solid rgba(168,192,255,0.12)",borderRadius:10,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#C8D4F0",outline:"none",background:"rgba(168,192,255,0.04)",resize:"vertical",minHeight:64}}/>
            </div>
          )}
          {step===2 && (
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3,color:"#4A5570",textTransform:"uppercase",marginBottom:16}}>Внешность</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                <Avatar ap={form.appearance} size={100}/>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8.5,color:"#7888AA",letterSpacing:1.5,marginBottom:8}}>ЦВЕТ ВОЛОС</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {HAIR_COLORS.map(([col,name])=>(
                    <button key={col} onClick={()=>setAp("hair",col)} title={name}
                      style={{width:28,height:28,borderRadius:"50%",background:col,cursor:"pointer",border:form.appearance.hair===col?`3px solid ${C.ink}`:`2px solid transparent`,transition:"all .15s"}}/>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8.5,color:"#7888AA",letterSpacing:1.5,marginBottom:8}}>ЦВЕТ ГЛАЗ</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {EYE_COLORS.map(([col,name])=>(
                    <button key={col} onClick={()=>setAp("eyes",col)} title={name}
                      style={{width:28,height:28,borderRadius:"50%",background:col,cursor:"pointer",border:form.appearance.eyes===col?`3px solid ${C.ink}`:`2px solid transparent`,transition:"all .15s"}}/>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:16,alignItems:"center"}}>
                <label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#C8D4F0"}}>
                  <input type="checkbox" checked={form.appearance.freckles} onChange={e=>setAp("freckles",e.target.checked)}/>
                  Веснушки
                </label>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#7888AA",marginLeft:"auto",marginRight:8}}>Тип волос:</div>
                {[["curly","кудри"],["wavy","волны"],["straight","прямые"]].map(([t,n])=>(
                  <button key={t} onClick={()=>setAp("hairType",t)} style={{...u(10,form.appearance.hairType===t?"#0A1628":C.muted),background:form.appearance.hairType===t?C.terra:C.smoke,border:"none",borderRadius:7,padding:"5px 9px",cursor:"pointer"}}>{n}</button>
                ))}
              </div>
            </div>
          )}
          {step===3 && (
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:3,color:"#4A5570",textTransform:"uppercase",marginBottom:16}}>Шаблон души</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[{k:"lera",name:"Лера Вельская",desc:"Готовый архетип Муза+Исследователь (The Legend)"},{k:"empty",name:"Чистая душа",desc:"Заполнить вручную"}].map(t=>(
                  <div key={t.k} onClick={()=>set("template",t.k)}
                    style={{padding:"14px",borderRadius:12,border:`2px solid ${form.template===t.k?"#A8C0FF":"rgba(168,192,255,0.1)"}`,cursor:"pointer",background:form.template===t.k?"rgba(168,192,255,0.1)":"rgba(168,192,255,0.03)",transition:"all .2s"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#F0F4FF"}}>{t.name}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10.5,color:"#4A5570",marginTop:4,lineHeight:1.4}}>{t.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{...u(11,C.muted),marginBottom:8}}>Стартовые ниши:</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {NICHES_DEF.map(n=>(
                  <button key={n.id} onClick={()=>set("niches",form.niches.includes(n.id)?form.niches.filter(x=>x!==n.id):[...form.niches,n.id])}
                    style={{...u(10.5),padding:"5px 11px",borderRadius:8,cursor:"pointer",border:"none",background:form.niches.includes(n.id)?C.terra:C.smoke,color:form.niches.includes(n.id)?"#0A1628":C.muted,transition:"all .15s"}}>
                    {n.icon} {n.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{padding:"16px 24px",borderTop:`1px solid ${C.smoke}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
          {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{...u(12,C.muted),background:C.smoke,border:"none",borderRadius:10,padding:"10px 20px",cursor:"pointer"}}>← Назад</button>}
          {step<3&&<button onClick={()=>setStep(s=>s+1)} disabled={step===1&&!form.name} style={{...u(12,"#0A1628",600),background:step===1&&!form.name?"#CCC":C.terra,border:"none",borderRadius:10,padding:"10px 20px",cursor:step===1&&!form.name?"not-allowed":"pointer",flex:1}}>Далее →</button>}
          {step===3&&<button onClick={submit} style={{...u(12,"#0A1628",600),background:`linear-gradient(135deg,${C.terra},#A8501C)`,border:"none",borderRadius:10,padding:"10px 24px",cursor:"pointer",flex:1}}>✨ Создать персону</button>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════
export default function PersonaOS() {
  const [personas, setPersonas] = useState([]);
  const [content,  setContent]  = useState([]);
  const [selId,    setSelId]    = useState(null);
  const [tab,      setTab]      = useState("studio");
  const [creating, setCreating] = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [delConfirm, setDelConfirm] = useState(null);

  // ── LOAD ─────────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      try {
        const [pr,cr] = await Promise.allSettled([
          loadData("os_personas"),
          loadData("os_content"),
        ]);
        const savedPersonas = pr.status==="fulfilled"&&pr.value ? pr.value : null;
        const savedContent  = cr.status==="fulfilled"&&cr.value ? cr.value : null;

        if(savedPersonas?.length) {
          setPersonas(savedPersonas);
          setSelId(savedPersonas[0].id);
        } else {
          // Seed with Lera
          const lera = {
            id:uid(), name:"Лера Вельская", handle:"lera.velskaya", brand:"The Legend",
            city:"Стамбул (из Екатеринбурга)", age:"30", bio:"Руководитель клиентского сервиса. Год назад переехала в путешествие. 30 стран — 30 историй.",
            appearance:{hair:"#C45518",eyes:"#7AAAD4",freckles:true,skin:"#F5D0B0",hairType:"curly"},
            soul:LERA_SOUL, state:{...ST_DEF},
            niches:["fashion","travel","self"],formats:["story","hot","reply","vuln"],
            context:"Стамбул, день 47. Через 3 дня — Грузия. Вчера звонила мама.",
            createdAt:now(),
          };
          setPersonas([lera]); setSelId(lera.id);
        }
        if(savedContent?.length) setContent(savedContent);
      } catch(e){ console.log("Storage init:",e); }
      setLoaded(true);
    })();
  },[]);

  // ── SAVE ─────────────────────────────────────────────
  useEffect(()=>{
    if(!loaded) return;
    saveData("os_personas", personas).catch(()=>{});
  },[personas,loaded]);
  useEffect(()=>{
    if(!loaded) return;
    saveData("os_content", content).catch(()=>{});
  },[content,loaded]);

  // ── PERSONA CRUD ──────────────────────────────────────
  const createPersona = p => {
    setPersonas(prev=>[...prev,p]);
    setSelId(p.id); setCreating(false); setTab("soul");
  };
  const updatePersona = (id,key,val) => setPersonas(prev=>prev.map(p=>p.id===id?{...p,[key]:val}:p));
  const deletePersona = id => {
    setPersonas(prev=>{
      const next=prev.filter(p=>p.id!==id);
      setSelId(next[0]?.id||null);
      return next;
    });
    setContent(prev=>prev.filter(c=>c.personaId!==id));
    setDelConfirm(null);
  };

  // ── CONTENT CRUD ─────────────────────────────────────
  const saveContent = item => setContent(prev=>[item,...prev]);
  const updateStatus = (id,status) => setContent(prev=>prev.map(c=>c.id===id?{...c,status}:c));
  const deleteContent = id => setContent(prev=>prev.filter(c=>c.id!==id));

  const sel = personas.find(p=>p.id===selId);
  const aura = sel ? computeAura(sel.state||ST_DEF) : null;

  // ── STATS ─────────────────────────────────────────────
  const stats = {
    total:   content.filter(c=>c.personaId===selId).length,
    draft:   content.filter(c=>c.personaId===selId&&c.status==="draft").length,
    approved:content.filter(c=>c.personaId===selId&&c.status==="approved").length,
    published:content.filter(c=>c.personaId===selId&&c.status==="published").length,
  };

  if(!loaded) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"radial-gradient(ellipse 60% 50% at 30% 40%,rgba(100,120,255,0.12) 0%,transparent 60%), radial-gradient(ellipse 50% 60% at 70% 60%,rgba(160,100,255,0.08) 0%,transparent 55%), #060914"}}>
      <div style={{textAlign:"center",animation:"fadeIn .8s ease"}}>
        <div style={{width:60,height:60,borderRadius:18,background:"rgba(168,192,255,0.08)",border:"1px solid rgba(168,192,255,0.2)",margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 40px rgba(168,192,255,0.15)"}}>
          <span style={{fontFamily:"'Unbounded',sans-serif",fontSize:24,color:"#A8C0FF",fontWeight:900}}>S</span>
        </div>
        <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:16,fontWeight:900,color:"#F0F4FF",letterSpacing:"0.08em",marginBottom:6}}>SOUL AI</div>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:16}}>
          {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#A8C0FF",animation:`dotPulse 1.4s ease ${i*0.2}s infinite`,boxShadow:"0 0 8px #A8C0FF"}}/>)}
        </div>
      </div>
    </div>
  );

  const TABS = [{id:"soul",l:"✦ Душа"},{id:"mind",l:"◉ Сознание"},{id:"arc",l:"↗ Арка"},{id:"studio",l:"⚡ Studio"},{id:"library",l:"◻ Библиотека"}];

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:F.b,background:"#060914",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Unbounded:wght@400;600;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp   {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
        @keyframes twinkle  {0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        @keyframes aurapulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.8;transform:scale(1.08)}}
        @keyframes dotPulse {0%,80%,100%{transform:scale(.4);opacity:.2}40%{transform:scale(1);opacity:1}}
        @keyframes nebulaDrift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(8px,-12px) scale(1.04)}100%{transform:translate(0,0) scale(1)}}
        @keyframes starPulse {0%,100%{filter:drop-shadow(0 0 3px currentColor)}50%{filter:drop-shadow(0 0 10px currentColor)}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(168,192,255,0.2);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(168,192,255,0.4)}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:3px;background:rgba(168,192,255,0.12);outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#060914;cursor:pointer;border:2px solid #A8C0FF;box-shadow:0 0 10px rgba(168,192,255,0.5)}
        input,textarea{color:#F0F4FF!important;font-family:'DM Sans',sans-serif!important;background:transparent}
        input::placeholder,textarea::placeholder{color:#4A5570!important}
        select{color-scheme:dark;color:#C8D4F0;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,0.04)}
        button{cursor:pointer;font-family:'DM Sans',sans-serif}
        button:focus{outline:none}
        .gc{background:rgba(255,255,255,0.03)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;border:1px solid rgba(255,255,255,0.07)!important;box-shadow:0 4px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)!important;border-radius:18px;transition:box-shadow .22s,transform .22s,border-color .22s}
        .gc:hover{border-color:rgba(168,192,255,0.15)!important;box-shadow:0 8px 40px rgba(0,0,0,0.5),0 0 30px rgba(168,192,255,0.06)!important;transform:translateY(-2px)}
        .si{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:all .18s;border:1px solid transparent}
        .si:hover{background:rgba(168,192,255,0.06)!important;border-color:rgba(168,192,255,0.12)!important}
        .si.active{background:rgba(168,192,255,0.08)!important;border-color:rgba(168,192,255,0.18)!important;box-shadow:0 0 20px rgba(168,192,255,0.08)}
        .tb{flex:1;border:none;background:none;padding:13px 6px;font-family:'DM Sans',sans-serif;font-size:11px;cursor:pointer;color:#4A5570;font-weight:400;position:relative;white-space:nowrap;transition:color .18s;letter-spacing:0.5px}
        .tb:hover{color:#A8C0FF}
        .tb.act{color:#F0F4FF;font-weight:600}
        .tb.act::after{content:'';position:absolute;bottom:0;left:25%;right:25%;height:1.5px;background:linear-gradient(90deg,#A8C0FF,#C4A8FF);border-radius:2px;box-shadow:0 0 8px rgba(168,192,255,0.5)}
        .btn{border:none;border-radius:12px;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
        .btn-star{background:rgba(168,192,255,0.1);border:1px solid rgba(168,192,255,0.25);color:#A8C0FF;box-shadow:0 0 20px rgba(168,192,255,0.08)}
        .btn-star:hover{background:rgba(168,192,255,0.18);box-shadow:0 0 30px rgba(168,192,255,0.2);transform:translateY(-1px)}
        .btn-star:disabled{opacity:.4;transform:none;box-shadow:none}
        .btn-ghost{background:transparent;border:1px dashed rgba(168,192,255,0.2);color:#7888AA;border-radius:11px}
        .btn-ghost:hover{border-color:rgba(168,192,255,0.4);color:#A8C0FF;background:rgba(168,192,255,0.05)}
        .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:600;font-family:'DM Sans',sans-serif;letter-spacing:0.4px}
        .seclabel{font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#4A5570}
        .field-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .field-row:last-child{border-bottom:none}
      `}</style>

      {/* ── Nebula bg blobs ── */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-20%",left:"-15%",width:"70vw",height:"70vw",borderRadius:"50%",
          background:"radial-gradient(circle,rgba(80,100,255,0.1) 0%,rgba(100,60,200,0.06) 40%,transparent 70%)",
          animation:"nebulaDrift 18s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"-25%",right:"-10%",width:"60vw",height:"60vw",borderRadius:"50%",
          background:"radial-gradient(circle,rgba(160,80,255,0.08) 0%,rgba(60,80,200,0.05) 40%,transparent 70%)",
          animation:"nebulaDrift 24s ease-in-out infinite reverse"}}/>
        <div style={{position:"absolute",top:"35%",right:"20%",width:"30vw",height:"30vw",borderRadius:"50%",
          background:"radial-gradient(circle,rgba(80,180,255,0.06) 0%,transparent 60%)",
          animation:"nebulaDrift 14s ease-in-out infinite 3s"}}/>
        {/* Star field */}
        {Array.from({length:60},(_,i)=>{
          const x=Math.sin(i*137.5)*50+50, y=Math.cos(i*97.3)*50+50;
          const s=Math.random()*1.5+0.4, op=Math.random()*0.5+0.2;
          return <div key={i} style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:s,height:s,borderRadius:"50%",background:"#fff",opacity:op,animation:`twinkle ${2+Math.random()*4}s ease-in-out infinite ${Math.random()*4}s`}}/>;
        })}
      </div>

      {/* ══ SIDEBAR ══════════════════════════════════════ */}
      <aside style={{
        width:sideOpen?248:58, flexShrink:0, position:"sticky", top:0, height:"100vh",
        display:"flex", flexDirection:"column", zIndex:20,
        background:"rgba(6,9,20,0.92)",
        backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)",
        borderRight:"1px solid rgba(168,192,255,0.07)",
        boxShadow:"6px 0 40px rgba(0,0,0,0.6)",
        transition:"width .28s cubic-bezier(.4,0,.2,1)", overflow:"hidden",
      }}>
        {/* Logo */}
        <div style={{padding:sideOpen?"20px 18px 16px":"18px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(168,192,255,0.06)"}}>
          <div style={{width:36,height:36,borderRadius:11,border:"1px solid rgba(168,192,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 20px rgba(168,192,255,0.12),inset 0 0 12px rgba(168,192,255,0.04)",background:"rgba(168,192,255,0.06)"}}>
            <span style={{fontFamily:"'Unbounded',sans-serif",fontSize:15,color:"#A8C0FF",fontWeight:900}}>S</span>
          </div>
          {sideOpen&&<div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:13,fontWeight:900,color:"#F0F4FF",letterSpacing:"0.06em",lineHeight:1}}>SOUL AI</div>
            <div style={{fontSize:8,color:"#4A5570",letterSpacing:2,marginTop:3,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase"}}>AINF · THE LEGEND</div>
          </div>}
          <button onClick={()=>setSideOpen(p=>!p)}
            style={{background:"rgba(168,192,255,0.06)",border:"1px solid rgba(168,192,255,0.1)",borderRadius:7,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",color:"#4A5570",fontSize:13,flexShrink:0,transition:"all .15s",marginLeft:"auto"}}
            onMouseOver={e=>{e.currentTarget.style.color="#A8C0FF";e.currentTarget.style.borderColor="rgba(168,192,255,0.3)"}}
            onMouseOut={e=>{e.currentTarget.style.color="#4A5570";e.currentTarget.style.borderColor="rgba(168,192,255,0.1)"}}>
            {sideOpen?"‹":"›"}
          </button>
        </div>

        {/* Persona list */}
        <div style={{flex:1,overflowY:"auto",padding:"12px 8px"}}>
          {sideOpen&&<div className="seclabel" style={{padding:"0 8px 10px",display:"block"}}>ПЕРСОНЫ</div>}
          {personas.map(p=>{
            const a=computeAura(p.state||ST_DEF);
            const active=selId===p.id;
            return (
              <div key={p.id} onClick={()=>setSelId(p.id)}
                className={`si${active?" active":""}`}
                style={{marginBottom:3,padding:sideOpen?"9px 10px":"8px 6px",justifyContent:sideOpen?"flex-start":"center"}}>
                <div style={{flexShrink:0,position:"relative",width:30,height:30}}>
                  <div style={{borderRadius:"50%",overflow:"hidden",width:30,height:30,border:`1px solid ${active?"rgba(168,192,255,0.35)":"rgba(255,255,255,0.06)"}`,transition:"border-color .2s"}}>
                    <Avatar ap={p.appearance||{}} size={30}/>
                  </div>
                  {active&&<div style={{position:"absolute",inset:-2,borderRadius:"50%",border:"1px solid rgba(168,192,255,0.25)",boxShadow:"0 0 12px rgba(168,192,255,0.2)"}}/>}
                </div>
                {sideOpen&&<div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:active?600:400,color:active?"#F0F4FF":"#7888AA",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"'DM Sans',sans-serif",letterSpacing:active?0.3:0}}>{p.name}</div>
                  <div style={{fontSize:9,color:"#4A5570",marginTop:1,fontFamily:"'DM Sans',sans-serif"}}>{p.brand}</div>
                </div>}
              </div>
            );
          })}
        </div>

        {/* Add */}
        <div style={{padding:"10px 8px",borderTop:"1px solid rgba(168,192,255,0.06)"}}>
          <button onClick={()=>setCreating(true)} className="btn btn-ghost"
            style={{width:"100%",padding:sideOpen?"9px 14px":"9px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:11}}>
            <span style={{fontSize:14,lineHeight:1,opacity:.7}}>✦</span>
            {sideOpen&&"Новая персона"}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,position:"relative",zIndex:1}}>
        {sel ? (
          <>
            {/* Header */}
            <header style={{
              position:"sticky",top:0,zIndex:19,flexShrink:0,
              background:"rgba(6,9,20,0.85)",
              backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",
              borderBottom:"1px solid rgba(168,192,255,0.07)",
              padding:"0 28px",height:60,display:"flex",alignItems:"center",gap:16,
            }}>
              <div style={{width:36,height:36,borderRadius:11,overflow:"hidden",border:"1px solid rgba(168,192,255,0.15)",boxShadow:"0 0 16px rgba(168,192,255,0.1)",flexShrink:0}}>
                <Avatar ap={sel.appearance||{}} size={36}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:13,fontWeight:700,color:"#F0F4FF",letterSpacing:"0.04em"}}>{sel.name}</div>
                <div style={{fontSize:9,color:"#4A5570",marginTop:2,fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5}}>@{sel.handle} · {sel.brand} · {sel.city}</div>
              </div>
              {/* Stats */}
              <div style={{display:"flex",gap:6}}>
                {[{n:stats.total,l:"постов",col:"#A8C0FF"},{n:stats.approved,l:"готово",col:"#80FFCC"},{n:stats.published,l:"опубл.",col:"#80E0FF"}].map(s=>(
                  <div key={s.l} style={{textAlign:"center",background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"5px 12px",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:15,fontWeight:700,color:s.col,textShadow:`0 0 12px ${s.col}66`,lineHeight:1.1}}>{s.n}</div>
                    <div style={{fontSize:8,color:"#4A5570",marginTop:2,fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5}}>{s.l}</div>
                  </div>
                ))}
              </div>
              {aura&&<div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.03)",borderRadius:20,padding:"5px 12px",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:aura.c2,boxShadow:`0 0 8px ${aura.c2}`}}/>
                <span style={{fontSize:9.5,fontWeight:600,color:aura.c2,fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5}}>{aura.label}</span>
              </div>}
              <button onClick={()=>setDelConfirm(sel.id)}
                style={{background:"none",border:"1px solid rgba(255,96,96,0.15)",borderRadius:8,padding:"5px 10px",fontSize:10,color:"#FF6060",transition:"all .18s"}}
                onMouseOver={e=>e.currentTarget.style.background="rgba(255,96,96,0.08)"}
                onMouseOut={e=>e.currentTarget.style.background="none"}>✕</button>
            </header>

            {/* Tab bar */}
            <div style={{position:"sticky",top:60,zIndex:18,flexShrink:0,
              background:"rgba(6,9,20,0.8)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
              borderBottom:"1px solid rgba(168,192,255,0.06)",
              padding:"0 24px",display:"flex",alignItems:"center",gap:2}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} className={`tb${tab===t.id?" act":""}`}>
                  {t.l}
                  {t.id==="library"&&stats.total>0&&<span style={{marginLeft:5,background:"rgba(168,192,255,0.15)",color:"#A8C0FF",borderRadius:20,padding:"0 5px",fontSize:9,fontWeight:700}}>{stats.total}</span>}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{flex:1,overflowY:"auto",padding:"20px 28px 60px"}}>
              <div style={{maxWidth:920,margin:"0 auto",animation:"fadeUp .35s ease"}}>
                {tab==="soul"    && <SoulEditor key={sel.id} persona={sel} onChange={(k,v)=>updatePersona(sel.id,k,v)}/>}
                {tab==="mind"    && <MindTab    key={sel.id} persona={sel} onChange={(k,v)=>updatePersona(sel.id,k,v)}/>}
                {tab==="arc"     && <ArcTab     key={sel.id} persona={sel} onSave={saveContent}/>}
                {tab==="studio"  && <StudioTab  key={sel.id} persona={sel} onSave={saveContent}/>}
                {tab==="library" && <LibraryTab personaId={sel.id} content={content} onStatusChange={updateStatus} onDelete={deleteContent}/>}
              </div>
            </div>
          </>
        ) : (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:40}}>
            <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:48,fontWeight:900,letterSpacing:"-0.03em",color:"rgba(168,192,255,0.12)",lineHeight:1,marginBottom:8,textShadow:"0 0 80px rgba(168,192,255,0.15)"}}>SOUL AI</div>
            <div style={{fontSize:14,color:"#4A5570",fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5}}>Создайте первую персону, чтобы начать</div>
            <button onClick={()=>setCreating(true)} className="btn btn-star" style={{marginTop:8,padding:"12px 28px",fontSize:14}}>✦ Создать персону</button>
          </div>
        )}
      </div>

      {creating && <CreateModal onClose={()=>setCreating(false)} onCreate={createPersona}/>}
      {delConfirm && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(16px)"}}>
          <div style={{background:"rgba(8,12,28,0.96)",backdropFilter:"blur(32px)",border:"1px solid rgba(255,96,96,0.15)",borderRadius:20,padding:"32px 36px",maxWidth:380,textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.7),0 0 40px rgba(255,96,96,0.08)"}}>
            <div style={{fontSize:32,marginBottom:16}}>⚠</div>
            <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:16,fontWeight:700,color:"#F0F4FF",marginBottom:10,letterSpacing:"0.04em"}}>Удалить персону?</div>
            <div style={{fontSize:12,color:"#7888AA",marginBottom:28,lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>Удалится весь контент этой персоны.<br/>Действие необратимо.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDelConfirm(null)} className="btn" style={{flex:1,background:"rgba(168,192,255,0.06)",color:"#7888AA",border:"1px solid rgba(168,192,255,0.1)"}}>Отмена</button>
              <button onClick={()=>deletePersona(delConfirm)} className="btn" style={{flex:1,background:"rgba(255,96,96,0.1)",color:"#FF6060",border:"1px solid rgba(255,96,96,0.2)",boxShadow:"0 0 20px rgba(255,96,96,0.1)"}}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
