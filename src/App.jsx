
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CATS=[{id:"food",l:"Food & Dining",em:"🍔",c:"#f97316"},{id:"groceries",l:"Groceries",em:"🛒",c:"#22c55e"},{id:"fuel",l:"Fuel",em:"⛽",c:"#eab308"},{id:"parking",l:"Parking",em:"🅿️",c:"#3b82f6"},{id:"creditcard",l:"Credit Card",em:"💳",c:"#a855f7"},{id:"entertain",l:"Entertainment",em:"🎬",c:"#ec4899"},{id:"shopping",l:"Shopping",em:"🛍️",c:"#06b6d4"},{id:"health",l:"Health",em:"🏥",c:"#ef4444"},{id:"transport",l:"Transport",em:"🚗",c:"#64748b"},{id:"bills",l:"Bills & Utilities",em:"💡",c:"#f59e0b"},{id:"other",l:"Other",em:"✦",c:"#94a3b8"}];
const C={bg:"#07070f",s1:"#0e0e1e",s2:"#141428",s3:"#1c1c34",b:"rgba(255,255,255,0.07)",acc:"#7C6FFF",aD:"rgba(124,111,255,0.15)",aG:"rgba(124,111,255,0.28)",gold:"#FFD166",gD:"rgba(255,209,102,0.12)",ok:"#05CFA0",oD:"rgba(5,207,160,0.12)",bad:"#FF4D72",bD:"rgba(255,77,114,0.12)",warn:"#FFB300",tx:"#ffffff",tx2:"#8090C0",tx3:"#3A4060"};
const fmt=n=>`AED ${Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const toDay=()=>new Date().toISOString().slice(0,10);
const thisM=()=>new Date().toISOString().slice(0,7);
const mLabel=ym=>new Date(ym+"-02").toLocaleString("en",{month:"long",year:"numeric"});
const mShort=ym=>new Date(ym+"-02").toLocaleString("en",{month:"short"});
const getCat=id=>CATS.find(c=>c.id===id)??CATS[10];

// ── localStorage storage (works on Vercel) ───────────────────────────────────
const sg=k=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch{return null;}};
const ss=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

const wkDays=(off=0)=>{const d=new Date();d.setDate(d.getDate()+off*7);const dow=d.getDay(),diff=dow===0?-6:1-dow;const mon=new Date(d);mon.setDate(d.getDate()+diff);return Array.from({length:7},(_,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return{date:x.toISOString().slice(0,10),lbl:"MTWTFSS"[i]};});};

const GC=({children,sx={},glow=false})=><div style={{background:C.s1,border:`1px solid ${glow?C.aG:C.b}`,borderRadius:16,padding:16,...sx}}>{children}</div>;
const Lbl=({children,sx={}})=><div style={{fontSize:10,fontWeight:600,color:C.tx2,textTransform:"uppercase",letterSpacing:.9,...sx}}>{children}</div>;
const I0={background:"#050510",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",borderRadius:10,padding:"11px 14px",fontSize:14,boxSizing:"border-box",outline:"none",fontFamily:"inherit",width:"100%"};

function ExpRow({e,onEdit,onDel}){
  const c=getCat(e.catId);
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.b}`}}>
    <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
      <div style={{width:40,height:40,borderRadius:11,background:c.c+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.em}</div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:C.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:155}}>{e.note||c.l}</div>
        <div style={{fontSize:11,color:C.tx2}}>{c.l} · {e.date}</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
      <span style={{fontSize:13,fontWeight:700,color:C.bad,marginRight:4}}>-{fmt(e.amount)}</span>
      <button onClick={onEdit} style={{background:"none",border:"none",cursor:"pointer",padding:4,fontSize:14,opacity:.6}}>✏️</button>
      <button onClick={onDel} style={{background:"none",border:"none",cursor:"pointer",padding:4,fontSize:14,opacity:.6}}>🗑️</button>
    </div>
  </div>;
}

function MonthItem({ym,exps,total,onEdit,onDel}){
  const [open,setOpen]=useState(false);
  return <div style={{marginBottom:8}}>
    <div onClick={()=>setOpen(o=>!o)} style={{background:C.s2,border:`1px solid ${C.b}`,borderRadius:12,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none"}}>
      <div><div style={{fontSize:14,fontWeight:600,color:C.tx}}>{mLabel(ym)}</div><div style={{fontSize:11,color:C.tx2}}>{exps.length} transactions</div></div>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14,fontWeight:700,color:C.bad}}>-{fmt(total)}</span><span style={{color:C.tx3,fontSize:10}}>{open?"▲":"▼"}</span></div>
    </div>
    {open&&<GC sx={{padding:"4px 14px",marginTop:4}}>{exps.sort((a,b)=>b.date.localeCompare(a.date)).map(e=><ExpRow key={e.id} e={e} onEdit={()=>onEdit(e)} onDel={()=>onDel(e.id)}/>)}</GC>}
  </div>;
}

function BillRow({bill,selMonth,onPay,onDel}){
  const today=toDay();const[y,m]=selMonth.split("-");
  const due=`${y}-${m}-${String(bill.dueDay).padStart(2,"0")}`;
  const paid=!!bill.paid?.[selMonth];const overdue=!paid&&today>due;
  const days=Math.ceil((new Date(due)-new Date(today))/(864e5));
  const c=getCat(bill.catId||"bills");
  const stCol=paid?C.ok:overdue?C.bad:days<=3?C.warn:C.tx2;
  const stTxt=paid?"✓ Paid":overdue?"Overdue":days===0?"Due today":`Due in ${days}d`;
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.s2,borderRadius:12,padding:"10px 14px",marginBottom:7,border:`1px solid ${overdue?C.bD:C.b}`}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:38,height:38,borderRadius:10,background:c.c+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{c.em}</div>
      <div><div style={{fontSize:13,fontWeight:500,color:C.tx}}>{bill.name}</div><div style={{fontSize:11,color:stCol,fontWeight:500}}>{stTxt}</div></div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
      <span style={{fontSize:13,fontWeight:700,color:paid?C.ok:C.tx}}>{fmt(bill.amount)}</span>
      {!paid&&<button onClick={()=>onPay(bill.id)} style={{background:C.aD,border:`1px solid ${C.acc}`,color:C.acc,fontSize:11,padding:"4px 9px",borderRadius:99,cursor:"pointer",fontWeight:600}}>Pay</button>}
      <button onClick={()=>onDel(bill.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.bad,fontSize:13,opacity:.55}}>✕</button>
    </div>
  </div>;
}

