'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Calendar from '@/app/components/Calendar'

const MapInner = dynamic(() => import('@/app/components/MapInner'), { ssr: false })

export default function MemberDashboard() {
  const [orgs, setOrgs] = useState([])
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  // Location modal
  const [locationModal, setLocationModal] = useState(null)
  const [geocoding, setGeocoding] = useState(false)

  // Payment modal
  const [paymentModal, setPaymentModal] = useState(null)
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCVV, setCardCVV] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Community post form
  const [showPostForm, setShowPostForm] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postOrg, setPostOrg] = useState('')
  const [postLoading, setPostLoading] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)

  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    const { data: memberOrgs } = await supabase
      .from('org_members')
      .select('*, orgs(name, description)')
      .eq('member_id', user.id)

    const { data: eventsData } = await supabase
      .from('events')
      .select('*, orgs(name)')
      .eq('status', 'approved')
      .order('date', { ascending: true })

    const orgIds = (memberOrgs || []).map(o => o.org_id)

    let announcementsData = []
    if (orgIds.length > 0) {
      const { data } = await supabase
        .from('announcements')
        .select('*, orgs(name)')
        .in('org_id', orgIds)
        .order('created_at', { ascending: false })
      announcementsData = data || []
    }

    // Fetch community posts
    let postsData = []
    if (orgIds.length > 0) {
      const { data } = await supabase
        .from('posts')
        .select('*, orgs(name)')
        .in('org_id', orgIds)
        .order('created_at', { ascending: false })
      postsData = data || []
    }

    setOrgs(memberOrgs || [])
    setEvents(eventsData || [])
    setAnnouncements(announcementsData)
    setPosts(postsData)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Location map
  const openLocationMap = async (address) => {
    setGeocoding(true)
    setLocationModal({ address, lat: null, lng: null })
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
      const data = await res.json()
      if (data[0]) setLocationModal({ address, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
    } catch {}
    setGeocoding(false)
  }

  // Payment
  const openPayment = (event) => {
    setPaymentModal(event)
    setPaymentSuccess(false)
    setCardName(''); setCardNumber(''); setCardExpiry(''); setCardCVV('')
  }

  const formatCardNumber = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = (val) => { const c = val.replace(/\D/g, '').slice(0, 4); return c.length >= 3 ? c.slice(0, 2) + '/' + c.slice(2) : c }

  const handlePay = async (e) => {
    e.preventDefault()
    setPaymentLoading(true)
    await new Promise(r => setTimeout(r, 1800))
    setPaymentLoading(false)
    setPaymentSuccess(true)
  }

  // Community posts
  const submitPost = async (e) => {
    e.preventDefault()
    if (!postTitle || !postContent || !postOrg) return
    setPostLoading(true)
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', currentUser.id).single()
    await supabase.from('posts').insert({
      org_id: postOrg,
      user_id: currentUser.id,
      author_name: profile?.full_name || currentUser.email,
      title: postTitle,
      content: postContent,
      likes: 0,
    })
    setPostTitle(''); setPostContent(''); setPostOrg('')
    setShowPostForm(false)
    setPostLoading(false)
    fetchData()
  }

  const likePost = async (post) => {
    await supabase.from('posts').update({ likes: (post.likes || 0) + 1 }).eq('id', post.id)
    fetchData()
  }

  const deletePost = async (postId) => {
    if (confirm('Delete this post?')) {
      await supabase.from('posts').delete().eq('id', postId)
      fetchData()
    }
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date)
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
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

        .navbar { background: #fff; border-bottom: 2px solid #e5e7eb; padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
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
        .stat-value.green { color: #000000; }
        .stat-value.blue { color: #000000; }
        .stat-value.cyan { color: #000000; }

        .tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .tab-btn { padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: 2px solid #e5e7eb; background: #ffffff; color: #6b7280; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .tab-btn:hover { border-color: #000000; color: #000000; }
        .tab-btn.active { background: #ffffff; color: #111113; border-color: #111113; }

        .content-card { background: #fff; border-radius: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); border: 2px solid #e5e7eb; overflow: hidden; margin-bottom: 20px; }
        .content-head { padding: 20px 24px; border-bottom: 2px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
        .content-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }

        .list-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #f3f4f6; transition: background 0.1s; gap: 16px; }
        .list-row:last-child { border-bottom: none; }
        .list-row:hover { background: #f9fafb; }

        .row-title { font-size: 15px; font-weight: 600; color: #1a1a2e; margin-bottom: 3px; }
        .row-sub { font-size: 13px; color: #9ca3af; }

        .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; white-space: nowrap; }
        .badge-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .badge-blue { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

        .pay-btn { background: #000000; color: #ffffff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; white-space: nowrap; }
        .pay-btn:hover { background: #333; }

        .org-tag { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; display: inline-block; margin-bottom: 4px; }

        .location-link { font-size: 13px; color: #2563eb; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; text-decoration: underline; text-underline-offset: 2px; transition: color 0.15s; }
        .location-link:hover { color: #1d4ed8; }

        .empty { padding: 48px 24px; text-align: center; color: #9ca3af; font-size: 15px; }
        .empty-icon { font-size: 32px; margin-bottom: 8px; }

        /* ── COMMUNITY FEED ── */
        .new-btn { background: #000000; color: #ffffff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .new-btn:hover { background: #333; }

        .post-form { padding: 20px 24px; border-bottom: 2px solid #f3f4f6; background: #fafafa; display: flex; flex-direction: column; gap: 10px; }
        .post-input { width: 100%; background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; font-size: 14px; color: #1a1a2e; font-family: 'Inter', sans-serif; outline: none; transition: border 0.15s; }
        .post-input:focus { border-color: #000; }
        .post-input::placeholder { color: #c0c4cc; }
        .post-submit { background: #000; color: #fff; border: none; border-radius: 8px; padding: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s; }
        .post-submit:hover { background: #333; }
        .post-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* POST CARD */
        .post-card { padding: 18px 24px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.15s; }
        .post-card:last-child { border-bottom: none; }
        .post-card:hover { background: #f9fafb; }

        .post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .post-avatar { width: 36px; height: 36px; border-radius: 50%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .post-author { font-size: 13px; font-weight: 600; color: #1a1a2e; }
        .post-meta { font-size: 11px; color: #9ca3af; margin-top: 1px; display: flex; align-items: center; gap: 6px; }
        .post-org-tag { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px; background: #f0f4ff; color: #2563eb; border: 1px solid #bfdbfe; }

        .post-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; line-height: 1.4; }
        .post-content { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

        .post-actions { display: flex; align-items: center; gap: 12px; }
        .post-action-btn { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #9ca3af; cursor: pointer; background: none; border: none; font-family: 'Inter', sans-serif; padding: 5px 10px; border-radius: 6px; transition: all 0.15s; }
        .post-action-btn:hover { background: #f3f4f6; color: #1a1a2e; }
        .post-action-btn.liked { color: #dc2626; }
        .post-action-btn.delete { color: #dc2626; }
        .post-action-btn.delete:hover { background: #fef2f2; }

        /* POST DETAIL MODAL */
        .post-detail-content { font-size: 14px; color: #374151; line-height: 1.8; white-space: pre-wrap; }

        /* MODALS */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-box { background: #fff; border-radius: 18px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 40px rgba(0,0,0,0.15); }
        .modal-head { padding: 18px 22px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-size: 16px; font-weight: 700; color: #1a1a2e; }
        .modal-close { background: #f3f4f6; border: none; border-radius: 6px; padding: 6px 10px; font-size: 14px; cursor: pointer; font-weight: 600; color: #374151; }
        .modal-close:hover { background: #e5e7eb; }
        .modal-body { padding: 20px 22px; }

        .map-wrap { border-radius: 10px; overflow: hidden; border: 2px solid #e5e7eb; height: 320px; }
        .map-address { font-size: 13px; color: #374151; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; margin-top: 12px; line-height: 1.5; }

        .pay-field { margin-bottom: 16px; }
        .pay-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .pay-input { width: 100%; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; font-size: 15px; color: #1a1a2e; font-family: 'Inter', sans-serif; outline: none; transition: border 0.15s; }
        .pay-input:focus { border-color: #000; }
        .pay-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pay-btn-full { width: 100%; background: #000; color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s; margin-top: 8px; }
        .pay-btn-full:hover:not(:disabled) { background: #333; }
        .pay-btn-full:disabled { opacity: 0.5; cursor: not-allowed; }
        .event-summary { background: #f0f4ff; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; }
        .event-summary-name { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
        .event-summary-detail { font-size: 13px; color: #6b7280; }
        .event-summary-price { font-size: 24px; font-weight: 800; color: #000; margin-top: 8px; }
        .success-wrap { text-align: center; padding: 24px 0; }
        .success-icon { font-size: 48px; margin-bottom: 12px; }
        .success-title { font-size: 20px; font-weight: 800; color: #16a34a; margin-bottom: 6px; }
        .success-sub { font-size: 14px; color: #6b7280; }
        .card-input-wrap { position: relative; }
        .card-brand { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 20px; }

        @media (max-width: 640px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
          .navbar { padding: 0 20px; }
          .main { padding: 24px 16px; }
          .pay-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Two Delta" className="nav-logo" />
        <div className="nav-right">
          <span className="nav-badge">🙂 Student Portal</span>
          <button onClick={handleLogout} className="signout-btn">Sign out</button>
        </div>
      </nav>

      <div className="main">
        <div className="page-sub">Welcome back! Here's what's happening.</div>

        {/* STATS */}
        <div className="stats">
          <div className="stat-card"><div className="stat-label">My Organizations</div><div className="stat-value">{orgs.length}</div></div>
          <div className="stat-card"><div className="stat-label">Upcoming Events</div><div className="stat-value blue">{events.length}</div></div>
          <div className="stat-card"><div className="stat-label">Announcements</div><div className="stat-value green">{announcements.length}</div></div>
          <div className="stat-card"><div className="stat-label">Community Posts</div><div className="stat-value cyan">{posts.length}</div></div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {[
            { id: 'home', label: '🏠 Home' },
            { id: 'community', label: `💬 Community${posts.length > 0 ? ` (${posts.length})` : ''}` },
            { id: 'announcements', label: `📣 Announcements${announcements.length > 0 ? ` (${announcements.length})` : ''}` },
            { id: 'calendar', label: '📆 Calendar' },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            <div className="content-card">
              <div className="content-head">
                <div className="content-title">My Organizations</div>
                <span className="badge badge-blue">{orgs.length} orgs</span>
              </div>
              {orgs.length === 0 ? (
                <div className="empty"><div className="empty-icon">🏛</div>You haven't joined any orgs yet</div>
              ) : orgs.map(o => (
                <div key={o.id} className="list-row">
                  <div>
                    <div className="row-title">{o.orgs?.name}</div>
                    <div className="row-sub">{o.orgs?.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="content-card">
              <div className="content-head">
                <div className="content-title">Upcoming Events</div>
                <span className="badge badge-green">{events.length} events</span>
              </div>
              {events.length === 0 ? (
                <div className="empty"><div className="empty-icon">📅</div>No upcoming events</div>
              ) : events.map(event => (
                <div key={event.id} className="list-row">
                  <div style={{ flex: 1 }}>
                    <div className="row-title">{event.title}</div>
                    <div className="row-sub">🏛 {event.orgs?.name}</div>
                    <div className="location-link" onClick={() => openLocationMap(event.location)}>📍 {event.location}</div>
                    <div className="row-sub" style={{ marginTop: '2px' }}>📅 {new Date(event.date).toLocaleDateString()}</div>
                  </div>
                  {event.requires_payment ? (
                    <button className="pay-btn" onClick={() => openPayment(event)}>Pay ${event.price}</button>
                  ) : (
                    <span className="badge badge-green">Free</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* COMMUNITY TAB */}
        {activeTab === 'community' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">💬 Community Feed</div>
              <button className="new-btn" onClick={() => setShowPostForm(!showPostForm)}>
                {showPostForm ? 'Cancel' : '+ New Post'}
              </button>
            </div>

            {/* POST FORM */}
            {showPostForm && (
              <form onSubmit={submitPost} className="post-form">
                <select className="post-input" value={postOrg} onChange={e => setPostOrg(e.target.value)} required>
                  <option value="">Select organization...</option>
                  {orgs.map(o => <option key={o.org_id} value={o.org_id}>{o.orgs?.name}</option>)}
                </select>
                <input
                  className="post-input"
                  placeholder="Post title..."
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  required
                />
                <textarea
                  className="post-input"
                  placeholder="Share your story, feedback, or message to your org leader..."
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  rows={4}
                  required
                />
                <button type="submit" className="post-submit" disabled={postLoading}>
                  {postLoading ? 'Posting...' : '📤 Share Post'}
                </button>
              </form>
            )}

            {/* POSTS LIST */}
            {posts.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">💬</div>
                No posts yet — be the first to share!
              </div>
            ) : posts.map(post => (
              <div key={post.id} className="post-card" onClick={() => setSelectedPost(post)}>
                <div className="post-header">
                  <div className="post-avatar">{getInitials(post.author_name)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="post-author">{post.author_name}</div>
                    <div className="post-meta">
                      <span>{timeAgo(post.created_at)}</span>
                      {post.orgs?.name && <span className="post-org-tag">{post.orgs.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="post-title">{post.title}</div>
                <div className="post-content">{post.content}</div>
                <div className="post-actions" onClick={e => e.stopPropagation()}>
                  <button className="post-action-btn" onClick={() => likePost(post)}>
                    ❤️ {post.likes || 0}
                  </button>
                  <button className="post-action-btn" onClick={() => setSelectedPost(post)}>
                    💬 Read more
                  </button>
                  {post.user_id === currentUser?.id && (
                    <button className="post-action-btn delete" onClick={() => deletePost(post.id)}>
                      🗑 Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="content-card">
            <div className="content-head">
              <div className="content-title">Announcements</div>
              <span className="badge badge-blue">{announcements.length} total</span>
            </div>
            {announcements.length === 0 ? (
              <div className="empty"><div className="empty-icon">📣</div>No announcements yet</div>
            ) : announcements.map(a => (
              <div key={a.id} className="list-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                  <div className="row-title">{a.title}</div>
                  <span className="row-sub">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <span className="org-tag">{a.orgs?.name}</span>
                <div className="row-sub" style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '4px' }}>{a.message}</div>
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

      {/* POST DETAIL MODAL */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{selectedPost.title}</div>
              <button className="modal-close" onClick={() => setSelectedPost(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="post-header" style={{ marginBottom: '16px' }}>
                <div className="post-avatar">{getInitials(selectedPost.author_name)}</div>
                <div>
                  <div className="post-author">{selectedPost.author_name}</div>
                  <div className="post-meta">
                    <span>{timeAgo(selectedPost.created_at)}</span>
                    {selectedPost.orgs?.name && <span className="post-org-tag">{selectedPost.orgs.name}</span>}
                  </div>
                </div>
              </div>
              <div className="post-detail-content">{selectedPost.content}</div>
              <div className="post-actions" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                <button className="post-action-btn" onClick={() => { likePost(selectedPost); setSelectedPost(null) }}>
                  ❤️ {selectedPost.likes || 0} likes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION MAP MODAL */}
      {locationModal && (
        <div className="modal-overlay" onClick={() => setLocationModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">📍 Event Location</div>
              <button className="modal-close" onClick={() => setLocationModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {geocoding ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading map...</div>
              ) : locationModal.lat ? (
                <div className="map-wrap">
                  <MapInner center={[locationModal.lat, locationModal.lng]} marker={[locationModal.lat, locationModal.lng]} onMapClick={() => {}} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Could not find location on map</div>
              )}
              <div className="map-address">📍 {locationModal.address}</div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">💳 Payment</div>
              <button className="modal-close" onClick={() => setPaymentModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {paymentSuccess ? (
                <div className="success-wrap">
                  <div className="success-icon">🎉</div>
                  <div className="success-title">Payment Successful!</div>
                  <div className="success-sub">You're registered for {paymentModal.title}</div>
                  <button className="pay-btn-full" style={{ marginTop: '20px' }} onClick={() => setPaymentModal(null)}>Done</button>
                </div>
              ) : (
                <>
                  <div className="event-summary">
                    <div className="event-summary-name">{paymentModal.title}</div>
                    <div className="event-summary-detail">📅 {new Date(paymentModal.date).toLocaleDateString()} · 📍 {paymentModal.location}</div>
                    <div className="event-summary-price">${paymentModal.price}</div>
                  </div>
                  <form onSubmit={handlePay}>
                    <div className="pay-field">
                      <label className="pay-label">Name on card</label>
                      <input className="pay-input" placeholder="John Smith" value={cardName} onChange={e => setCardName(e.target.value)} required />
                    </div>
                    <div className="pay-field">
                      <label className="pay-label">Card number</label>
                      <div className="card-input-wrap">
                        <input className="pay-input" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} required />
                        <span className="card-brand">💳</span>
                      </div>
                    </div>
                    <div className="pay-row">
                      <div className="pay-field">
                        <label className="pay-label">Expiry</label>
                        <input className="pay-input" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} required />
                      </div>
                      <div className="pay-field">
                        <label className="pay-label">CVV</label>
                        <input className="pay-input" placeholder="123" value={cardCVV} onChange={e => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} required />
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>🔒 Your payment is secure and encrypted</div>
                    <button type="submit" className="pay-btn-full" disabled={paymentLoading}>
                      {paymentLoading ? 'Processing...' : `Pay $${paymentModal.price}`}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}