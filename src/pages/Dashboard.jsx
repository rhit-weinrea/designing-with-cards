import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [sessions, setSessions] = useState([])
  const [newProductName, setNewProductName] = useState('')
  const [newSession, setNewSession] = useState({ productId: '', userName: '', budget: 100 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [prods, sess] = await Promise.all([api.getProducts(), api.getSessions()])
    setProducts(prods)
    setSessions(sess)
  }

  async function createProduct(e) {
    e.preventDefault()
    if (!newProductName.trim()) return
    await api.createProduct(newProductName.trim())
    setNewProductName('')
    loadData()
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product and all its cards/sessions?')) return
    await api.deleteProduct(id)
    loadData()
  }

  async function createSession(e) {
    e.preventDefault()
    if (!newSession.productId || !newSession.userName.trim()) return
    await api.createSession({
      product_id: Number(newSession.productId),
      user_name: newSession.userName.trim(),
      budget: Number(newSession.budget) || 100,
    })
    setNewSession({ productId: '', userName: '', budget: 100 })
    loadData()
  }

  function sessionsForProduct(productId) {
    return sessions.filter(s => s.product_id === productId)
  }

  return (
    <div>
      <div className="section">
        <div className="toolbar">
          <h2 className="section-title">Products</h2>
        </div>

        <form className="inline-form" onSubmit={createProduct} style={{ marginBottom: '1rem' }}>
          <input
            placeholder="New product name..."
            value={newProductName}
            onChange={e => setNewProductName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Add Product</button>
        </form>

        {products.length === 0 && <p className="empty-state">No products yet. Create one above!</p>}

        {products.map(p => (
          <div key={p.id} className="product-item">
            <div className="product-header">
              <span className="product-name">{p.name}</span>
              <div className="product-actions">
                <Link to={`/product/${p.id}`} className="btn btn-primary btn-small">Edit Cards</Link>
                <button className="btn btn-danger btn-small" onClick={() => deleteProduct(p.id)}>Delete</button>
              </div>
            </div>

            <div className="sessions-list">
              {sessionsForProduct(p.id).length === 0 && (
                <div style={{ color: '#999', fontSize: '0.85rem' }}>No sessions yet</div>
              )}
              {sessionsForProduct(p.id).map(s => (
                <div key={s.id} className="session-row">
                  <Link to={`/session/${s.id}`}>{s.user_name}</Link>
                  <span style={{ fontSize: '0.8rem', color: '#999' }}>
                    Budget: ${s.budget}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h2 className="section-title">New Session</h2>
        <form className="inline-form" onSubmit={createSession}>
          <select
            value={newSession.productId}
            onChange={e => setNewSession({ ...newSession, productId: e.target.value })}
          >
            <option value="">Select product...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            placeholder="User name..."
            value={newSession.userName}
            onChange={e => setNewSession({ ...newSession, userName: e.target.value })}
          />
          <input
            type="number"
            placeholder="Budget"
            value={newSession.budget}
            onChange={e => setNewSession({ ...newSession, budget: e.target.value })}
            style={{ width: '80px' }}
          />
          <button className="btn btn-success" type="submit">Create Session</button>
        </form>
      </div>
    </div>
  )
}
