import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Reportar from './pages/Reportar'
import MisReportes from './pages/MisReportes'
import Seguimiento from './pages/Seguimiento'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="reportar" element={<Reportar />} />
        <Route path="mis-reportes" element={<MisReportes />} />
        <Route path="seguimiento" element={<Seguimiento />} />
      </Route>
    </Routes>
  )
}