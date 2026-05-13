// ════════════════════════════════
//  ESTADO — apenas memória RAM
// ════════════════════════════════
const S = {
  currentType: 'income',
  goalAmount: 10000,
  nextId: 200,
  categories: [
    { id:1, name:'Moradia',     emoji:'🏠', color:'#8B5CF6', type:'expense' },
    { id:2, name:'Alimentação', emoji:'🍔', color:'#F97316', type:'expense' },
    { id:3, name:'Educação',    emoji:'📚', color:'#14B8A6', type:'expense' },
    { id:4, name:'Transporte',  emoji:'🚗', color:'#3B82F6', type:'expense' },
    { id:5, name:'Saúde',       emoji:'❤️', color:'#EF4444', type:'expense' },
    { id:6, name:'Lazer',       emoji:'🎮', color:'#EC4899', type:'expense' },
    { id:7, name:'Salário',     emoji:'💼', color:'#00C96F', type:'income'  },
    { id:8, name:'Freelance',   emoji:'💻', color:'#06B6D4', type:'income'  },
  ],
  transactions: [
    { id:1,  desc:'Salário Março',      amount:5500, type:'income',  cat:'Salário',     date:'2026-03-05' },
    { id:2,  desc:'Freelance Design',   amount:1610, type:'income',  cat:'Freelance',   date:'2026-03-12' },
    { id:3,  desc:'Aluguel',            amount:1200, type:'expense', cat:'Moradia',     date:'2026-03-10' },
    { id:4,  desc:'Supermercado',       amount:520,  type:'expense', cat:'Alimentação', date:'2026-03-15' },
    { id:5,  desc:'Curso Online',       amount:130,  type:'expense', cat:'Educação',    date:'2026-03-18' },
    { id:6,  desc:'Uber',               amount:95,   type:'expense', cat:'Transporte',  date:'2026-03-20' },
    { id:7,  desc:'Netflix',            amount:45,   type:'expense', cat:'Lazer',       date:'2026-03-22' },
    { id:8,  desc:'Salário Fevereiro',  amount:5500, type:'income',  cat:'Salário',     date:'2026-02-05' },
    { id:9,  desc:'Aluguel Fev',        amount:1200, type:'expense', cat:'Moradia',     date:'2026-02-10' },
    { id:10, desc:'Supermercado Fev',   amount:480,  type:'expense', cat:'Alimentação', date:'2026-02-16' },
    { id:11, desc:'Salário Janeiro',    amount:5000, type:'income',  cat:'Salário',     date:'2026-01-05' },
    { id:12, desc:'Aluguel Jan',        amount:1200, type:'expense', cat:'Moradia',     date:'2026-01-10' },
    { id:13, desc:'Farmácia',           amount:180,  type:'expense', cat:'Saúde',       date:'2026-01-22' },
  ]
};

// ════════════════════════════════
//  HELPERS
// ════════════════════════════════
const PALETTE = ['#8B5CF6','#F97316','#14B8A6','#3B82F6','#EC4899','#EF4444','#10B981','#F59E0B','#06B6D4'];

const fmt = n => 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits:2 });
const setEl = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
const catOf  = name => S.categories.find(c => c.name === name) || { color:'#ccc', emoji:'•' };
const txByM  = (m, y) => S.transactions.filter(t => { const d = new Date(t.date+'T00:00:00'); return d.getMonth()===m && d.getFullYear()===y; });
const sumAmt = (arr, type) => arr.filter(t=>t.type===type).reduce((a,b)=>a+b.amount,0);

let charts = {};
function destroyCharts() { Object.values(charts).forEach(c=>{ try{c.destroy()}catch(e){} }); charts={}; }
function mkChart(id, cfg) { const el=document.getElementById(id); if(el) charts[id]=new Chart(el,cfg); }

// ════════════════════════════════
//  NAVEGAÇÃO
// ════════════════════════════════
function nav(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  const ni = document.getElementById('nav-'+page); if(ni) ni.classList.add('active');
  destroyCharts();
  ({ dashboard:renderDashboard, transacoes:renderTransactions, categorias:renderCategories, relatorios:renderReports })[page]?.();
}

