import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function BuyMode() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [cards, setCards] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getSession(id).then(sess => {
      setSession(sess)
      setCards(sess.cards)
    })
  }, [id])

  const budget = session?.budget || 0
  const spent = cards.filter(c => selected.has(c.id)).reduce((sum, c) => sum + c.price, 0)
  const remaining = budget - spent
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0

  function toggleCard(card) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(card.id)) {
        next.delete(card.id)
      } else if (card.price <= remaining) {
        next.add(card.id)
      }
      return next
    })
    setSaved(false)
  }

  async function saveSnapshot() {
    const selectedCards = cards.filter(c => selected.has(c.id))
    const data = {
      budget,
      total: spent,
      selected: selectedCards.map(c => ({ id: c.id, title: c.title, price: c.price })),
    }
    await api.saveSnapshot(id, 'buy', data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!session) return <div>Loading...</div>

  let barColor = '#27ae60'
  if (pct > 80) barColor = '#f39c12'
  if (pct >= 100) barColor = '#e74c3c'

  return (
    <div>
      <Link to={`/session/${id}`} className="back-link">&larr; Back to Session</Link>
      <div className="toolbar">
        <h2 className="section-title">Buy a Feature - {session.user_name}</h2>
        <button className="btn btn-success" onClick={saveSnapshot}>
          {saved ? 'Saved!' : 'Save Snapshot'}
        </button>
      </div>

      <div className="budget-bar">
        <span className="budget-label">Budget: ${budget}</span>
        <div className="budget-progress">
          <div className="budget-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <span style={{ fontWeight: 600 }}>
          ${spent} / ${budget}
          <span style={{ color: '#999', fontWeight: 400 }}> (${remaining} left)</span>
        </span>
      </div>

      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Click cards to add them to your selection. Cards you can't afford are dimmed.
      </p>

      <div className="card-grid">
        {cards.map(card => {
          const isSelected = selected.has(card.id)
          const canAfford = isSelected || card.price <= remaining

          return (
            <div
              key={card.id}
              className={`buy-card ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
              onClick={() => canAfford && toggleCard(card)}
            >
              <div className="card-title">{card.title}</div>
              {card.description && <div className="card-desc">{card.description}</div>}
              <div className="card-price">${card.price}</div>
              {isSelected && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#27ae60', fontWeight: 600 }}>
                  Selected
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
