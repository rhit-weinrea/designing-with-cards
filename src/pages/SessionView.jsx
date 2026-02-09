import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function SessionView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [expandedSnapshot, setExpandedSnapshot] = useState(null)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const [sess, snaps] = await Promise.all([api.getSession(id), api.getSnapshots(id)])
    setSession(sess)
    setSnapshots(snaps)
  }

  function renderSnapshotData(snapshot) {
    const { mode, data } = snapshot
    if (mode === 'sort') {
      return (
        <div className="snapshot-detail">
          <strong>Ranking:</strong>
          <ol>
            {data.map((item, i) => <li key={i}>{item.title}</li>)}
          </ol>
        </div>
      )
    }
    if (mode === 'group') {
      return (
        <div className="snapshot-detail">
          {data.map((group, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <strong>{group.name}:</strong>{' '}
              {group.cards.map(c => c.title).join(', ') || '(empty)'}
            </div>
          ))}
        </div>
      )
    }
    if (mode === 'buy') {
      return (
        <div className="snapshot-detail">
          <strong>Selected (total: ${data.total}):</strong>
          <ul>
            {data.selected.map((c, i) => (
              <li key={i}>{c.title} - ${c.price}</li>
            ))}
          </ul>
        </div>
      )
    }
    return <pre className="snapshot-detail">{JSON.stringify(data, null, 2)}</pre>
  }

  if (!session) return <div>Loading...</div>

  return (
    <div>
      <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
      <h2 className="section-title">
        Session: {session.user_name}
        <span style={{ fontWeight: 400, fontSize: '0.9rem', color: '#666', marginLeft: '0.5rem' }}>
          ({session.product_name} &middot; Budget: ${session.budget})
        </span>
      </h2>

      <div className="mode-buttons">
        <button className="mode-btn" onClick={() => navigate(`/session/${id}/sort`)}>
          <h3>Sort</h3>
          <p>Rank cards from most to least important</p>
        </button>
        <button className="mode-btn" onClick={() => navigate(`/session/${id}/group`)}>
          <h3>Group</h3>
          <p>Organize cards into named groups</p>
        </button>
        <button className="mode-btn" onClick={() => navigate(`/session/${id}/buy`)}>
          <h3>Buy a Feature</h3>
          <p>Select features within a budget of ${session.budget}</p>
        </button>
      </div>

      <div className="section">
        <h3 className="section-title">Saved Snapshots ({snapshots.length})</h3>
        {snapshots.length === 0 && <p className="empty-state">No snapshots yet. Use a mode and save results!</p>}
        <div className="snapshot-list">
          {snapshots.map(snap => (
            <div
              key={snap.id}
              className="snapshot-item"
              onClick={() => setExpandedSnapshot(expandedSnapshot === snap.id ? null : snap.id)}
            >
              <div className="snapshot-meta">
                <span className="snapshot-mode">{snap.mode}</span>
                <span>{new Date(snap.created_at).toLocaleString()}</span>
              </div>
              {expandedSnapshot === snap.id && renderSnapshotData(snap)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
