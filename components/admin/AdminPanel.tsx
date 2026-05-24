'use client'
import { useState, useMemo } from 'react'
import { DB, AdminActions, TeamStats, Team, Player, Match, Goal, Card, KnockoutMatch } from '@/lib/types'
import { sortGroup } from '@/lib/standings'

const C = {
  bg:'#07111f', bg2:'#0c1a2e', card:'#0f1f38', card2:'#132540',
  border:'#1a3060', blue:'#1a4fd6', blue2:'#2563eb', gold:'#f0b429',
  green:'#16a34a', red:'#dc2626', muted:'#64748b', text:'#e2e8f0',
}

// ─── UI PRIMITIVOS ────────────────────────────────────────────────────────────
const iStyle: React.CSSProperties = {
  background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 13,
  padding: '9px 12px', outline: 'none', width: '100%',
}
const lStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
  textTransform: 'uppercase', color: C.muted, marginBottom: 5,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={lStyle}>{label}</label>{children}</div>
}
function Inp({ value, onChange, placeholder, type = 'text', style: s }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties
}) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...iStyle, ...s }}
      onFocus={e => (e.target.style.borderColor = C.blue2)}
      onBlur={e => (e.target.style.borderColor = C.border)} />
  )
}
function Sel({ value, onChange, children }: { value: string | number; onChange: (v: string) => void; children: React.ReactNode }) {
  return <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>{children}</select>
}
function Btn({ onClick, children, variant = 'primary', small = false, disabled = false, full = false }: {
  onClick?: () => void; children: React.ReactNode; variant?: string; small?: boolean; disabled?: boolean; full?: boolean
}) {
  const bg: Record<string, string> = { primary: C.blue2, gold: C.gold, danger: C.red, ghost: 'transparent', success: C.green, dark: C.card2 }
  const fg = variant === 'gold' ? '#0d1526' : '#fff'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#334155' : (bg[variant] ?? C.blue2), color: disabled ? C.muted : fg,
      border: variant === 'ghost' ? `1px solid ${C.border}` : 'none',
      borderRadius: 6, padding: small ? '6px 14px' : '10px 20px',
      fontFamily: "'Bebas Neue',sans-serif", fontSize: small ? 13 : 16,
      letterSpacing: 1.5, cursor: disabled ? 'not-allowed' : 'pointer',
      transition: '.2s', whiteSpace: 'nowrap', width: full ? '100%' : 'auto',
    }}>{children}</button>
  )
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, color: C.gold }}>{title}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}
function Toast({ msg, type }: { msg: string; type: string }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: type === 'error' ? C.red : C.green, color: '#fff', padding: '12px 20px', borderRadius: 8, fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: '.5px', boxShadow: '0 8px 30px rgba(0,0,0,.5)', animation: 'slideUp .3s ease' }}>{msg}</div>
  )
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: C.muted, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>{children}</div>
}
function Shield({ team, size = 36 }: { team?: Team; size?: number }) {
  const cols = ['#1a4fd6','#7c3aed','#dc2626','#16a34a','#d97706','#0891b2','#be185d','#0f766e']
  const c = cols[(team?.id ?? 0) % cols.length]
  if (team?.foto_url) return <img src={team.foto_url} alt={team.nome} style={{ width: size, height: size, objectFit: 'contain' }} />
  return (
    <svg width={size} height={size} viewBox="0 0 40 48" fill="none">
      <path d="M20 2L4 9v14c0 9.9 6.8 19.2 16 22 9.2-2.8 16-12.1 16-22V9L20 2z" fill={c} opacity=".9"/>
      <path d="M20 8L10 13v10c0 6.6 4.5 12.8 10 14.7 5.5-1.9 10-8.1 10-14.7V13L20 8z" fill="rgba(255,255,255,0.12)"/>
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Oswald">{team?.nome?.slice(0,2) ?? '??'}</text>
    </svg>
  )
}
function Avatar({ nome, foto, size = 36 }: { nome?: string; foto?: string; size?: number }) {
  const colors = ['#1a4fd6','#7c3aed','#dc2626','#16a34a','#d97706','#0891b2']
  const c = colors[(nome?.charCodeAt(0) ?? 0) % colors.length]
  if (foto) return <img src={foto} alt={nome} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .36, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: "'Oswald',sans-serif" }}>
      {nome?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() ?? '?'}
    </div>
  )
}
const fmtDate = (d?: string) => { if (!d) return '—'; const [y,m,day] = d.split('-'); return `${day}/${m}/${y}` }
const uid = () => Math.random().toString(36).slice(2)

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function AdminDash({ db }: { db: DB }) {
  const finished = db.matches.filter(m => m.status === 'encerrada').length
  const cards = [
    ['🛡️','Times',       db.teams.length,   C.blue],
    ['👥','Jogadores',   db.players.length, C.gold],
    ['⚽','Partidas',    db.matches.length, C.green],
    ['✅','Encerradas',  finished,           C.green],
    ['📅','Agendadas',   db.matches.length - finished, C.muted],
    ['⚡','Gols',        db.goals.length,   C.gold],
    ['🟨','Cartões',     db.cards.length,   '#f59e0b'],
  ] as [string,string,number,string][]
  return (
    <div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:2, color:C.gold, marginBottom:18 }}>Dashboard</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 }}>
        {cards.map(([icon,label,val,c]) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 12px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:c }}>{val}</div>
            <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:.8 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TIMES ────────────────────────────────────────────────────────────────────
