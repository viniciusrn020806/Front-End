import { useState, useEffect, useRef } from 'react';
import './style.css';


const INITIAL_CATEGORIES = [
  { id:1, name:'Moradia',     emoji:'🏠', color:'#8B5CF6', type:'expense' },
  { id:2, name:'Alimentação', emoji:'🍔', color:'#F97316', type:'expense' },
  { id:3, name:'Educação',    emoji:'📚', color:'#14B8A6', type:'expense' },
  { id:4, name:'Transporte',  emoji:'🚗', color:'#3B82F6', type:'expense' },
  { id:5, name:'Saúde',       emoji:'❤️', color:'#EF4444', type:'expense' },
  { id:6, name:'Lazer',       emoji:'🎮', color:'#EC4899', type:'expense' },
  { id:7, name:'Salário',     emoji:'💼', color:'#00C96F', type:'income'  },
  { id:8, name:'Freelance',   emoji:'💻', color:'#06B6D4', type:'income'  },
];

const INITIAL_TRANSACTIONS = [
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
];

const GOAL_AMOUNT = 10000;

// Funções de formatação globais
const fmt = n => 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits:2 });
const sumAmt = (arr, type) => arr.filter(t=>t.type===type).reduce((a,b)=>a+b.amount,0);

function App() {
  // ESTADOS DO SISTEMA
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Estados dos Modais
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);

  // Estados dos Formulários
  const [txType, setTxType] = useState('income');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState('2026-05-20');
  const [txCat, setTxCat] = useState('Salário');

  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('');
  const [catColor, setCatColor] = useState('#00C96F');
  const [catType, setCatType] = useState('expense');

  // Estados de Filtro (Página de Transações e Relatórios)
  const [searchTx, setSearchTx] = useState('');
  const [fltType, setFltType] = useState('');
  const [fltCat, setFltCat] = useState('');
  const [repMonth, setRepMonth] = useState(2); // Março (0-indexado)
  const [repYear, setRepYear] = useState(2026);

  // Referências para os gráficos
  const lineChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const catBarChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // Helper local para categorias
  const catOf = name => categories.find(c => c.name === name) || { color:'#ccc', emoji:'•' };
  const txByM = (m, y) => transactions.filter(t => { 
    const d = new Date(t.date+'T00:00:00'); 
    return d.getMonth()===m && d.getFullYear()===y; 
  });

  // LÓGICA DE DADOS COMPUTADOS (Dashboard)
  const totalInc = sumAmt(transactions, 'income');
  const totalExp = sumAmt(transactions, 'expense');
  const bal = totalInc - totalExp;
  const gPct = Math.min(Math.round((totalInc / GOAL_AMOUNT) * 100), 999);
  const last5 = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  // Lógica de Filtros (Transações)
  let filteredTx = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date));
  if (searchTx) filteredTx = filteredTx.filter(t => t.desc.toLowerCase().includes(searchTx.toLowerCase()) || t.cat.toLowerCase().includes(searchTx.toLowerCase()));
  if (fltType) filteredTx = filteredTx.filter(t => t.type === fltType);
  if (fltCat) filteredTx = filteredTx.filter(t => t.cat === fltCat);

  // Lógica de Relatórios
  const txRepM = txByM(repMonth, repYear);
  const incRep = sumAmt(txRepM, 'income');
  const expRep = sumAmt(txRepM, 'expense');
  const balRep = incRep - expRep;

  // AÇÕES
  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2800);
  };

  const deleteTx = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    showToast('🗑 Transação removida.');
  };

  const handleAddTx = () => {
    if (!txDesc || !txAmount || txAmount <= 0 || !txDate || !txCat) {
      showToast('❌ Preencha todos os campos.');
      return;
    }
    const newTx = { id: Date.now(), desc: txDesc, amount: parseFloat(txAmount), type: txType, cat: txCat, date: txDate };
    setTransactions([...transactions, newTx]);
    setTxModalOpen(false);
    showToast('✅ Transação adicionada!');
    setActivePage('dashboard');
  };

  const handleAddCat = () => {
    if (!catName) { showToast('❌ Informe o nome da categoria.'); return; }
    if (categories.find(c => c.name.toLowerCase() === catName.toLowerCase())) { showToast('❌ Categoria já existe.'); return; }
    const newCat = { id: Date.now(), name: catName, emoji: catEmoji || '📁', color: catColor, type: catType };
    setCategories([...categories, newCat]);
    setCatModalOpen(false);
    showToast('✅ Categoria criada!');
  };

  // EFEITOS 
  useEffect(() => {
    if (!window.Chart) return;
    let instances = [];

    // Dashboard Charts
    if (activePage === 'dashboard') {
      if (lineChartRef.current) {
        const refD = new Date(2026, 3, 1);
        const pairs = Array.from({length:6}, (_,i) => { 
          const d = new Date(refD.getFullYear(), refD.getMonth()-5+i, 1); 
          return { m: d.getMonth(), y: d.getFullYear() }; 
        });
        const lbls = pairs.map(p => new Date(p.y, p.m).toLocaleDateString('pt-BR',{month:'short'}));
        const iData = pairs.map(p => sumAmt(txByM(p.m,p.y), 'income'));
        const eData = pairs.map(p => sumAmt(txByM(p.m,p.y), 'expense'));

        instances.push(new window.Chart(lineChartRef.current, {
          type:'line',
          data:{ labels:lbls, datasets:[
            {label:'Receitas', data:iData, borderColor:'#00C96F', backgroundColor:'rgba(0,201,111,.08)', borderWidth:2.5, tension:.4, fill:true, pointRadius:5, pointBackgroundColor:'#00C96F'},
            {label:'Despesas', data:eData, borderColor:'#FF4D6D', backgroundColor:'rgba(255,77,109,.06)', borderWidth:2.5, tension:.4, fill:true, pointRadius:5, pointBackgroundColor:'#FF4D6D'},
          ]},
          options:{ plugins:{ legend:{ position:'top', labels:{ font:{ size:11 }, padding:14 } } }, scales:{ y:{ grid:{ color:'#F3F4F6' }, ticks:{ callback: v => 'R$'+Math.round(v/1000)+'k' } }, x:{ grid:{ display:false } } }, responsive:true, maintainAspectRatio:false }
        }));
      }

      if (donutChartRef.current) {
        const catMap = {};
        transactions.filter(t => t.type === 'expense').forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount; });
        const keys = Object.keys(catMap);
        instances.push(new window.Chart(donutChartRef.current, {
          type:'doughnut',
          data:{ labels:keys, datasets:[{ data:keys.map(k=>catMap[k]), backgroundColor:keys.map(k=>catOf(k).color), borderWidth:0, hoverOffset:6 }]},
          options:{ plugins:{ legend:{ position:'bottom', labels:{ font:{ size:11 }, padding:10, boxWidth:10 } } }, cutout:'60%', responsive:true, maintainAspectRatio:false }
        }));
      }
    }

    // Categorias Chart
    if (activePage === 'categorias' && catBarChartRef.current) {
      const expCats = categories.filter(c => c.type === 'expense');
      const totals = expCats.map(c => sumAmt(transactions.filter(t => t.cat === c.name), 'expense'));
      instances.push(new window.Chart(catBarChartRef.current, {
        type:'bar',
        data:{ labels:expCats.map(c => c.emoji+' '+c.name), datasets:[{ data:totals, backgroundColor:expCats.map(c=>c.color+'CC'), borderRadius:6 }] },
        options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ grid:{ color:'#F3F4F6' } }, x:{ grid:{ display:false } } }, responsive:true, maintainAspectRatio:false }
      }));
    }

    // Relatórios Charts
    if (activePage === 'relatorios') {
      if (barChartRef.current) {
        const refD = new Date(repYear, repMonth, 1);
        const pairs = Array.from({length:6}, (_,i) => { const d=new Date(refD.getFullYear(),refD.getMonth()-5+i,1); return {m:d.getMonth(),y:d.getFullYear()}; });
        instances.push(new window.Chart(barChartRef.current, {
          type:'bar',
          data:{ labels:pairs.map(p=>new Date(p.y,p.m).toLocaleDateString('pt-BR',{month:'short'})), datasets:[
            {label:'Receitas', data:pairs.map(p=>sumAmt(txByM(p.m,p.y),'income')), backgroundColor:'#00C96F99', borderRadius:5},
            {label:'Despesas', data:pairs.map(p=>sumAmt(txByM(p.m,p.y),'expense')), backgroundColor:'#FF4D6D99', borderRadius:5},
          ]},
          options:{ plugins:{ legend:{ position:'top' } }, scales:{ y:{ grid:{ color:'#F3F4F6' } }, x:{ grid:{ display:false } } }, responsive:true, maintainAspectRatio:false }
        }));
      }
      if (pieChartRef.current) {
        const catMap = {};
        txRepM.filter(t => t.type === 'expense').forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount; });
        const keys = Object.keys(catMap);
        instances.push(new window.Chart(pieChartRef.current, {
          type:'pie',
          data:{ labels:keys, datasets:[{ data:keys.map(k=>catMap[k]), backgroundColor:keys.map(k=>catOf(k).color), borderWidth:0 }]},
          options:{ plugins:{ legend:{ display:false } }, responsive:true, maintainAspectRatio:false }
        }));
      }
    }

    return () => instances.forEach(i => i.destroy());
  }, [activePage, transactions, categories, repMonth, repYear]);


  // RENDERIZAÇÃO
  return (
    <>
      <div className="app">
        {/* === SIDEBAR === */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
          <div className="brand">
            <div className="brand-icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <div><div className="brand-name">FinanceFlow</div><div className="brand-sub">Gestão Financeira</div></div>
          </div>

          <div className="balance-card">
            <div className="balance-label">Saldo geral</div>
            <div className="balance-value">{bal >= 0 ? '+' : '-'}{fmt(bal)}</div>
            <div className="balance-upd"><span className="dot-pulse"></span> Atualizado agora</div>
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
            <div className="nav-section">Menu Principal</div>
            {['dashboard', 'transacoes', 'categorias', 'relatorios'].map(page => (
              <div key={page} className={`nav-item ${activePage === page ? 'active' : ''}`} onClick={() => { setActivePage(page); setSidebarOpen(false); }}>
                {page.charAt(0).toUpperCase() + page.slice(1)} <span className="nav-chev">›</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* === MAIN === */}
        <div className="main">
          <div className="topbar">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="topbar-date">20 de Maio de 2026</div>
          </div>

          <div className="content">
            
            {/* PÁGINA: DASHBOARD */}
            {activePage === 'dashboard' && (
              <div className="page active">
                <div className="page-header">
                  <div><h1 className="page-title">Dashboard</h1><p className="page-sub">Aqui está seu resumo financeiro</p></div>
                  <button className="btn btn-primary" onClick={() => { setTxType('income'); setTxModalOpen(true); }}>+ Nova Transação</button>
                </div>
                <div className="kpi-grid">
                  <div className="kpi"><div className="kpi-top"><div className="kpi-icon" style={{background:'var(--green-light)'}}>📈</div><span className="badge badge-green">+{gPct}% da meta</span></div><div className="kpi-label">Total Receitas</div><div className="kpi-value">{fmt(totalInc)}</div></div>
                  <div className="kpi"><div className="kpi-top"><div className="kpi-icon" style={{background:'var(--red-light)'}}>📉</div><span className="badge badge-red">{Math.round((totalExp/totalInc||0)*100)}% da receita</span></div><div className="kpi-label">Total Despesas</div><div className="kpi-value">{fmt(totalExp)}</div></div>
                  <div className="kpi"><div className="kpi-top"><div className="kpi-icon" style={{background:'var(--blue-light)'}}>💳</div><span className="badge badge-blue">{bal >= 0 ? '↑ Positivo' : '↓ Negativo'}</span></div><div className="kpi-label">Saldo Líquido</div><div className="kpi-value">{bal >= 0 ? '+' : '-'}{fmt(bal)}</div></div>
                  <div className="kpi"><div className="kpi-top"><div className="kpi-icon" style={{background:'var(--purple-light)'}}>🎯</div><span className="badge badge-purple">{gPct}% atingido</span></div><div className="kpi-label">Meta Mensal</div><div className="kpi-value">{gPct}%</div></div>
                </div>
                <div className="charts-grid">
                  <div className="card"><div className="chart-title">Evolução Financeira</div><div style={{height: '190px'}}><canvas ref={lineChartRef}></canvas></div></div>
                  <div className="card"><div className="chart-title">Despesas por Categoria</div><div style={{height: '190px'}}><canvas ref={donutChartRef}></canvas></div></div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div className="chart-title">Últimas Transações</div>
                    <button className="btn btn-secondary" onClick={() => setActivePage('transacoes')}>Ver todas →</button>
                  </div>
                  <table className="tx-table">
                    <thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Valor</th></tr></thead>
                    <tbody>
                      {last5.length === 0 ? <tr><td colSpan="4"><div className="empty">Nenhuma transação ainda.</div></td></tr> : 
                        last5.map(t => {
                          const c = catOf(t.cat);
                          return (
                            <tr key={t.id}>
                              <td><strong>{t.desc}</strong></td>
                              <td><span style={{background: c.color+'22', color: c.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'}}>{c.emoji} {t.cat}</span></td>
                              <td style={{color: 'var(--text-muted)'}}>{new Date(t.date+'T00:00:00').toLocaleDateString('pt-BR')}</td>
                              <td className={t.type === 'income' ? 'amount-pos' : 'amount-neg'}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PÁGINA: TRANSAÇÕES */}
            {activePage === 'transacoes' && (
              <div className="page active">
                <div className="page-header">
                  <div><h1 className="page-title">Transações</h1></div>
                  <button className="btn btn-primary" onClick={() => setTxModalOpen(true)}>+ Nova Transação</button>
                </div>
                <div className="card">
                  <div className="filters">
                    <input className="search-in" placeholder="🔍 Buscar..." value={searchTx} onChange={e => setSearchTx(e.target.value)} />
                    <select className="filter-sel" value={fltType} onChange={e => setFltType(e.target.value)}>
                      <option value="">Todos os tipos</option><option value="income">Receita</option><option value="expense">Despesa</option>
                    </select>
                    <select className="filter-sel" value={fltCat} onChange={e => setFltCat(e.target.value)}>
                      <option value="">Todas as categorias</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <table className="tx-table">
                    <thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Tipo</th><th>Valor</th><th>Ação</th></tr></thead>
                    <tbody>
                      {filteredTx.map(t => {
                        const c = catOf(t.cat);
                        return (
                          <tr key={t.id}>
                            <td><strong>{t.desc}</strong></td>
                            <td><span style={{background: c.color+'22', color: c.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'}}>{c.emoji} {t.cat}</span></td>
                            <td style={{color: 'var(--text-muted)'}}>{new Date(t.date+'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td>{t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                            <td className={t.type === 'income' ? 'amount-pos' : 'amount-neg'}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</td>
                            <td><button className="btn btn-danger" onClick={() => deleteTx(t.id)}>✕</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PÁGINA: CATEGORIAS */}
            {activePage === 'categorias' && (
              <div className="page active">
                <div className="page-header">
                  <div><h1 className="page-title">Categorias</h1></div>
                  <button className="btn btn-primary" onClick={() => setCatModalOpen(true)}>+ Nova Categoria</button>
                </div>
                <div className="cats-grid">
                  {categories.map(c => {
                    const total = sumAmt(transactions.filter(t => t.cat === c.name), c.type);
                    const cnt = transactions.filter(t => t.cat === c.name).length;
                    return (
                      <div className="cat-card" key={c.id}>
                        <div className="cat-icon-box" style={{background: c.color+'22'}}>{c.emoji}</div>
                        <div>
                          <div className="cat-name">{c.name}</div>
                          <div className="cat-total">{fmt(total)}</div>
                          <div className="cat-count">{cnt} transações · {c.type === 'income' ? 'Receita' : 'Despesa'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="card"><div className="chart-title">Gastos por Categoria</div><div style={{height: '180px'}}><canvas ref={catBarChartRef}></canvas></div></div>
              </div>
            )}

            {/* PÁGINA: RELATÓRIOS */}
            {activePage === 'relatorios' && (
              <div className="page active">
                <div className="page-header">
                  <div><h1 className="page-title">Relatórios</h1></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select className="filter-sel" value={repMonth} onChange={e => setRepMonth(parseInt(e.target.value))}>
                      {['Janeiro','Fevereiro','Março','Abril','Maio','Junho'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select className="filter-sel" value={repYear} onChange={e => setRepYear(parseInt(e.target.value))}><option>2026</option></select>
                  </div>
                </div>
                <div className="report-grid">
                  <div className="card"><div className="chart-title">Receitas vs Despesas</div><div style={{height:'220px'}}><canvas ref={barChartRef}></canvas></div></div>
                  <div className="card"><div className="chart-title">Despesas do Mês</div><div style={{height:'220px'}}><canvas ref={pieChartRef}></canvas></div></div>
                </div>
                <div className="card">
                  <div className="chart-title" style={{ marginBottom: '16px' }}>Resumo do Período</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                    <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '18px' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Receitas</div><div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--green)' }}>{fmt(incRep)}</div></div>
                    <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '18px' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Despesas</div><div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--red)' }}>{fmt(expRep)}</div></div>
                    <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '18px' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Saldo do Mês</div><div style={{ fontSize: '22px', fontWeight: '700', color: balRep >= 0 ? 'var(--blue)' : 'var(--red)' }}>{balRep >= 0 ? '+' : '-'}{fmt(balRep)}</div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === MODAIS === */}
      {txModalOpen && (
        <div className="overlay" style={{ display: 'flex' }} onClick={(e) => { if(e.target.className === 'overlay') setTxModalOpen(false) }}>
          <div className="modal">
            <div className="modal-header"><h3 className="modal-title">Nova Transação</h3><button className="close-btn" onClick={() => setTxModalOpen(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Tipo</label>
              <div className="type-toggle">
                <button className={`type-btn ${txType === 'income' ? 'sel-income' : ''}`} onClick={() => setTxType('income')}>📈 Receita</button>
                <button className={`type-btn ${txType === 'expense' ? 'sel-expense' : ''}`} onClick={() => setTxType('expense')}>📉 Despesa</button>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Descrição</label><input className="form-input" value={txDesc} onChange={e => setTxDesc(e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Valor (R$)</label><input className="form-input" type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Data</label><input className="form-input" type="date" value={txDate} onChange={e => setTxDate(e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Categoria</label>
              <select className="form-input" value={txCat} onChange={e => setTxCat(e.target.value)}>
                {categories.filter(c => c.type === txType).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setTxModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAddTx}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {catModalOpen && (
        <div className="overlay" style={{ display: 'flex' }} onClick={(e) => { if(e.target.className === 'overlay') setCatModalOpen(false) }}>
          <div className="modal">
            <div className="modal-header"><h3 className="modal-title">Nova Categoria</h3><button className="close-btn" onClick={() => setCatModalOpen(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Nome</label><input className="form-input" value={catName} onChange={e => setCatName(e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Ícone</label><input className="form-input" maxLength="2" value={catEmoji} onChange={e => setCatEmoji(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Cor</label><input className="form-input" type="color" style={{padding:'4px', height:'44px'}} value={catColor} onChange={e => setCatColor(e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Tipo</label>
              <select className="form-input" value={catType} onChange={e => setCatType(e.target.value)}>
                <option value="expense">Despesa</option><option value="income">Receita</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCatModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAddCat}>Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* === TOAST === */}
      <div id="toast" className={toast.show ? 'show' : ''} style={{ display: toast.show ? 'block' : 'none' }}>
        <span id="toast-msg">{toast.msg}</span>
      </div>
    </>
  );
}

export default App;