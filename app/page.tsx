'use client'

import { useTeams } from '@/hooks/useTeams'

export default function HomePage() {
  const { teams } = useTeams()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07111f',
        color: 'white',
        padding: '40px',
      }}
    >
      <h1 style={{ fontSize: '40px', marginBottom: '30px' }}>
        INTERCLASSE 2026 ⚽
      </h1>

      <h2>Times cadastrados:</h2>

      {teams.length === 0 ? (
        <p>Nenhum time cadastrado.</p>
      ) : (
        teams.map((team) => (
          <div
            key={team.id}
            style={{
              background: '#132540',
              padding: '15px',
              borderRadius: '10px',
              marginTop: '10px',
            }}
          >
            {team.nome}
          </div>
        ))
      )}
    </div>
  )
}
