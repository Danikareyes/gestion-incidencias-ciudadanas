import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import RutaProtegida from './components/RutaProtegida'
import Inicio from './pages/Inicio'
import Reportar from './pages/Reportar'
import MisReportes from './pages/MisReportes'
import Seguimiento from './pages/Seguimiento'
import Login from './pages/Login'
import Registro from './pages/Registro'
import PanelReportes from './pages/admin/PanelReportes'
import DetalleReporte from './pages/DetalleReporte'
import GestionReporte from './pages/admin/GestionReporte'
import RecuperarContrasena from './pages/RecuperarContrasena'
import NuevaContrasena from './pages/NuevaContrasena'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Públicas */}
        <Route index element={<Inicio />} />
        <Route path="seguimiento" element={<Seguimiento />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />
        <Route path="recuperar" element={<RecuperarContrasena />} />
        <Route path="nueva-contrasena" element={<NuevaContrasena />} />

        {/* Requieren sesión */}
        <Route element={<RutaProtegida />}>
          <Route path="reportar" element={<Reportar />} />
          <Route path="mis-reportes" element={<MisReportes />} />
          <Route path="mis-reportes/:id" element={<DetalleReporte />} />

        </Route>

        {/* Solo operadores y administradores */}
        <Route element={<RutaProtegida roles={['operador', 'admin']} />}>
          <Route path="admin" element={<PanelReportes />} />
          <Route path="admin/reportes/:id" element={<GestionReporte />} />
        </Route>
      </Route>
    </Routes>
  )
}