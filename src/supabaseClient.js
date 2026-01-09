// 📚 WHAT IS THIS FILE?
// This file creates a "connection" to your Supabase database.
// Think of it like setting up a phone line - once it's set up,
// any part of your app can use it to talk to the database.

// 🔧 IMPORTING TOOLS
// We're bringing in the Supabase tool we installed earlier
import { createClient } from '@supabase/supabase-js'

// 🔑 GETTING YOUR SECRET KEYS
// Remember the .env file you created? We're reading from it now!
// VITE automatically makes these available as import.meta.env.VITE_*

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ⚠️ SAFETY CHECK
// If the keys are missing, we'll show an error instead of breaking the app
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Make sure you created the .env file with:')
  console.error('VITE_SUPABASE_URL=your-url')
  console.error('VITE_SUPABASE_ANON_KEY=your-key')
}

// 🌐 CREATE THE CONNECTION
// This "supabase" object is what we'll use everywhere to:
// - Log users in
// - Sign users up
// - Save outfit ratings
// - Get user data
// It's like the "main controller" for our database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 📖 HOW TO USE THIS IN OTHER FILES:
// Just import it like this:
// import { supabase } from './supabaseClient'
// 
// Then you can do things like:
// await supabase.auth.signUp({ email, password })
// await supabase.from('outfit_history').select('*')