// ════════════════════════════════
//  DASHBOARD
// ════════════════════════════════
function renderDashboard() {
  const totalInc = sumAmt(S.transactions,'income');
  const totalExp = sumAmt(S.transactions,'expense');
  const bal = totalInc - totalExp;

  setEl('k-income',  fmt(totalInc));
  setEl('k-expense', fmt(totalExp));
  setEl('k-balance', (bal>=0?'+':'-')+fmt(bal));
  const gPct = Math.min(Math.round((totalInc/S.goalAmount)*100), 999);
  setEl('k-goal', gPct+'%');
  setEl('side-balance', (bal>=0?'+':'-')+fmt(bal));
  document.getElementById('k-inc-badge').textContent  = '+'+gPct+'% da meta';
  document.getElementById('k-exp-badge').textContent  = Math.round((totalExp/totalInc||0)*100)+'% da receita';
  document.getElementById('k-bal-badge').textContent  = bal>=0 ? '↑ Positivo' : '↓ Negativo';
  document.getElementById('k-goal-badge').textContent = gPct+'% atingido';

  // últimas 5 transações
  const last5 = [...S.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const tbody = document.getElementById('dash-tbody');
  const empty = document.getElementById('dash-empty');
  if (!last5.length) { tbody.innerHTML=''; empty.style.display='block'; }
  else { empty.style.display='none'; tbody.innerHTML=last5.map(t=>rowHtml(t,false)).join(''); }

  // line chart: 6 meses
  const ref = new Date(2026,3,1);
  const pairs = Array.from({length:6},(_,i)=>{ const d=new Date(ref.getFullYear(),ref.getMonth()-5+i,1); return {m:d.getMonth(),y:d.getFullYear()}; });
  const lbls = pairs.map(p=>new Date(p.y,p.m).toLocaleDateString('pt-BR',{month:'short'}));
  const iData = pairs.map(p=>sumAmt(txByM(p.m,p.y),'income'));
  const eData = pairs.map(p=>sumAmt(txByM(p.m,p.y),'expense'));

  mkChart('lineChart',{type:'line',data:{labels:lbls,datasets:[
    {label:'Receitas',data:iData,borderColor:'#00C96F',backgroundColor:'rgba(0,201,111,.08)',borderWidth:2.5,tension:.4,fill:true,pointRadius:5,pointBackgroundColor:'#00C96F'},
    {label:'Despesas',data:eData,borderColor:'#FF4D6D',backgroundColor:'rgba(255,77,109,.06)',borderWidth:2.5,tension:.4,fill:true,pointRadius:5,pointBackgroundColor:'#FF4D6D'},
  ]},options:{plugins:{legend:{position:'top',labels:{font:{size:11},padding:14}}},scales:{y:{grid:{color:'#F3F4F6'},ticks:{callback:v=>'R$'+Math.round(v/1000)+'k'}},x:{grid:{display:false}}},responsive:true,maintainAspectRatio:true}});

  // donut
  const catMap={};
  S.transactions.filter(t=>t.type==='expense').forEach(t=>{ catMap[t.cat]=(catMap[t.cat]||0)+t.amount; });
  const keys=Object.keys(catMap);
  mkChart('donutChart',{type:'doughnut',data:{labels:keys,datasets:[{data:keys.map(k=>catMap[k]),backgroundColor:keys.map(k=>catOf(k).color||'#ccc'),borderWidth:0,hoverOffset:6}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:10,boxWidth:10}}},cutout:'60%',responsive:true,maintainAspectRatio:true}});
}

// ════════════════════════════════
//  TRANSAÇÕES
// ════════════════════════════════
function renderTransactions() {
  const sel = document.getElementById('flt-cat');
  sel.innerHTML = '<option value="">Todas as categorias</option>' + S.categories.map(c=>`<option>${c.name}</option>`).join('');
  renderTxTable();
}

