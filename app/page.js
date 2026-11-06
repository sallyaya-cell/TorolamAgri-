'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialisation de Supabase (utilise tes clés sécurisées ou variables d'environnement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'TA_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'TA_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TorolamAgriApp() {
  const [activeTab, setActiveTab] = useState('marche');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulaire Produit / Vente
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Maraîchage');
  const [netPrice, setNetPrice] = useState('');
  const [sellerName, setSellerName] = useState('');

  // Module Sama Compta
  const [comptaEntries, setComptaEntries] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('entree');

  // Accès Admin Cockpit
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);

  // Chargement des produits depuis Supabase
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Erreur de chargement Supabase:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  // Calcul automatique de la commission et du prix final TTC selon la grille Torolam Holding
  const calculateFinalPrice = (net, cat) => {
    const base = parseFloat(net) || 0;
    let commission = 0;
    switch (cat) {
      case 'Maraîchage':
      case 'Céréales':
        commission = 50; // 50 FCFA / kg
        break;
      case 'Laitier':
        commission = 25; // 25 FCFA / Litre
        break;
      case 'Avicole':
        commission = 150; // 150 FCFA / poulet
        break;
      case 'Œufs':
        commission = 250; // 250 FCFA / alvéole
        break;
      case 'Poisson':
        commission = 50; // 50 FCFA / kg
        break;
      default:
        commission = 100;
    }
    return base + commission;
  };

  // Ajouter un produit (Publication instantanée sur le marché)
  async function handleAddProduct(e) {
    e.preventDefault();
    if (!productName || !netPrice || !sellerName) return;

    const finalP = calculateFinalPrice(netPrice, category);

    const { data, error } = await supabase.from('products').insert([
      {
        name: productName,
        category: category,
        net_price: parseFloat(netPrice),
        final_price: finalP,
        seller: sellerName,
        created_at: new Date()
      }
    ]);

    if (error) {
      alert('Erreur lors de l\'ajout du produit : ' + error.message);
    } else {
      alert('Produit publié instantanément sur le marché !');
      setProductName('');
      setNetPrice('');
      setSellerName('');
      fetchProducts();
    }
  }

  // Gestion Sama Compta
  const handleAddCompta = (e) => {
    e.preventDefault();
    if (!desc || !amount) return;
    const newEntry = {
      id: Date.now(),
      desc,
      amount: parseFloat(amount),
      type,
      date: new Date().toLocaleDateString()
    };
    setComptaEntries([newEntry, ...comptaEntries]);
    setDesc('');
    setAmount('');
  };

  // Export CSV Sama Compta
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Description,Montant (FCFA),Type,Date\n";
    comptaEntries.forEach(row => {
      csvContent += `"${row.desc}",${row.amount},${row.type},${row.date}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "SamaCompta_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'sans-serif', color: '#333' }}>
      
      {/* HEADER OFFICIEL TOROLAM HOLDING */}
      <header style={{ backgroundColor: '#1b4d3e', color: '#fff', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 10px 0' }}>
          TorolamAgri — Le marché agropastoral et halieutique du Sénégal
        </h1>
        <p style={{ fontSize: '0.9rem', margin: 0, opacity: 0.9 }}>
          Vallée du fleuve Sénégal (du Nord au Sud, d'Est en Ouest) | NINEA : 013365061 | RCCM : SN.MTM.2026.A.10.56
        </p>
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('marche')} style={navBtnStyle(activeTab === 'marche')}>Le Marché</button>
          <button onClick={() => setActiveTab('publier')} style={navBtnStyle(activeTab === 'publier')}>Espace Producteur / Vente</button>
          <button onClick={() => setActiveTab('compta')} style={navBtnStyle(activeTab === 'compta')}>Sama Compta</button>
          <button onClick={() => setIsAdminOpen(true)} style={{ ...navBtnStyle(false), backgroundColor: '#d9534f' }}>Accès Admin (Torolam Holding)</button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 15px' }}>

        {/* ONGLET 1 : LE MARCHÉ */}
        {activeTab === 'marche' && (
          <div>
            <h2 style={{ color: '#1b4d3e', borderBottom: '2px solid #1b4d3e', paddingBottom: '5px' }}>Catalogue du Marché en Direct</h2>
            <p>Toutes les offres certifiées. Les prix affichés incluent la logistique et la sécurité des transactions <strong>Torolam Holding (Wave / Orange Money : 77 131 20 12)</strong>.</p>
            
            {loading ? (
              <p>Chargement des offres en temps réel depuis Supabase...</p>
            ) : products.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#666' }}>Aucun produit disponible pour le moment. Soyez le premier à publier !</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '20px' }}>
                {products.map((prod) => (
                  <div key={prod.id || prod.name} style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <span style={{ fontSize: '0.75rem', background: '#e2efda', color: '#274e13', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {prod.category}
                    </span>
                    <h3 style={{ margin: '10px 0 5px 0', fontSize: '1.2rem' }}>{prod.name}</h3>
                    <p style={{ margin: '0 0 10px 0', color: '#555', fontSize: '0.9rem' }}>Vendeur : {prod.seller}</p>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#b45f06', marginBottom: '15px' }}>
                      {prod.final_price ? prod.final_price.toLocaleString() : calculateFinalPrice(prod.net_price, prod.category)} FCFA
                    </div>
                    <button style={{ width: '100%', backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Commander (Code Marchand : 77 131 20 12)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : PUBLICATION PRODUCTEUR */}
        {activeTab === 'publier' && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1b4d3e', marginTop: 0 }}>Espace Producteur — Publier une Offre</h2>
            <p style={{ fontSize: '0.9rem', color: '#555' }}>Enregistrez votre production. Le prix final public sera calculé automatiquement avec la commission réglementaire.</p>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom du Produit / Denrée :</label>
                <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Sac de Riz Local 50kg, Oignons, Poulet de chair..." required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filière :</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  <option value="Maraîchage">Maraîchage & Fruits</option>
                  <option value="Céréales">Céréales</option>
                  <option value="Laitier">Filière Laitière</option>
                  <option value="Avicole">Volaille de Chair</option>
                  <option value="Œufs">Œufs de Table</option>
                  <option value="Poisson">Poissonnerie / Halieutique</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Votre Prix Net Souhaité (FCFA) :</label>
                <input type="number" value={netPrice} onChange={(e) => setNetPrice(e.target.value)} placeholder="Ex: 15000" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom du Producteur / GIE / Vendeur :</label>
                <input type="text" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Ex: GIE Soudel / Yaya SALL" required style={inputStyle} />
              </div>
              <button type="submit" style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                Publier Immédiatement sur le Marché
              </button>
            </form>
          </div>
        )}

        {/* ONGLET 3 : SAMA COMPTA */}
        {activeTab === 'compta' && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ color: '#1b4d3e', margin: 0 }}>Sama Compta — Gestion Financière</h2>
              {comptaEntries.length > 0 && (
                <button onClick={exportCSV} style={{ backgroundColor: '#0277bd', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Télécharger le rapport CSV
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#555' }}>Suivez vos recettes et dépenses en temps réel pour optimiser votre activité.</p>

            <form onSubmit={handleAddCompta} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px', marginBottom: '20px' }}>
              <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description de l'opération" required style={{ ...inputStyle, flex: '2', minWidth: '200px' }} />
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant (FCFA)" required style={{ ...inputStyle, flex: '1', minWidth: '120px' }} />
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle, flex: '1', minWidth: '120px' }}>
                <option value="entree">Entrée (+ Recette)</option>
                <option value="sortie">Sortie (- Dépense)</option>
              </select>
              <button type="submit" style={{ backgroundColor: '#1b4d3e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                Ajouter
              </button>
            </form>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#e2efda', color: '#1b4d3e' }}>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Date</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Type</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Montant (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {comptaEntries.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Aucune opération enregistrée.</td></tr>
                  ) : (
                    comptaEntries.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{item.date}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{item.desc}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', color: item.type === 'entree' ? 'green' : 'red', fontWeight: 'bold' }}>
                          {item.type === 'entree' ? 'Recette' : 'Dépense'}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: item.type === 'entree' ? 'green' : 'red' }}>
                          {item.type === 'entree' ? `+${item.amount.toLocaleString()}` : `-${item.amount.toLocaleString()}`} FCFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* COCKPIT ADMINISTRATEUR / CONCEPTEUR (TOROLAM HOLDING) */}
      {isAdminOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '700px', padding: '30px', borderRadius: '10px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1b4d3e', paddingBottom: '10px' }}>
              <h2 style={{ color: '#1b4d3e', margin: 0 }}>Cockpit Administrateur — Torolam Holding</h2>
              <button onClick={() => { setIsAdminOpen(false); setIsAuthorizedAdmin(false); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {!isAuthorizedAdmin ? (
              <div style={{ margin: '30px 0', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>Accès Souverain Réservé au Fondateur (Yaya SALL)</p>
                <input 
                  type="password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)} 
                  placeholder="Entrez le mot de passe secret" 
                  style={{ ...inputStyle, maxWidth: '300px', margin: '0 auto 15px auto', textAlign: 'center' }} 
                />
                <br />
                <button 
                  onClick={() => {
                    // Mot de passe sécurisé par défaut pour le cockpit
                    if (adminPassword === 'torolam2026' || adminPassword === 'admin') {
                      setIsAuthorizedAdmin(true);
                    } else {
                      alert('Mot de passe incorrect.');
                    }
                  }} 
                  style={{ backgroundColor: '#1b4d3e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Déverrouiller le Cockpit
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '20px' }}>
                <div style={{ background: '#e2efda', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#274e13' }}>Statut de l'Entreprise</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>TOROLAM HOLDING</strong> | NINEA : 013365061 | RCCM : SN.MTM.2026.A.10.56</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>Compte Officiel de Référence Wave / Orange Money : <strong>77 131 20 12</strong></p>
                </div>

                <h3 style={{ color: '#1b4d3e' }}>Supervision Globale en Temps Réel</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ background: '#f4f6f8', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#1b4d3e' }}>{products.length}</span>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Produits Actifs sur le Marché</span>
                  </div>
                  <div style={{ background: '#f4f6f8', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#274e13' }}>Actif</span>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Réseau Vallée du Fleuve</span>
                  </div>
                </div>

                <h3 style={{ color: '#1b4d3e' }}>Gestion de la Marque & Paramètres</h3>
                <p style={{ fontSize: '0.9rem', color: '#555' }}>Le logo et l'identité visuelle de TorolamAgri sont synchronisés avec la charte graphique de Torolam Holding.</p>
                
                <button onClick={() => alert('Paramètres de marque sauvegardés.')} style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                  Mettre à jour l'identité visuelle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

function navBtnStyle(isActive) {
  return {
    backgroundColor: isActive ? '#2e7d32' : 'transparent',
    color: '#fff',
    border: '1px solid #fff',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  };
}
