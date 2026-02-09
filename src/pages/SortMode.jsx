import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../api'

function SortableCard({ card, rank, showPrice }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`drag-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <span className="rank">#{rank}</span>
      <div className="card-info">
        <div className="card-title">{card.title}</div>
        {card.description && <div className="card-desc">{card.description}</div>}
        {showPrice && <span className="card-price">${card.price}</span>}
      </div>
    </div>
  )
}

export default function SortMode() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [cards, setCards] = useState([])
  const [saved, setSaved] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    api.getSession(id).then(sess => {
      setSession(sess)
      setCards(sess.cards)
    })
  }, [id])

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      setCards(prev => {
        const oldIndex = prev.findIndex(c => c.id === active.id)
        const newIndex = prev.findIndex(c => c.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
      setSaved(false)
    }
  }

  async function saveSnapshot() {
    const data = cards.map((c, i) => ({ title: c.title, id: c.id, rank: i + 1 }))
    await api.saveSnapshot(id, 'sort', data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!session) return <div>Loading...</div>

  return (
    <div>
      <Link to={`/session/${id}`} className="back-link">&larr; Back to Session</Link>
      <div className="toolbar">
        <h2 className="section-title">Sort Mode - {session.user_name}</h2>
        <button className="btn btn-success" onClick={saveSnapshot}>
          {saved ? 'Saved!' : 'Save Snapshot'}
        </button>
      </div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>Drag cards to rank them from most important (#1) to least important.</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card, i) => (
            <SortableCard key={card.id} card={card} rank={i + 1} showPrice={!!session.show_prices} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
