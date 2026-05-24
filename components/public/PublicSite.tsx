'use client'
import { useState, useMemo } from 'react'
import { DB, TeamStats, Team, Match, Goal } from '@/lib/types'
import { sortGroup, calcScorers } from '@/lib/standings'

const C = {
  bg:'#07111f',bg2:'#0c1a2e',card:'#0f1f38',card2:'#132540',
  border:'#1a3060',blue:'#1a4fd6',blue2:'#2563eb',gold:'#f0b429',
  green:'#16a34a',red:'#dc2626',muted:'#64748b',text:'#e2e8f0',
}

const fmtDate = (d?: string) => { if (!d) return '—'; const [y,m,day] = d.split('-'); return `${day}/${m}/${y}` }
const sgFmt   = (v: number)  => v > 0 ? `+${v}` : `${v}`

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

function Avatar({ nome, foto, size = 40 }: { nome?: string; foto?: string; size?: number }) {
  const colors = ['#1a4fd6','#7c3aed','#dc2626','#16a34a','#d97706','#0891b2']
  const c = colors[(nome?.charCodeAt(0) ?? 0) % colors.length]
  if (foto) return <img src={foto} alt={nome} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .36, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: "'Oswald',sans-serif" }}>
      {nome?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() ?? '?'}
    </div>
  )
}

function PosBadge({ pos }: { pos: number }) {
  const s: Record<number,{bg:string,fg:string}> = { 1:{bg:'#f0b429',fg:'#0d1526'}, 2:{bg:'#94a3b8',fg:'#0d1526'}, 3:{bg:'#cd7f32',fg:'#fff'} }
  const st = s[pos] ?? { bg: C.border, fg: C.muted }
  return <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:26, height:26, borderRadius:'50%', background:st.bg, color:st.fg, fontSize:11, fontWeight:800, fontFamily:"'Oswald',sans-serif" }}>{pos}</span>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:C.muted, marginBottom:8, borderBottom:`1px solid ${C.border}`, paddingBottom:6 }}>{children}</div>
}

function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, letterSpacing:2, marginBottom:2 }}>{title}</h1>
      {sub && <p style={{ fontSize:12, color:C.muted }}>{sub}</p>}
    </div>
  )
}

