'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MemberLobby() {
  const [allOrgs, setAllOrgs] = useState([])
  const [myOrgIds, setMyOrgIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: orgsData } = await supabase.from('orgs').select('*').order('name')
    const { data: memberOrgs } = await supabase.from('org_members').select('org_id').eq('member_id', user.id)

    setAllOrgs(orgsData || [])
    setMyOrgIds((memberOrgs || []).map(o => o.org_id))
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filtered = allOrgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.description?.toLowerCase().includes(search.toLowerCase())
  )

  const myOrgs = filtered.filter(o => myOrgIds.includes(o.id))
  const otherOrgs = filtered.filter(o => !myOrgIds.includes(o.id))

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', fontFamily: 'Inter, sans-serif' }}>
      Loading...
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; font-family: 'Inter', sans-serif; }

        .navbar { background: #fff; border-bottom: 2px solid #e5e7eb; padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .nav-logo { height: 140px; width: auto; object-fit: contain; }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .nav-badge { background: #ffffff; color: #000000; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 99px; border: 1px solid #8b8e8f; }
        .signout-btn { background: none; border: 2px solid #e5e7eb; border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 500; color: #78797a; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .signout-btn:hover { border-color: #06b6d4; color: #0891b2; }

        .main { max-width: 900px; margin: 0 auto; padding: 36px 24px; }

        .hero { margin-bottom: 32px; }
        .hero-title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 6px; }
        .hero-sub { font-size: 15px; color: #6b7280; }

        .search-wrap { position: relative; margin-bottom: 32px; }
        .search-input { width: 100%; background: #fff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 14px 18px 14px 44px; font-size: 15px; color: #1a1a2e; font-family: 'Inter', sans-serif; outline: none; transition: border 0.15s; }
        .search-input:focus { border-color: #000; }
        .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 18px; }

        .section-title { font-size: 18px; font-weight: 800; color: #1a1a2e; margin-bottom: 14px; }

        .orgs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 36px; }

        .org-card { background: #fff; border-radius: 16px; border: 2px solid #e5e7eb; padding: 20px; cursor: pointer; transition: all 0.15s; }
        .org-card:hover { border-color: #000; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .org-card.joined { border-color: #bbf7d0; background: #f0fdf4; }
        .org-card.joined:hover { border-color: #16a34a; }

        .org-card-name { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
        .org-card-desc { font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 14px; }
        .org-card-footer { display: flex; align-items: center; justify-content: space-between; }

        .joined-badge { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
        .view-btn { font-size: 12px; font-weight: 600; color: #6b7280; }
        .org-card:hover .view-btn { color: #000; }

        .empty { padding: 48px 24px; text-align: center; color: #9ca3af; font-size: 15px; }
        .empty-icon { font-size: 32px; margin-bottom: 8px; }

        @media (max-width: 640px) {
          .navbar { padding: 0 20px; }
          .main { padding: 24px 16px; }
          .orgs-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="navbar">
        <img src="/logo.png" alt="Logo" className="nav-logo" />
        <div className="nav-right">
          <span className="nav-badge"> Student Portal</span>
          <button onClick={handleLogout} className="signout-btn">Sign out</button>
        </div>
      </nav>

      <div className="main">
        <div className="hero">
          <div className="hero-title">Campus Organizations </div>
          <div className="hero-sub">Browse and join organizations on campus</div>
        </div>

        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search organizations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {myOrgs.length > 0 && (
          <>
            <div className="section-title">My Organizations</div>
            <div className="orgs-grid">
              {myOrgs.map(org => (
                <div key={org.id} className="org-card joined" onClick={() => router.push(`/member/org/${org.id}`)}>
                  <div className="org-card-name">{org.name}</div>
                  <div className="org-card-desc">{org.description}</div>
                  <div className="org-card-footer">
                    <span className="joined-badge">✅ Joined</span>
                    <span className="view-btn">View →</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-title">All Organizations</div>
        {otherOrgs.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            {search ? 'No organizations match your search' : 'No other organizations to join'}
          </div>
        ) : (
          <div className="orgs-grid">
            {otherOrgs.map(org => (
              <div key={org.id} className="org-card" onClick={() => router.push(`/member/org/${org.id}`)}>
                <div className="org-card-name">{org.name}</div>
                <div className="org-card-desc">{org.description}</div>
                <div className="org-card-footer">
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Click to view & join</span>
                  <span className="view-btn">View →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}