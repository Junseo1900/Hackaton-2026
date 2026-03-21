'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [proposals, setProposals] = useState([])
  const [events, setEvents] = useState([])
  const [orgs, setOrgs] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: proposalsData } = await supabase
      .from('proposals')
      .select('*, orgs(name)')
      .eq('status', 'pending')

    const { data: eventsData } = await supabase
      .from('events')
      .select('*, orgs(name)')
      .eq('status', 'pending')

    const { data: orgsData } = await supabase
      .from('orgs')
      .select('*')

    setProposals(proposalsData || [])
    setEvents(eventsData || [])
    setOrgs(orgsData || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#6b7280' }}>
      Loading...
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; font-family: 'Inter', sans-serif; }

        /* NAVBAR */
        .navbar {
          background: #fff;
          border-bottom: 2px solid #e5e7eb;
          padding: 0 40px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-logo {
          height: 140px;
          width: auto;
          object-fit: contain;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-badge {
          background: #ffffff;
          color: #000000;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 99px;
          border: 1px solid #8b8e8f;
        }

        .signout-btn {
          background: none;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #78797a;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }
        .signout-btn:hover { border-color: #06b6d4; color: #0891b2; }

        /* MAIN */
        .main { max-width: 1100px; margin: 0 auto; padding: 36px 24px; }

        .page-title {
          font-size: 26px;
          font-weight: 800;
          color: #1a1a2e;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .page-sub {
          font-size: 15px;
          color: #6b7280;
          margin-bottom: 32px;
        }

        /* STAT CARDS */
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px 22px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 2px solid #e5e7eb;
        }

        .stat-label {
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: #1a1a2e;
          letter-spacing: -1px;
          line-height: 1;
        }
        
        .stat-value.green { color: #16a34a; }
        .stat-value.yellow { color: #e7dc12; }
        .stat-value.red { color: #dc2626; }
        .stat-value.cyan { color: #0226ee; }

        /* TABS */
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tab-btn {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 2px solid #e5e7eb;
          background: #000000;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }

        .tab-btn:hover { border-color: #000000; color: #000000; }
        .tab-btn.active { background: #000000; color: #fff; border-color: #000000; }

        /* CONTENT CARD */
        .content-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 2px solid #e5e7eb;
          overflow: hidden;
        }

        .content-head {
          padding: 20px 24px;
          border-bottom: 2px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .content-title {
          font-size: 17px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .count-badge {
          background: #fef3c7;
          color: #d97706;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 99px;
        }

        .count-badge.cyan {
          background: #000000;
          color: #ffffff;
        }

        /* LIST ROWS */
        .list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.1s;
        }

        .list-row:last-child { border-bottom: none; }
        .list-row:hover { background: #f9fafb; }

        .row-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 3px;
        }

        .row-sub {
          font-size: 13px;
          color: #9ca3af;
        }

        .row-arrow {
          font-size: 18px;
          color: #d1d5db;
        }

        .empty {
          padding: 48px 24px;
          text-align: center;
          color: #9ca3af;
          font-size: 15px;
        }

        .empty-icon { font-size: 32px; margin-bottom: 8px; }

        /* PENDING BADGE */
        .pending-badge {
          background: #fef3c7;
          color: #d97706;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 99px;
          white-space: nowrap;
        }

        .amount-badge {
          background: #f0fdf4;
          color: #16a34a;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 99px;
        }

        @media (max-width: 640px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
          .navbar { padding: 0 20px; }
          .main { padding: 24px 16px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Two Delta" className="nav-logo" />
        <div className="nav-right">
          <span className="nav-badge">🎓 university Administration</span>
          <button onClick={handleLogout} className="signout-btn">Sign out</button>
        </div>
      </nav>

      <div className="main">
        <div className="page-title"> </div>
        <div className="page-sub">Manage organizations, budgets, and events</div>

        {/* STATS */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Total Organizations</div>
            <div className="stat-value cyan">{orgs.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Budgets</div>
            <div className="stat-value green">{proposals.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Events</div>
            <div className="stat-value yellow">{events.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Pending</div>
            <div className="stat-value red">{proposals.length + events.length}</div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            🏛 Organization Directory
          </button>
          <button
            className={`tab-btn ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('budgets')}
          >
            💰 Budget Proposals {proposals.length > 0 && `(${proposals.length})`}
          </button>
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📅 Event Proposals {events.length > 0 && `(${events.length})`}
          </button>
        </div>

        {/* ORG DIRECTORY */}
        {activeTab === 'overview' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Student Organizations</div>
              <span className="count-badge cyan">{orgs.length} orgs</span>
            </div>
            {orgs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🏛</div>
                No organizations yet
              </div>
            ) : (
              orgs.map(org => (
                <div
                  key={org.id}
                  className="list-row"
                  onClick={() => router.push(`/admin/org/${org.id}`)}
                >
                  <div>
                    <div className="row-title">{org.name}</div>
                    <div className="row-sub">{org.description}</div>
                  </div>
                  <span className="row-arrow">→</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* BUDGET PROPOSALS */}
        {activeTab === 'budgets' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Pending Budget Proposals</div>
              {proposals.length > 0 && <span className="count-badge">{proposals.length} pending</span>}
            </div>
            {proposals.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">✅</div>
                No pending budget proposals
              </div>
            ) : (
              proposals.map(proposal => (
                <div key={proposal.id} className="list-row">
                  <div>
                    <div className="row-title">{proposal.title}</div>
                    <div className="row-sub">{proposal.orgs?.name} · {proposal.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="amount-badge">${proposal.amount}</span>
                    <span className="pending-badge">Pending</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* EVENT PROPOSALS */}
        {activeTab === 'events' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Pending Event Proposals</div>
              {events.length > 0 && <span className="count-badge">{events.length} pending</span>}
            </div>
            {events.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">✅</div>
                No pending event proposals
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="list-row">
                  <div>
                    <div className="row-title">{event.title}</div>
                    <div className="row-sub">{event.orgs?.name} · 📍 {event.location}</div>
                  </div>
                  <span className="pending-badge">Pending</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}