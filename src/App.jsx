import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ProductEditor from './pages/ProductEditor'
import SessionView from './pages/SessionView'
import SortMode from './pages/SortMode'
import GroupMode from './pages/GroupMode'
import BuyMode from './pages/BuyMode'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">Designing with Cards</Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/product/:id" element={<ProductEditor />} />
          <Route path="/session/:id" element={<SessionView />} />
          <Route path="/session/:id/sort" element={<SortMode />} />
          <Route path="/session/:id/group" element={<GroupMode />} />
          <Route path="/session/:id/buy" element={<BuyMode />} />
        </Routes>
      </main>
    </div>
  )
}
