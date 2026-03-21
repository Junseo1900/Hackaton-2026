'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OrgDetail({ params }) {
  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [proposals, setProposals] = useState([])
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [activeTab, setActiveTab] = useState('members')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const id = (await params).id
    const { data: orgData } = await supabase.from('orgs').select('*').eq('id', id).single()
    const { data: membersData } = await supabase.from('org_members').select('*, profiles(full_name, email, role)').eq('org_id', id)
    const { data: proposalsData } = await supabase.from('proposals').select('*').eq('org_id', id).order('created_at', { ascending: false })
    const { data: eventsData } = await supabase.from('events').select('*').eq('org_id', id).order('created_at', { ascending: false })
    const { data: announcementsData } = await supabase.from('announcements').select('*').eq('org_id', id).order('created_at', { ascending: false })
    setOrg(orgData)
    setMembers(membersData || [])
    setProposals(proposalsData || [])
    setEvents(eventsData || [])
    setAnnouncements(announcementsData || [])
    setLoading(false)
  }

  const handleProposal = async (id, status) => {
    await supabase.from('proposals').update({ status }).eq('id', id)
    fetchData()
  }

  const handleEvent = async (id, status) => {
    await supabase.from('events').update({ status }).eq('id', id)
    fetchData()
  }

  const statusBadge = (status) => {
    if (status === 'approved') return 'badge-green'
    if (status === 'denied') return 'badge-red'
    return 'badge-yellow'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#333' }}>
      Loading...
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* WHITE PAGE BACKGROUND */
        body { background: #f0f4ff; font-family: 'Inter', sans-serif; }

        /* NAVBAR — white */
        .navbar {
          background: #ffffff;
          border-bottom: 2px solid #ffffff;
          padding: 0 40px;
          height: 64px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .back-btn {
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }
        .back-btn:hover { background: #e5e7eb; }

        .nav-logo { height: 36px; width: auto; object-fit: contain; }

        .org-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }
        .org-desc { font-size: 13px; color: #6b7280; margin-top: 1px; }

        /* MAIN */
        .main { max-width: 900px; margin: 0 auto; padding: 36px 24px; }

        /* STATS — BLACK CARDS */
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 18px 20px;
        }

        .stat-label { font-size: 12px; color: #000000; font-weight: 500; margin-bottom: 8px; }
        .stat-value { font-size: 30px; font-weight: 800; color: #000000; letter-spacing: -1px; line-height: 1; }
        .stat-value.yellow { color: #ff0000; }
        .stat-value.cyan { color: #000000; }

        /* TABS */
        .tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }

        .tab-btn {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 2px solid #e5e7eb;
          background: #ffffff;
          color: #6b7280;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }

        .tab-btn:hover { border-color: #000000; color: #000000; }
        .tab-btn.active { background: #ffffff; color: #111113; border-color: #111113; }

        /* CONTENT CARD — BLACK */
        .content-card {
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        border: 2px solid #e5e7eb;
}

        .content-head {
          padding: 18px 22px;
          border-bottom: 1px solid #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .content-title { font-size: 16px; font-weight: 700; color: #000000; }

        /* LIST ROWS */
        .list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 22px;
          border-bottom: 1px solid #1e1e20;
          gap: 16px;
        }
        .list-row:last-child { border-bottom: none; }
        .list-row:hover { background: #d0d0e0; }

        .row-title { font-size: 14px; font-weight: 600; color: #070707; margin-bottom: 3px; }
        .row-sub { font-size: 12px; color: #6b7280; }
        .row-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }

        /* BADGES */
        .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; white-space: nowrap; }
        .badge-green { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .badge-red { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .badge-yellow { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
        .badge-blue { background: rgba(34,211,238,0.15); color: #22d3ee; border: 1px solid rgba(34,211,238,0.2); }
        .badge-gray { background: #1e1e20; color: #9ca3af; border: 1px solid #333; }

        /* BUTTONS */
        .btn-approve {
          background: rgba(34,197,94,0.15); color: #4ade80;
          border: 1px solid rgba(34,197,94,0.25); border-radius: 8px;
          padding: 7px 14px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .btn-approve:hover { background: #16a34a; color: #fff; }

        .btn-deny {
          background: rgba(239,68,68,0.15); color: #f87171;
          border: 1px solid rgba(239,68,68,0.25); border-radius: 8px;
          padding: 7px 14px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .btn-deny:hover { background: #dc2626; color: #fff; }

        /* AUDIT */
        .audit-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 22px; border-bottom: 1px solid #1e1e20; font-size: 14px;
        }
        .audit-row:last-child { border-bottom: none; }
        .audit-label { color: #9ca3af; }
        .audit-value { font-weight: 700; color: #000000; }
        .audit-value.green { color: #4ade80; }
        .audit-value.yellow { color: #fbbf24; }
        .audit-value.red { color: #f87171; }

        .empty { padding: 48px 22px; text-align: center; color: #4b5563; font-size: 15px; }
        .empty-icon { font-size: 28px; margin-bottom: 8px; }

        @media (max-width: 640px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
          .navbar { padding: 0 16px; }
          .main { padding: 20px 16px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <button className="back-btn" onClick={() => router.push('/admin')}>← Back</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Two Delta" className="nav-logo" />
        <div>
          <div className="org-title">{org?.name}</div>
          <div className="org-desc">{org?.description}</div>
        </div>
      </nav>

      <div className="main">

        {/* STATS */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Members</div>
            <div className="stat-value cyan">{members.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Proposals</div>
            <div className="stat-value">{proposals.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value yellow">
              {proposals.filter(p => p.status === 'pending').length + events.filter(e => e.status === 'pending').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{events.length}</div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {[
            { id: 'members', label: '👥 Members' },
            { id: 'budgets', label: '💰 Budget Proposals' },
            { id: 'events', label: '📅 Event Proposals' },
            { id: 'finances', label: '📊 Financial Audit' },
            { id: 'announcements', label: '📣 Announcements' },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* MEMBERS */}
        {activeTab === 'members' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Member List</div>
              <span className="badge badge-gray">{members.length} members</span>
            </div>
            {members.length === 0 ? (
              <div className="empty"><div className="empty-icon">👥</div>No members yet</div>
            ) : members.map(m => (
              <div key={m.id} className="list-row">
                <div>
                  <div className="row-title">{m.profiles?.full_name}</div>
                  <div className="row-sub">{m.profiles?.email}</div>
                </div>
                <span className="badge badge-gray">{m.profiles?.role}</span>
              </div>
            ))}
          </div>
        )}

        {/* BUDGET PROPOSALS */}
        {activeTab === 'budgets' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Budget Proposals</div>
              <span className="badge badge-yellow">{proposals.filter(p => p.status === 'pending').length} pending</span>
            </div>
            {proposals.length === 0 ? (
              <div className="empty"><div className="empty-icon">💰</div>No budget proposals yet</div>
            ) : proposals.map(proposal => (
              <div key={proposal.id} className="list-row">
                <div style={{ flex: 1 }}>
                  <div className="row-title">{proposal.title}</div>
                  <div className="row-sub">${proposal.amount} · {proposal.description}</div>
                </div>
                <div className="row-actions">
                  {proposal.status === 'pending' ? (
                    <>
                      <button className="btn-approve" onClick={() => handleProposal(proposal.id, 'approved')}>Approve</button>
                      <button className="btn-deny" onClick={() => handleProposal(proposal.id, 'denied')}>Deny</button>
                    </>
                  ) : (
                    <span className={`badge ${statusBadge(proposal.status)}`}>{proposal.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVENT PROPOSALS */}
        {activeTab === 'events' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Event Proposals</div>
              <span className="badge badge-yellow">{events.filter(e => e.status === 'pending').length} pending</span>
            </div>
            {events.length === 0 ? (
              <div className="empty"><div className="empty-icon">📅</div>No event proposals yet</div>
            ) : events.map(event => (
              <div key={event.id} className="list-row">
                <div style={{ flex: 1 }}>
                  <div className="row-title">{event.title}</div>
                  <div className="row-sub">📍 {event.location} · {new Date(event.date).toLocaleDateString()}</div>
                  <div className="row-sub" style={{ marginTop: '2px' }}>{event.description}</div>
                  {event.requires_payment && (
                    <span className="badge badge-blue" style={{ marginTop: '6px', display: 'inline-block' }}>💳 Paid · ${event.price}</span>
                  )}
                </div>
                <div className="row-actions">
                  {event.status === 'pending' ? (
                    <>
                      <button className="btn-approve" onClick={() => handleEvent(event.id, 'approved')}>Approve</button>
                      <button className="btn-deny" onClick={() => handleEvent(event.id, 'denied')}>Deny</button>
                    </>
                  ) : (
                    <span className={`badge ${statusBadge(event.status)}`}>{event.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FINANCIAL AUDIT */}
        {activeTab === 'finances' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Financial Audit</div>
            </div>
            <div className="audit-row"><span className="audit-label">Total approved budget</span><span className="audit-value green">${proposals.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span></div>
            <div className="audit-row"><span className="audit-label">Total pending budget</span><span className="audit-value yellow">${proposals.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span></div>
            <div className="audit-row"><span className="audit-label">Total denied budget</span><span className="audit-value red">${proposals.filter(p => p.status === 'denied').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span></div>
            <div className="audit-row"><span className="audit-label">Total proposals submitted</span><span className="audit-value">{proposals.length}</span></div>
            <div className="content-head" style={{ borderTop: '1px solid #2a2a2a' }}>
              <div className="content-title">Proposal History</div>
            </div>
            {proposals.length === 0 ? (
              <div className="empty"><div className="empty-icon">📊</div>No proposals yet</div>
            ) : proposals.map(p => (
              <div key={p.id} className="list-row">
                <div>
                  <div className="row-title">{p.title}</div>
                  <div className="row-sub">{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <div className="row-actions">
                  <span style={{ fontWeight: 700, color: '#000000', fontSize: '14px' }}>${p.amount}</span>
                  <span className={`badge ${statusBadge(p.status)}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Announcements</div>
            </div>
            {announcements.length === 0 ? (
              <div className="empty"><div className="empty-icon">📣</div>No announcements yet</div>
            ) : announcements.map(a => (
              <div key={a.id} className="list-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                  <div className="row-title">{a.title}</div>
                  <span className="row-sub">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <div className="row-sub" style={{ fontSize: '13px', lineHeight: '1.5' }}>{a.message}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}