'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Calendar from '@/app/components/Calendar'

export default function MemberDashboard() {
  const [orgs, setOrgs] = useState([])
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [activeTab, setActiveTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: memberOrgs } = await supabase
      .from('org_members')
      .select('*, orgs(name, description)')
      .eq('member_id', user.id)

    const { data: eventsData } = await supabase
      .from('events')
      .select('*, orgs(name)')
      .eq('status', 'approved')
      .order('date', { ascending: true })

    // Get org ids the member belongs to
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

    setOrgs(memberOrgs || [])
    setEvents(eventsData || [])
    setAnnouncements(announcementsData)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">OrgBridge</h1>
          <p className="text-sm text-gray-500">Student Portal</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-black">
          Sign out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'home' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'announcements' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Announcements {announcements.length > 0 && `(${announcements.length})`}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'calendar' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Calendar
          </button>
        </div>

        {/* Home Tab */}
        {activeTab === 'home' && (
          <>
            {/* My Orgs */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">My Organizations</h2>
              {orgs.length === 0 ? (
                <p className="text-gray-400 text-sm">You haven't joined any orgs yet</p>
              ) : (
                <div className="divide-y">
                  {orgs.map(o => (
                    <div key={o.id} className="py-3">
                      <p className="font-medium">{o.orgs?.name}</p>
                      <p className="text-sm text-gray-500">{o.orgs?.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Upcoming Events</h2>
              {events.length === 0 ? (
                <p className="text-gray-400 text-sm">No upcoming events</p>
              ) : (
                <div className="divide-y">
                  {events.map(event => (
                    <div key={event.id} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.orgs?.name} · {event.location}</p>
                        <p className="text-sm text-gray-400">{new Date(event.date).toLocaleDateString()}</p>
                      </div>
                      {event.requires_payment && (
                        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
                          Pay ${event.price}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Announcements</h2>
            {announcements.length === 0 ? (
              <p className="text-gray-400 text-sm">No announcements yet</p>
            ) : (
              <div className="divide-y">
                {announcements.map(a => (
                  <div key={a.id} className="py-4">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="text-xs text-blue-500 mb-1">{a.orgs?.name}</p>
                    <p className="text-sm text-gray-500">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <Calendar />
        )}

      </div>
    </div>
  )
}