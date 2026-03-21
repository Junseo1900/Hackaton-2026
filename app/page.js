'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const router = useRouter()

  const portals = [
    { id: 'admin', icon: '🎓', title: 'University Admin', desc: 'Manage orgs, approve proposals' },
    { id: 'org_leader', icon: '👥', title: 'Org Leader', desc: 'Submit budgets & events' },
    { id: 'member', icon: '🙂', title: 'Member', desc: 'View events & updates' },
  ]

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!selectedRole) { setError('Please select a portal first.'); return }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    const role = profile?.role
    if (role === 'admin') router.push('/admin')
    else if (role === 'org_leader') router.push('/leader')
    else router.push('/member')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; }

        .root {
          min-height: 100vh;
          background: #f0f4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          padding: 40px 20px;
        }

        .container {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        /* LOGO */
        .logo-img {
          width: 250px;
          height: auto;
          object-fit: contain;
        }

        /* PORTAL CARDS */
        .portal-label {
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
          width: 100%;
        }

        .portals {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          margin-bottom: 4px;
        }

        .portal-card {
          background: #fff;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          padding: 18px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .portal-card:hover { border-color: #06b6d4; background: #ecfeff; }
        .portal-card.selected {
          border-color: #06b6d4;
          background: #ecfeff;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.15);
        }

        .portal-icon { font-size: 28px; margin-bottom: 8px; }
        .portal-title { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
        .portal-card.selected .portal-title { color: #0891b2; }
        .portal-desc { font-size: 11px; color: #9ca3af; line-height: 1.4; }

        /* FORM */
        .form-card {
          background: #fff;
          border-radius: 18px;
          padding: 32px 28px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          width: 100%;
        }

        .field { margin-bottom: 20px; }

        .label {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .input {
          width: 100%;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 16px;
          color: #1a1a2e;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border 0.15s;
        }

        .input::placeholder { color: #c0c4cc; }
        .input:focus { border-color: #06b6d4; background: #fff; }

        .password-wrap { position: relative; }
        .password-wrap .input { padding-right: 50px; }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #9ca3af;
          padding: 4px;
          line-height: 1;
        }
        .eye-btn:hover { color: #06b6d4; }

        .error {
          font-size: 14px;
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }

        .btn {
          width: 100%;
          background: #06b6d4;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 16px;
          font-size: 17px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .btn:hover:not(:disabled) { background: #0891b2; }
        .btn:active:not(:disabled) { transform: scale(0.99); }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .selected-badge {
          display: inline-block;
          background: #ecfeff;
          color: #0891b2;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 99px;
          margin-bottom: 20px;
          border: 1px solid #a5f3fc;
        }
      `}</style>

      <div className="root">
        <div className="container">

          {/* LOGO */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Two Delta" className="logo-img" />

          {/* PORTAL SELECTOR */}
          <div style={{ width: '100%' }}>
            <div className="portal-label">Choose your portal</div>
            <div className="portals">
              {portals.map((p) => (
                <div
                  key={p.id}
                  className={`portal-card ${selectedRole === p.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(p.id)}
                >
                  <div className="portal-icon">{p.icon}</div>
                  <div className="portal-title">{p.title}</div>
                  <div className="portal-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FORM */}
          <div className="form-card">
            {selectedRole && (
              <div className="selected-badge">
                {portals.find(p => p.id === selectedRole)?.icon}{' '}
                {portals.find(p => p.id === selectedRole)?.title} Portal
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="field">
                <label className="label">Email</label>
                <input
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div className="field">
                <label className="label">Password</label>
                <div className="password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && <div className="error">{error}</div>}

              <button type="submit" disabled={loading} className="btn">
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  )
}