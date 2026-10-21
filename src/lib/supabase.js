import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Cloud mode is active once you add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY */
export const isCloud = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = isCloud ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

/** Razorpay gateway configured (public key only — safe on the client) */
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID
export const isGateway = Boolean(RAZORPAY_KEY_ID)

export async function loadRazorpay() {
  if (typeof window === 'undefined') return false
  if (window.Razorpay) return true
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
}
