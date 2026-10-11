const box=document.getElementById("players");
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function render(p){
 const name=p.name||p.player_name||"Игрок";
 const pos=p.position||p.role||"—";
 const team=p.team_name||p.team||p.current_team||"—";
 const num=p.shirt_number||p.number||"—";
 const photo=p.photo||"";
 return `<article class="player">${photo?`<img class="avatar" src="${esc(photo)}" alt="${esc(name)}">`:`<div class="avatar">🏐</div>`}<h3>${esc(name)}</h3><p>№ ${esc(num)} · ${esc(pos)}</p><p>${esc(team)}</p></article>`;
}
async function load(url="/api/players"){
 try{const r=await fetch(url);const d=await r.json();box.innerHTML=d.success&&d.players.length?d.players.map(render).join(""):'<div class="empty">Игроки не найдены.</div>'}
 catch(e){box.innerHTML='<div class="empty">Ошибка загрузки игроков.</div>'}
}
document.getElementById("playerSearch").addEventListener("submit",async e=>{
 e.preventDefault();const q=document.getElementById("query").value.trim();
 if(!q)return load();
 box.innerHTML='<div class="loading">Поиск...</div>';
 load(`/api/search/player?q=${encodeURIComponent(q)}`);
});
load();
