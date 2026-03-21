'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') router.push('/admin')
    else if (profile?.role === 'org_leader') router.push('/leader')
    else router.push('/member')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .root {
          min-height: 100vh;
          background: #111112;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          padding: 24px;
        }

        .wrap {
          width: 100%;
          max-width: 420px;
        }

        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .logo span { color: #4ade80; }

        .tagline {
          font-size: 17px;
          color: #555;
          margin-bottom: 44px;
        }

        .label {
          display: block;
          font-size: 15px;
          color: #888;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .field { margin-bottom: 20px; }

        .input-wrap {
          position: relative;
        }

        .input {
          width: 100%;
          background: #1a1a1b;
          border: 1px solid #2a2a2b;
          border-radius: 10px;
          padding: 15px 18px;
          font-size: 17px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border 0.15s;
        }

        .input::placeholder { color: #333; }
        .input:focus { border-color: #4ade80; }

        .input-password {
          padding-right: 52px;
        }

        .show-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #555;
          cursor: pointer;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          padding: 4px;
          transition: color 0.15s;
        }

        .show-btn:hover { color: #4ade80; }

        .error {
          font-size: 15px;
          color: #f87171;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.15);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 18px;
        }

        .btn {
          width: 100%;
          background: #4ade80;
          color: #0a0a0a;
          border: none;
          border-radius: 10px;
          padding: 16px;
          font-size: 17px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: opacity 0.15s;
          margin-top: 8px;
        }

        .btn:hover:not(:disabled) { opacity: 0.85; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .footer {
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid #1e1e1f;
          display: flex;
          justify-content: center;
          gap: 28px;
        }

        .footer-item {
          font-size: 14px;
          color: #333;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ade80;
          opacity: 0.5;
        }
      `}</style>

      <div className="root">
        <div className="wrap">
          <div className="logo">Org<span>Bridge</span></div>
          <div className="tagline">Sign in to your campus portal</div>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="label">Email</label>
              <div className="input-wrap">
                <input
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-password"
                  required
                />
                <button
                  type="button"
                  className="show-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={loading} className="btn">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="footer">
            {['Admin', 'Org Leader', 'Member'].map((role) => (
              <div className="footer-item" key={role}>
                <div className="dot" />
                {role}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}