function Sheet({title,onClose,children}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300}}>
    <div style={{background:C.s1,border:`1px solid ${C.b}`,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:500,maxHeight:"92vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:17,fontWeight:700,color:C.tx}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.tx2,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

function SaveBtn({label,onClick,disabled}){
  return <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:14,background:disabled?"#1a1a2e":C.acc,border:"none",borderRadius:12,color:disabled?C.tx3:"#fff",fontSize:15,fontWeight:700,cursor:disabled?"not-allowed":"pointer"}}>{label}</button>;
}

function AddExpModal({item,onSave,onClose}){
  const[amt,setAmt]=useState(item?.amount?.toString()||"");
  const[catId,setCat]=useState(item?.catId||"food");
  const[date,setDate]=useState(item?.date||toDay());
  const[note,setNote]=useState(item?.note||"");
  const ok=amt&&!isNaN(+amt)&&+amt>0;
  return <Sheet title={item?"Edit Expense":"New Expense"} onClose={onClose}>
    <Lbl sx={{marginBottom:6}}>Amount (AED) *</Lbl>
    <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0.00" autoFocus style={{...I0,fontSize:22,fontWeight:700,marginBottom:18}}/>
    <Lbl sx={{marginBottom:8}}>Category</Lbl>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:18}}>
      {CATS.map(c=><button key={c.id} onClick={()=>setCat(c.id)} style={{padding:"8px 4px",background:catId===c.id?c.c+"28":"#050510",border:`1.5px solid ${catId===c.id?c.c:C.b}`,borderRadius:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
        <span style={{fontSize:18}}>{c.em}</span><span style={{fontSize:9,color:catId===c.id?c.c:C.tx2,lineHeight:1.2}}>{c.l.split(" ")[0]}</span>
      </button>)}
    </div>
    <Lbl sx={{marginBottom:6}}>Date</Lbl>
    <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...I0,colorScheme:"dark",marginBottom:14}}/>
    <Lbl sx={{marginBottom:6}}>Note (optional)</Lbl>
    <input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Lunch with client" style={{...I0,marginBottom:22}}/>
    <SaveBtn label={item?"Update Expense":"Add Expense"} onClick={()=>ok&&onSave({amount:+amt,catId,date,note})} disabled={!ok}/>
  </Sheet>;
}

function AddBillModal({item,onSave,onClose}){
  const[name,setName]=useState(item?.name||"");
  const[amt,setAmt]=useState(item?.amount?.toString()||"");
  const[day,setDay]=useState(item?.dueDay?.toString()||"1");
  const[catId,setCat]=useState(item?.catId||"bills");
  const ok=name&&amt&&!isNaN(+amt)&&+amt>0;
  return <Sheet title={item?"Edit Bill":"New Bill"} onClose={onClose}>
    <Lbl sx={{marginBottom:6}}>Bill name</Lbl>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Etisalat, DEWA, Netflix" autoFocus style={{...I0,marginBottom:14}}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      <div><Lbl sx={{marginBottom:6}}>Amount (AED)</Lbl><input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0.00" style={I0}/></div>
      <div><Lbl sx={{marginBottom:6}}>Due day</Lbl><input type="number" min="1" max="31" value={day} onChange={e=>setDay(e.target.value)} placeholder="15" style={I0}/></div>
    </div>
    <Lbl sx={{marginBottom:8}}>Category</Lbl>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:22}}>
      {CATS.slice(0,8).map(c=><button key={c.id} onClick={()=>setCat(c.id)} style={{padding:"7px 3px",background:catId===c.id?c.c+"28":"#050510",border:`1.5px solid ${catId===c.id?c.c:C.b}`,borderRadius:9,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        <span style={{fontSize:16}}>{c.em}</span><span style={{fontSize:9,color:catId===c.id?c.c:C.tx2}}>{c.l.split(" ")[0]}</span>
      </button>)}
    </div>
    <SaveBtn label={item?"Update Bill":"Add Bill"} onClick={()=>ok&&onSave({name,amount:+amt,dueDay:+day||1,catId,paid:{}})} disabled={!ok}/>
  </Sheet>;
}

function AddSplitModal({onSave,onClose}){
  const[desc,setDesc]=useState("");const[date,setDate]=useState(toDay());
  const[pName,setPName]=useState("");const[pAmt,setPAmt]=useState("");const[people,setPeople]=useState([]);
  const addP=()=>{if(!pName||!pAmt)return;setPeople(p=>[...p,{id:Date.now(),name:pName,amount:+pAmt,settled:false}]);setPName("");setPAmt("");};
  const total=people.reduce((s,p)=>s+p.amount,0);const ok=desc&&people.length>0;
  return <Sheet title="Split Expense" onClose={onClose}>
    <Lbl sx={{marginBottom:6}}>Description</Lbl>
    <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. Dinner at Nobu" autoFocus style={{...I0,marginBottom:14}}/>
    <Lbl sx={{marginBottom:6}}>Date</Lbl>
    <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...I0,colorScheme:"dark",marginBottom:16}}/>
    <div style={{background:C.s2,borderRadius:12,padding:14,marginBottom:16}}>
      <Lbl sx={{marginBottom:10}}>People who owe you</Lbl>
      <div style={{display:"grid",gridTemplateColumns:"1fr 90px 40px",gap:8,marginBottom:4}}>
        <input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Name" style={{...I0,padding:"9px 12px"}}/>
        <input type="number" value={pAmt} onChange={e=>setPAmt(e.target.value)} placeholder="AED" style={{...I0,padding:"9px 12px"}}/>
        <button onClick={addP} style={{background:C.aD,border:`1px solid ${C.acc}`,borderRadius:10,color:C.acc,fontSize:22,cursor:"pointer",fontWeight:300,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      </div>
      {people.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderTop:`1px solid ${C.b}`,marginTop:4}}>
        <span style={{fontSize:13,color:C.tx}}>{p.name}</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:600,color:C.bad}}>{fmt(p.amount)}</span>
          <button onClick={()=>setPeople(ps=>ps.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",color:C.bad,fontSize:14,cursor:"pointer",opacity:.7}}>✕</button>
        </div>
      </div>)}
    </div>
    {people.length>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
      <span style={{fontSize:14,color:C.tx2}}>Total owed to you</span>
      <span style={{fontSize:16,fontWeight:700,color:C.ok}}>{fmt(total)}</span>
    </div>}
    <SaveBtn label="Save Split" onClick={()=>ok&&onSave({desc,date,total,people,id:Date.now()+(Math.random()*999|0)})} disabled={!ok}/>
  </Sheet>;
}

