'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ borderBottom: '2px solid #2e7d32', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#2e7d32', margin: 0 }}>TorolamAgri</h1>
        <p style={{ color: '#555', margin: '0.5rem 0 0 0' }}>
          Plateforme agropastorale, avicole et halieutique — Torolam Holding
        </p>
      </header>

      <section>
        <h2 style={{ color: '#333' }}>Marché en direct</h2>
        {loading ? (
          <p>Chargement des données de la plateforme...</p>
        ) : products.length === 0 ? (
          <p>Aucun produit enregistré pour le moment. Votre base de données est prête à recevoir vos offres.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {products.map((p) => (
              <li key={p.id} style={{ background: '#fff', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <strong>{p.name}</strong> - {p.price} FCFA ({p.category})
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
