const datePicker=document.getElementById("datePicker");
const box=document.getElementById("matches");
const today=new Date();
datePicker.value=today.toISOString().slice(0,10);
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function fmt(s){if(!s)return "";const d=new Date(s.replace(" ","T"));return Number.isNaN(d.getTime())?s:d.toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}
function render(m){
 const st=String(m.status).toLowerCase(),live=["live","inprogress","in_progress","started"].includes(st),done=["finished","ended","completed"].includes(st);
 return `<article class="match"><div class="team"><div class="status ${live?"live":done?"done":""}">${esc(m.statusText||m.status)}</div>${m.home.logo?`<img src="${esc(m.home.logo)}" alt="">`:""}${esc(m.home.name)}</div><div class="score"><div class="sets">${m.home.sets} : ${m.away.sets}</div><div class="points">${live?`Текущий сет: ${m.home.points} : ${m.away.points}`:done?"Завершён":fmt(m.dateTime)}</div></div><div class="team"><div class="status">&nbsp;</div>${m.away.logo?`<img src="${esc(m.away.logo)}" alt="">`:""}${esc(m.away.name)}</div></article>`;
}
async function load(date){
 box.innerHTML='<div class="loading">Загрузка...</div>';
 try{const r=await fetch(`/api/matches?date=${date}`);const d=await r.json();box.innerHTML=d.success&&d.matches.length?d.matches.map(render).join(""):`<div class="empty">${esc(d.message||"На эту дату матчей нет.")}</div>`}
 catch(e){box.innerHTML='<div class="empty">Ошибка соединения с сервером.</div>'}
}
datePicker.addEventListener("change",()=>load(datePicker.value));
function shift(n){const d=new Date(datePicker.value+"T00:00:00");d.setDate(d.getDate()+n);datePicker.value=d.toISOString().slice(0,10);load(datePicker.value)}
document.getElementById("prevDay").addEventListener("click",()=>shift(-1));
document.getElementById("nextDay").addEventListener("click",()=>shift(1));
load(datePicker.value);