function IncomeModal({selMonth,sources,onSave,onClose}){
  const[local,setLocal]=useState(sources||[]);
  const[name,setName]=useState("");const[amt,setAmt]=useState("");const[type,setType]=useState("active");
  const add=()=>{if(!name||!amt)return;setLocal(p=>[...p,{id:Date.now(),name,amount:+amt,type}]);setName("");setAmt("");};
  const total=local.reduce((s,x)=>s+x.amount,0);
  return <Sheet title={`Income — ${mLabel(selMonth)}`} onClose={onClose}>
    <div style={{fontSize:12,color:C.tx2,marginBottom:16}}>Add all your income sources for this month</div>
    {local.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.s2,borderRadius:10,padding:"10px 14px",marginBottom:7}}>
      <div><div style={{fontSize:13,fontWeight:500,color:C.tx}}>{s.name}</div><div style={{fontSize:11,color:s.type==="passive"?C.gold:C.ok}}>{s.type==="passive"?"Passive":"Active"} income</div></div>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:700,color:C.ok}}>{fmt(s.amount)}</span><button onClick={()=>setLocal(l=>l.filter(x=>x.id!==s.id))} style={{background:"none",border:"none",color:C.bad,cursor:"pointer",fontSize:13,opacity:.7}}>✕</button></div>
    </div>)}
    <div style={{background:C.s2,borderRadius:12,padding:14,marginBottom:14}}>
      <Lbl sx={{marginBottom:10}}>Add source</Lbl>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Emirates Salary, Freelance, Airbnb" style={{...I0,marginBottom:9}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="AED amount" style={I0}/>
        <div style={{display:"flex",background:"#050510",borderRadius:10,border:`1px solid ${C.b}`,overflow:"hidden"}}>
          {["active","passive"].map(t=><button key={t} onClick={()=>setType(t)} style={{flex:1,background:type===t?C.aD:"transparent",border:"none",color:type===t?C.acc:C.tx2,cursor:"pointer",fontSize:11,fontWeight:type===t?600:400,padding:"9px 0"}}>{t}</button>)}
        </div>
      </div>
      <button onClick={add} disabled={!name||!amt} style={{width:"100%",marginTop:9,padding:9,background:name&&amt?C.aD:"transparent",border:`1px solid ${name&&amt?C.acc:C.b}`,borderRadius:10,color:name&&amt?C.acc:C.tx3,fontWeight:600,cursor:name&&amt?"pointer":"default",fontSize:13}}>+ Add source</button>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <span style={{fontSize:14,color:C.tx2}}>Total for {mShort(selMonth)}</span>
      <span style={{fontSize:20,fontWeight:700,color:C.ok}}>{fmt(total)}</span>
    </div>
    <SaveBtn label="Save Income" onClick={()=>onSave(local)} disabled={false}/>
  </Sheet>;
}

