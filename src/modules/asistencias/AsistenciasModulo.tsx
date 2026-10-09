import { Route, Routes } from 'react-router-dom'
import AsistenciasHome from './AsistenciasHome'
import AsistenciaEmpleados from './AsistenciaEmpleados'

/** Pantallas del módulo Asistencias: la lista (/asistencias) y el detalle de un empleado (/asistencias/:uuid). */
function AsistenciasModulo() {
  return (
    <Routes>
      <Route index element={<AsistenciasHome />} />
      <Route path=":uuid" element={<AsistenciaEmpleados />} />
    </Routes>
  )
}

export default AsistenciasModulo
