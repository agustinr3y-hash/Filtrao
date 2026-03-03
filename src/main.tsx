import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

// Estilos básicos para que se vea bien en el iPhone
const styles = {
  container: { padding: '20px', backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  card: { border: '1px solid #333', padding: '15px', borderRadius: '10px', marginBottom: '10px', backgroundColor: '#111' },
  title: { color: '#f39c12', fontSize: '24px', fontWeight: 'bold' }
}

function App() {
  const [recetas, setRecetas] = useState(() => {
    const saved = localStorage.getItem('recetas');
    return saved ? JSON.parse(saved) : [
      { id: 1, nombre: 'V60 Clásica', ratio: '1:15', molienda: 'Media' },
      { id: 2, nombre: 'Aeropress Invertido', ratio: '1:13', molienda: 'Fina' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('recetas', JSON.stringify(recetas));
  }, [recetas]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>☕ Filtrao</h1>
      <p>Tus recetas de café en Tucumán</p>
      <hr />
      {recetas.map(r => (
        <div key={r.id} style={styles.card}>
          <h3>{r.nombre}</h3>
          <p>Ratio: {r.ratio} | Molienda: {r.molienda}</p>
        </div>
      ))}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