function HomeTab({expenses,income,bills,selMonth,onOpenIncome}){
  const today=toDay();
  const mnInc=income[selMonth]||[];const totInc=mnInc.reduce((s,x)=>s+x.amount,0);
  const mnExp=expenses.filter(e=>e.date.startsWith(selMonth));const totSpent=mnExp.reduce((s,e)=>s+Number(e.amount),0);
  const net=totInc-totSpent;const savPct=totInc>0?Math.round((Math.max(0,net)/totInc)*100):0;
  const tw=wkDays(0),lw=wkDays(-1);
  const twT=tw.reduce((s,d)=>s+expenses.filter(e=>e.date===d.date).reduce((ss,e)=>ss+Number(e.amount),0),0);
  const lwT=lw.reduce((s,d)=>s+expenses.filter(e=>e.date===d.date).reduce((ss,e)=>ss+Number(e.amount),0),0);
  const wkChg=lwT>0?Math.round(((twT-lwT)/lwT)*100):0;
  const barData=tw.map(d=>({lbl:d.lbl,val:expenses.filter(e=>e.date===d.date).reduce((s,e)=>s+Number(e.amount),0),today:d.date===today,future:d.date>today}));
  const maxBar=Math.max(...barData.map(d=>d.val),1);
  const[y,mo]=selMonth.split("-");
  const upBills=bills.filter(b=>{const due=`${y}-${mo}-${String(b.dueDay).padStart(2,"0")}`;return !b.paid?.[selMonth]&&due>=today;}).sort((a,b)=>a.dueDay-b.dueDay).slice(0,3);
  const recent=[...mnExp].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{background:"linear-gradient(135deg,#1c0e40 0%,#0e1038 55%,#080818 100%)",border:"1px solid rgba(124,111,255,0.22)",borderRadius:20,padding:22,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-20,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,111,255,0.22) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <Lbl sx={{color:"rgba(255,255,255,0.4)"}}>{mShort(selMonth)} · net balance</Lbl>
        <button onClick={onOpenIncome} style={{background:"rgba(124,111,255,0.15)",border:"1px solid rgba(124,111,255,0.3)",borderRadius:8,color:C.acc,fontSize:11,padding:"4px 10px",cursor:"pointer",fontWeight:600}}>+ Income</button>
      </div>
      <div style={{fontSize:30,fontWeight:700,letterSpacing:-1,lineHeight:1,color:net>=0?C.ok:C.bad}}>{fmt(Math.abs(net))}</div>
      {net<0&&<div style={{fontSize:11,color:C.bad,marginTop:4}}>⚠️ Spent more than earned this month</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:18}}>
        {[["↑ Income",totInc>0?fmt(totInc):"Not set",C.ok],["↓ Spent",fmt(totSpent),C.bad],["💎 Saved",savPct>0?`${savPct}%`:"—",C.acc]].map(([l,v,col])=>(
          <div key={l} style={{background:"rgba(0,0,0,0.28)",borderRadius:10,padding:"10px 8px"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{l}</div>
            <div style={{fontSize:12,fontWeight:700,color:col}}>{v}</div>
          </div>
        ))}
      </div>
      {totInc>0&&<div style={{marginTop:14}}>
        <div style={{background:"rgba(0,0,0,0.35)",borderRadius:99,height:5,overflow:"hidden"}}>
          <div style={{width:`${Math.min(100,(totSpent/totInc)*100)}%`,height:"100%",background:`linear-gradient(90deg,${C.acc},${net<0?C.bad:C.ok})`,borderRadius:99}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:"rgba(255,255,255,0.3)"}}>
          <span>Spent {Math.min(100,Math.round((totSpent/totInc)*100))}%</span><span>{fmt(totInc)}</span>
        </div>
      </div>}
    </div>
    <GC>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:C.tx}}>This week</div>
          <div style={{fontSize:11,color:C.tx2,marginTop:2}}>{fmt(twT)}&nbsp;&nbsp;<span style={{color:lwT===0?C.tx2:wkChg>0?C.bad:C.ok,fontWeight:500}}>{lwT===0?"First week":`${wkChg>0?"▲":"▼"}${Math.abs(wkChg)}% vs last week`}</span></div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"flex-end",gap:5,height:52}}>
        {barData.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <div style={{width:"100%",height:40,display:"flex",alignItems:"flex-end"}}>
            <div style={{width:"100%",height:d.future?3:Math.max(3,Math.round((d.val/maxBar)*40)),background:d.today?C.acc:d.future?"rgba(255,255,255,0.07)":"rgba(124,111,255,0.3)",borderRadius:4}}/>
          </div>
          <div style={{fontSize:9,color:d.today?C.acc:C.tx3,fontWeight:d.today?700:400}}>{d.lbl}</div>
        </div>)}
      </div>
    </GC>
    {upBills.length>0&&<div>
      <div style={{fontSize:13,fontWeight:600,color:C.tx,marginBottom:8}}>Upcoming bills</div>
      {upBills.map(b=>{const due=`${y}-${mo}-${String(b.dueDay).padStart(2,"0")}`;const days=Math.ceil((new Date(due)-new Date(today))/(864e5));const cc=getCat(b.catId||"bills");
        return <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.s2,borderRadius:12,padding:"10px 14px",marginBottom:7,border:`1px solid ${C.b}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:cc.c+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{cc.em}</div>
            <div><div style={{fontSize:13,fontWeight:500,color:C.tx}}>{b.name}</div><div style={{fontSize:11,color:days<=2?C.warn:C.tx2}}>Due in {days}d</div></div>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:C.tx}}>{fmt(b.amount)}</div>
        </div>;
      })}
    </div>}
    {recent.length>0?<GC sx={{padding:"14px 14px"}}>
      <div style={{fontSize:13,fontWeight:600,color:C.tx,marginBottom:10}}>Recent transactions</div>
      {recent.map((e,i)=>{const c=getCat(e.catId);return <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<recent.length-1?`1px solid ${C.b}`:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:c.c+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{c.em}</div>
          <div><div style={{fontSize:12,fontWeight:500,color:C.tx}}>{e.note||c.l}</div><div style={{fontSize:10,color:C.tx2}}>{e.date}</div></div>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:C.bad}}>-{fmt(e.amount)}</div>
      </div>;})}
    </GC>:<GC sx={{textAlign:"center",padding:48}}>
      <div style={{fontSize:36,marginBottom:10}}>💸</div>
      <div style={{fontSize:14,fontWeight:500,color:C.tx,marginBottom:6}}>No expenses yet</div>
      <div style={{fontSize:12,color:C.tx2}}>Go to Expenses tab to add your first one</div>
    </GC>}
  </div>;
}

function ExpensesTab({mnExp,expenses,view,setView,selMonth,onEdit,onDel,splits,onSettle,onDelSplit}){
  const[sub,setSub]=useState("transactions");
  const sorted=[...mnExp].sort((a,b)=>b.date.localeCompare(a.date));
  const byDay=sorted.reduce((acc,e)=>{(acc[e.date]??=[]).push(e);return acc;},{});
  const byMonth=[...expenses].sort((a,b)=>b.date.localeCompare(a.date)).reduce((acc,e)=>{const ym=e.date.slice(0,7);if(!acc[ym])acc[ym]={exps:[],total:0};acc[ym].exps.push(e);acc[ym].total+=Number(e.amount);return acc;},{});
  const totalOwed=splits.reduce((s,sp)=>s+sp.people.filter(p=>!p.settled).reduce((ss,p)=>ss+p.amount,0),0);
  return <div>
    <div style={{display:"flex",gap:6,marginBottom:16}}>
      {[["transactions","Transactions"],["splits",`Splits${totalOwed>0?" · "+fmt(totalOwed):""}`,]].map(([v,lb])=>(
        <button key={v} onClick={()=>setSub(v)} style={{padding:"8px 14px",background:sub===v?C.acc:"transparent",border:`1px solid ${sub===v?C.acc:C.b}`,borderRadius:99,color:sub===v?"#fff":C.tx2,cursor:"pointer",fontSize:12,fontWeight:sub===v?600:400}}>{lb}</button>
      ))}
    </div>
    {sub==="transactions"&&<>
      <div style={{display:"flex",background:C.s2,borderRadius:12,padding:3,marginBottom:16,border:`1px solid ${C.b}`}}>
        {["daily","monthly"].map(v=><button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"8px 0",background:view===v?C.acc:"transparent",border:"none",borderRadius:10,color:view===v?"#fff":C.tx2,cursor:"pointer",fontSize:13,fontWeight:view===v?600:400,transition:"all .2s"}}>{v==="daily"?"Daily":"Monthly"}</button>)}
      </div>
      {view==="daily"?(Object.keys(byDay).length===0?<GC sx={{textAlign:"center",padding:60}}><div style={{fontSize:32,marginBottom:10}}>📭</div><div style={{fontSize:14,color:C.tx2}}>No expenses this month</div></GC>:Object.entries(byDay).map(([date,exps])=><div key={date} style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><Lbl>{new Date(date+"T12:00:00").toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"})}</Lbl><Lbl>{fmt(exps.reduce((s,e)=>s+Number(e.amount),0))}</Lbl></div>
        <GC sx={{padding:"4px 14px"}}>{exps.map(e=><ExpRow key={e.id} e={e} onEdit={()=>onEdit(e)} onDel={()=>onDel(e.id)}/>)}</GC>
      </div>)):(Object.keys(byMonth).length===0?<GC sx={{textAlign:"center",padding:60}}><div style={{color:C.tx2}}>No expenses yet</div></GC>:Object.entries(byMonth).map(([ym,{exps,total}])=><MonthItem key={ym} ym={ym} exps={exps} total={total} onEdit={onEdit} onDel={onDel}/>))}
    </>}
    {sub==="splits"&&<div>
      {totalOwed>0&&<div style={{background:"linear-gradient(135deg,#0d1f15,#081510)",border:`1px solid ${C.oD}`,borderRadius:14,padding:14,marginBottom:16}}><Lbl sx={{marginBottom:4}}>Total owed to you</Lbl><div style={{fontSize:22,fontWeight:700,color:C.ok}}>{fmt(totalOwed)}</div></div>}
      {splits.length===0?<GC sx={{textAlign:"center",padding:60}}><div style={{fontSize:32,marginBottom:10}}>🤝</div><div style={{fontSize:14,color:C.tx,fontWeight:500,marginBottom:6}}>No splits yet</div><div style={{fontSize:12,color:C.tx2}}>Tap 🤝 below to split an expense</div></GC>:splits.sort((a,b)=>b.date.localeCompare(a.date)).map(sp=>{
        const owed=sp.people.filter(p=>!p.settled).reduce((s,p)=>s+p.amount,0);
        return <GC key={sp.id} sx={{marginBottom:10,padding:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div><div style={{fontSize:14,fontWeight:600,color:C.tx}}>{sp.desc}</div><div style={{fontSize:11,color:C.tx2}}>{sp.date}</div></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {owed>0?<span style={{fontSize:13,fontWeight:700,color:C.ok}}>{fmt(owed)}</span>:<span style={{fontSize:11,color:C.ok,background:C.oD,padding:"3px 8px",borderRadius:99}}>Settled</span>}
              <button onClick={()=>onDelSplit(sp.id)} style={{background:"none",border:"none",color:C.bad,fontSize:13,cursor:"pointer",opacity:.6}}>✕</button>
            </div>
          </div>
          {sp.people.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderTop:`1px solid ${C.b}`}}>
            <span style={{fontSize:12,color:p.settled?C.tx2:C.tx}}>{p.name}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,fontWeight:600,color:p.settled?C.tx2:C.bad}}>{fmt(p.amount)}</span>
              {!p.settled&&<button onClick={()=>onSettle(sp.id,p.id)} style={{background:C.oD,border:`1px solid ${C.ok}`,color:C.ok,fontSize:10,padding:"3px 8px",borderRadius:99,cursor:"pointer",fontWeight:600}}>Settle</button>}
              {p.settled&&<span style={{fontSize:11,color:C.ok}}>✓</span>}
            </div>
          </div>)}
        </GC>;
      })}
    </div>}
  </div>;
}

function BillsTab({bills,selMonth,onPay,onDel}){
  const today=toDay();const[y,m]=selMonth.split("-");
  const ws=bills.map(b=>{const due=`${y}-${m}-${String(b.dueDay).padStart(2,"0")}`;const paid=!!b.paid?.[selMonth];return{...b,paid,overdue:!paid&&today>due};});
  const upcoming=ws.filter(b=>!b.paid&&!b.overdue).sort((a,c)=>a.dueDay-c.dueDay);
  const overdue=ws.filter(b=>b.overdue);const paid=ws.filter(b=>b.paid);
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <GC sx={{padding:14}}><Lbl sx={{marginBottom:4}}>Upcoming</Lbl><div style={{fontSize:18,fontWeight:700,color:C.warn}}>{fmt(upcoming.reduce((s,b)=>s+b.amount,0))}</div><div style={{fontSize:11,color:C.tx2,marginTop:2}}>{upcoming.length} bills</div></GC>
      <GC sx={{padding:14,borderColor:overdue.length>0?C.bD:C.b}}><Lbl sx={{marginBottom:4}}>Overdue</Lbl><div style={{fontSize:18,fontWeight:700,color:overdue.length>0?C.bad:C.tx2}}>{fmt(overdue.reduce((s,b)=>s+b.amount,0))}</div><div style={{fontSize:11,color:C.tx2,marginTop:2}}>{overdue.length} bills</div></GC>
    </div>
    {overdue.length>0&&<div><Lbl sx={{marginBottom:8,color:C.bad}}>⚠️ Overdue</Lbl>{overdue.map(b=><BillRow key={b.id} bill={b} selMonth={selMonth} onPay={onPay} onDel={onDel}/>)}</div>}
    {upcoming.length>0&&<div><Lbl sx={{marginBottom:8}}>Upcoming</Lbl>{upcoming.map(b=><BillRow key={b.id} bill={b} selMonth={selMonth} onPay={onPay} onDel={onDel}/>)}</div>}
    {paid.length>0&&<div><Lbl sx={{marginBottom:8}}>Paid this month</Lbl>{paid.map(b=><BillRow key={b.id} bill={b} selMonth={selMonth} onPay={onPay} onDel={onDel}/>)}</div>}
    {bills.length===0&&<GC sx={{textAlign:"center",padding:48}}><div style={{fontSize:36,marginBottom:10}}>🗓️</div><div style={{fontSize:14,fontWeight:500,color:C.tx,marginBottom:6}}>No bills yet</div><div style={{fontSize:12,color:C.tx2}}>Add recurring bills like Etisalat, DEWA, Netflix</div></GC>}
  </div>;
}

function ReportTab({expenses,income,selMonth}){
  const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-5+i);const ym=d.toISOString().slice(0,7);const inc=(income[ym]||[]).reduce((s,x)=>s+x.amount,0);const exp=expenses.filter(e=>e.date.startsWith(ym)).reduce((s,e)=>s+Number(e.amount),0);return{ym,name:mShort(ym),income:inc,expenses:exp};});
  const mnExp=expenses.filter(e=>e.date.startsWith(selMonth));
  const catData=CATS.map(c=>({name:c.l,em:c.em,color:c.c,value:mnExp.filter(e=>e.catId===c.id).reduce((s,e)=>s+Number(e.amount),0)})).filter(d=>d.value>0).sort((a,b)=>b.value-a.value);
  const selInc=(income[selMonth]||[]).reduce((s,x)=>s+x.amount,0);
  const selExp=mnExp.reduce((s,e)=>s+Number(e.amount),0);
  const selSav=Math.max(0,selInc-selExp);
  const savPct=selInc>0?Math.round((selSav/selInc)*100):0;
  const incSrc=income[selMonth]||[];
  const actInc=incSrc.filter(s=>s.type==="active").reduce((s,x)=>s+x.amount,0);
  const pasInc=incSrc.filter(s=>s.type==="passive").reduce((s,x)=>s+x.amount,0);
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {[["Income",selInc,C.ok,"↑"],["Spent",selExp,C.bad,"↓"],["Saved",selSav,C.acc,"💎"]].map(([l,v,c,em])=><GC key={l} sx={{padding:12,textAlign:"center"}}><div style={{fontSize:18,marginBottom:4}}>{em}</div><Lbl sx={{marginBottom:4,textAlign:"center"}}>{l}</Lbl><div style={{fontSize:13,fontWeight:700,color:c}}>{fmt(v)}</div></GC>)}
    </div>
    {selInc>0&&<GC><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:14,fontWeight:600,color:C.tx}}>Savings rate</div><div style={{fontSize:22,fontWeight:700,color:savPct>=20?C.ok:savPct>=10?C.warn:C.bad}}>{savPct}%</div></div><div style={{background:C.s3,borderRadius:99,height:8,overflow:"hidden"}}><div style={{width:`${savPct}%`,height:"100%",background:savPct>=20?C.ok:savPct>=10?C.warn:C.bad,borderRadius:99}}/></div><div style={{fontSize:11,color:C.tx2,marginTop:6}}>{savPct>=20?"🎉 Excellent! Keep it up":savPct>=10?"👍 Good — aim for 20%":"📈 Try to spend less this month"}</div></GC>}
    {incSrc.length>0&&<GC>
      <div style={{fontSize:14,fontWeight:600,color:C.tx,marginBottom:10}}>Income — {mLabel(selMonth)}</div>
      {incSrc.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.b}`}}>
        <div><div style={{fontSize:13,color:C.tx}}>{s.name}</div><div style={{fontSize:11,color:s.type==="passive"?C.gold:C.ok}}>{s.type==="passive"?"Passive":"Active"}</div></div>
        <div style={{fontSize:13,fontWeight:700,color:C.ok}}>{fmt(s.amount)}</div>
      </div>)}
      {actInc>0&&pasInc>0&&<div style={{display:"flex",gap:8,marginTop:10}}>
        <div style={{flex:1,background:C.oD,borderRadius:10,padding:10,textAlign:"center"}}><Lbl sx={{marginBottom:4,textAlign:"center"}}>Active</Lbl><div style={{fontSize:14,fontWeight:700,color:C.ok}}>{fmt(actInc)}</div></div>
        <div style={{flex:1,background:C.gD,borderRadius:10,padding:10,textAlign:"center"}}><Lbl sx={{marginBottom:4,textAlign:"center"}}>Passive</Lbl><div style={{fontSize:14,fontWeight:700,color:C.gold}}>{fmt(pasInc)}</div></div>
      </div>}
    </GC>}
    <GC>
      <div style={{fontSize:14,fontWeight:600,color:C.tx,marginBottom:4}}>6-month overview</div>
      <div style={{display:"flex",gap:10,marginBottom:10}}>
        {[[C.ok,"Income"],[C.bad,"Expenses"]].map(([c,l])=><div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.tx2}}><div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}</div>)}
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={months} barSize={14} barGap={2} margin={{left:-14,right:4}}>
          <XAxis dataKey="name" tick={{fill:C.tx2,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:C.tx2,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
          <Tooltip formatter={v=>fmt(v)} contentStyle={{background:C.s2,border:`1px solid ${C.b}`,borderRadius:8,fontSize:12,color:C.tx}} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
          <Bar dataKey="income" fill={C.ok} radius={[4,4,0,0]} opacity={.85}/>
          <Bar dataKey="expenses" fill={C.bad} radius={[4,4,0,0]} opacity={.85}/>
        </BarChart>
      </ResponsiveContainer>
    </GC>
    {catData.length>0&&<GC>
      <div style={{fontSize:14,fontWeight:600,color:C.tx,marginBottom:10}}>Top spending — {mLabel(selMonth)}</div>
      {catData.slice(0,5).map((d,i)=>{const pct=selExp>0?Math.round((d.value/selExp)*100):0;return <div key={d.name} style={{padding:"8px 0",borderTop:i>0?`1px solid ${C.b}`:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{d.em}</span><span style={{fontSize:12,color:C.tx}}>{d.name}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:C.tx2}}>{pct}%</span><span style={{fontSize:13,fontWeight:700,color:C.bad}}>{fmt(d.value)}</span></div>
        </div>
        <div style={{background:C.s3,borderRadius:99,height:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:d.color,borderRadius:99}}/></div>
      </div>;})}
    </GC>}
  </div>;
}

function SettingsTab({settings,income,selMonth,updSettings,onOpenIncome}){
  const[editB,setEditB]=useState(null);const[bVal,setBVal]=useState("");
  const budgets=settings.budgets||{};
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <GC glow>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div><div style={{fontSize:14,fontWeight:600,color:C.tx}}>Monthly income</div><div style={{fontSize:11,color:C.tx2}}>Active & passive — different each month</div></div>
        <button onClick={onOpenIncome} style={{background:C.aD,border:`1px solid ${C.aG}`,color:C.acc,fontSize:12,padding:"6px 14px",borderRadius:10,cursor:"pointer",fontWeight:600}}>Edit</button>
      </div>
      {Array.from({length:3},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const ym=d.toISOString().slice(0,7);const src=income[ym]||[];const tot=src.reduce((s,x)=>s+x.amount,0);return <div key={ym} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<2?`1px solid ${C.b}`:"none"}}><span style={{fontSize:13,color:i===0?C.tx:C.tx2,fontWeight:i===0?600:400}}>{mLabel(ym)}</span><span style={{fontSize:13,fontWeight:600,color:tot>0?C.ok:C.tx3}}>{tot>0?fmt(tot):"Not set"}</span></div>;})}
    </GC>
    <div>
      <div style={{fontSize:13,fontWeight:600,color:C.tx,marginBottom:10}}>Budget limits per category</div>
      {CATS.map(c=>{const b=budgets[c.id]||0;return <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.s2,borderRadius:10,padding:"10px 14px",marginBottom:6,border:`1px solid ${C.b}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{c.em}</span><span style={{fontSize:13,color:C.tx}}>{c.l}</span></div>
        <button onClick={()=>{setEditB(c.id);setBVal(b.toString());}} style={{background:b>0?C.aD:"transparent",border:`1px solid ${b>0?C.aG:C.b}`,color:b>0?C.acc:C.tx2,fontSize:12,padding:"4px 10px",borderRadius:8,cursor:"pointer"}}>{b>0?`AED ${b.toLocaleString()}`:"Set limit"}</button>
      </div>;})}
    </div>
    {editB&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200}}>
      <div style={{background:C.s1,border:`1px solid ${C.b}`,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:500}}>
        <div style={{fontSize:15,fontWeight:600,color:C.tx,marginBottom:14}}>{getCat(editB).em} {getCat(editB).l} — Monthly limit</div>
        <input type="number" value={bVal} onChange={e=>setBVal(e.target.value)} placeholder="Monthly limit (AED)" autoFocus style={{...I0,marginBottom:16}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setEditB(null)} style={{flex:1,padding:12,background:C.s2,border:`1px solid ${C.b}`,borderRadius:10,color:C.tx,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>{updSettings({...settings,budgets:{...budgets,[editB]:+bVal||0}});setEditB(null);}} style={{flex:1,padding:12,background:C.acc,border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button>
        </div>
      </div>
    </div>}
  </div>;
}

export default function App(){
  const[tab,setTab]=useState("home");
  const[expenses,setExpenses]=useState([]);const[income,setIncome]=useState({});
  const[bills,setBills]=useState([]);const[splits,setSplits]=useState([]);
  const[settings,setSettings]=useState({budgets:{}});const[ready,setReady]=useState(false);
  const[selM,setSelM]=useState(thisM());const[view,setView]=useState("daily");
  const[expMod,setExpMod]=useState(null);const[billMod,setBillMod]=useState(null);
  const[splitMod,setSplitMod]=useState(false);const[incMod,setIncMod]=useState(false);
  const[delCfm,setDelCfm]=useState(null);

  useEffect(()=>{
    const e=sg("floos_exp"),i=sg("floos_inc"),b=sg("floos_bills"),sp=sg("floos_splits"),s=sg("floos_set");
    if(e)setExpenses(e);if(i)setIncome(i);if(b)setBills(b);if(sp)setSplits(sp);if(s)setSettings({budgets:{},...s});
    setReady(true);
  },[]);

  const saveExp=e=>{setExpenses(e);ss("floos_exp",e);};
  const saveInc=i=>{setIncome(i);ss("floos_inc",i);};
  const saveBills=b=>{setBills(b);ss("floos_bills",b);};
  const saveSplits=sp=>{setSplits(sp);ss("floos_splits",sp);};
  const saveSets=s=>{setSettings(s);ss("floos_set",s);};

  const handleSaveExp=exp=>{const isEdit=expMod&&typeof expMod==="object"&&expMod.id;saveExp(isEdit?expenses.map(e=>e.id===expMod.id?{...exp,id:expMod.id}:e):[{...exp,id:Date.now()+(Math.random()*999|0)},...expenses]);setExpMod(null);};
  const handleSaveBill=bill=>{const isEdit=billMod&&typeof billMod==="object"&&billMod.id;saveBills(isEdit?bills.map(b=>b.id===billMod.id?{...bill,id:billMod.id,paid:billMod.paid||{}}:b):[{...bill,id:Date.now()+(Math.random()*999|0)},...bills]);setBillMod(null);};
  const handlePayBill=id=>saveBills(bills.map(b=>b.id===id?{...b,paid:{...b.paid,[selM]:true}}:b));
  const handleSaveIncome=src=>{saveInc({...income,[selM]:src});setIncMod(false);};
  const handleSaveSplit=sp=>{saveSplits([sp,...splits]);setSplitMod(false);};
  const handleSettle=(spId,pId)=>saveSplits(splits.map(sp=>sp.id===spId?{...sp,people:sp.people.map(p=>p.id===pId?{...p,settled:true}:p)}:sp));
  const handleDelSplit=id=>saveSplits(splits.filter(s=>s.id!==id));
  const handleDel=()=>{if(!delCfm)return;if(delCfm.t==="exp")saveExp(expenses.filter(e=>e.id!==delCfm.id));if(delCfm.t==="bill")saveBills(bills.filter(b=>b.id!==delCfm.id));setDelCfm(null);};

  const mnExp=expenses.filter(e=>e.date.startsWith(selM));
  const TABS=[{id:"home",em:"🏠",lb:"Home"},{id:"expenses",em:"💸",lb:"Expenses"},{id:"bills",em:"🗓️",lb:"Bills"},{id:"report",em:"📊",lb:"Report"},{id:"settings",em:"⚙️",lb:"Settings"}];

  if(!ready)return <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:C.tx2,fontFamily:"sans-serif"}}>Loading Floos...</div>;

  return <div style={{background:C.bg,minHeight:"100vh",color:C.tx,fontFamily:"'Inter',-apple-system,sans-serif",maxWidth:500,margin:"0 auto",paddingBottom:90}}>
    <style>{`*{box-sizing:border-box;}input[type="date"],input[type="month"]{color-scheme:dark;}`}</style>
    <div style={{padding:"15px 18px 11px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.b}`,position:"sticky",top:0,background:C.bg,zIndex:20}}>
      <div>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:-1}}>Floos</div>
        <div style={{fontSize:10,color:C.tx3,marginTop:1}}>Your money, your rules</div>
      </div>
      <input type="month" value={selM} onChange={e=>setSelM(e.target.value)} style={{background:C.s2,border:`1px solid ${C.b}`,color:C.tx,borderRadius:8,padding:"5px 10px",fontSize:12,outline:"none",cursor:"pointer"}}/>
    </div>
    <div style={{padding:"16px 16px 0"}}>
      {tab==="home"&&<HomeTab expenses={expenses} income={income} bills={bills} selMonth={selM} onOpenIncome={()=>setIncMod(true)}/>}
      {tab==="expenses"&&<ExpensesTab mnExp={mnExp} expenses={expenses} view={view} setView={setView} selMonth={selM} onEdit={e=>setExpMod(e)} onDel={id=>setDelCfm({t:"exp",id})} splits={splits} onSettle={handleSettle} onDelSplit={handleDelSplit}/>}
      {tab==="bills"&&<BillsTab bills={bills} selMonth={selM} onPay={handlePayBill} onDel={id=>setDelCfm({t:"bill",id})}/>}
      {tab==="report"&&<ReportTab expenses={expenses} income={income} selMonth={selM}/>}
      {tab==="settings"&&<SettingsTab settings={settings} income={income} selMonth={selM} updSettings={saveSets} onOpenIncome={()=>setIncMod(true)}/>}
    </div>
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,background:"rgba(7,7,15,0.97)",borderTop:`1px solid ${C.b}`,display:"flex",justifyContent:"space-around",padding:"8px 0 14px",zIndex:50}}>
      {TABS.map(({id,em,lb})=><button key={id} onClick={()=>setTab(id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 8px"}}>
        <span style={{fontSize:21}}>{em}</span>
        <span style={{fontSize:9,color:tab===id?C.acc:C.tx3,fontWeight:tab===id?700:400}}>{lb}</span>
        {tab===id&&<div style={{width:4,height:4,borderRadius:99,background:C.acc}}/>}
      </button>)}
    </div>
    {tab==="expenses"&&<>
      <button onClick={()=>setExpMod("new")} style={{position:"fixed",bottom:82,right:20,background:C.acc,border:"none",borderRadius:"50%",width:54,height:54,fontSize:26,cursor:"pointer",color:"#fff",boxShadow:`0 4px 24px ${C.aG}`,zIndex:49,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      <button onClick={()=>setSplitMod(true)} style={{position:"fixed",bottom:82,right:84,background:C.s2,border:`1px solid ${C.b}`,borderRadius:"50%",width:44,height:44,fontSize:18,cursor:"pointer",zIndex:49,display:"flex",alignItems:"center",justifyContent:"center"}}>🤝</button>
    </>}
    {tab==="bills"&&<button onClick={()=>setBillMod("new")} style={{position:"fixed",bottom:82,right:20,background:"#0a2218",border:`1px solid ${C.ok}`,borderRadius:"50%",width:54,height:54,fontSize:26,cursor:"pointer",color:C.ok,boxShadow:"0 4px 20px rgba(5,207,160,0.2)",zIndex:49,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
    {expMod!==null&&<AddExpModal item={typeof expMod==="object"?expMod:null} onSave={handleSaveExp} onClose={()=>setExpMod(null)}/>}
    {billMod!==null&&<AddBillModal item={typeof billMod==="object"?billMod:null} onSave={handleSaveBill} onClose={()=>setBillMod(null)}/>}
    {splitMod&&<AddSplitModal onSave={handleSaveSplit} onClose={()=>setSplitMod(false)}/>}
    {incMod&&<IncomeModal selMonth={selM} sources={income[selM]||[]} onSave={handleSaveIncome} onClose={()=>setIncMod(false)}/>}
    {delCfm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:24}}>
      <div style={{background:C.s1,border:`1px solid ${C.b}`,borderRadius:16,padding:24,width:"100%",maxWidth:320}}>
        <div style={{fontSize:16,fontWeight:600,color:C.tx,marginBottom:8}}>Delete this {delCfm.t==="exp"?"expense":"bill"}?</div>
        <div style={{color:C.tx2,fontSize:13,marginBottom:20}}>This cannot be undone.</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setDelCfm(null)} style={{flex:1,padding:12,background:C.s2,border:`1px solid ${C.b}`,borderRadius:10,color:C.tx,cursor:"pointer"}}>Cancel</button>
          <button onClick={handleDel} style={{flex:1,padding:12,background:C.bad,border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:"pointer"}}>Delete</button>
        </div>
      </div>
    </div>}
  </div>;
}
