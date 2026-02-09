import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function ProductEditor() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [cards, setCards] = useState([])
  const [newCard, setNewCard] = useState({ title: '', description: '', price: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '' })

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const [prod, crds] = await Promise.all([api.getProduct(id), api.getCards(id)])
    setProduct(prod)
    setCards(crds)
  }

  async function addCard(e) {
    e.preventDefault()
    if (!newCard.title.trim()) return
    await api.createCard(id, {
      title: newCard.title.trim(),
      description: newCard.description.trim(),
      price: Number(newCard.price) || 0,
    })
    setNewCard({ title: '', description: '', price: '' })
    loadData()
  }

  function startEdit(card) {
    setEditingId(card.id)
    setEditForm({ title: card.title, description: card.description, price: card.price })
  }

  async function saveEdit(e) {
    e.preventDefault()
    await api.updateCard(editingId, {
      title: editForm.title,
      description: editForm.description,
      price: Number(editForm.price) || 0,
    })
    setEditingId(null)
    loadData()
  }

  async function deleteCard(cardId) {
    if (!confirm('Delete this card?')) return
    await api.deleteCard(cardId)
    loadData()
  }

  if (!product) return <div>Loading...</div>

  return (
    <div>
      <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
      <h2 className="section-title">{product.name} - Cards</h2>

      <form className="inline-form" onSubmit={addCard} style={{ marginBottom: '1.5rem' }}>
        <input
          placeholder="Card title"
          value={newCard.title}
          onChange={e => setNewCard({ ...newCard, title: e.target.value })}
        />
        <input
          placeholder="Description"
          value={newCard.description}
          onChange={e => setNewCard({ ...newCard, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={newCard.price}
          onChange={e => setNewCard({ ...newCard, price: e.target.value })}
          style={{ width: '80px' }}
        />
        <button className="btn btn-success" type="submit">Add Card</button>
      </form>

      {cards.length === 0 && <p className="empty-state">No cards yet. Add some above!</p>}

      <div className="card-grid">
        {cards.map(card => (
          <div key={card.id} className="card">
            {editingId === card.id ? (
              <form onSubmit={saveEdit}>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                />
                <input
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                />
                <input
                  type="number"
                  value={editForm.price}
                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                  style={{ width: '80px', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button className="btn btn-success btn-small" type="submit">Save</button>
                  <button className="btn btn-secondary btn-small" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="card-title">{card.title}</div>
                {card.description && <div className="card-desc">{card.description}</div>}
                <div className="card-price">${card.price}</div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem' }}>
                  <button className="btn btn-primary btn-small" onClick={() => startEdit(card)}>Edit</button>
                  <button className="btn btn-danger btn-small" onClick={() => deleteCard(card.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
