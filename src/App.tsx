import React, { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Header, BottomNav } from './components/Header'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useSaleWatcher } from './hooks/useSaleAlerts'
import { Home } from './pages/Home'
import { Results } from './pages/Results'
import { JourneyDetail } from './pages/JourneyDetail'
import { Trips } from './pages/Trips'
import { Auth } from './pages/Auth'
import { Account } from './pages/Account'
import { Cards } from './pages/Cards'
import { CheckoutSuccess, CheckoutCancel } from './pages/CheckoutReturn'

export default function App() {
  const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  useSaleWatcher()

  return (
    <div className="min-h-full pb-16 sm:pb-0">
      <Header />
      <main>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/journey" element={<JourneyDetail />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/kortingskaarten" element={<Cards />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-ink-faint">
      Spoorwijs · demo — reisplanner voor treinreizen door de EU & UK. Afrekenen bij de vervoerder.
    </footer>
  )
}
