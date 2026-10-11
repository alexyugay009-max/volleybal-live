function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function fmtDate(s){if(!s)return "";const d=new Date(s.replace(" ","T"));return Number.isNaN(d.getTime())?s:d.toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}
function card(m){
  const st=String(m.status).toLowerCase();
  const live=["live","inprogress","in_progress","started"].includes(st);
  const done=["finished","ended","completed"].includes(st);
  return `<article class="match">
    <div class="team"><div class="status ${live?"live":done?"done":""}">${esc(m.statusText||m.status)}</div>${m.home.logo?`<img src="${esc(m.home.logo)}" alt="">`:""}${esc(m.home.name)}</div>
    <div class="score"><div class="sets">${m.home.sets} : ${m.away.sets}</div><div class="points">${live?`Сет: ${m.home.points} : ${m.away.points}`:fmtDate(m.dateTime)}</div></div>
    <div class="team"><div class="status">&nbsp;</div>${m.away.logo?`<img src="${esc(m.away.logo)}" alt="">`:""}${esc(m.away.name)}</div>
  </article>`
}
async function load(){
 const box=document.getElementById("todayMatches"); if(!box)return;
 const date=new Date().toISOString().slice(0,10);
 try{const r=await fetch(`/api/matches?date=${date}`);const d=await r.json();box.innerHTML=d.success&&d.matches.length?d.matches.map(card).join(""):`<div class="empty">${esc(d.message||"Матчей сегодня нет.")}</div>`}
 catch(e){box.innerHTML='<div class="empty">Не удалось загрузить данные.</div>'}
}
load();
