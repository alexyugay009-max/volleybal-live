const box=document.getElementById("liveMatches"), empty=document.getElementById("liveEmpty");
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function render(m){
 return `<article class="live-card">
  <div class="live-top"><span>● LIVE</span><span>${esc(m.league)}</span></div>
  <div class="live-score">
    <div class="live-team">${esc(m.home.name)}</div>
    <div><div class="live-number">${m.home.sets} : ${m.away.sets}</div><div class="setsline">текущий сет ${m.home.points} : ${m.away.points}</div></div>
    <div class="live-team">${esc(m.away.name)}</div>
  </div>
  <div class="stream" id="stream-${esc(m.id)}">Проверяем доступность трансляции...</div>
 </article>`;
}
async function stream(id){
 try{
  const r=await fetch(`/api/stream/${encodeURIComponent(id)}`);const d=await r.json();
  const el=document.getElementById(`stream-${id}`);
  if(!el)return;
  if(d.streamUrl) el.innerHTML=`<a class="button" target="_blank" rel="noopener" href="${esc(d.streamUrl)}">▶ Открыть трансляцию</a>`;
  else el.innerHTML=`<a class="button ghost" target="_blank" rel="noopener" href="https://tv.volleyballworld.com/">Открыть VBTV</a>`;
 }catch(e){
  const el=document.getElementById(`stream-${id}`);if(el)el.innerHTML=`<a class="button ghost" target="_blank" rel="noopener" href="https://tv.volleyballworld.com/">VBTV</a>`;
 }
}
async function load(){
 try{
  const r=await fetch("/api/live");const d=await r.json();
  if(!d.success){box.innerHTML=`<div class="empty">${esc(d.message)}</div>`;empty.style.display="none";return}
  empty.style.display=d.matches.length?"none":"block";
  box.innerHTML=d.matches.map(render).join("");
  d.matches.forEach(m=>stream(m.id));
 }catch(e){box.innerHTML='<div class="empty">Не удалось получить LIVE-данные.</div>';empty.style.display="none"}
}
load();
setInterval(load,30000);
