import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cukxdfpohnwlymprtlmp.supabase.co";
const SUPABASE_KEY = "sb_publishable_jb2uwxN2Od231pGfsZL-rQ_A70ibaSE";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";

const T = {
  bg: "#F7F7F5", surface: "#FFFFFF", border: "#E8E8E4", border2: "#D0D0CA",
  text: "#111111", sub: "#6B6B6B", muted: "#ABABAB", black: "#111111",
  accent: "#2B2B2B", danger: "#C0392B", success: "#27AE60",
};

const DEFAULT_CATS = [
  { id: "food", label: "Food", color: "#3D3D3D", budget: "" },
  { id: "drinks", label: "Drinks", color: "#787878", budget: "" },
  { id: "transport", label: "Transport", color: "#1A1A1A", budget: "" },
  { id: "shopping", label: "Shopping", color: "#5C5C5C", budget: "" },
  { id: "entertainment", label: "Entertainment", color: "#9A9A9A", budget: "" },
  { id: "others", label: "Others", color: "#C4C4C4", budget: "" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TABS = ["Dashboard","Expenses","Savings","Net Worth","Goals","Settings"];
const USER_ID = "nisa";

const sgd = n => `S$${Number(n||0).toLocaleString("en-SG",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const toDay = () => new Date().toISOString().split("T")[0];
const moOf = d => (d||"").slice(0,7);
const thisMo = () => new Date().toISOString().slice(0,7);

async function readReceipt(b64, mime) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!apiKey) throw new Error("No API key configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mime, data: b64 } },
        { type: "text", text: "Extract info from this receipt. Return ONLY valid JSON (no markdown): {\"merchant\":\"string\",\"amount\":number,\"category\":\"food|drinks|transport|shopping|entertainment|others\",\"date\":\"YYYY-MM-DD\",\"note\":\"string\"}. Use null for unknown." }
      ]}]
    })
  });
  const d = await res.json();
  const txt = d.content?.find(b => b.type === "text")?.text || "{}";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}

function Btn({ children, onClick, variant="primary", size="md", style:sx={}, disabled }) {
  const s = {
    display:"inline-flex", alignItems:"center", justifyContent:"center",
    fontFamily:"'DM Sans',sans-serif", fontWeight:600,
    cursor:disabled?"not-allowed":"pointer", border:"none",
    transition:"opacity 0.15s", opacity:disabled?0.4:1,
    borderRadius:size==="sm"?8:12,
    padding:size==="sm"?"6px 14px":size==="lg"?"14px 28px":"10px 20px",
    fontSize:size==="sm"?12:14,
    ...(variant==="primary" && { background:T.black, color:"#fff" }),
    ...(variant==="outline" && { background:"transparent", color:T.text, border:`1.5px solid ${T.border2}` }),
    ...(variant==="ghost" && { background:"transparent", color:T.sub }),
    ...(variant==="danger" && { background:T.danger, color:"#fff" }),
    ...sx
  };
  return <button style={s} onClick={onClick} disabled={disabled}
    onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity="0.72"; }}
    onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}>{children}</button>;
}

function Card({ children, style:sx={} }) {
  return <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, padding:"18px 20px", ...sx }}>{children}</div>;
}
function Lbl({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>{children}</div>;
}
function Fld({ label, children }) {
  return <div style={{ marginBottom:14 }}><Lbl>{label}</Lbl>{children}</div>;
}
function Inp({ ...p }) {
  return <input {...p} style={{ width:"100%", boxSizing:"border-box", background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"10px 14px", fontSize:14, color:T.text, fontFamily:"'DM Sans',sans-serif", outline:"none", ...p.style }}
    onFocus={e=>e.target.style.borderColor=T.accent}
    onBlur={e=>e.target.style.borderColor=T.border} />;
}
function Sel({ children, ...p }) {
  return <select {...p} style={{ width:"100%", boxSizing:"border-box", background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"10px 14px", fontSize:14, color:T.text, fontFamily:"'DM Sans',sans-serif", outline:"none", appearance:"none" }}>{children}</select>;
}
function Pill({ label, color }) {
  return <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:99, fontSize:11, fontWeight:600, background:color+"18", color, fontFamily:"'DM Sans',sans-serif" }}>{label}</span>;
}
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:T.surface, borderRadius:"24px 24px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", padding:"24px 24px 44px", boxSizing:"border-box" }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:38, height:4, borderRadius:99, background:T.border2, margin:"0 auto 20px" }} />
        {title && <div style={{ fontSize:20, fontFamily:"'Instrument Serif',serif", color:T.text, marginBottom:20 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
function Donut({ data, size=130 }) {
  const total = data.reduce((s,d)=>s+d.value,0);
  if (!total) return <div style={{ width:size, height:size, borderRadius:"50%", background:T.bg, border:`2px dashed ${T.border2}`, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:11, color:T.muted }}>No data</span></div>;
  const r=44,cx=60,cy=60,sw=16,circ=2*Math.PI*r; let off=0;
  const slices=data.map(d=>{ const pct=d.value/total; const s={ dash:`${pct*circ} ${circ-pct*circ}`, offset:-off*circ, color:d.color }; off+=pct; return s; });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.bg} strokeWidth={sw} />
      {slices.map((s,i)=><circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={s.dash} strokeDashoffset={s.offset} style={{ transform:"rotate(-90deg)", transformOrigin:"60px 60px", transition:"all 0.5s" }} />)}
      <text x={cx} y={cy-4} textAnchor="middle" fill={T.text} fontSize="11" fontFamily="'DM Sans',sans-serif" fontWeight="700">{sgd(total).replace("S$","")}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill={T.muted} fontSize="9" fontFamily="'DM Sans',sans-serif">total</text>
    </svg>
  );
}
function Bar({ value, max, showPct }) {
  const pct=max?Math.min((value/max)*100,100):0; const over=value>max&&max>0;
  return <div><div style={{ background:T.bg, borderRadius:99, height:6, overflow:"hidden", border:`1px solid ${T.border}` }}><div style={{ width:`${pct}%`, height:"100%", background:over?T.danger:T.black, borderRadius:99, transition:"width 0.5s ease" }} /></div>{showPct&&<div style={{ fontSize:11, color:over?T.danger:T.muted, marginTop:3 }}>{pct.toFixed(0)}%{over?" · over budget!":""}</div>}</div>;
}
function LineChart({ points }) {
  if (points.length<2) return <div style={{ height:90, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:13 }}>Track across multiple months to see your trend</div>;
  const vals=points.map(p=>p.v),min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
  const W=300,H=80,pad=10;
  const xs=points.map((_,i)=>pad+(i/(points.length-1))*(W-pad*2));
  const ys=points.map(p=>H-pad-((p.v-min)/range)*(H-pad*2));
  const path=xs.map((x,i)=>`${i===0?"M":"L"}${x},${ys[i]}`).join(" ");
  const area=`${path} L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`;
  return <div style={{ overflowX:"auto" }}><svg width="100%" viewBox={`0 0 ${W} ${H+18}`} style={{ minWidth:240 }}>
    <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.black} stopOpacity="0.1"/><stop offset="100%" stopColor={T.black} stopOpacity="0"/></linearGradient></defs>
    <path d={area} fill="url(#lg)"/><path d={path} fill="none" stroke={T.black} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {points.map((p,i)=><g key={i}><circle cx={xs[i]} cy={ys[i]} r="3" fill={T.surface} stroke={T.black} strokeWidth="2"/><text x={xs[i]} y={H+14} textAnchor="middle" fontSize="8" fill={T.muted} fontFamily="'DM Sans',sans-serif">{p.label}</text></g>)}
  </svg></div>;
}
function SyncDot({ status }) {
  const colors = { synced:"#27AE60", syncing:"#F39C12", error:"#C0392B", offline:"#ABABAB" };
  const labels = { synced:"Synced", syncing:"Syncing…", error:"Sync error", offline:"Offline" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background:colors[status]||T.muted }} />
      {labels[status]||""}
    </div>
  );
}

export default function BudgetApp() {
  const [tab, setTab] = useState("Dashboard");
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [income, setIncome] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("synced");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const fileRef = useRef();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [e, s, i, inv, g, c] = await Promise.all([
        supabase.from("expenses").select("*").eq("user_id", USER_ID).order("date", { ascending: false }),
        supabase.from("savings").select("*").eq("user_id", USER_ID).order("date", { ascending: false }),
        supabase.from("income").select("*").eq("user_id", USER_ID).order("date", { ascending: false }),
        supabase.from("investments").select("*").eq("user_id", USER_ID).order("date", { ascending: false }),
        supabase.from("goals").select("*").eq("user_id", USER_ID),
        supabase.from("categories").select("*").eq("user_id", USER_ID),
      ]);
      if (e.data) setExpenses(e.data);
      if (s.data) setSavings(s.data);
      if (i.data) setIncome(i.data);
      if (inv.data) setInvestments(inv.data);
      if (g.data) setGoals(g.data);
      if (c.data && c.data.length > 0) setCategories(c.data);
      else await supabase.from("categories").upsert(DEFAULT_CATS.map(cat => ({ ...cat, user_id: USER_ID })));
      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
    setLoading(false);
  };

  const dbInsert = async (table, row) => { setSyncStatus("syncing"); const { error } = await supabase.from(table).insert({ ...row, user_id: USER_ID }); setSyncStatus(error?"error":"synced"); return !error; };
  const dbUpdate = async (table, id, row) => { setSyncStatus("syncing"); const { error } = await supabase.from(table).update(row).eq("id", id).eq("user_id", USER_ID); setSyncStatus(error?"error":"synced"); return !error; };
  const dbDelete = async (table, id) => { setSyncStatus("syncing"); const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", USER_ID); setSyncStatus(error?"error":"synced"); return !error; };
  const dbUpsert = async (table, row) => { setSyncStatus("syncing"); const { error } = await supabase.from(table).upsert({ ...row, user_id: USER_ID }); setSyncStatus(error?"error":"synced"); return !error; };

  const totExp = expenses.reduce((s,e)=>s+Number(e.amount),0);
  const totSav = savings.reduce((s,e)=>s+Number(e.amount),0);
  const totInc = income.reduce((s,e)=>s+Number(e.amount),0);
  const totInv = investments.reduce((s,e)=>s+Number(e.amount),0);
  const netWorth = totSav+totInc+totInv-totExp;
  const TM = thisMo();
  const tmExp = expenses.filter(e=>moOf(e.date)===TM);
  const tmTotal = tmExp.reduce((s,e)=>s+Number(e.amount),0);
  const getCat = id => categories.find(c=>c.id===id)||{ label:id, color:T.muted, budget:"" };
  const expByCat = categories.map(c=>({ label:c.label, color:c.color, value: expenses.filter(e=>e.category===c.id).reduce((s,e)=>s+Number(e.amount),0) })).filter(c=>c.value>0);
  const nwHistory = (()=>{
    const ms=[...new Set([...expenses,...savings,...income,...investments].map(e=>e.date).filter(Boolean).map(d=>d.slice(0,7)))].sort();
    return ms.map(m=>{ const e=expenses.filter(x=>moOf(x.date)<=m).reduce((s,x)=>s+Number(x.amount),0); const s=savings.filter(x=>moOf(x.date)<=m).reduce((s,x)=>s+Number(x.amount),0); const i=income.filter(x=>moOf(x.date)<=m).reduce((s,x)=>s+Number(x.amount),0); const inv=investments.filter(x=>moOf(x.date)<=m).reduce((s,x)=>s+Number(x.amount),0); return { label:MONTHS[parseInt(m.split("-")[1])-1], v:s+i+inv-e }; });
  })();

  const openModal = (key, pre={}) => { setForm(pre); setScanMsg(""); setModal(key); };
  const closeModal = () => { setModal(null); setEditId(null); setForm({}); };
  const ff = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleFile = async e => {
    const file=e.target.files[0]; if(!file) return;
    setScanning(true); setScanMsg("");
    const reader=new FileReader();
    reader.onload=async ev=>{
      try {
        const r=await readReceipt(ev.target.result.split(",")[1],file.type);
        setForm({ merchant:r.merchant||"", amount:r.amount||"", category:r.category||"others", date:r.date||toDay(), note:r.note||"" });
        setScanMsg("✓ Receipt read — confirm details below");
      } catch(err) { setScanMsg("Could not read receipt — fill in manually"); console.error(err); }
      setScanning(false);
    };
    reader.readAsDataURL(file); e.target.value="";
  };

  const saveExpense = async () => {
    if (!form.amount||!form.category) return;
    const entry={ id:editId||Date.now(), ...form, date:form.date||toDay() };
    if (editId) { await dbUpdate("expenses", editId, entry); setExpenses(expenses.map(x=>x.id===editId?entry:x)); }
    else { await dbInsert("expenses", entry); setExpenses([entry,...expenses]); }
    closeModal();
  };
  const saveSimple = async (table, list, setList) => {
    if (!form.amount) return;
    const entry={ id:editId||Date.now(), ...form, date:form.date||toDay() };
    if (editId) { await dbUpdate(table, editId, entry); setList(list.map(x=>x.id===editId?entry:x)); }
    else { await dbInsert(table, entry); setList([entry,...list]); }
    closeModal();
  };
  const saveGoal = async () => {
    if (!form.name||!form.target) return;
    const entry={ id:editId||Date.now(), ...form, saved:Number(form.saved)||0 };
    if (editId) { await dbUpdate("goals", editId, entry); setGoals(goals.map(x=>x.id===editId?entry:x)); }
    else { await dbInsert("goals", entry); setGoals([entry,...goals]); }
    closeModal();
  };
  const saveCat = async () => {
    if (!form.label) return;
    if (editId) { const updated={ ...categories.find(c=>c.id===editId), ...form }; await dbUpdate("categories", editId, updated); setCategories(categories.map(c=>c.id===editId?updated:c)); }
    else { const entry={ id:Date.now().toString(), budget:"", ...form }; await dbUpsert("categories", entry); setCategories([...categories, entry]); }
    closeModal();
  };
  const deleteRow = async (table, id, list, setList) => { await dbDelete(table, id); setList(list.filter(x=>x.id!==id)); };
  const topup = async g => {
    const add=parseFloat(prompt(`Top up "${g.name}" (S$):`));
    if (!isNaN(add)&&add>0) { const updated={ ...g, saved:Number(g.saved)+add }; await dbUpdate("goals", g.id, updated); setGoals(goals.map(x=>x.id===g.id?updated:x)); }
  };
  const clearAll = async () => {
    if (!window.confirm("Clear ALL data? This cannot be undone.")) return;
    await Promise.all([supabase.from("expenses").delete().eq("user_id",USER_ID),supabase.from("savings").delete().eq("user_id",USER_ID),supabase.from("income").delete().eq("user_id",USER_ID),supabase.from("investments").delete().eq("user_id",USER_ID),supabase.from("goals").delete().eq("user_id",USER_ID)]);
    setExpenses([]); setSavings([]); setIncome([]); setInvestments([]); setGoals([]);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ fontSize:32, fontFamily:"'Instrument Serif',serif" }}>MyBudget</div>
      <div style={{ fontSize:13, color:T.muted }}>Loading your data…</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif", paddingBottom:100 }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"48px 20px 16px" }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:T.muted, textTransform:"uppercase", marginBottom:8 }}>Net Worth</div>
              <div style={{ fontSize:38, fontFamily:"'Instrument Serif',serif", fontWeight:400, letterSpacing:"-0.02em", color:netWorth<0?T.danger:T.text }}>{sgd(netWorth)}</div>
              <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>This month: <strong style={{color:T.text}}>{sgd(tmTotal)}</strong> spent · {tmExp.length} transactions</div>
            </div>
            <SyncDot status={syncStatus} />
          </div>
        </div>
      </div>
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, overflowX:"auto", scrollbarWidth:"none" }}>
        <div style={{ display:"flex", maxWidth:520, margin:"0 auto", padding:"0 12px" }}>
          {TABS.map(t=>(<button key={t} onClick={()=>setTab(t)} style={{ background:"none", border:"none", padding:"13px 13px", fontFamily:"'DM Sans',sans-serif", fontWeight:tab===t?700:500, fontSize:13, color:tab===t?T.text:T.muted, cursor:"pointer", whiteSpace:"nowrap", borderBottom:tab===t?`2.5px solid ${T.black}`:"2.5px solid transparent", transition:"all 0.15s" }}>{t}</button>))}
        </div>
      </div>
      <div style={{ maxWidth:520, margin:"0 auto", padding:"20px 16px" }}>
        {tab==="Dashboard" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",gap:12}}>{[{l:"Income",val:totInc},{l:"Saved",val:totSav},{l:"Invested",val:totInv}].map(s=>(<Card key={s.l} style={{flex:1,padding:"14px 16px"}}><Lbl>{s.l}</Lbl><div style={{fontSize:16,fontFamily:"'Instrument Serif',serif"}}>{sgd(s.val)}</div></Card>))}</div>
            <Card><Lbl>Spending by Category</Lbl><div style={{display:"flex",alignItems:"center",gap:20,marginTop:10}}><Donut data={expByCat} /><div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>{expByCat.length?expByCat.map(c=>(<div key={c.label}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0}}/><span style={{fontSize:13}}>{c.label}</span></div><span style={{fontSize:13,fontWeight:700}}>{sgd(c.value)}</span></div>{(()=>{ const cat=categories.find(x=>x.label===c.label); return cat?.budget?<Bar value={c.value} max={Number(cat.budget)} showPct/>:null; })()}</div>)):<span style={{fontSize:13,color:T.muted}}>No expenses yet</span>}</div></div></Card>
            {goals.length>0&&<Card><Lbl>Goals</Lbl>{goals.slice(0,3).map(g=>(<div key={g.id} style={{marginTop:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:14,fontWeight:600}}>{g.name}</span><span style={{fontSize:12,color:T.muted}}>{sgd(g.saved)} / {sgd(g.target)}</span></div><Bar value={Number(g.saved)} max={Number(g.target)}/></div>))}</Card>}
            <Card><Lbl>Recent</Lbl>{expenses.slice(0,5).map(e=>(<div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:10,background:getCat(e.category).color+"12",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:8,height:8,borderRadius:"50%",background:getCat(e.category).color}}/></div><div><div style={{fontSize:13,fontWeight:600}}>{e.merchant||getCat(e.category).label}</div><div style={{fontSize:11,color:T.muted}}>{e.date}</div></div></div><span style={{fontSize:14,fontWeight:700}}>−{sgd(e.amount)}</span></div>))}{!expenses.length&&<div style={{fontSize:13,color:T.muted,paddingTop:8}}>No expenses yet</div>}</Card>
          </div>
        )}
        {tab==="Expenses" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:22,fontFamily:"'Instrument Serif',serif"}}>Expenses</div><Btn onClick={()=>{setEditId(null);openModal("expense");}}>+ Add</Btn></div>
            {categories.filter(c=>c.budget).map(c=>{ const spent=tmExp.filter(e=>e.category===c.id).reduce((s,e)=>s+Number(e.amount),0); if(!spent) return null; const over=spent>Number(c.budget); return <div key={c.id} style={{background:over?"#FFF0EE":T.bg,border:`1px solid ${over?"#F5C6C0":T.border}`,borderRadius:10,padding:"9px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13}}><strong>{c.label}</strong>: {sgd(spent)} / {sgd(c.budget)}/mo</span>{over&&<span style={{fontSize:11,color:T.danger,fontWeight:700}}>Over budget</span>}</div>; })}
            {!expenses.length&&<div style={{textAlign:"center",color:T.muted,padding:40,fontSize:14}}>No expenses logged yet.</div>}
            {expenses.map(e=>(<div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:38,height:38,borderRadius:12,background:getCat(e.category).color+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:9,height:9,borderRadius:"50%",background:getCat(e.category).color}}/></div><div><div style={{fontSize:14,fontWeight:600}}>{e.merchant||getCat(e.category).label}</div><div style={{display:"flex",gap:6,marginTop:3,alignItems:"center"}}><Pill label={getCat(e.category).label} color={getCat(e.category).color}/><span style={{fontSize:11,color:T.muted}}>{e.date}</span></div>{e.note&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{e.note}</div>}</div></div><div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}><span style={{fontSize:15,fontWeight:700}}>−{sgd(e.amount)}</span><button onClick={()=>{setEditId(e.id);openModal("expense",{...e});}} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:13,padding:"2px 4px"}}>✎</button><button onClick={()=>deleteRow("expenses",e.id,expenses,setExpenses)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18,padding:"2px 4px"}}>×</button></div></div>))}
          </div>
        )}
        {tab==="Savings" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:22,fontFamily:"'Instrument Serif',serif"}}>Savings</div><div style={{display:"flex",gap:8}}><Btn variant="outline" size="sm" onClick={()=>{setEditId(null);openModal("income");}}>+ Income</Btn><Btn size="sm" onClick={()=>{setEditId(null);openModal("savings");}}>+ Savings</Btn></div></div>
            <div style={{display:"flex",gap:12,marginBottom:20}}><Card style={{flex:1}}><Lbl>Total Saved</Lbl><div style={{fontSize:20,fontFamily:"'Instrument Serif',serif"}}>{sgd(totSav)}</div></Card><Card style={{flex:1}}><Lbl>Total Income</Lbl><div style={{fontSize:20,fontFamily:"'Instrument Serif',serif"}}>{sgd(totInc)}</div></Card></div>
            {[...savings.map(s=>({...s,_t:"Savings"})),...income.map(s=>({...s,_t:"Income"}))].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(e=>(<div key={e.id+e._t} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${T.border}`}}><div><div style={{fontSize:14,fontWeight:600}}>{e.note||e._t}</div><div style={{display:"flex",gap:6,marginTop:3}}><Pill label={e._t} color={T.accent}/><span style={{fontSize:11,color:T.muted}}>{e.date}</span></div></div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15,fontWeight:700,color:T.success}}>+{sgd(e.amount)}</span><button onClick={()=>{ if(e._t==="Savings") deleteRow("savings",e.id,savings,setSavings); else deleteRow("income",e.id,income,setIncome); }} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18}}>×</button></div></div>))}
          </div>
        )}
        {tab==="Net Worth" && (
          <div>
            <div style={{fontSize:22,fontFamily:"'Instrument Serif',serif",marginBottom:20}}>Net Worth</div>
            <Card style={{textAlign:"center",marginBottom:14,padding:"28px 20px"}}><Lbl>Total Net Worth</Lbl><div style={{fontSize:44,fontFamily:"'Instrument Serif',serif",color:netWorth<0?T.danger:T.text,letterSpacing:"-0.02em",marginTop:6}}>{sgd(netWorth)}</div><div style={{fontSize:12,color:T.muted,marginTop:8}}>Savings + Income + Investments − Expenses</div></Card>
            <Card style={{marginBottom:14}}><Lbl>Net Worth History</Lbl><div style={{marginTop:10}}><LineChart points={nwHistory}/></div></Card>
            {[{label:"Income",val:totInc,action:()=>openModal("income"),add:"+ Income",neg:false},{label:"Savings",val:totSav,action:()=>openModal("savings"),add:"+ Savings",neg:false},{label:"Investments",val:totInv,action:()=>openModal("investment"),add:"+ Investment",neg:false},{label:"Expenses",val:totExp,action:()=>openModal("expense"),add:"+ Expense",neg:true}].map(r=>(<Card key={r.label} style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><Lbl>{r.label}</Lbl><div style={{fontSize:20,fontFamily:"'Instrument Serif',serif",color:r.neg?T.danger:T.text}}>{r.neg?"−":""}{sgd(r.val)}</div></div><Btn variant="outline" size="sm" onClick={r.action}>{r.add}</Btn></Card>))}
          </div>
        )}
        {tab==="Goals" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:22,fontFamily:"'Instrument Serif',serif"}}>Money Goals</div><Btn onClick={()=>{setEditId(null);openModal("goal");}}>+ Goal</Btn></div>
            {!goals.length&&<div style={{textAlign:"center",color:T.muted,padding:40,fontSize:14}}>Set your first savings goal!</div>}
            {goals.map(g=>{ const pct=Math.min((Number(g.saved)/Number(g.target))*100,100); return (<Card key={g.id} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{fontSize:16,fontWeight:700}}>{g.name}</div><div style={{display:"flex",gap:6}}><button onClick={()=>{setEditId(g.id);openModal("goal",{...g});}} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:13}}>✎</button><button onClick={()=>deleteRow("goals",g.id,goals,setGoals)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18}}>×</button></div></div>{g.note&&<div style={{fontSize:12,color:T.muted,margin:"4px 0 10px"}}>{g.note}</div>}<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{fontWeight:600,color:T.success}}>{sgd(g.saved)} saved</span><span style={{color:T.muted}}>of {sgd(g.target)}</span></div><Bar value={Number(g.saved)} max={Number(g.target)} showPct/><div style={{marginTop:12}}><Btn variant="outline" size="sm" onClick={()=>topup(g)}>+ Top up</Btn></div></Card>); })}
          </div>
        )}
        {tab==="Settings" && (
          <div>
            <div style={{fontSize:22,fontFamily:"'Instrument Serif',serif",marginBottom:20}}>Settings</div>
            <Card style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><Lbl>Expense Categories</Lbl><Btn size="sm" onClick={()=>{setEditId(null);openModal("cat");}}>+ New</Btn></div>{categories.map(c=>(<div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:12,height:12,borderRadius:"50%",background:c.color,border:`1.5px solid ${T.border2}`,flexShrink:0}}/><div><div style={{fontSize:14,fontWeight:600}}>{c.label}</div>{c.budget&&<div style={{fontSize:11,color:T.muted}}>Budget: {sgd(c.budget)}/mo</div>}</div></div><div style={{display:"flex",gap:10}}><button onClick={()=>{setEditId(c.id);openModal("cat",{...c});}} style={{background:"none",border:"none",cursor:"pointer",color:T.sub,fontSize:13}}>✎ Edit</button><button onClick={()=>deleteRow("categories",c.id,categories,setCategories)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:13}}>✕</button></div></div>))}</Card>
            <Card style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><Lbl>Investments</Lbl><Btn size="sm" onClick={()=>{setEditId(null);openModal("investment");}}>+ Add</Btn></div>{!investments.length&&<div style={{fontSize:13,color:T.muted}}>No investments tracked yet.</div>}{investments.map(e=>(<div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}><div><div style={{fontSize:14,fontWeight:600}}>{e.note||"Investment"}</div><div style={{fontSize:11,color:T.muted}}>{e.date}</div></div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,fontWeight:700}}>{sgd(e.amount)}</span><button onClick={()=>deleteRow("investments",e.id,investments,setInvestments)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:18}}>×</button></div></div>))}</Card>
            <Card style={{marginBottom:14}}><Lbl>Sync</Lbl><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><SyncDot status={syncStatus}/><Btn variant="outline" size="sm" onClick={loadAll}>↻ Refresh</Btn></div></Card>
            <Card><Lbl>Data</Lbl><Btn variant="danger" size="sm" onClick={clearAll}>Clear All Data</Btn></Card>
          </div>
        )}
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(255,255,255,0.94)", backdropFilter:"blur(16px)", borderTop:`1px solid ${T.border}`, padding:"10px 16px 28px" }}>
        <div style={{maxWidth:520,width:"100%",margin:"0 auto",display:"flex",gap:10}}>
          <Btn onClick={()=>{setEditId(null);openModal("expense");}} style={{flex:1}}>+ Expense</Btn>
          <Btn variant="outline" onClick={()=>{setEditId(null);openModal("savings");}} style={{flex:1}}>+ Savings</Btn>
        </div>
      </div>
      <Modal open={modal==="expense"} onClose={closeModal} title={editId?"Edit Expense":"Log Expense"}>
        <div style={{marginBottom:16}}><input type="file" accept="image/*" ref={fileRef} style={{display:"none"}} onChange={handleFile}/><Btn variant="outline" onClick={()=>fileRef.current.click()} style={{width:"100%"}}>{scanning?"⏳ Reading receipt…":"📷 Upload Receipt Image"}</Btn>{scanMsg&&<div style={{fontSize:12,color:scanMsg.startsWith("✓")?T.success:T.danger,marginTop:8}}>{scanMsg}</div>}</div>
        <Fld label="Merchant / Store"><Inp placeholder="e.g. FairPrice" value={form.merchant||""} onChange={e=>ff("merchant",e.target.value)}/></Fld>
        <Fld label="Amount (S$)"><Inp type="number" placeholder="0.00" value={form.amount||""} onChange={e=>ff("amount",e.target.value)}/></Fld>
        <Fld label="Category"><Sel value={form.category||""} onChange={e=>ff("category",e.target.value)}><option value="">Select…</option>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</Sel></Fld>
        <Fld label="Date"><Inp type="date" value={form.date||toDay()} onChange={e=>ff("date",e.target.value)}/></Fld>
        <Fld label="Note (optional)"><Inp placeholder="e.g. Lunch with team" value={form.note||""} onChange={e=>ff("note",e.target.value)}/></Fld>
        <div style={{display:"flex",gap:10,marginTop:4}}><Btn variant="outline" onClick={closeModal} style={{flex:1}}>Cancel</Btn><Btn onClick={saveExpense} style={{flex:1}}>Save</Btn></div>
      </Modal>
      <Modal open={modal==="savings"} onClose={closeModal} title="Add Savings">
        <Fld label="Amount (S$)"><Inp type="number" placeholder="0.00" value={form.amount||""} onChange={e=>ff("amount",e.target.value)}/></Fld>
        <Fld label="Date"><Inp type="date" value={form.date||toDay()} onChange={e=>ff("date",e.target.value)}/></Fld>
        <Fld label="Note (optional)"><Inp placeholder="e.g. Monthly savings" value={form.note||""} onChange={e=>ff("note",e.target.value)}/></Fld>
        <div style={{display:"flex",gap:10}}><Btn variant="outline" onClick={closeModal} style={{flex:1}}>Cancel</Btn><Btn onClick={()=>saveSimple("savings",savings,setSavings)} style={{flex:1}}>Save</Btn></div>
      </Modal>
      <Modal open={modal==="income"} onClose={closeModal} title="Add Income">
        <Fld label="Amount (S$)"><Inp type="number" placeholder="0.00" value={form.amount||""} onChange={e=>ff("amount",e.target.value)}/></Fld>
        <Fld label="Source"><Inp placeholder="e.g. Salary, Freelance" value={form.note||""} onChange={e=>ff("note",e.target.value)}/></Fld>
        <Fld label="Date"><Inp type="date" value={form.date||toDay()} onChange={e=>ff("date",e.target.value)}/></Fld>
        <div style={{display:"flex",gap:10}}><Btn variant="outline" onClick={closeModal} style={{flex:1}}>Cancel</Btn><Btn onClick={()=>saveSimple("income",income,setIncome)} style={{flex:1}}>Save</Btn></div>
      </Modal>
      <Modal open={modal==="investment"} onClose={closeModal} title="Add Investment">
        <Fld label="Amount (S$)"><Inp type="number" placeholder="0.00" value={form.amount||""} onChange={e=>ff("amount",e.target.value)}/></Fld>
        <Fld label="Name / Type"><Inp placeholder="e.g. STI ETF, CPF, SSB" value={form.note||""} onChange={e=>ff("note",e.target.value)}/></Fld>
        <Fld label="Date"><Inp type="date" value={form.date||toDay()} onChange={e=>ff("date",e.target.value)}/></Fld>
        <div style={{display:"flex",gap:10}}><Btn variant="outline" onClick={closeModal} style={{flex:1}}>Cancel</Btn><Btn onClick={()=>saveSimple("investments",investments,setInvestments)} style={{flex:1}}>Save</Btn></div>
      </Modal>
      <Modal open={modal==="goal"} onClose={closeModal} title={editId?"Edit Goal":"New Goal"}>
        <Fld label="Goal Name"><Inp placeholder="e.g. Japan Trip" value={form.name||""} onChange={e=>ff("name",e.target.value)}/></Fld>
        <Fld label="Target Amount (S$)"><Inp type="number" placeholder="0.00" value={form.target||""} onChange={e=>ff("target",e.target.value)}/></Fld>
        <Fld label="Already Saved (S$)"><Inp type="number" placeholder="0.00" value={form.saved||""} onChange={e=>ff("saved",e.target.value)}/></Fld>
        <Fld label="Note (optional)"><Inp placeholder="What's this for?" value={form.note||""} onChange={e=>ff("note",e.target.value)}/></Fld>
        <div style={{display:"flex",gap:10}}><Btn variant="outline" onClick={closeModal} style={{flex:1}}>Cancel</Btn><Btn onClick={saveGoal} style={{flex:1}}>Save</Btn></div>
      </Modal>
      <Modal open={modal==="cat"} onClose={closeModal} title={editId?"Edit Category":"New Category"}>
        <Fld label="Name"><Inp placeholder="e.g. Groceries" value={form.label||""} onChange={e=>ff("label",e.target.value)}/></Fld>
        <Fld label="Colour"><div style={{display:"flex",alignItems:"center",gap:12}}><input type="color" value={form.color||"#555555"} onChange={e=>ff("color",e.target.value)} style={{width:44,height:36,border:`1.5px solid ${T.border}`,borderRadius:8,cursor:"pointer",padding:2,background:T.bg}}/><span style={{fontSize:13,color:T.muted}}>Pick a colour</span></div></Fld>
        <Fld label="Monthly Budget (S$) — optional"><Inp type="number" placeholder="Leave blank for no limit" value={form.budget||""} onChange={e=>ff("budget",e.target.value)}/></Fld>
        <div style={{display:"flex",gap:10}}><Btn variant="outline" onClick={closeModal} style={{flex:1}}>Cancel</Btn><Btn onClick={saveCat} style={{flex:1}}>Save</Btn></div>
      </Modal>
    </div>
  );
}
