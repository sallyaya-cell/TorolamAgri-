'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // État pour Sama Compta (Comptabilité simplifiée)
  const [entries, setEntries] = useState([
    { id: 1, type: 'Entrée', description: 'Vente Poulets - Coopérative Soudel', amount: 150000, date: '2026-10-29' },
    { id: 2, type: 'Sortie', description: 'Achat Intrants / Aliments', amount: 45000, date: '2026-10-28' }
  ])
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('Entrée')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des produits :', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = (e) => {
    e.preventDefault()
    if (!desc || !amount) return
    const newEntry = {
      id: Date.now(),
      type,
      description: desc,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0]
    }
    setEntries([newEntry, ...entries])
    setDesc('')
    setAmount('')
  }

  const exportToCSV = () => {
    const headers = "ID,Type,Description,Montant (FCFA),Date\n"
    const rows = entries.map(e => `${e.id},${e.type},"${e.description}",${e.amount},${e.date}`).join("\n")
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "SamaCompta_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main style={{ padding: '1.5rem', fontFamily: 'sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ borderBottom: '2px solid #2e7d32', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#2e7d32', margin: 0 }}>TorolamAgri</h1>
        <p style={{ color: '#555', margin: '0.5rem 0 0 0' }}>
          Plateforme agropastorale, avicole et halieutique — Torolam Holding
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Section Marché */}
        <section style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#333', marginTop: 0 }}>🌾 Marché en direct</h2>
          {loading ? (
            <p>Chargement des données de la plateforme...</p>
          ) : products.length === 0 ? (
            <p>Aucun produit enregistré pour le moment. Votre base de données est prête à recevoir vos offres.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {products.map((p) => (
                <li key={p.id} style={{ background: '#fdfdfd', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                  <strong>{p.name}</strong> - {p.price} FCFA ({p.category})
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Section Sama Compta (Mon Comptable) */}
        <section style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #2e7d32', paddingBottom: '0.5rem' }}>
            <h3 style={{ color: '#2e7d32', margin: 0 }}>📊 Sama Compta</h3>
            <button 
              onClick={exportToCSV}
              style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Exporter (CSV)
            </button>
          </div>

          <form onSubmit={handleAddEntry} style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Description (ex: Vente 50 poulets)" 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input 
              type="number" 
              placeholder="Montant en FCFA" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="Entrée">Entrée (Recette)</option>
              <option value="Sortie">Sortie (Dépense)</option>
            </select>
            <button type="submit" style={{ background: '#333', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Ajouter l'opération
            </button>
          </form>

          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {entries.map((item) => (
                <li key={item.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{item.description} ({item.date})</span>
                  <strong style={{ color: item.type === 'Entrée' ? '#2e7d32' : '#d32f2f' }}>
                    {item.type === 'Entrée' ? '+' : '-'}{item.amount} FCFA
                  </strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </div>
    </main>
  )
}
