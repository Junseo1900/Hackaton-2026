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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">OrgBridge</h1>
          <p className="text-sm text-gray-500">University Admin Portal</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-black">Sign out</button>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Total Orgs</p>
            <p className="text-3xl font-bold mt-1">{orgs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Pending Budgets</p>
            <p className="text-3xl font-bold mt-1 text-yellow-500">{proposals.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Pending Events</p>
            <p className="text-3xl font-bold mt-1 text-yellow-500">{events.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Total Pending</p>
            <p className="text-3xl font-bold mt-1 text-red-500">{proposals.length + events.length}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'overview' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Org Directory
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'budgets' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Budget Proposals {proposals.length > 0 && `(${proposals.length})`}
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'events' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Event Proposals {events.length > 0 && `(${events.length})`}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Student Organizations</h2>
            {orgs.length === 0 ? (
              <p className="text-gray-400 text-sm">No organizations yet</p>
            ) : (
              <div className="divide-y">
                {orgs.map(org => (
                  <div
                    key={org.id}
                    onClick={() => router.push(`/admin/org/${org.id}`)}
                    className="py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition"
                  >
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-gray-400">{org.description}</p>
                    </div>
                    <span className="text-gray-400 text-sm">View →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Pending Budget Proposals</h2>
            {proposals.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending budget proposals</p>
            ) : (
              <div className="divide-y">
                {proposals.map(proposal => (
                  <div key={proposal.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{proposal.title}</p>
                      <p className="text-sm text-gray-500">{proposal.orgs?.name} · ${proposal.amount}</p>
                      <p className="text-sm text-gray-400">{proposal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Pending Event Proposals</h2>
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending event proposals</p>
            ) : (
              <div className="divide-y">
                {events.map(event => (
                  <div key={event.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">{event.orgs?.name} · {event.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}