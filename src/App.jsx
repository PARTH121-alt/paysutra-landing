import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider, useStore, canAccess } from './store'
import Landing from './pages/Landing'
import Login from './pages/Login'
import DashboardLayout from './components/DashboardLayout'
import Overview from './components/Overview'
import Transactions from './components/Transactions'
import Payouts from './components/Payouts'
import Customers from './components/Customers'
import Settings from './components/Settings'
import Team from './components/Team'

function RequireAuth({ children }) {
  const { user } = useStore()
  return user ? children : <Navigate to="/login" replace />
}

/* User-based access control: page-level RBAC guard.
   Users without the role are redirected to their Overview. */
function Access({ page, children }) {
  const { user } = useStore()
  if (!canAccess(page, user)) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="transactions" element={<Access page="transactions"><Transactions /></Access>} />
            <Route path="payouts" element={<Access page="payouts"><Payouts /></Access>} />
            <Route path="customers" element={<Access page="customers"><Customers /></Access>} />
            <Route path="team" element={<Access page="team"><Team /></Access>} />
            <Route path="settings" element={<Access page="settings"><Settings /></Access>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