function renderTxTable() {
  const q    = (document.getElementById('search-tx')?.value||'').toLowerCase();
  const type = document.getElementById('flt-type')?.value||'';
  const cat  = document.getElementById('flt-cat')?.value||'';
  let list   = [...S.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(q)    list=list.filter(t=>t.desc.toLowerCase().includes(q)||t.cat.toLowerCase().includes(q));
  if(type) list=list.filter(t=>t.type===type);
  if(cat)  list=list.filter(t=>t.cat===cat);
  const tbody=document.getElementById('tx-tbody'), empty=document.getElementById('tx-empty');
  if(!list.length){ tbody.innerHTML=''; empty.style.display='block'; }
  else { empty.style.display='none'; tbody.innerHTML=list.map(t=>rowHtml(t,true)).join(''); }
}

function rowHtml(t, full) {
  const c = catOf(t.cat);
  const dateStr = new Date(t.date+'T00:00:00').toLocaleDateString('pt-BR');
  const pill = t.type==='income'
    ? `<span style="background:var(--green-light);color:var(--green-dark);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">Receita</span>`
    : `<span style="background:var(--red-light);color:var(--red);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">Despesa</span>`;
  return `<tr>
    <td><strong>${t.desc}</strong></td>
    <td><span style="background:${c.color}22;color:${c.color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">${c.emoji} ${t.cat}</span></td>
    <td style="color:var(--text-muted)">${dateStr}</td>
    ${full?`<td>${pill}</td>`:''}
    <td class="${t.type==='income'?'amount-pos':'amount-neg'}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</td>
    ${full?`<td><button class="btn btn-danger" onclick="deleteTx(${t.id})">✕</button></td>`:''}
  </tr>`;
}

function deleteTx(id) {
  S.transactions = S.transactions.filter(t=>t.id!==id);
  renderTxTable();
  const bal = sumAmt(S.transactions,'income') - sumAmt(S.transactions,'expense');
  setEl('side-balance', (bal>=0?'+':'-')+fmt(bal));
  showToast('🗑 Transação removida.');
}

// ════════════════════════════════
//  CATEGORIAS
// ════════════════════════════════
function renderCategories() {
  document.getElementById('cats-grid').innerHTML = S.categories.map(c=>{
    const total = S.transactions.filter(t=>t.cat===c.name).reduce((a,b)=>a+b.amount,0);
    const cnt   = S.transactions.filter(t=>t.cat===c.name).length;
    return `<div class="cat-card">
      <div class="cat-icon-box" style="background:${c.color}22;">${c.emoji}</div>
      <div>
        <div class="cat-name">${c.name}</div>
        <div class="cat-total">${fmt(total)}</div>
        <div class="cat-count">${cnt} transaç${cnt===1?'ão':'ões'} · ${c.type==='income'?'Receita':'Despesa'}</div>
      </div>
    </div>`;
  }).join('');

  const expCats = S.categories.filter(c=>c.type==='expense');
  const totals  = expCats.map(c=>S.transactions.filter(t=>t.cat===c.name&&t.type==='expense').reduce((a,b)=>a+b.amount,0));
  mkChart('catBarChart',{type:'bar',data:{labels:expCats.map(c=>c.emoji+' '+c.name),datasets:[{data:totals,backgroundColor:expCats.map(c=>c.color+'CC'),borderRadius:6,borderSkipped:false}]},options:{plugins:{legend:{display:false}},scales:{y:{grid:{color:'#F3F4F6'},ticks:{callback:v=>'R$'+v}},x:{grid:{display:false}}},responsive:true,maintainAspectRatio:true}});
}

// ════════════════════════════════
//  RELATÓRIOS
// ════════════════════════════════
function renderReports() {
  const m = parseInt(document.getElementById('rep-month').value);
  const y = parseInt(document.getElementById('rep-year').value);
  const txM = txByM(m,y);
  const inc = sumAmt(txM,'income'), exp = sumAmt(txM,'expense'), bal = inc-exp;

  // bar: últimos 6 meses
  const ref = new Date(y, m, 1);
  const pairs = Array.from({length:6},(_,i)=>{ const d=new Date(ref.getFullYear(),ref.getMonth()-5+i,1); return {m:d.getMonth(),y:d.getFullYear()}; });
  mkChart('barChart',{type:'bar',data:{labels:pairs.map(p=>new Date(p.y,p.m).toLocaleDateString('pt-BR',{month:'short'})),datasets:[
    {label:'Receitas',data:pairs.map(p=>sumAmt(txByM(p.m,p.y),'income')),backgroundColor:'#00C96F99',borderRadius:5},
    {label:'Despesas',data:pairs.map(p=>sumAmt(txByM(p.m,p.y),'expense')),backgroundColor:'#FF4D6D99',borderRadius:5},
  ]},options:{plugins:{legend:{position:'top'}},scales:{y:{grid:{color:'#F3F4F6'}},x:{grid:{display:false}}},responsive:true,maintainAspectRatio:true}});

  // pie
  const catMap={};
  txM.filter(t=>t.type==='expense').forEach(t=>{ catMap[t.cat]=(catMap[t.cat]||0)+t.amount; });
  const keys=Object.keys(catMap);
  const colors=keys.map(k=>catOf(k).color||'#ccc');
  mkChart('pieChart',{type:'pie',data:{labels:keys,datasets:[{data:keys.map(k=>catMap[k]),backgroundColor:colors,borderWidth:0}]},options:{plugins:{legend:{display:false}},responsive:true,maintainAspectRatio:true}});

  const total=keys.reduce((a,k)=>a+catMap[k],0)||1;
  document.getElementById('pie-legend').innerHTML = keys.length
    ? keys.map((k,i)=>`<li class="legend-item"><span style="display:flex;align-items:center;"><span class="legend-dot" style="background:${colors[i]}"></span>${catOf(k).emoji} ${k}</span><strong>${fmt(catMap[k])}</strong></li><li style="margin-bottom:4px"><div class="progress-bar"><div class="progress-fill" style="width:${Math.round((catMap[k]/total)*100)}%;background:${colors[i]}"></div></div></li>`).join('')
    : '<li style="color:var(--text-muted);text-align:center;padding:12px 0;">Sem despesas neste mês.</li>';

  document.getElementById('rep-summary').innerHTML = [
    {label:'Total Receitas', val:fmt(inc),                         color:'var(--green)'},
    {label:'Total Despesas', val:fmt(exp),                         color:'var(--red)'},
    {label:'Saldo do Mês',   val:(bal>=0?'+':'-')+fmt(bal),        color:bal>=0?'var(--blue)':'var(--red)'},
  ].map(s=>`<div style="background:var(--bg);border-radius:12px;padding:18px;"><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">${s.label}</div><div style="font-size:22px;font-weight:700;font-family:'JetBrains Mono',monospace;color:${s.color}">${s.val}</div></div>`).join('');
}

// ════════════════════════════════
//  MODAIS
// ════════════════════════════════
function openTxModal() {
  selType('income');
  document.getElementById('tx-desc').value   = '';
  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-date').value   = new Date(2026,3,28).toISOString().split('T')[0];
  document.getElementById('tx-modal').classList.add('open');
}
function closeTxModal() { document.getElementById('tx-modal').classList.remove('open'); }

function openCatModal() {
  ['cat-name','cat-emoji'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('cat-color').value='#00C96F';
  document.getElementById('cat-modal').classList.add('open');
}
function closeCatModal() { document.getElementById('cat-modal').classList.remove('open'); }

function selType(t) {
  S.currentType = t;
  document.getElementById('btn-income').className  = 'type-btn'+(t==='income'  ?' sel-income':'');
  document.getElementById('btn-expense').className = 'type-btn'+(t==='expense' ?' sel-expense':'');
  document.getElementById('tx-cat').innerHTML = S.categories.filter(c=>c.type===t).map(c=>`<option>${c.name}</option>`).join('');
}

function addTransaction() {
  const desc   = document.getElementById('tx-desc').value.trim();
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const date   = document.getElementById('tx-date').value;
  const cat    = document.getElementById('tx-cat').value;
  if (!desc||!amount||amount<=0||!date||!cat) { showToast('❌ Preencha todos os campos.'); return; }
  S.transactions.push({ id:++S.nextId, desc, amount, type:S.currentType, cat, date });
  closeTxModal();
  showToast('✅ Transação adicionada!');
  nav('dashboard');
}

function addCategory() {
  const name  = document.getElementById('cat-name').value.trim();
  const emoji = document.getElementById('cat-emoji').value.trim()||'📁';
  const color = document.getElementById('cat-color').value;
  const type  = document.getElementById('cat-type').value;
  if (!name) { showToast('❌ Informe o nome da categoria.'); return; }
  if (S.categories.find(c=>c.name.toLowerCase()===name.toLowerCase())) { showToast('❌ Categoria já existe.'); return; }
  S.categories.push({ id:++S.nextId, name, emoji, color, type });
  closeCatModal();
  showToast('✅ Categoria criada!');
  renderCategories();
}

// ════════════════════════════════
//  TOAST
// ════════════════════════════════
let toastT;
function showToast(msg) {
  clearTimeout(toastT);
  document.getElementById('toast-msg').textContent = msg;
  const el = document.getElementById('toast');
  el.classList.add('show');
  toastT = setTimeout(()=>el.classList.remove('show'), 2800);
}

// ════════════════════════════════
//  INIT
// ════════════════════════════════
(function() {
  const d = new Date(2026,3,28);
  setEl('top-date', d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
  document.getElementById('rep-month').value = '2';
  document.querySelectorAll('.overlay').forEach(ov=>ov.addEventListener('click',e=>{ if(e.target===ov) ov.classList.remove('open'); }));
  renderDashboard();
})();
