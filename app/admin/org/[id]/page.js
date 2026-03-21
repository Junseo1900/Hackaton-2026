'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OrgDetail({ params }) {
  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [proposals, setProposals] = useState([])
  const [events, setEvents] = useState([])
  const [activeTab, setActiveTab] = useState('members')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const id = (await params).id

    const { data: orgData } = await supabase
      .from('orgs')
      .select('*')
      .eq('id', id)
      .single()

    const { data: membersData } = await supabase
      .from('org_members')
      .select('*, profiles(full_name, email, role)')
      .eq('org_id', id)

    const { data: proposalsData } = await supabase
      .from('proposals')
      .select('*')
      .eq('org_id', id)
      .order('created_at', { ascending: false })

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('org_id', id)
      .order('created_at', { ascending: false })

    setOrg(orgData)
    setMembers(membersData || [])
    setProposals(proposalsData || [])
    setEvents(eventsData || [])
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
    if (status === 'approved') return 'bg-green-100 text-green-700'
    if (status === 'denied') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-gray-400 hover:text-black"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold">{org?.name}</h1>
            <p className="text-sm text-gray-500">{org?.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Members</p>
            <p className="text-3xl font-bold mt-1">{members.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Total Proposals</p>
            <p className="text-3xl font-bold mt-1">{proposals.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-3xl font-bold mt-1 text-yellow-500">
              {proposals.filter(p => p.status === 'pending').length + events.filter(e => e.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">Total Events</p>
            <p className="text-3xl font-bold mt-1">{events.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'members' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'budgets' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Budget Proposals
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'events' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Event Proposals
          </button>
          <button
            onClick={() => setActiveTab('finances')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'finances' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Financial Audit
          </button>
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Member List</h2>
            {members.length === 0 ? (
              <p className="text-gray-400 text-sm">No members yet</p>
            ) : (
              <div className="divide-y">
                {members.map(m => (
                  <div key={m.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.profiles?.full_name}</p>
                      <p className="text-sm text-gray-400">{m.profiles?.email}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                      {m.profiles?.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Budget Proposals Tab */}
        {activeTab === 'budgets' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Budget Proposals</h2>
            {proposals.length === 0 ? (
              <p className="text-gray-400 text-sm">No budget proposals yet</p>
            ) : (
              <div className="divide-y">
                {proposals.map(proposal => (
                  <div key={proposal.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{proposal.title}</p>
                      <p className="text-sm text-gray-500">${proposal.amount} · {proposal.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {proposal.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleProposal(proposal.id, 'approved')}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProposal(proposal.id, 'denied')}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
                          >
                            Deny
                          </button>
                        </>
                      ) : (
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusBadge(proposal.status)}`}>
                          {proposal.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Event Proposals Tab */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Event Proposals</h2>
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm">No event proposals yet</p>
            ) : (
              <div className="divide-y">
                {events.map(event => (
                  <div key={event.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">{event.location} · {new Date(event.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">{event.description}</p>
                      {event.requires_payment && (
                        <p className="text-sm text-blue-500">Paid event · ${event.price}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {event.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleEvent(event.id, 'approved')}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleEvent(event.id, 'denied')}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
                          >
                            Deny
                          </button>
                        </>
                      ) : (
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusBadge(event.status)}`}>
                          {event.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Financial Audit Tab */}
        {activeTab === 'finances' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Financial Audit</h2>
            <div className="divide-y">
              <div className="py-3 flex justify-between">
                <p className="text-sm text-gray-500">Total approved budget</p>
                <p className="font-bold text-green-600">
                  ${proposals.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="py-3 flex justify-between">
                <p className="text-sm text-gray-500">Total pending budget</p>
                <p className="font-bold text-yellow-600">
                  ${proposals.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="py-3 flex justify-between">
                <p className="text-sm text-gray-500">Total denied budget</p>
                <p className="font-bold text-red-600">
                  ${proposals.filter(p => p.status === 'denied').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="py-3 flex justify-between">
                <p className="text-sm text-gray-500">Total proposals submitted</p>
                <p className="font-bold">{proposals.length}</p>
              </div>
            </div>

            <h3 className="font-bold mt-6 mb-3">Proposal History</h3>
            {proposals.length === 0 ? (
              <p className="text-gray-400 text-sm">No proposals yet</p>
            ) : (
              <div className="divide-y">
                {proposals.map(p => (
                  <div key={p.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold">${p.amount}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(p.status)}`}>
                        {p.status}
                      </span>
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