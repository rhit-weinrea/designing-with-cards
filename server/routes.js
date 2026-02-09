import { Router } from 'express'
import db from './db.js'

const router = Router()

// --- Products ---

router.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all()
  res.json(products)
})

router.post('/api/products', (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const result = db.prepare('INSERT INTO products (name) VALUES (?)').run(name)
  res.json({ id: result.lastInsertRowid, name })
})

router.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  if (!product) return res.status(404).json({ error: 'Not found' })
  res.json(product)
})

router.put('/api/products/:id', (req, res) => {
  const { name } = req.body
  db.prepare('UPDATE products SET name = ? WHERE id = ?').run(name, req.params.id)
  res.json({ id: Number(req.params.id), name })
})

router.delete('/api/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// --- Cards ---

router.get('/api/products/:id/cards', (req, res) => {
  const cards = db.prepare('SELECT * FROM cards WHERE product_id = ? ORDER BY id').all(req.params.id)
  res.json(cards)
})

router.post('/api/products/:id/cards', (req, res) => {
  const { title, description, price } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required' })
  const result = db.prepare(
    'INSERT INTO cards (product_id, title, description, price) VALUES (?, ?, ?, ?)'
  ).run(req.params.id, title, description || '', price || 0)
  res.json({ id: result.lastInsertRowid, product_id: Number(req.params.id), title, description: description || '', price: price || 0 })
})

router.put('/api/cards/:id', (req, res) => {
  const { title, description, price } = req.body
  db.prepare('UPDATE cards SET title = ?, description = ?, price = ? WHERE id = ?')
    .run(title, description || '', price || 0, req.params.id)
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id)
  res.json(card)
})

router.delete('/api/cards/:id', (req, res) => {
  db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// --- Sessions ---

router.get('/api/sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, p.name as product_name
    FROM sessions s JOIN products p ON s.product_id = p.id
    ORDER BY s.created_at DESC
  `).all()
  res.json(sessions)
})

router.get('/api/products/:id/sessions', (req, res) => {
  const sessions = db.prepare('SELECT * FROM sessions WHERE product_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json(sessions)
})

router.post('/api/sessions', (req, res) => {
  const { product_id, user_name, show_prices, budget } = req.body
  if (!product_id || !user_name) return res.status(400).json({ error: 'product_id and user_name required' })
  const result = db.prepare(
    'INSERT INTO sessions (product_id, user_name, show_prices, budget) VALUES (?, ?, ?, ?)'
  ).run(product_id, user_name, show_prices ? 1 : 0, budget || 100)
  res.json({ id: result.lastInsertRowid, product_id, user_name, show_prices: !!show_prices, budget: budget || 100 })
})

router.get('/api/sessions/:id', (req, res) => {
  const session = db.prepare(`
    SELECT s.*, p.name as product_name
    FROM sessions s JOIN products p ON s.product_id = p.id
    WHERE s.id = ?
  `).get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Not found' })
  const cards = db.prepare('SELECT * FROM cards WHERE product_id = ? ORDER BY id').all(session.product_id)
  res.json({ ...session, cards })
})

router.put('/api/sessions/:id', (req, res) => {
  const { show_prices, budget } = req.body
  const updates = []
  const values = []
  if (show_prices !== undefined) { updates.push('show_prices = ?'); values.push(show_prices ? 1 : 0) }
  if (budget !== undefined) { updates.push('budget = ?'); values.push(budget) }
  if (updates.length) {
    values.push(req.params.id)
    db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id)
  res.json(session)
})

// --- Snapshots ---

router.post('/api/sessions/:id/snapshot', (req, res) => {
  const { mode, data } = req.body
  if (!mode || !data) return res.status(400).json({ error: 'mode and data required' })
  const result = db.prepare(
    'INSERT INTO snapshots (session_id, mode, data) VALUES (?, ?, ?)'
  ).run(req.params.id, mode, JSON.stringify(data))
  res.json({ id: result.lastInsertRowid, session_id: Number(req.params.id), mode, data })
})

router.get('/api/sessions/:id/snapshots', (req, res) => {
  const snapshots = db.prepare('SELECT * FROM snapshots WHERE session_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json(snapshots.map(s => ({ ...s, data: JSON.parse(s.data) })))
})

export default router
