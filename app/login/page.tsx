'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const C = {
  bg: '#07111f', card2: '#132540', border: '#1a3060',
  gold: '#f0b429', muted: '#64748b', text: '#e2e8f0', red: '#dc2626',
}
const inp: React.CSSProperties = {
  background: '#0c1a2e', border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 13,
  padding: '9px 12px', outline: 'none', width: '100%',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
  textTransform: 'uppercase', color: C.muted, marginBottom: 5,
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const err = await signIn(email, password)
    if (err) { setError('Credenciais inválidas.'); setPassword('') }
    else router.push('/admin')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '34px 30px', width: '100%', maxWidth: 360, boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 3, color: C.text }}>
            INTER<span style={{ color: C.gold }}>CLASSE</span> 2026
          </div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginTop: 2 }}>PAINEL ADMINISTRATIVO</div>
        </div>

        <label style={lbl}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)}
          placeholder="admin@interclasse.com"
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inp, marginBottom: 14 }} />

        <label style={lbl}>Senha</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inp, marginBottom: 14 }} />

        {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{error}</div>}

        <button onClick={handleLogin} disabled={loading} style={{
          background: loading ? '#334155' : C.gold, color: '#0d1526', border: 'none',
          borderRadius: 6, padding: '10px 20px', fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 16, letterSpacing: 1.5, cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%', transition: '.2s',
        }}>
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}