function AdminTeams({ db, actions, showToast }: { db: DB; actions: AdminActions; showToast: (m:string,t?:string)=>void }) {
  const [modal, setModal] = useState<'new'|'edit'|null>(null)
  const [form, setForm]   = useState<Partial<Team>>({})
  const f = (k: keyof Team) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const openNew  = () => { setForm({ nome:'', turma:'', grupo:1, foto_url:'', descricao:'' }); setModal('new') }
  const openEdit = (t: Team) => { setForm({ ...t }); setModal('edit') }

  const save = async () => {
    if (!form.nome?.trim()) { showToast('Nome obrigatório', 'error'); return }
    if (modal === 'new') { await actions.addTeam({ nome:form.nome!, turma:form.turma??'', grupo:Number(form.grupo)??1, foto_url:form.foto_url??'', descricao:form.descricao??'' }); showToast('Time cadastrado! 🛡️') }
    else { await actions.updateTeam(form as Team); showToast('Time atualizado! ✅') }
    setModal(null)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2, color:C.gold }}>Times</div>
        <Btn onClick={openNew} variant="gold">+ Novo</Btn>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {db.teams.map(t => (
          <div key={t.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <Shield team={t} size={32} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14 }}>{t.nome}</div>
              <div style={{ fontSize:11, color:C.muted }}>{t.turma} · Grupo {t.grupo}</div>
            </div>
            <Btn onClick={() => openEdit(t)} variant="ghost" small>Editar</Btn>
            <Btn onClick={async () => { await actions.deleteTeam(t.id); showToast('Removido') }} variant="danger" small>✕</Btn>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === 'new' ? 'Novo Time' : 'Editar Time'} onClose={() => setModal(null)}>
          <Field label="Nome"><Inp value={form.nome??''} onChange={f('nome')} placeholder="Ex: 3º Bagres" /></Field>
          <Field label="Turma"><Inp value={form.turma??''} onChange={f('turma')} placeholder="3A" /></Field>
          <Field label="Grupo">
            <Sel value={form.grupo??1} onChange={f('grupo')}>
              <option value={1}>Grupo 1</option><option value={2}>Grupo 2</option>
            </Sel>
          </Field>
          <Field label="Descrição"><Inp value={form.descricao??''} onChange={f('descricao')} placeholder="..." /></Field>
          <Field label="URL do Escudo"><Inp value={form.foto_url??''} onChange={f('foto_url')} placeholder="https://..." /></Field>
          <div style={{ marginTop:14, display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="ghost">Cancelar</Btn>
            <Btn onClick={save} variant="gold">Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── JOGADORES ────────────────────────────────────────────────────────────────
function AdminPlayers({ db, actions, showToast }: { db: DB; actions: AdminActions; showToast: (m:string,t?:string)=>void }) {
  const [modal, setModal]   = useState<'new'|'edit'|null>(null)
  const [form, setForm]     = useState<Partial<Player>>({})
  const [filterTeam, setFT] = useState<string>('all')
  const positions = ['Goleiro','Zagueiro','Lateral','Meia','Atacante','Ponta']
  const tMap = Object.fromEntries(db.teams.map(t => [t.id, t]))
  const filtered = filterTeam === 'all' ? db.players : db.players.filter(p => p.time_id === Number(filterTeam))
  const f = (k: keyof Player) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const openNew  = () => { setForm({ nome:'', numero:0, posicao:'Atacante', time_id: db.teams[0]?.id, foto_url:'' }); setModal('new') }
  const openEdit = (p: Player) => { setForm({ ...p }); setModal('edit') }

  const save = async () => {
    if (!form.nome?.trim()) { showToast('Nome obrigatório', 'error'); return }
    const payload = { ...form, numero: Number(form.numero) || 0, time_id: Number(form.time_id) } as Player
    if (modal === 'new') { await actions.addPlayer(payload); showToast('Jogador cadastrado! 👤') }
    else { await actions.updatePlayer(payload); showToast('Atualizado! ✅') }
    setModal(null)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2, color:C.gold }}>Jogadores</div>
        <Btn onClick={openNew} variant="gold">+ Novo</Btn>
      </div>
      <div style={{ marginBottom:12 }}>
        <Sel value={filterTeam} onChange={setFT}>
          <option value="all">Todos os times</option>
          {db.teams.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </Sel>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <Avatar nome={p.nome} foto={p.foto_url} size={34} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:12 }}>{p.nome}</div>
              <div style={{ fontSize:10, color:C.muted }}>#{p.numero} · {p.posicao} · {tMap[p.time_id]?.nome ?? '—'}</div>
            </div>
            <Btn onClick={() => openEdit(p)} variant="ghost" small>Editar</Btn>
            <Btn onClick={async () => { await actions.deletePlayer(p.id); showToast('Removido') }} variant="danger" small>✕</Btn>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === 'new' ? 'Novo Jogador' : 'Editar Jogador'} onClose={() => setModal(null)}>
          <Field label="Nome"><Inp value={form.nome??''} onChange={f('nome')} placeholder="Nome" /></Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Número"><Inp type="number" value={form.numero??0} onChange={f('numero')} placeholder="9" /></Field>
            <Field label="Posição">
              <Sel value={form.posicao??'Atacante'} onChange={f('posicao')}>
                {positions.map(p => <option key={p}>{p}</option>)}
              </Sel>
            </Field>
          </div>
          <Field label="Time">
            <Sel value={form.time_id??''} onChange={f('time_id')}>
              {db.teams.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </Sel>
          </Field>
          <Field label="URL da Foto"><Inp value={form.foto_url??''} onChange={f('foto_url')} placeholder="https://..." /></Field>
          <div style={{ marginTop:14, display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="ghost">Cancelar</Btn>
            <Btn onClick={save} variant="gold">Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── PARTIDAS ─────────────────────────────────────────────────────────────────
function AdminMatches({ db, actions, showToast }: { db: DB; actions: AdminActions; showToast: (m:string,t?:string)=>void }) {
  const [modal, setModal] = useState<'new'|'edit'|null>(null)
  const [form, setForm]   = useState<Partial<Match>>({})
  const tMap = Object.fromEntries(db.teams.map(t => [t.id, t]))
  const f = (k: keyof Match) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const openNew  = () => { setForm({ time_a: db.teams[0]?.id, time_b: db.teams[1]?.id, data:'', rodada:1, gols_a:null, gols_b:null, status:'agendada' }); setModal('new') }
  const openEdit = (m: Match) => { setForm({ ...m }); setModal('edit') }

  const save = async () => {
    if (Number(form.time_a) === Number(form.time_b)) { showToast('Times devem ser diferentes!', 'error'); return }
    const payload = {
      ...form,
      time_a: Number(form.time_a), time_b: Number(form.time_b),
      rodada: Number(form.rodada) || 1,
      gols_a: form.gols_a === null || form.gols_a === undefined || (form.gols_a as unknown as string) === '' ? null : Number(form.gols_a),
      gols_b: form.gols_b === null || form.gols_b === undefined || (form.gols_b as unknown as string) === '' ? null : Number(form.gols_b),
    } as Match
    if (modal === 'new') { await actions.addMatch(payload); showToast('Partida criada! ⚽') }
    else { await actions.updateMatch(payload); showToast('Atualizado! ✅') }
    setModal(null)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2, color:C.gold }}>Partidas</div>
        <Btn onClick={openNew} variant="gold">+ Nova</Btn>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {[...db.matches].sort((a,b) => (a.data??'').localeCompare(b.data??'')).map(m => (
          <div key={m.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:12 }}>{tMap[m.time_a]?.nome} × {tMap[m.time_b]?.nome}</div>
              <div style={{ fontSize:10, color:C.muted }}>{fmtDate(m.data)} · R{m.rodada} · <span style={{ color: m.status==='encerrada' ? C.green : m.status==='ao_vivo' ? '#ef4444' : C.muted }}>{m.status}</span></div>
            </div>
            {m.status !== 'agendada' && <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:C.gold }}>{m.gols_a}×{m.gols_b}</span>}
            <Btn onClick={() => openEdit(m)} variant="ghost" small>Editar</Btn>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === 'new' ? 'Nova Partida' : 'Editar Partida'} onClose={() => setModal(null)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Time A (Casa)">
              <Sel value={form.time_a??''} onChange={f('time_a')}>{db.teams.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</Sel>
            </Field>
            <Field label="Time B (Fora)">
              <Sel value={form.time_b??''} onChange={f('time_b')}>{db.teams.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</Sel>
            </Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Data"><Inp type="date" value={form.data??''} onChange={f('data')} /></Field>
            <Field label="Rodada"><Inp type="number" value={form.rodada??1} onChange={f('rodada')} placeholder="1" /></Field>
          </div>
          <Field label="Status">
            <Sel value={form.status??'agendada'} onChange={f('status')}>
              <option value="agendada">Agendada</option>
              <option value="ao_vivo">Ao Vivo</option>
              <option value="encerrada">Encerrada</option>
            </Sel>
          </Field>
          {form.status !== 'agendada' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Gols Time A"><Inp type="number" value={form.gols_a??0} onChange={f('gols_a')} placeholder="0" /></Field>
              <Field label="Gols Time B"><Inp type="number" value={form.gols_b??0} onChange={f('gols_b')} placeholder="0" /></Field>
            </div>
          )}
          <div style={{ marginTop:14, display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="ghost">Cancelar</Btn>
            <Btn onClick={save} variant="gold">Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── SÚMULAS ──────────────────────────────────────────────────────────────────
function AdminSumulas({ db, actions, showToast }: { db: DB; actions: AdminActions; showToast: (m:string,t?:string)=>void }) {
  const [sel, setSel] = useState<number | null>(null)
  const tMap = Object.fromEntries(db.teams.map(t => [t.id, t]))
  const pMap = Object.fromEntries(db.players.map(p => [p.id, p]))
  const finished = db.matches.filter(m => m.status === 'encerrada' || m.status === 'ao_vivo')

  if (sel !== null) {
    const m = db.matches.find(x => x.id === sel)
    if (!m) { setSel(null); return null }
    return <SumulaEditor match={m} db={db} tMap={tMap} pMap={pMap} actions={actions} showToast={showToast} onBack={() => setSel(null)} />
  }

  return (
    <div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2, color:C.gold, marginBottom:14 }}>Súmulas</div>
      {finished.length === 0
        ? <div style={{ color:C.muted, fontSize:13, textAlign:'center', padding:40 }}>Nenhuma partida encerrada ainda.</div>
        : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {finished.map(m => (
              <div key={m.id} onClick={() => setSel(m.id)}
                style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'11px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'border-color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:13 }}>{tMap[m.time_a]?.nome} × {tMap[m.time_b]?.nome}</div>
                  <div style={{ fontSize:10, color:C.muted }}>{fmtDate(m.data)} · R{m.rodada}</div>
                </div>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:C.gold }}>{m.gols_a}×{m.gols_b}</span>
                <span style={{ fontSize:11, color:C.gold }}>→</span>
              </div>
            ))}
          </div>}
    </div>
  )
}

function SumulaEditor({ match, db, tMap, pMap, actions, showToast, onBack }: {
  match: Match; db: DB; tMap: Record<number,Team>; pMap: Record<number,Player>
  actions: AdminActions; showToast: (m:string,t?:string)=>void; onBack: () => void
}) {
  const [gf, setGf] = useState({ player_id:'', minuto:'' })
  const [cf, setCf] = useState({ player_id:'', minuto:'', tipo:'amarelo' })
  const matchPlayers = db.players.filter(p => p.time_id === match.time_a || p.time_id === match.time_b)
  const mg = db.goals.filter(g => g.match_id === match.id)
  const mc = db.cards.filter(c => c.match_id === match.id)

  const addGoal = async () => {
    if (!gf.player_id) { showToast('Selecione o jogador', 'error'); return }
    const p = pMap[Number(gf.player_id)]
    await actions.addGoal({ match_id: match.id, player_id: Number(gf.player_id), minuto: Number(gf.minuto) || 0, player_name: p?.nome ?? '?' })
    setGf({ player_id:'', minuto:'' })
    showToast('Gol registrado! ⚽')
  }
  const addCard = async () => {
    if (!cf.player_id) { showToast('Selecione o jogador', 'error'); return }
    await actions.addCard({ match_id: match.id, player_id: Number(cf.player_id), minuto: Number(cf.minuto) || 0, tipo: cf.tipo as 'amarelo'|'vermelho' })
    setCf({ player_id:'', minuto:'', tipo:'amarelo' })
    showToast('Cartão registrado!')
  }

  return (
    <div>
      <button onClick={onBack} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, marginBottom:16, fontFamily:"'Oswald',sans-serif" }}>← Voltar</button>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:C.gold, marginBottom:14 }}>
        Súmula: {tMap[match.time_a]?.nome} × {tMap[match.time_b]?.nome}
      </div>
      <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:16, textAlign:'center' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:34, letterSpacing:3 }}>{match.gols_a}<span style={{ color:C.muted }}>×</span>{match.gols_b}</div>
        <div style={{ fontSize:11, color:C.muted }}>{tMap[match.time_a]?.nome} × {tMap[match.time_b]?.nome}</div>
      </div>

      <SectionLabel>⚽ Registrar Gol</SectionLabel>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px auto', gap:8, alignItems:'end' }}>
          <Field label="Jogador">
            <Sel value={gf.player_id} onChange={v => setGf(f => ({ ...f, player_id:v }))}>
              <option value="">Selecione...</option>
              {matchPlayers.map(p => <option key={p.id} value={p.id}>#{p.numero} {p.nome} ({tMap[p.time_id]?.nome})</option>)}
            </Sel>
          </Field>
          <Field label="Min"><Inp type="number" value={gf.minuto} onChange={v => setGf(f => ({ ...f, minuto:v }))} placeholder="45" /></Field>
          <Btn onClick={addGoal} variant="success">+ Gol</Btn>
        </div>
        {mg.length > 0 && (
          <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
            {[...mg].sort((a,b) => a.minuto - b.minuto).map(g => (
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, padding:'5px 9px', background:C.bg2, borderRadius:5 }}>
                <span style={{ color:C.gold, fontFamily:"'Bebas Neue',sans-serif" }}>{g.minuto}&apos;</span>
                <span>⚽ {g.player_name ?? pMap[g.player_id]?.nome}</span>
                <span style={{ color:C.muted, fontSize:10 }}>({tMap[pMap[g.player_id]?.time_id]?.nome})</span>
                <button onClick={async () => { await actions.deleteGoal(g.id); showToast('Gol removido') }}
                  style={{ marginLeft:'auto', background:'transparent', border:'none', color:C.red, cursor:'pointer', fontSize:13 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <SectionLabel>🟨 Registrar Cartão</SectionLabel>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 110px auto', gap:8, alignItems:'end' }}>
          <Field label="Jogador">
            <Sel value={cf.player_id} onChange={v => setCf(f => ({ ...f, player_id:v }))}>
              <option value="">Selecione...</option>
              {matchPlayers.map(p => <option key={p.id} value={p.id}>#{p.numero} {p.nome}</option>)}
            </Sel>
          </Field>
          <Field label="Min"><Inp type="number" value={cf.minuto} onChange={v => setCf(f => ({ ...f, minuto:v }))} placeholder="45" /></Field>
          <Field label="Tipo">
            <Sel value={cf.tipo} onChange={v => setCf(f => ({ ...f, tipo:v }))}>
              <option value="amarelo">🟨 Amarelo</option>
              <option value="vermelho">🟥 Vermelho</option>
            </Sel>
          </Field>
          <Btn onClick={addCard} variant="gold">+ Cartão</Btn>
        </div>
        {mc.length > 0 && (
          <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
            {[...mc].sort((a,b) => a.minuto - b.minuto).map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, padding:'5px 9px', background:C.bg2, borderRadius:5 }}>
                <span>{c.tipo === 'amarelo' ? '🟨' : '🟥'}</span>
                <span style={{ color:C.muted, fontFamily:"'Bebas Neue',sans-serif" }}>{c.minuto}&apos;</span>
                <span>{pMap[c.player_id]?.nome}</span>
                <button onClick={async () => { await actions.deleteCard(c.id) }}
                  style={{ marginLeft:'auto', background:'transparent', border:'none', color:C.red, cursor:'pointer', fontSize:13 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MATA-MATA ────────────────────────────────────────────────────────────────
function AdminKnockout({ db, actions, stats, showToast }: { db: DB; actions: AdminActions; stats: Record<number,TeamStats>; showToast: (m:string,t?:string)=>void }) {
  const tMap = Object.fromEntries(db.teams.map(t => [t.id, t]))
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm]     = useState({ gols_a:'', gols_b:'' })

  const phases: Array<'quartas'|'semifinal'|'final'> = ['quartas','semifinal','final']
  const phaseLabel = { quartas:'Quartas de Final', semifinal:'Semifinais', final:'Final' }

  const generateBracket = async () => {
    const g1 = sortGroup(db.teams.filter(t => t.grupo === 1), stats)
    const g2 = sortGroup(db.teams.filter(t => t.grupo === 2), stats)
    const bracket: Omit<KnockoutMatch,'id'>[] = [
      { fase:'quartas', pos:1, time_a:g1[0]?.id??null, time_b:g2[1]?.id??null, gols_a:null, gols_b:null, vencedor:null },
      { fase:'quartas', pos:2, time_a:g2[0]?.id??null, time_b:g1[1]?.id??null, gols_a:null, gols_b:null, vencedor:null },
      { fase:'quartas', pos:3, time_a:g1[2]?.id??null, time_b:g2[3]?.id??null, gols_a:null, gols_b:null, vencedor:null },
      { fase:'quartas', pos:4, time_a:g2[2]?.id??null, time_b:g1[3]?.id??null, gols_a:null, gols_b:null, vencedor:null },
      { fase:'semifinal', pos:1, time_a:null, time_b:null, gols_a:null, gols_b:null, vencedor:null },
      { fase:'semifinal', pos:2, time_a:null, time_b:null, gols_a:null, gols_b:null, vencedor:null },
      { fase:'final', pos:1, time_a:null, time_b:null, gols_a:null, gols_b:null, vencedor:null },
    ]
    await actions.setKnockout(bracket)
    showToast('Chaveamento gerado! 🏆')
  }

  const saveResult = async (k: KnockoutMatch) => {
    if (form.gols_a === '' || form.gols_b === '') { showToast('Preencha os gols', 'error'); return }
    const ga = Number(form.gols_a), gb = Number(form.gols_b)
    const venc = ga > gb ? k.time_a : gb > ga ? k.time_b : null
    await actions.updateKnockout({ ...k, gols_a:ga, gols_b:gb, vencedor:venc })
    setEditId(null)
    showToast('Resultado salvo! ✅')
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2, color:C.gold }}>Mata-Mata</div>
        <Btn onClick={generateBracket} variant="gold" small>↺ Gerar Chaveamento</Btn>
      </div>
      {db.knockout.length === 0
        ? <div style={{ color:C.muted, fontSize:13, textAlign:'center', padding:40 }}>Clique em &ldquo;Gerar Chaveamento&rdquo; para criar os confrontos automaticamente.</div>
        : phases.map(phase => {
            const ms = db.knockout.filter(k => k.fase === phase).sort((a,b) => a.pos - b.pos)
            if (!ms.length) return null
            return (
              <div key={phase} style={{ marginBottom:20 }}>
                <SectionLabel>{phaseLabel[phase]}</SectionLabel>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {ms.map(k => {
                    const ta = tMap[k.time_a!], tb = tMap[k.time_b!]
                    const isEdit = editId === k.id
                    return (
                      <div key={k.id} style={{ background:C.card, border:`1px solid ${k.vencedor ? C.gold : C.border}`, borderRadius:10, padding:14 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:12 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                            <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:13, color: k.vencedor===k.time_a ? C.gold : C.text }}>{ta?.nome ?? 'A definir'}</span>
                            <Shield team={ta} size={26} />
                          </div>
                          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:8, padding:'5px 12px', textAlign:'center', minWidth:70 }}>
                            {k.gols_a !== null
                              ? <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20 }}>{k.gols_a}<span style={{ color:C.muted }}>×</span>{k.gols_b}</span>
                              : <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:C.muted }}>VS</span>}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <Shield team={tb} size={26} />
                            <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:13, color: k.vencedor===k.time_b ? C.gold : C.text }}>{tb?.nome ?? 'A definir'}</span>
                          </div>
                        </div>
                        {ta && tb && (
                          isEdit
                            ? <div style={{ marginTop:10, display:'flex', gap:6, alignItems:'center', justifyContent:'center' }}>
                                <input type="number" value={form.gols_a} onChange={e => setForm(f => ({ ...f, gols_a:e.target.value }))}
                                  placeholder="0" style={{ ...iStyle, width:60, textAlign:'center' }} />
                                <span style={{ color:C.muted }}>×</span>
                                <input type="number" value={form.gols_b} onChange={e => setForm(f => ({ ...f, gols_b:e.target.value }))}
                                  placeholder="0" style={{ ...iStyle, width:60, textAlign:'center' }} />
                                <Btn onClick={() => saveResult(k)} variant="success" small>✓</Btn>
                                <Btn onClick={() => setEditId(null)} variant="ghost" small>✕</Btn>
                              </div>
                            : <button onClick={() => { setEditId(k.id); setForm({ gols_a: String(k.gols_a??0), gols_b: String(k.gols_b??0) }) }}
                                style={{ marginTop:8, width:'100%', background:'transparent', border:`1px solid ${C.border}`, borderRadius:5, color:C.muted, fontSize:10, fontFamily:"'Oswald',sans-serif", letterSpacing:1, padding:'5px 0', cursor:'pointer', textTransform:'uppercase' }}>
                                {k.gols_a !== null ? 'Editar resultado' : 'Registrar resultado'}
                              </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
    </div>
  )
}

// ─── ADMIN PANEL ROOT ─────────────────────────────────────────────────────────
export default function AdminPanel({ db, stats, actions, onLogout }: {
  db: DB; stats: Record<number,TeamStats>; actions: AdminActions; onLogout: () => void
}) {
  const [ap, setAp] = useState('dashboard')
  const [toast, setToast] = useState({ msg:'', type:'success' })

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg:'', type:'success' }), 2800)
  }

  const nav = [
    { id:'dashboard', label:'Dashboard', icon:'📊' },
    { id:'teams',     label:'Times',     icon:'🛡️' },
    { id:'players',   label:'Jogadores', icon:'👥' },
    { id:'matches',   label:'Partidas',  icon:'⚽' },
    { id:'sumulas',   label:'Súmulas',   icon:'📋' },
    { id:'knockout',  label:'Mata-Mata', icon:'🏆' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex' }}>
      {/* Sidebar */}
      <div style={{ width:200, background:C.bg2, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'16px 14px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2 }}>INTER<span style={{ color:C.gold }}>CLASSE</span> 2026</div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:1 }}>ADMIN</div>
        </div>
        <nav style={{ flex:1, padding:8 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setAp(n.id)} style={{
              width:'100%', textAlign:'left', padding:'9px 12px', borderRadius:6,
              background: ap===n.id ? C.card2 : 'transparent',
              border: ap===n.id ? `1px solid ${C.border}` : '1px solid transparent',
              color: ap===n.id ? C.gold : C.muted,
              fontFamily:"'Oswald',sans-serif", fontSize:12, fontWeight:600,
              letterSpacing:.8, cursor:'pointer', display:'flex', alignItems:'center',
              gap:8, marginBottom:3, transition:'.2s',
            }}>{n.icon} {n.label}</button>
          ))}
        </nav>
        <button onClick={onLogout} style={{ margin:8, padding:'8px 12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, fontFamily:"'Oswald',sans-serif", fontSize:11, cursor:'pointer', letterSpacing:.8 }}>
          🚪 Sair
        </button>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto' }}>
        <div style={{ maxWidth:860, margin:'0 auto', padding:24 }}>
          {ap === 'dashboard' && <AdminDash db={db} />}
          {ap === 'teams'     && <AdminTeams db={db} actions={actions} showToast={showToast} />}
          {ap === 'players'   && <AdminPlayers db={db} actions={actions} showToast={showToast} />}
          {ap === 'matches'   && <AdminMatches db={db} actions={actions} showToast={showToast} />}
          {ap === 'sumulas'   && <AdminSumulas db={db} actions={actions} showToast={showToast} />}
          {ap === 'knockout'  && <AdminKnockout db={db} actions={actions} stats={stats} showToast={showToast} />}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  )
}