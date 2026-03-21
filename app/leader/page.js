'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Calendar from '@/app/components/Calendar'
import LocationPicker from '@/app/components/LocationPicker'

export default function LeaderOrgDetail({ params }) {
  const [org, setOrg] = useState(null)
  const [proposals, setProposals] = useState([])
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('budget')
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState(null)
  const router = useRouter()

  // Edit announcement
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMessage, setEditMessage] = useState('')

  // Budget form
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  // Event form
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [eventPrice, setEventPrice] = useState('')

  // Announcement form
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')

  // Reply to post
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const id = (await params).id
    setOrgId(id)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
    setUserProfile({ ...profile, id: user.id })

    const { data: orgData } = await supabase.from('orgs').select('*').eq('id', id).single()
    const { data: proposalsData } = await supabase.from('proposals').select('*').eq('org_id', id).order('created_at', { ascending: false })
    const { data: eventsData } = await supabase.from('events').select('*').eq('org_id', id).order('created_at', { ascending: false })
    const { data: announcementsData } = await supabase.from('announcements').select('*').eq('org_id', id).order('created_at', { ascending: false })
    const { data: postsData } = await supabase.from('posts').select('*').eq('org_id', id).order('created_at', { ascending: false })

    setOrg(orgData)
    setProposals(proposalsData || [])
    setEvents(eventsData || [])
    setAnnouncements(announcementsData || [])
    setPosts(postsData || [])
    setLoading(false)
  }

  const submitBudgetProposal = async (e) => {
    e.preventDefault()
    await supabase.from('proposals').insert({ org_id: orgId, title, amount: parseFloat(amount), description, status: 'pending' })
    setTitle(''); setAmount(''); setDescription(''); setShowBudgetForm(false); fetchData()
  }

  const submitEventProposal = async (e) => {
    e.preventDefault()
    await supabase.from('events').insert({ org_id: orgId, title: eventTitle, description: eventDescription, date: eventDate, location: eventLocation, requires_payment: requiresPayment, price: requiresPayment ? parseFloat(eventPrice) : 0, status: 'pending' })
    setEventTitle(''); setEventDescription(''); setEventDate(''); setEventLocation(''); setRequiresPayment(false); setEventPrice(''); setShowEventForm(false); fetchData()
  }

  const submitAnnouncement = async (e) => {
    e.preventDefault()
    await supabase.from('announcements').insert({ org_id: orgId, title: announcementTitle, message: announcementMessage })
    setAnnouncementTitle(''); setAnnouncementMessage(''); setShowAnnouncementForm(false); fetchData()
  }

  const saveEdit = async (id) => {
    await supabase.from('announcements').update({ title: editTitle, message: editMessage }).eq('id', id)
    setEditingId(null); setEditTitle(''); setEditMessage(''); fetchData()
  }

  const submitReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return
    setReplyLoading(true)
    await supabase.from('comments').insert({
      post_id: replyingTo.id,
      user_id: userProfile.id,
      author_name: userProfile.full_name,
      content: replyContent,
      is_leader_reply: true
    })
    setReplyContent(''); setReplyingTo(null); setReplyLoading(false); fetchData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const statusBadge = (status) => {
    if (status === 'approved') return 'badge-green'
    if (status === 'denied') return 'badge-red'
    return 'badge-yellow'
  }

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date)
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'

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
        .nav-left { display: flex; align-items: center; gap: 16px; }
        .back-btn { background: #f3f4f6; border: none; border-radius: 8px; padding: 7px 14px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .back-btn:hover { background: #e5e7eb; }
        .nav-logo { height: 140px; width: auto; object-fit: contain; }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .nav-badge { background: #ffffff; color: #000000; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 99px; border: 1px solid #8b8e8f; }
        .signout-btn { background: none; border: 2px solid #e5e7eb; border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 500; color: #78797a; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .signout-btn:hover { border-color: #06b6d4; color: #0891b2; }

        .main { max-width: 1100px; margin: 0 auto; padding: 36px 24px; }
        .page-sub { font-size: 15px; color: #6b7280; margin-bottom: 32px; }

        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #fff; border-radius: 16px; padding: 20px 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); border: 2px solid #e5e7eb; }
        .stat-label { font-size: 15px; color: #000000; font-weight: 700; margin-bottom: 8px; }
        .stat-value { font-size: 20px; font-weight: 600; color: #1a1a2e; letter-spacing: -1px; line-height: 1; }

        .tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .tab-btn { padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: 2px solid #e5e7eb; background: #ffffff; color: #6b7280; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .tab-btn:hover { border-color: #000000; color: #000000; }
        .tab-btn.active { background: #ffffff; color: #111113; border-color: #111113; }

        .content-card { background: #fff; border-radius: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); border: 2px solid #e5e7eb; overflow: hidden; }
        .content-head { padding: 20px 24px; border-bottom: 2px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
        .content-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }

        .list-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #f3f4f6; transition: background 0.1s; gap: 16px; }
        .list-row:last-child { border-bottom: none; }
        .list-row:hover { background: #f9fafb; }
        .row-title { font-size: 15px; font-weight: 600; color: #1a1a2e; margin-bottom: 3px; }
        .row-sub { font-size: 13px; color: #9ca3af; }
        .row-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }

        .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; white-space: nowrap; }
        .badge-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .badge-red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-yellow { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }

        .amount-badge-green { background: #f0fdf4; color: #16a34a; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 99px; }
        .amount-badge-yellow { background: #fef3c7; color: #d97706; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 99px; }
        .amount-badge-red { background: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 99px; }

        .new-btn { background: #000000; color: #ffffff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .new-btn:hover { background: #333; }

        .form-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 0; display: flex; flex-direction: column; gap: 10px; }
        .form-input { width: 100%; background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; font-size: 14px; color: #1a1a2e; font-family: 'Inter', sans-serif; outline: none; transition: border 0.15s; }
        .form-input:focus { border-color: #06b6d4; }
        .form-submit { background: #000000; color: #fff; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s; }
        .form-submit:hover { background: #333; }
        .cancel-btn { background: #f3f4f6; color: #374151; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .cancel-btn:hover { background: #e5e7eb; }

        .edit-form { width: 100%; background: #f0f4ff; border: 2px solid #06b6d4; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .edit-label { font-size: 11px; font-weight: 700; color: #0891b2; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7280; cursor: pointer; }

        /* POSTS */
        .post-card { padding: 18px 24px; border-bottom: 1px solid #f3f4f6; }
        .post-card:last-child { border-bottom: none; }
        .post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .post-avatar { width: 36px; height: 36px; border-radius: 50%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .post-author { font-size: 13px; font-weight: 600; color: #1a1a2e; }
        .post-meta { font-size: 11px; color: #9ca3af; margin-top: 1px; }
        .post-title-text { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
        .post-content { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 12px; }
        .post-actions { display: flex; align-items: center; gap: 12px; }
        .post-action-btn { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #9ca3af; cursor: pointer; background: none; border: none; font-family: 'Inter', sans-serif; padding: 5px 10px; border-radius: 6px; transition: all 0.15s; }
        .post-action-btn:hover { background: #f3f4f6; color: #1a1a2e; }
        .post-action-btn.leader { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .post-action-btn.leader:hover { background: #fde68a; }

        .reply-form { margin-top: 12px; background: #fffbeb; border: 2px solid #fde68a; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
        .reply-label { font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em; }
        .reply-input { width: 100%; background: #fff; border: 2px solid #fde68a; border-radius: 8px; padding: 10px 14px; font-size: 14px; color: #1a1a2e; font-family: 'Inter', sans-serif; outline: none; resize: none; }
        .reply-input:focus { border-color: #f59e0b; }
        .reply-submit { background: #f59e0b; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; align-self: flex-end; }
        .reply-submit:hover { background: #d97706; }
        .reply-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .empty { padding: 48px 24px; text-align: center; color: #9ca3af; font-size: 15px; }
        .empty-icon { font-size: 32px; margin-bottom: 8px; }

        @media (max-width: 640px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
          .navbar { padding: 0 20px; }
          .main { padding: 24px 16px; }
        }
      `}</style>

      <nav className="navbar">
        <div className="nav-left">
          <button className="back-btn" onClick={() => router.push('/leader')}>← Back</button>
          <img src="/logo.png" alt="Logo" className="nav-logo" />
        </div>
        <div className="nav-right">
          <span className="nav-badge">👑 {org?.name}</span>
          <button onClick={handleLogout} className="signout-btn">Sign out</button>
        </div>
      </nav>

      <div className="main">
        <div className="page-sub">Manage your organization, budgets, and events</div>

        <div className="stats">
          <div className="stat-card"><div className="stat-label">Total Proposals</div><div className="stat-value">{proposals.length}</div></div>
          <div className="stat-card"><div className="stat-label">Approved</div><div className="stat-value">{proposals.filter(p => p.status === 'approved').length}</div></div>
          <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value">{proposals.filter(p => p.status === 'pending').length}</div></div>
          <div className="stat-card"><div className="stat-label">Events</div><div className="stat-value">{events.length}</div></div>
        </div>

        <div className="tabs">
          {[
            { id: 'budget', label: '💰 Budget Proposals' },
            { id: 'events', label: '📅 Event Proposals' },
            { id: 'announcements', label: '📣 Announcements' },
            { id: 'community', label: `💬 Community${posts.length > 0 ? ` (${posts.length})` : ''}` },
            { id: 'calendar', label: '📆 Calendar' },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* BUDGET TAB */}
        {activeTab === 'budget' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Budget Proposals</div>
              <button className="new-btn" onClick={() => setShowBudgetForm(!showBudgetForm)}>+ New Proposal</button>
            </div>
            {showBudgetForm && (
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <form onSubmit={submitBudgetProposal} className="form-box" style={{ margin: 0 }}>
                  <input className="form-input" placeholder="Proposal title" value={title} onChange={e => setTitle(e.target.value)} required />
                  <input className="form-input" type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} required />
                  <textarea className="form-input" placeholder="Description — what is this budget for?" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
                  <button type="submit" className="form-submit">Submit Proposal</button>
                </form>
              </div>
            )}
            {proposals.length === 0 ? (
              <div className="empty"><div className="empty-icon">💰</div>No proposals yet</div>
            ) : proposals.map(proposal => (
              <div key={proposal.id} className="list-row">
                <div style={{ flex: 1 }}>
                  <div className="row-title">{proposal.title}</div>
                  <div className="row-sub">${proposal.amount} · {proposal.description}</div>
                </div>
                <div className="row-actions">
                  <span className={`amount-badge-${proposal.status === 'denied' ? 'red' : proposal.status === 'approved' ? 'green' : 'yellow'}`}>${proposal.amount}</span>
                  <span className={`badge ${statusBadge(proposal.status)}`}>{proposal.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Event Proposals</div>
              <button className="new-btn" onClick={() => setShowEventForm(!showEventForm)}>+ New Event</button>
            </div>
            {showEventForm && (
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <form onSubmit={submitEventProposal} className="form-box" style={{ margin: 0 }}>
                  <input className="form-input" placeholder="Event title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required />
                  <textarea className="form-input" placeholder="Description" value={eventDescription} onChange={e => setEventDescription(e.target.value)} rows={2} />
                  <input className="form-input" placeholder="Location" value={eventLocation} onChange={e => setEventLocation(e.target.value)} required />
                  <input className="form-input" type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                  <label className="checkbox-label">
                    <input type="checkbox" checked={requiresPayment} onChange={e => setRequiresPayment(e.target.checked)} />
                    Requires payment
                  </label>
                  {requiresPayment && (
                    <input className="form-input" type="number" placeholder="Price ($)" value={eventPrice} onChange={e => setEventPrice(e.target.value)} required />
                  )}
                  <button type="submit" className="form-submit">Submit Event Proposal</button>
                </form>
              </div>
            )}
            {events.length === 0 ? (
              <div className="empty"><div className="empty-icon">📅</div>No events yet</div>
            ) : events.map(event => (
              <div key={event.id} className="list-row">
                <div style={{ flex: 1 }}>
                  <div className="row-title">{event.title}</div>
                  <div className="row-sub">📍 {event.location} · {new Date(event.date).toLocaleDateString()}</div>
                  <div className="row-sub" style={{ marginTop: '2px' }}>{event.description}</div>
                </div>
                <span className={`badge ${statusBadge(event.status)}`}>{event.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Announcements</div>
              <button className="new-btn" onClick={() => { setShowAnnouncementForm(!showAnnouncementForm); setEditingId(null) }}>+ New Announcement</button>
            </div>
            {showAnnouncementForm && (
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <form onSubmit={submitAnnouncement} className="form-box" style={{ margin: 0 }}>
                  <input className="form-input" placeholder="Announcement title" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} required />
                  <textarea className="form-input" placeholder="Write your message to members..." value={announcementMessage} onChange={e => setAnnouncementMessage(e.target.value)} rows={4} required />
                  <button type="submit" className="form-submit">Send Announcement</button>
                </form>
              </div>
            )}
            {announcements.length === 0 ? (
              <div className="empty"><div className="empty-icon">📣</div>No announcements yet</div>
            ) : announcements.map(a => (
              <div key={a.id} className="list-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                {editingId === a.id ? (
                  <div className="edit-form">
                    <div className="edit-label">✏️ Editing announcement</div>
                    <div><div className="edit-label">Title</div><input className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
                    <div><div className="edit-label">Message</div><textarea className="form-input" value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={4} /></div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="form-submit" style={{ flex: 1 }} onClick={() => saveEdit(a.id)}>Save changes</button>
                      <button className="cancel-btn" style={{ flex: 1 }} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                      <div className="row-title">{a.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="row-sub">{new Date(a.created_at).toLocaleDateString()}</span>
                        <button onClick={() => { setEditingId(a.id); setEditTitle(a.title); setEditMessage(a.message); setShowAnnouncementForm(false) }} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '7px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                        <button onClick={async () => { if (confirm('Delete this announcement?')) { await supabase.from('announcements').delete().eq('id', a.id); fetchData() } }} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '7px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                    <div className="row-sub" style={{ fontSize: '13px', lineHeight: '1.5' }}>{a.message}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* COMMUNITY TAB */}
        {activeTab === 'community' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">💬 Community Feed</div>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Reply to member posts as leader</span>
            </div>
            {posts.length === 0 ? (
              <div className="empty"><div className="empty-icon">💬</div>No posts yet from members</div>
            ) : posts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-avatar">{getInitials(post.author_name)}</div>
                  <div>
                    <div className="post-author">{post.author_name}</div>
                    <div className="post-meta">{timeAgo(post.created_at)}</div>
                  </div>
                </div>
                <div className="post-title-text">{post.title}</div>
                <div className="post-content">{post.content}</div>
                <div className="post-actions">
                  <button className="post-action-btn">👍 {post.likes || 0}</button>
                  <button className="post-action-btn">👎 {post.downvotes || 0}</button>
                  <button
                    className="post-action-btn leader"
                    onClick={() => setReplyingTo(replyingTo?.id === post.id ? null : post)}
                  >
                    👑 Reply as Leader
                  </button>
                </div>
                {replyingTo?.id === post.id && (
                  <form onSubmit={submitReply} className="reply-form">
                    <div className="reply-label">👑 Official Leader Reply</div>
                    <textarea
                      className="reply-input"
                      placeholder="Write your official reply to this post..."
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      rows={3}
                      required
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" className="cancel-btn" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => setReplyingTo(null)}>Cancel</button>
                      <button type="submit" className="reply-submit" disabled={replyLoading}>
                        {replyLoading ? 'Sending...' : '👑 Send Reply'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div className="content-card">
            <div className="content-head"><div className="content-title">Campus Calendar</div></div>
            <div style={{ padding: '24px' }}><Calendar /></div>
          </div>
        )}
      </div>
    </>
  )
}