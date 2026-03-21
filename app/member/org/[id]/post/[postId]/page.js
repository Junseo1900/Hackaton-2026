'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PostDetail({ params }) {
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState(null)
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { postId, id } = await params
    setOrgId(id)

    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
    setUserProfile(profile)

    const { data: postData } = await supabase.from('posts').select('*, orgs(name)').eq('id', postId).single()
    const { data: commentsData } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true })

    setPost(postData)
    setComments(commentsData || [])
    setLoading(false)
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)

    const { postId } = await params
    const isLeader = userProfile?.role === 'org_leader'

    await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUser.id,
      author_name: userProfile?.full_name || currentUser.email,
      content: comment,
      is_leader_reply: isLeader
    })

    setComment('')
    setSubmitting(false)
    fetchData()
  }

  const handleVote = async (type) => {
    const field = type === 'up' ? 'likes' : 'downvotes'
    await supabase.from('posts').update({ [field]: (post[field] || 0) + 1 }).eq('id', post.id)
    fetchData()
  }

  const deleteComment = async (commentId) => {
    if (confirm('Delete this comment?')) {
      await supabase.from('comments').delete().eq('id', commentId)
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

        .navbar { background: #fff; border-bottom: 2px solid #e5e7eb; padding: 0 40px; height: 64px; display: flex; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 100; }
        .back-btn { background: #f3f4f6; border: none; border-radius: 8px; padding: 7px 14px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .back-btn:hover { background: #e5e7eb; }
        .nav-logo { height: 36px; width: auto; }

        .main { max-width: 720px; margin: 0 auto; padding: 36px 24px; }

        /* POST */
        .post-card { background: #fff; border-radius: 18px; border: 2px solid #e5e7eb; overflow: hidden; margin-bottom: 24px; }
        .post-body { padding: 24px; }
        .post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .post-avatar { width: 40px; height: 40px; border-radius: 50%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
        .post-author { font-size: 14px; font-weight: 700; color: #1a1a2e; }
        .post-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .post-title { font-size: 22px; font-weight: 800; color: #1a1a2e; margin-bottom: 12px; line-height: 1.3; }
        .post-content { font-size: 15px; color: #374151; line-height: 1.8; white-space: pre-wrap; }

        /* VOTE BAR */
        .vote-bar { padding: 14px 24px; border-top: 1px solid #f3f4f6; display: flex; align-items: center; gap: 12px; }
        .vote-btn { display: flex; align-items: center; gap: 6px; background: #f3f4f6; border: none; border-radius: 8px; padding: 8px 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .vote-btn.up:hover { background: #f0fdf4; color: #16a34a; }
        .vote-btn.down:hover { background: #fef2f2; color: #dc2626; }
        .vote-score { font-size: 16px; font-weight: 800; color: #1a1a2e; padding: 0 4px; }
        .comment-count { font-size: 13px; color: #9ca3af; margin-left: 8px; }

        /* COMMENTS */
        .comments-section { background: #fff; border-radius: 18px; border: 2px solid #e5e7eb; overflow: hidden; }
        .comments-head { padding: 18px 24px; border-bottom: 2px solid #f3f4f6; font-size: 16px; font-weight: 700; color: #1a1a2e; }

        .comment { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; }
        .comment:last-child { border-bottom: none; }
        .comment.leader { background: #fffbeb; border-left: 4px solid #f59e0b; }

        .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .comment-avatar { width: 32px; height: 32px; border-radius: 50%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .comment-avatar.leader { background: #f59e0b; }
        .comment-author { font-size: 13px; font-weight: 700; color: #1a1a2e; }
        .leader-badge { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; margin-left: 6px; }
        .comment-time { font-size: 11px; color: #9ca3af; margin-left: auto; }
        .comment-content { font-size: 14px; color: #374151; line-height: 1.6; }
        .comment-delete { background: none; border: none; font-size: 11px; color: #9ca3af; cursor: pointer; padding: 2px 6px; border-radius: 4px; margin-left: 8px; font-family: 'Inter', sans-serif; }
        .comment-delete:hover { background: #fef2f2; color: #dc2626; }

        /* COMMENT FORM */
        .comment-form { padding: 20px 24px; border-top: 2px solid #f3f4f6; display: flex; flex-direction: column; gap: 10px; }
        .comment-input { width: 100%; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; font-size: 14px; color: #1a1a2e; font-family: 'Inter', sans-serif; outline: none; transition: border 0.15s; resize: none; }
        .comment-input:focus { border-color: #000; background: #fff; }
        .comment-submit { background: #000; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; align-self: flex-end; transition: background 0.15s; }
        .comment-submit:hover:not(:disabled) { background: #333; }
        .comment-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .empty { padding: 32px 24px; text-align: center; color: #9ca3af; font-size: 14px; }

        @media (max-width: 640px) {
          .navbar { padding: 0 16px; }
          .main { padding: 20px 16px; }
        }
      `}</style>

      <nav className="navbar">
        <button className="back-btn" onClick={() => router.push(`/member/org/${orgId}`)}>← Back</button>
        <img src="/logo.png" alt="Logo" className="nav-logo" />
      </nav>

      <div className="main">
        {/* POST */}
        <div className="post-card">
          <div className="post-body">
            <div className="post-header">
              <div className="post-avatar">{getInitials(post?.author_name)}</div>
              <div>
                <div className="post-author">{post?.author_name}</div>
                <div className="post-meta">{timeAgo(post?.created_at)} · {post?.orgs?.name}</div>
              </div>
            </div>
            <div className="post-title">{post?.title}</div>
            <div className="post-content">{post?.content}</div>
          </div>
          <div className="vote-bar">
            <button className="vote-btn up" onClick={() => handleVote('up')}>👍 {post?.likes || 0}</button>
            <button className="vote-btn down" onClick={() => handleVote('down')}>👎 {post?.downvotes || 0}</button>
            <span className="comment-count">💬 {comments.length} comments</span>
          </div>
        </div>

        {/* COMMENTS */}
        <div className="comments-section">
          <div className="comments-head">💬 Comments ({comments.length})</div>

          {comments.length === 0 ? (
            <div className="empty">No comments yet — be the first to reply!</div>
          ) : comments.map(c => (
            <div key={c.id} className={`comment ${c.is_leader_reply ? 'leader' : ''}`}>
              <div className="comment-header">
                <div className={`comment-avatar ${c.is_leader_reply ? 'leader' : ''}`}>
                  {getInitials(c.author_name)}
                </div>
                <div className="comment-author">
                  {c.author_name}
                  {c.is_leader_reply && <span className="leader-badge">👑 Leader</span>}
                </div>
                <span className="comment-time">{timeAgo(c.created_at)}</span>
                {c.user_id === currentUser?.id && (
                  <button className="comment-delete" onClick={() => deleteComment(c.id)}>✕</button>
                )}
              </div>
              <div className="comment-content">{c.content}</div>
            </div>
          ))}

          {/* COMMENT FORM */}
          <form onSubmit={submitComment} className="comment-form">
            <textarea
              className="comment-input"
              placeholder={userProfile?.role === 'org_leader' ? '👑 Reply as org leader...' : 'Write a comment...'}
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              required
            />
            <button type="submit" className="comment-submit" disabled={submitting}>
              {submitting ? 'Posting...' : userProfile?.role === 'org_leader' ? '👑 Reply as Leader' : 'Post Comment'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}