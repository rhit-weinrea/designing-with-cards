import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../api'

function DraggableItem({ card, showPrice }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="drag-card" {...attributes} {...listeners}>
      <div className="card-info">
        <div className="card-title">{card.title}</div>
        {card.description && <div className="card-desc">{card.description}</div>}
        {showPrice && <span className="card-price">${card.price}</span>}
      </div>
    </div>
  )
}

function DroppableGroup({ group, groupIndex, showPrice, onRename, onRemove }) {
  const cardIds = group.cards.map(c => `card-${c.id}`)
  const { setNodeRef, isOver } = useDroppable({ id: `group-${groupIndex}` })

  return (
    <div
      ref={setNodeRef}
      className={`group-column${isOver ? ' drop-target' : ''}`}
    >
      <div className="group-header">
        <input
          value={group.name}
          onChange={e => onRename(groupIndex, e.target.value)}
          placeholder="Group name..."
        />
        <button className="btn btn-danger btn-small" onClick={() => onRemove(groupIndex)} title="Remove group">x</button>
      </div>
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        {group.cards.map(card => (
          <DraggableItem key={card.id} card={card} showPrice={showPrice} />
        ))}
        {group.cards.length === 0 && (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
            Drop cards here
          </div>
        )}
      </SortableContext>
    </div>
  )
}

export default function GroupMode() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [groups, setGroups] = useState([{ name: 'Ungrouped', cards: [] }])
  const [saved, setSaved] = useState(false)
  const [activeCard, setActiveCard] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    api.getSession(id).then(sess => {
      setSession(sess)
      setGroups([{ name: 'Ungrouped', cards: [...sess.cards] }])
    })
  }, [id])

  function findCardGroup(cardId) {
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].cards.some(c => `card-${c.id}` === cardId)) return i
    }
    return -1
  }

  function handleDragStart(event) {
    const item = event.active.data.current?.card
    setActiveCard(item || null)
  }

  function findGroupByOverId(overId) {
    // Check if dropping directly over a group container
    const groupMatch = String(overId).match(/^group-(\d+)$/)
    if (groupMatch) return Number(groupMatch[1])
    // Otherwise check if dropping over a card inside a group
    return findCardGroup(overId)
  }

  function handleDragOver(event) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const fromGroup = findCardGroup(activeId)
    const toGroup = findGroupByOverId(overId)

    if (fromGroup === -1 || toGroup === -1 || fromGroup === toGroup) return

    setGroups(prev => {
      const next = prev.map(g => ({ ...g, cards: [...g.cards] }))
      const cardIndex = next[fromGroup].cards.findIndex(c => `card-${c.id}` === activeId)
      if (cardIndex === -1) return prev
      const [card] = next[fromGroup].cards.splice(cardIndex, 1)
      next[toGroup].cards.push(card)
      return next
    })
  }

  function handleDragEnd(event) {
    const { active, over } = event

    // Handle reordering within the same group
    if (over) {
      const activeId = active.id
      const overId = over.id
      const fromGroup = findCardGroup(activeId)
      const toGroup = findCardGroup(overId)

      if (fromGroup !== -1 && fromGroup === toGroup && activeId !== overId) {
        setGroups(prev => {
          const next = prev.map(g => ({ ...g, cards: [...g.cards] }))
          const oldIndex = next[fromGroup].cards.findIndex(c => `card-${c.id}` === activeId)
          const newIndex = next[fromGroup].cards.findIndex(c => `card-${c.id}` === overId)
          if (oldIndex !== -1 && newIndex !== -1) {
            const [card] = next[fromGroup].cards.splice(oldIndex, 1)
            next[fromGroup].cards.splice(newIndex, 0, card)
          }
          return next
        })
      }
    }

    setActiveCard(null)
    setSaved(false)
  }

  function addGroup() {
    setGroups([...groups, { name: `Group ${groups.length + 1}`, cards: [] }])
  }

  function renameGroup(index, name) {
    setGroups(prev => prev.map((g, i) => i === index ? { ...g, name } : g))
  }

  function removeGroup(index) {
    if (groups.length <= 1) return
    setGroups(prev => {
      const removed = prev[index]
      const next = prev.filter((_, i) => i !== index)
      // Move cards back to first group
      next[0] = { ...next[0], cards: [...next[0].cards, ...removed.cards] }
      return next
    })
  }

  async function saveSnapshot() {
    const data = groups.map(g => ({
      name: g.name,
      cards: g.cards.map(c => ({ id: c.id, title: c.title })),
    }))
    await api.saveSnapshot(id, 'group', data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!session) return <div>Loading...</div>

  // Collect all card IDs for DndContext
  const allCardIds = groups.flatMap(g => g.cards.map(c => `card-${c.id}`))

  return (
    <div>
      <Link to={`/session/${id}`} className="back-link">&larr; Back to Session</Link>
      <div className="toolbar">
        <h2 className="section-title">Group Mode - {session.user_name}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={addGroup}>Add Group</button>
          <button className="btn btn-success" onClick={saveSnapshot}>
            {saved ? 'Saved!' : 'Save Snapshot'}
          </button>
        </div>
      </div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>Drag cards between groups. Rename groups by clicking their headers.</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="groups-container">
          {groups.map((group, i) => (
            <DroppableGroup
              key={i}
              group={group}
              groupIndex={i}
              showPrice={!!session.show_prices}
              onRename={renameGroup}
              onRemove={removeGroup}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="drag-card" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div className="card-info">
                <div className="card-title">{activeCard.title}</div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
