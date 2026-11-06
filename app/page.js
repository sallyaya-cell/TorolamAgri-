'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuration du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'TA_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'TA_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TorolamAgriApp() {
  const [activeTab, setActiveTab] = useState('marche');
  const [products, setProducts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authentification & Session
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Formulaire d'inscription par profil
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerRole, setRegisterRole] = useState('Producteur');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  // Champs spécifiques
  const [regProdSite, setRegProdSite] = useState('');
  const [regFiliere, setRegFiliere] = useState('Maraîchage');
  const [regB2BOrg, setRegB2BOrg] = useState('');
  const [regPermis, setRegPermis] = useState('');
  const [regMatricule, setRegMatricule] = useState('');

  // Formulaire de Publication Produit
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Maraîchage');
  const [netPrice, setNetPrice] = useState('');
  const [sellerName, setSellerName] = useState('');

  // Gestion du Panier & Tunnel de Commande
  const [cart, setCart] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [merchantCode, setMerchantCode] = useState('');

  // Sama Compta
  const [comptaEntries, setComptaEntries] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('entree');

  // Cockpit Administrateur (Torolam Holding)
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchProfiles();
  }, []);

  // Récupération des données Supabase
  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
    setLoading(false);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('*');
    setProfiles(data || []);
  }

  // Grille Officielle des Commissions Torolam Holding
  const calculateCommission = (net, cat) => {
    const base = parseFloat(net) || 0;
    switch (cat) {
      case 'Maraîchage':
      case 'Céréales':
      case 'Poisson':
        return 50; // 50 FCFA / kg
      case 'Laitier':
        return 25; // 25 FCFA / Litre
      case 'Avicole':
        return 150; // 150 FCFA / unité
      case 'Œufs':
        return 250; // 250 FCFA / alvéole
      default:
        return 100;
    }
  };

  const calculateFinalPrice = (net, cat) => {
    return (parseFloat(net) || 0) + calculateCommission(net, cat);
  };

  // Authentification "J'ai déjà un compte"
  const handleLogin = (e) => {
    e.preventDefault();
    const user = profiles.find(p => (p.phone === loginId || p.email === loginId) && p.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setShowLoginModal(false);
      setLoginId('');
      setLoginPassword('');
      alert(`Bienvenue ${user.name} (${user.role}) !`);
    } else {
      alert("Identifiant ou mot de passe incorrect.");
    }
  };

  // Inscription Cloisonnée par Profil
  const handleRegister = async (e) => {
    e.preventDefault();
    const newProfile = {
      name: regName,
      phone: regPhone,
      address: regAddress,
      password: regPassword,
      role: registerRole,
      prod_site: registerRole === 'Producteur' ? regProdSite : null,
      filiere: registerRole === 'Producteur' ? regFiliere : null,
      b2b_org: registerRole === 'B2B' ? regB2BOrg : null,
      permis: registerRole === 'Transporteur' ? regPermis : null,
      matricule: registerRole === 'Transporteur' ? regMatricule : null,
      created_at: new Date()
    };

    const { error } = await supabase.from('profiles').insert([newProfile]);
    if (error) {
      alert("Erreur lors de l'inscription : " + error.message);
    } else {
      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      fetchProfiles();
      setShowRegisterModal(false);
    }
  };

  // Publication d'un produit sur le marché
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productName || !netPrice || !sellerName) return;

    const finalP = calculateFinalPrice(netPrice, category);
    const comm = calculateCommission(netPrice, category);

    const { error } = await supabase.from('products').insert([
      {
        name: productName,
        category,
        net_price: parseFloat(netPrice),
        commission: comm,
        final_price: finalP,
        seller: sellerName,
        created_at: new Date()
      }
    ]);

    if (error) {
      alert("Erreur lors de la publication : " + error.message);
    } else {
      alert("Produit publié avec succès sur Le Marché !");
      setProductName('');
      setNetPrice('');
      setSellerName('');
      fetchProducts();
    }
  };

  // Gestion du Panier multi-articles
  const addToCart = (product) => {
    setCart([...cart, product]);
    alert(`${product.name} ajouté au panier !`);
  };

  // Déclenchement de la Commande & Code Marchand à 6 chiffres
  const initCheckout = (itemOrCart) => {
    const isSingle = !Array.isArray(itemOrCart);
    const items = isSingle ? [itemOrCart] : itemOrCart;
    const totalNet = items.reduce((sum, i) => sum + i.final_price, 0);
    const b2cFee = 100; // Commission B2C fixe
    const totalTTC = totalNet + b2cFee;
    
    // Code Marchand Aléatoire à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMerchantCode(code);
    setCurrentOrder({ items, totalTTC, code });
    setShowCheckoutModal(true);
  };

  // Sama Compta
  const handleAddCompta = (e) => {
    e.preventDefault();
    if (!desc || !amount) return;
    setComptaEntries([{ id: Date.now(), desc, amount: parseFloat(amount), type, date: new Date().toLocaleDateString() }, ...comptaEntries]);
    setDesc('');
    setAmount('');
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Description,Montant (FCFA),Type,Date\n";
    comptaEntries.forEach(r => { csvContent += `"${r.desc}",${r.amount},${r.type},${r.date}\n`; });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "SamaCompta_export.csv";
    link.click();
  };

  // Calcul du Cumul des Commissions pour le Cockpit Admin
  const totalCommissionsPerCategory = (cat) => {
    return products
      .filter(p => p.category === cat)
      .reduce((sum, p) => sum + (p.commission || calculateCommission(p.net_price, p.category)), 0);
  };

  const grandTotalCommissions = () => {
    return products.reduce((sum, p) => sum + (p.commission || calculateCommission(p.net_price, p.category)), 0);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'sans-serif', color: '#333' }}>
      
      {/* HEADER OFFICIEL */}
      <header style={{ backgroundColor: '#1b4d3e', color: '#fff', padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'left' }}>
            {brandLogo ? <img src={brandLogo} alt="Logo" style={{ maxHeight: '45px', marginBottom: '5px' }} /> : null}
            <h1 style={{ fontSize: '1.4rem', margin: 0 }}>TorolamAgri</h1>
          </div>
          <div>
            {currentUser ? (
              <span style={{ fontSize: '0.9rem', background: '#2e7d32', padding: '5px 12px', borderRadius: '15px' }}>
                👤 {currentUser.name} ({currentUser.role})
              </span>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowLoginModal(true)} style={authBtnStyle}>J'ai déjà un compte</button>
                <button onClick={() => setShowRegisterModal(true)} style={{ ...authBtnStyle, backgroundColor: '#2e7d32' }}>S'inscrire</button>
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', margin: '10px 0 0 0', opacity: 0.9 }}>
          Le marché agropastoral et halieutique du Sénégal (Vallée du fleuve) | NINEA : 013365061 | RCCM : SN.MTM.2026.A.10.56
        </p>

        {/* NAVIGATION */}
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('marche')} style={navBtnStyle(activeTab === 'marche')}>Le Marché</button>
          <button onClick={() => setActiveTab('publier')} style={navBtnStyle(activeTab === 'publier')}>Espace Vente</button>
          <button onClick={() => setActiveTab('panier')} style={navBtnStyle(activeTab === 'panier')}>Panier ({cart.length})</button>
          <button onClick={() => setActiveTab('compta')} style={navBtnStyle(activeTab === 'compta')}>Sama Compta</button>
          <button onClick={() => setIsAdminOpen(true)} style={{ ...navBtnStyle(false), backgroundColor: '#d9534f' }}>Accès Concepteur / Admin</button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 15px' }}>

        {/* ONGLET 1 : LE MARCHÉ */}
        {activeTab === 'marche' && (
          <div>
            <h2 style={{ color: '#1b4d3e' }}>Offres certifiées en direct</h2>
            {loading ? <p>Chargement des offres...</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {products.map((prod) => (
                  <div key={prod.id || prod.name} style={cardStyle}>
                    <span style={{ fontSize: '0.75rem', background: '#e2efda', color: '#274e13', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {prod.category}
                    </span>
                    <h3 style={{ margin: '10px 0 5px 0' }}>{prod.name}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Vendeur : {prod.seller}</p>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#b45f06', margin: '10px 0' }}>
                      {prod.final_price ? prod.final_price.toLocaleString() : calculateFinalPrice(prod.net_price, prod.category)} FCFA
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => initCheckout(prod)} style={{ flex: 1, backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Commander
                      </button>
                      <button onClick={() => addToCart(prod)} style={{ backgroundColor: '#1b4d3e', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                        + Panier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : FORMULAIRE DE PUBLICATION PRODUIT */}
        {activeTab === 'publier' && (
          <div style={formCardStyle}>
            <h2 style={{ color: '#1b4d3e', marginTop: 0 }}>Publier une production</h2>
            <form onSubmit={handleAddProduct} style={flexColumn}>
              <label>Nom du Produit : <input type="text" value={productName} onChange={e => setProductName(e.target.value)} required style={inputStyle} /></label>
              <label>Filière : 
                <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                  <option value="Maraîchage">Maraîchage & Fruits</option>
                  <option value="Céréales">Céréales</option>
                  <option value="Laitier">Filière Laitière</option>
                  <option value="Avicole">Volaille de Chair</option>
                  <option value="Œufs">Œufs de Table</option>
                  <option value="Poisson">Poissonnerie / Halieutique</option>
                </select>
              </label>
              <label>Prix Net Vendeur (FCFA) : <input type="number" value={netPrice} onChange={e => setNetPrice(e.target.value)} required style={inputStyle} /></label>
              <label>Nom du Vendeur / GIE : <input type="text" value={sellerName} onChange={e => setSellerName(e.target.value)} required style={inputStyle} /></label>
              <button type="submit" style={submitBtnStyle}>Publier Immédiatement</button>
            </form>
          </div>
        )}

        {/* ONGLET 3 : LE PANIER MULTI-ARTICLES */}
        {activeTab === 'panier' && (
          <div style={formCardStyle}>
            <h2 style={{ color: '#1b4d3e', marginTop: 0 }}>Votre Panier d'Achat</h2>
            {cart.length === 0 ? <p>Votre panier est vide.</p> : (
              <div>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <span>{item.name} ({item.category})</span>
                    <strong>{item.final_price} FCFA</strong>
                  </div>
                ))}
                <button onClick={() => initCheckout(cart)} style={{ ...submitBtnStyle, marginTop: '20px' }}>
                  Finaliser la commande du panier
                </button>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 4 : SAMA COMPTA */}
        {activeTab === 'compta' && (
          <div style={formCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#1b4d3e', margin: 0 }}>Sama Compta</h2>
              <button onClick={exportCSV} style={{ backgroundColor: '#0277bd', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Exporter CSV</button>
            </div>
            <form onSubmit={handleAddCompta} style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
              <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" required style={{ ...inputStyle, flex: 2 }} />
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant FCFA" required style={{ ...inputStyle, flex: 1 }} />
              <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
                <option value="entree">Recette (+)</option>
                <option value="sortie">Dépense (-)</option>
              </select>
              <button type="submit" style={{ backgroundColor: '#1b4d3e', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }}>Ajouter</button>
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#e2efda' }}><th style={{ padding: '8px' }}>Date</th><th>Opération</th><th>Type</th><th>Montant</th></tr></thead>
              <tbody>
                {comptaEntries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{e.date}</td>
                    <td>{e.desc}</td>
                    <td style={{ color: e.type === 'entree' ? 'green' : 'red', fontWeight: 'bold' }}>{e.type}</td>
                    <td style={{ fontWeight: 'bold' }}>{e.amount} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL : AUTHENTIFICATION ("J'AI DÉJÀ UN COMPTE") */}
      {showLoginModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3>Connexion Utilisateur</h3>
            <form onSubmit={handleLogin} style={flexColumn}>
              <label>Téléphone ou Email : <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} required style={inputStyle} /></label>
              <label>Mot de passe : <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={inputStyle} /></label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" style={submitBtnStyle}>Se connecter</button>
                <button type="button" onClick={() => setShowLoginModal(false)} style={{ ...submitBtnStyle, backgroundColor: '#666' }}>Fermer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : INSCRIPTION CLOISONNÉE PAR PROFIL */}
      {showRegisterModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3>Créer un Compte — TorolamAgri</h3>
            <form onSubmit={handleRegister} style={flexColumn}>
              <label>Profil / Rôle : 
                <select value={registerRole} onChange={e => setRegisterRole(e.target.value)} style={inputStyle}>
                  <option value="Producteur">Producteur (Maraîcher, Éleveur, Pêcheur)</option>
                  <option value="Consommateur">Consommateur Simple (B2C)</option>
                  <option value="B2B">Consommateur Grand Compte (B2B)</option>
                  <option value="Transporteur">Transporteur / Livreur</option>
                </select>
              </label>

              <label>Nom & Prénom : <input type="text" value={regName} onChange={e => setRegName(e.target.value)} required style={inputStyle} /></label>
              <label>Numéro de Téléphone : <input type="text" value={regPhone} onChange={e => setRegPhone(e.target.value)} required style={inputStyle} /></label>
              <label>Adresse : <input type="text" value={regAddress} onChange={e => setRegAddress(e.target.value)} required style={inputStyle} /></label>
              <label>Mot de passe : <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required style={inputStyle} /></label>

              {/* CHAMPS DÉDIÉS PRODUCTEURS */}
              {registerRole === 'Producteur' && (
                <>
                  <label>Adresse du site de production : <input type="text" value={regProdSite} onChange={e => setRegProdSite(e.target.value)} required style={inputStyle} /></label>
                  <label>Filière principale : 
                    <select value={regFiliere} onChange={e => setRegFiliere(e.target.value)} style={inputStyle}>
                      <option value="Maraîchage">Maraîchage & Fruits</option>
                      <option value="Céréales">Céréales</option>
                      <option value="Avicole">Avicole</option>
                      <option value="Laitier">Laitier</option>
                      <option value="Poisson">Halieutique / Pêche</option>
                    </select>
                  </label>
                </>
              )}

              {/* CHAMPS DÉDIÉS GRANDS COMPTES B2B */}
              {registerRole === 'B2B' && (
                <label>Nom de la structure / Institution / Cantine : <input type="text" value={regB2BOrg} onChange={e => setRegB2BOrg(e.target.value)} required style={inputStyle} /></label>
              )}

              {/* CHAMPS DÉDIÉS TRANSPORTEURS */}
              {registerRole === 'Transporteur' && (
                <>
                  <label>Numéro de permis de conduire : <input type="text" value={regPermis} onChange={e => setRegPermis(e.target.value)} required style={inputStyle} /></label>
                  <label>Matricule / Immatriculation véhicule : <input type="text" value={regMatricule} onChange={e => setRegMatricule(e.target.value)} required style={inputStyle} /></label>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" style={submitBtnStyle}>Finaliser l'inscription</button>
                <button type="button" onClick={() => setShowRegisterModal(false)} style={{ ...submitBtnStyle, backgroundColor: '#666' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : TUNNEL DE COMMANDE & CODE MARCHAND (WAVE / ORANGE MONEY) */}
      {showCheckoutModal && currentOrder && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ color: '#1b4d3e', marginTop: 0 }}>Paiement Sécurisé — Torolam Holding</h3>
            <p><strong>Total à régler TTC :</strong> {currentOrder.totalTTC.toLocaleString()} FCFA</p>
            <div style={{ background: '#e2efda', padding: '15px', borderRadius: '6px', textAlign: 'center', margin: '15px 0' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Compte Officiel Wave / Orange Money :</p>
              <h2 style={{ margin: '5px 0', color: '#274e13' }}>77 131 20 12</h2>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Code Marchand Unique (Motif du transfert) :</p>
              <h1 style={{ margin: '5px 0', color: '#b45f06', letterSpacing: '2px' }}>{currentOrder.code}</h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#555' }}>Veuillez effectuer le transfert sur le compte officiel avec le Code Marchand en motif pour valider la livraison.</p>
            <button onClick={() => { alert('Commande enregistrée en attente du règlement !'); setShowCheckoutModal(false); setCart([]); }} style={submitBtnStyle}>
              J'ai effectué le paiement
            </button>
          </div>
        </div>
      )}

      {/* MODAL : COCKPIT ADMINISTRATEUR / CONCEPTEUR SOUVERAIN */}
      {isAdminOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1b4d3e', paddingBottom: '10px' }}>
              <h2 style={{ color: '#1b4d3e', margin: 0 }}>Cockpit Souverain — Torolam Holding</h2>
              <button onClick={() => { setIsAdminOpen(false); setIsAuthorizedAdmin(false); }} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {!isAuthorizedAdmin ? (
              <div style={{ textAlign: 'center', margin: '30px 0' }}>
                <p style={{ fontWeight: 'bold' }}>Accès Fondateur (Yaya SALL)</p>
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Mot de passe administrateur" style={{ ...inputStyle, maxWidth: '250px', textAlign: 'center', margin: '10px auto' }} />
                <br />
                <button onClick={() => { if (adminPassword === 'torolam2026' || adminPassword === 'admin') setIsAuthorizedAdmin(true); else alert('Accès refusé.'); }} style={submitBtnStyle}>
                  Déverrouiller
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '15px' }}>
                <h3>1. Inscriptions enregistrées par Profil</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={statBoxStyle}><strong>{profiles.filter(p => p.role === 'Producteur').length}</strong><br /><small>Producteurs</small></div>
                  <div style={statBoxStyle}><strong>{profiles.filter(p => p.role === 'Consommateur').length}</strong><br /><small>B2C Simples</small></div>
                  <div style={statBoxStyle}><strong>{profiles.filter(p => p.role === 'B2B').length}</strong><br /><small>Grands Comptes</small></div>
                  <div style={statBoxStyle}><strong>{profiles.filter(p => p.role === 'Transporteur').length}</strong><br /><small>Transporteurs</small></div>
                </div>

                <h3>2. Cumul des Commissions Torolam Holding</h3>
                <p><strong>Total Général des Commissions récoltées : {grandTotalCommissions().toLocaleString()} FCFA</strong></p>
                <ul>
                  <li>Maraîchage : {totalCommissionsPerCategory('Maraîchage').toLocaleString()} FCFA</li>
                  <li>Céréales : {totalCommissionsPerCategory('Céréales').toLocaleString()} FCFA</li>
                  <li>Laitier : {totalCommissionsPerCategory('Laitier').toLocaleString()} FCFA</li>
                  <li>Avicole : {totalCommissionsPerCategory('Avicole').toLocaleString()} FCFA</li>
                  <li>Œufs : {totalCommissionsPerCategory('Œufs').toLocaleString()} FCFA</li>
                  <li>Poisson : {totalCommissionsPerCategory('Poisson').toLocaleString()} FCFA</li>
                </ul>

                <h3>3. Marque & Logo Officiel</h3>
                <input type="text" value={brandLogo} onChange={e => setBrandLogo(e.target.value)} placeholder="Lien URL de l'image du logo" style={inputStyle} />
                <button onClick={() => alert('Logo mis à jour !')} style={{ ...submitBtnStyle, marginTop: '10px' }}>Enregistrer le logo</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Styles réutilisables
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '4px', boxSizing: 'border-box' };
const submitBtnStyle = { width: '100%', backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };
const authBtnStyle = { backgroundColor: 'transparent', color: '#fff', border: '1px solid #fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' };
const cardStyle = { background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const formCardStyle = { background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '650px', margin: '0 auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const flexColumn = { display: 'flex', flexDirection: 'column', gap: '12px' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalBoxStyle = { background: '#fff', padding: '25px', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '85vh', overflowY: 'auto' };
const statBoxStyle = { background: '#f4f6f8', padding: '10px', borderRadius: '6px' };

function navBtnStyle(isActive) {
  return {
    backgroundColor: isActive ? '#2e7d32' : 'transparent',
    color: '#fff',
    border: '1px solid #fff',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.85rem'
  };
}