// ── Classificação ─────────────────────────────────────────────────────────────
function StandingsPage({ db, stats }: { db: DB; stats: Record<number,TeamStats> }) {
  const g1 = sortGroup(db.teams.filter(t => t.grupo === 1), stats)
  const g2 = sortGroup(db.teams.filter(t => t.grupo === 2), stats)

  function GTable({ title, rows }: { title: string; rows: Team[] }) {
    return (
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:20 }}>
        <div style={{ background:C.blue, padding:'10px 16px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:2 }}>⚽ {title}</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#091322' }}>
                {['Pos','Time','Pts','J','V','E','D','GF','GC','SG'].map(h => (
                  <th key={h} style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:C.muted, padding:'8px 10px', textAlign: h==='Time' ? 'left' : 'center', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => {
                const s = stats[t.id] ?? { pts:0, j:0, v:0, e:0, d:0, gf:0, gc:0, sg:0 }
                return (
                  <tr key={t.id} style={{ borderBottom:`1px solid ${C.border}`, background: i===0 ? 'rgba(240,180,41,.05)' : 'transparent' }}>
                    <td style={{ padding:'10px', textAlign:'center' }}><PosBadge pos={i+1} /></td>
                    <td style={{ padding:'10px 8px', minWidth:150 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Shield team={t} size={26} /><span style={{ fontWeight:700, fontSize:13, fontFamily:"'Oswald',sans-serif" }}>{t.nome}</span>
                      </div>
                    </td>
                    <td style={{ textAlign:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:C.gold }}>{s.pts}</td>
                    {[s.j, s.v, s.e, s.d, s.gf, s.gc].map((v, k) => (
                      <td key={k} style={{ textAlign:'center', fontSize:13, color:C.muted, padding:'10px 8px' }}>{v}</td>
                    ))}
                    <td style={{ textAlign:'center', fontSize:13, fontWeight:700, color: s.sg>0 ? C.green : s.sg<0 ? C.red : C.muted }}>{sgFmt(s.sg)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Classificação" sub="Recalculada automaticamente com cada resultado" />
      <GTable title="Grupo 1" rows={g1} />
      <GTable title="Grupo 2" rows={g2} />
    </div>
  )
}

// ── Resultados ────────────────────────────────────────────────────────────────
function ResultsPage({ db, onSelectMatch }: { db: DB; onSelectMatch: (m: Match) => void }) {
  const rounds = [...new Set(db.matches.map(m => m.rodada))].sort((a,b) => a-b)
  const [activeRound, setActiveRound] = useState(rounds[0] ?? 1)
  const tMap = Object.fromEntries(db.teams.map(t => [t.id, t]))

  return (
    <div>
      <PageHeader title="Resultados" sub="Todas as partidas do campeonato" />
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {rounds.map(r => (
          <button key={r} onClick={() => setActiveRound(r)} style={{ padding:'6px 16px', borderRadius:6, border:`1px solid ${activeRound===r ? C.blue2 : C.border}`, background: activeRound===r ? C.blue : 'transparent', color: activeRound===r ? '#fff' : C.muted, fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:11, letterSpacing:1, textTransform:'uppercase', cursor:'pointer' }}>Rodada {r}</button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {db.matches.filter(m => m.rodada === activeRound).map(m => {
          const ta = tMap[m.time_a], tb = tMap[m.time_b]
          const mg = db.goals.filter(g => g.match_id === m.id)
          return (
            <div key={m.id} onClick={() => onSelectMatch(m)}
              style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px', cursor:'pointer', transition:'border-color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.blue2)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
              <div style={{ fontSize:10, color:C.muted, letterSpacing:.8, textTransform:'uppercase', marginBottom:8 }}>
                {fmtDate(m.data)} · <span style={{ color: m.status==='encerrada' ? C.green : m.status==='ao_vivo' ? '#ef4444' : C.muted }}>{m.status==='encerrada' ? 'Encerrada' : m.status==='ao_vivo' ? '🔴 Ao Vivo' : 'Agendada'}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                  <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, textAlign:'right' }}>{ta?.nome ?? '?'}</span>
                  <Shield team={ta} size={28} />
                </div>
                <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 14px', textAlign:'center', minWidth:78 }}>
                  {m.status !== 'agendada'
                    ? <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2 }}>{m.gols_a}<span style={{ color:C.muted }}>×</span>{m.gols_b}</span>
                    : <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:C.muted, letterSpacing:2 }}>VS</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Shield team={tb} size={28} />
                  <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14 }}>{tb?.nome ?? '?'}</span>
                </div>
              </div>
              {mg.length > 0 && (
                <div style={{ marginTop:8, fontSize:11, color:C.muted, display:'flex', gap:8, flexWrap:'wrap' }}>
                  {mg.map((g, i) => <span key={i}>⚽ {g.player_name} {g.minuto}&apos;</span>)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Próximos Jogos ─────────────────────────────────────────────────────────────
function UpcomingPage({ db }: { db: DB }) {
  const tMap = Object.fromEntries(db.teams.map(t => [t.id, t]))
  const up = [...db.matches].filter(m => m.status === 'agendada').sort((a,b) => (a.data ?? '').localeCompare(b.data ?? '')).slice(0, 16)
  return (
    <div>
      <PageHeader title="Próximos Jogos" sub="Agenda do campeonato" />
      {up.length === 0
        ? <div style={{ textAlign:'center', padding:60, color:C.muted }}><div style={{ fontSize:40, marginBottom:12 }}>📅</div>Sem jogos agendados</div>
        : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {up.map(m => {
              const ta = tMap[m.time_a], tb = tMap[m.time_b]
              return (
                <div key={m.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontSize:10, color:C.gold, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', marginBottom:8 }}>📅 {fmtDate(m.data)} — Rodada {m.rodada}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                      <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, textAlign:'right' }}>{ta?.nome ?? '?'}</span>
                      <Shield team={ta} size={28} />
                    </div>
                    <div style={{ background:C.bg2, border:`2px solid ${C.border}`, borderRadius:8, padding:'6px 16px', textAlign:'center' }}>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:C.muted, letterSpacing:2 }}>VS</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Shield team={tb} size={28} />
                      <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14 }}>{tb?.nome ?? '?'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>}
    </div>
  )
}

// ── Times ─────────────────────────────────────────────────────────────────────
function TeamsPage({ db, stats, onSelectTeam }: { db: DB; stats: Record<number,TeamStats>; onSelectTeam: (t: Team) => void }) {
  const g1 = db.teams.filter(t => t.grupo === 1)
  const g2 = db.teams.filter(t => t.grupo === 2)
  function TCard({ t }: { t: Team }) {
    const s = stats[t.id] ?? { pts:0, j:0, v:0, sg:0 }
    const count = db.players.filter(p => p.time_id === t.id).length
    return (
      <div onClick={() => onSelectTeam(t)}
        style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16, cursor:'pointer', transition:'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=C.blue2; e.currentTarget.style.background=C.card2 }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.card }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <Shield team={t} size={42} />
          <div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15 }}>{t.nome}</div>
            <div style={{ fontSize:11, color:C.muted }}>{t.turma}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:14 }}>
          {([['PTS', s.pts, C.gold], ['JGS', s.j, C.text], ['VIT', s.v, C.green]] as [string,number,string][]).map(([l,v,c]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:c }}>{v}</div>
              <div style={{ color:C.muted, fontSize:9, letterSpacing:.8, textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
          <div style={{ marginLeft:'auto', fontSize:11, color:C.muted, alignSelf:'flex-end' }}>{count} jog.</div>
        </div>
      </div>
    )
  }
  return (
    <div>
      <PageHeader title="Times" sub="Perfil de todos os times" />
      <SectionLabel>Grupo 1</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:10, marginBottom:20 }}>
        {g1.map(t => <TCard key={t.id} t={t} />)}
      </div>
      <SectionLabel>Grupo 2</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:10 }}>
        {g2.map(t => <TCard key={t.id} t={t} />)}
      </div>
    </div>
  )
}

// ── Perfil do Time ─────────────────────────────────────────────────────────────
function TeamProfile({ db, team, stats, onBack }: { db: DB; team: Team; stats: Record<number,TeamStats>; onBack: () => void }) {
  const s = stats[team.id] ?? { pts:0, j:0, v:0, e:0, d:0, gf:0, gc:0, sg:0 }
  const roster = db.players.filter(p => p.time_id === team.id)
  const tm = db.matches.filter(m => m.time_a === team.id || m.time_b === team.id)
  return (
    <div>
      <button onClick={onBack} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, marginBottom:18, fontFamily:"'Oswald',sans-serif" }}>← Voltar</button>
      <div style={{ background:`linear-gradient(135deg,${C.card2},${C.bg2})`, border:`1px solid ${C.border}`, borderRadius:12, padding:22, marginBottom:18, display:'flex', gap:18, alignItems:'center', flexWrap:'wrap' }}>
        <Shield team={team} size={68} />
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2 }}>{team.nome}</div>
          <div style={{ color:C.muted, fontSize:12 }}>{team.turma} · Grupo {team.grupo}</div>
        </div>
        <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
          {([['PTS', s.pts, C.gold], ['V', s.v, C.green], ['J', s.j, C.text], ['SG', sgFmt(s.sg), s.sg>0 ? C.green : s.sg<0 ? C.red : C.muted]] as [string,string|number,string][]).map(([l,v,c]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:c }}>{v}</div>
              <div style={{ fontSize:9, color:C.muted, letterSpacing:1, textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <SectionLabel>Elenco ({roster.length})</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8, marginBottom:20 }}>
        {roster.map(p => (
          <div key={p.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <Avatar nome={p.nome} foto={p.foto_url} size={36} />
            <div>
              <div style={{ fontWeight:700, fontSize:12 }}>{p.nome}</div>
              <div style={{ fontSize:10, color:C.muted }}>#{p.numero} · {p.posicao}</div>
            </div>
          </div>
        ))}
      </div>
      <SectionLabel>Partidas</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {tm.map(m => {
          const isH = m.time_a === team.id
          const tf = isH ? m.gols_a : m.gols_b
          const tc = isH ? m.gols_b : m.gols_a
          return (
            <div key={m.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
              <span style={{ color:C.muted, fontSize:10 }}>{fmtDate(m.data)} R{m.rodada}</span>
              <span style={{ color:C.muted, fontSize:10 }}>{isH ? 'Casa' : 'Fora'}</span>
              {m.status !== 'agendada'
                ? <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color: Number(tf)>Number(tc) ? C.green : Number(tf)<Number(tc) ? C.red : C.muted }}>{tf}×{tc}</span>
                : <span style={{ color:C.muted, fontSize:10 }}>Agendada</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Artilharia ────────────────────────────────────────────────────────────────
function ScorersPage({ db }: { db: DB }) {
  const ranked = useMemo(() => calcScorers(db.goals, db.players, db.teams), [db.goals, db.players, db.teams])
  const medals = ['🥇','🥈','🥉']
  return (
    <div>
      <PageHeader title="Artilharia" sub={`${db.goals.length} gol${db.goals.length !== 1 ? 's' : ''} registrado${db.goals.length !== 1 ? 's' : ''}`} />
      {ranked.length === 0
        ? <div style={{ textAlign:'center', padding:60, color:C.muted }}><div style={{ fontSize:40, marginBottom:12 }}>⚽</div>Nenhum gol registrado ainda</div>
        : <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#091322' }}>
                  {['#','Jogador','Time','Gols'].map(h => (
                    <th key={h} style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:C.muted, padding:'10px 14px', textAlign: h==='Gols' ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom:`1px solid ${C.border}`, background: i===0 ? 'rgba(240,180,41,.06)' : 'transparent' }}>
                    <td style={{ padding:'12px 14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color: i===0 ? C.gold : i===1 ? '#94a3b8' : i===2 ? '#cd7f32' : C.muted }}>{medals[i] ?? `#${i+1}`}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar nome={p.nome} foto={p.foto_url} size={34} />
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{p.nome}</div>
                          <div style={{ fontSize:11, color:C.muted }}>#{p.numero} · {p.posicao}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      {p.team && <div style={{ display:'flex', alignItems:'center', gap:6 }}><Shield team={p.team} size={18} /><span style={{ fontSize:12, color:C.muted }}>{p.team.nome}</span></div>}
                    </td>
                    <td style={{ padding:'12px 14px', textAlign:'center' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', background:C.blue, color:'#fff', borderRadius:'50%', width:34, height:34, fontFamily:"'Bebas Neue',sans-serif", fontSize:17 }}>{p.gols}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
    </div>
  )
}

// ── Súmula ─────────────────────────────────────────────────────────────────────
function MatchSummary({ db, match, onBack }: { db: DB; match: Match; onBack: () => void }) {
  const tMap = Object.fromEntries(db.teams.map(t => [t.id, t]))
  const pMap = Object.fromEntries(db.players.map(p => [p.id, p]))
  const ta = tMap[match.time_a], tb = tMap[match.time_b]
  const mg = db.goals.filter(g => g.match_id === match.id).sort((a,b) => a.minuto - b.minuto)
  const mc = db.cards.filter(c => c.match_id === match.id).sort((a,b) => a.minuto - b.minuto)
  const aGoals = mg.filter(g => pMap[g.player_id]?.time_id === match.time_a)
  const bGoals = mg.filter(g => pMap[g.player_id]?.time_id === match.time_b)
  return (
    <div>
      <button onClick={onBack} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, marginBottom:18, fontFamily:"'Oswald',sans-serif" }}>← Voltar</button>
      <div style={{ background:`linear-gradient(135deg,${C.card2},${C.bg2})`, border:`2px solid ${match.status==='ao_vivo' ? '#ef4444' : C.border}`, borderRadius:14, padding:24, marginBottom:18 }}>
        <div style={{ textAlign:'center', fontSize:10, color:C.muted, marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>
          Rodada {match.rodada} · {fmtDate(match.data)} · <span style={{ color: match.status==='encerrada' ? C.green : match.status==='ao_vivo' ? '#ef4444' : C.gold, marginLeft:6 }}>{match.status==='encerrada' ? 'Encerrada' : match.status==='ao_vivo' ? '🔴 Ao Vivo' : 'Agendada'}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:16, textAlign:'center' }}>
          <div><Shield team={ta} size={52} /><div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:16, marginTop:8 }}>{ta?.nome}</div></div>
          <div style={{ minWidth:90 }}>
            {match.status !== 'agendada'
              ? <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:44, letterSpacing:4, lineHeight:1 }}>{match.gols_a}<span style={{ color:C.muted }}>×</span>{match.gols_b}</div>
              : <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:C.muted }}>VS</div>}
          </div>
          <div><Shield team={tb} size={52} /><div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:16, marginTop:8 }}>{tb?.nome}</div></div>
        </div>
      </div>
      {mg.length > 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:12 }}>
          <div style={{ padding:'9px 16px', background:'#091322', fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:1.5 }}>⚽ Gols</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
            <div style={{ padding:12, borderRight:`1px solid ${C.border}` }}>
              {aGoals.map((g, i) => <div key={i} style={{ fontSize:12, marginBottom:5 }}><span style={{ color:C.gold, fontFamily:"'Bebas Neue',sans-serif" }}>{g.minuto}&apos;</span> ⚽ {g.player_name ?? pMap[g.player_id]?.nome}</div>)}
            </div>
            <div style={{ padding:12 }}>
              {bGoals.map((g, i) => <div key={i} style={{ fontSize:12, marginBottom:5, textAlign:'right' }}>⚽ {g.player_name ?? pMap[g.player_id]?.nome} <span style={{ color:C.gold, fontFamily:"'Bebas Neue',sans-serif" }}>{g.minuto}&apos;</span></div>)}
            </div>
          </div>
        </div>
      )}
      {mc.length > 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'9px 16px', background:'#091322', fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:1.5 }}>🟨 Cartões</div>
          <div style={{ padding:12 }}>
            {mc.map((c, i) => <div key={i} style={{ fontSize:12, marginBottom:5, display:'flex', alignItems:'center', gap:8 }}><span>{c.tipo==='amarelo' ? '🟨' : '🟥'}</span><span style={{ color:C.muted, fontFamily:"'Bebas Neue',sans-serif" }}>{c.minuto}&apos;</span><span>{pMap[c.player_id]?.nome}</span></div>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mata-Mata ─────────────────────────────────────────────────────────────────
function KnockoutPage({ db, stats }: { db: DB; stats: Record<number,TeamStats> }) {
  const tMap = Object.fromEntries(db.teams.map(t => [t.id, t]))
  const phases: Array<'quartas'|'semifinal'|'final'> = ['quartas','semifinal','final']
  const phaseLabel = { quartas:'Quartas de Final', semifinal:'Semifinais', final:'Final' }
  const champion = db.knockout.find(k => k.fase === 'final' && k.vencedor)

  return (
    <div>
      <PageHeader title="Mata-Mata" sub="Fase eliminatória do campeonato" />
      {champion && (
        <div style={{ background:`linear-gradient(135deg,#d97706,#f0b429)`, borderRadius:12, padding:20, marginBottom:20, textAlign:'center', color:'#0d1526' }}>
          <div style={{ fontSize:36, marginBottom:6 }}>🏆</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2 }}>CAMPEÃO</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:20 }}>{tMap[champion.vencedor!]?.nome}</div>
        </div>
      )}
      {db.knockout.length === 0
        ? <div style={{ textAlign:'center', padding:50, color:C.muted }}><div style={{ fontSize:40, marginBottom:12 }}>🏆</div>Chaveamento ainda não gerado.</div>
        : phases.map(phase => {
            const ms = db.knockout.filter(k => k.fase === phase).sort((a,b) => a.pos - b.pos)
            if (!ms.length) return null
            return (
              <div key={phase} style={{ marginBottom:24 }}>
                <SectionLabel>{phaseLabel[phase]}</SectionLabel>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
                  {ms.map(k => {
                    const ta = tMap[k.time_a!], tb = tMap[k.time_b!]
                    return (
                      <div key={k.id} style={{ background:C.card2, border:`1px solid ${k.vencedor ? C.gold : C.border}`, borderRadius:10, padding:14 }}>
                        <div style={{ fontSize:10, color:C.muted, letterSpacing:.8, textTransform:'uppercase', marginBottom:8 }}>{phaseLabel[phase]} #{k.pos}</div>
                        {([{t:ta,gols:k.gols_a,win:k.vencedor===k.time_a},{t:tb,gols:k.gols_b,win:k.vencedor===k.time_b}] as {t?:Team,gols:number|null,win:boolean}[]).map(({t,gols,win},i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, opacity: k.vencedor && !win ? .5 : 1 }}>
                            <Shield team={t} size={22} />
                            <span style={{ flex:1, fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:12, color: win ? C.gold : C.text }}>{t?.nome ?? 'A definir'}</span>
                            {gols !== null && <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color: win ? C.gold : C.muted }}>{gols}</span>}
                            {win && <span style={{ fontSize:12 }}>🏆</span>}
                          </div>
                        ))}
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

// ── PublicSite (root) ─────────────────────────────────────────────────────────
export default function PublicSite({ db, stats }: { db: DB; stats: Record<number,TeamStats> }) {
  const [page, setPage]           = useState('standings')
  const [selTeam, setSelTeam]     = useState<Team | null>(null)
  const [selMatch, setSelMatch]   = useState<Match | null>(null)

  const navItems = [
    { id:'standings', label:'Tabela',     icon:'📊' },
    { id:'results',   label:'Resultados', icon:'🏁' },
    { id:'upcoming',  label:'Próximos',   icon:'📅' },
    { id:'teams',     label:'Times',      icon:'🛡️' },
    { id:'scorers',   label:'Artilharia', icon:'⚽' },
    { id:'knockout',  label:'Mata-Mata',  icon:'🏆' },
  ]

  const navigate = (p: string) => { setPage(p); setSelTeam(null); setSelMatch(null) }

  return (
    <>
      <header style={{ background:`linear-gradient(90deg,${C.bg} 0%,${C.bg2} 100%)`, borderBottom:`3px solid ${C.gold}`, position:'sticky', top:0, zIndex:200, padding:'0 14px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, flexShrink:0 }}>INTER<span style={{ color:C.gold }}>CLASSE</span> 2026</div>
        <nav style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)} style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, fontWeight:600, letterSpacing:1, textTransform:'uppercase', padding:'5px 8px', border:'none', borderRadius:5, cursor:'pointer', background: page===n.id ? C.gold : 'transparent', color: page===n.id ? '#0d1526' : C.muted, transition:'.2s' }}>{n.icon} {n.label}</button>
          ))}
        </nav>
        <a href="/login" style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, borderRadius:5, padding:'5px 10px', cursor:'pointer', fontSize:10, fontFamily:"'Oswald',sans-serif", letterSpacing:.8, textDecoration:'none' }}>🔐</a>
      </header>
      <main style={{ maxWidth:1040, margin:'0 auto', padding:'22px 14px 60px' }}>
        {selMatch ? <MatchSummary db={db} match={selMatch} onBack={() => setSelMatch(null)} />
          : selTeam ? <TeamProfile db={db} team={selTeam} stats={stats} onBack={() => setSelTeam(null)} />
          : page==='standings' ? <StandingsPage db={db} stats={stats} />
          : page==='results'   ? <ResultsPage db={db} onSelectMatch={m => setSelMatch(m)} />
          : page==='upcoming'  ? <UpcomingPage db={db} />
          : page==='teams'     ? <TeamsPage db={db} stats={stats} onSelectTeam={t => setSelTeam(t)} />
          : page==='scorers'   ? <ScorersPage db={db} />
          : page==='knockout'  ? <KnockoutPage db={db} stats={stats} />
          : null}
      </main>
    </>
  )
}