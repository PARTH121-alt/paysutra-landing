import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
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
            <Route path="transactions" element={<Transactions />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="customers" element={<Customers />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
