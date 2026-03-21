'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LeaderDashboard() {
  const [proposals, setProposals] = useState([])
  const [events, setEvents] = useState([])
  const [org, setOrg] = useState(null)
  const [activeTab, setActiveTab] = useState('budget')
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Budget form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  // Event form state
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [eventPrice, setEventPrice] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: orgData } = await supabase
      .from('orgs')
      .select('*')
      .eq('leader_id', user.id)
      .single()

    setOrg(orgData)

    if (orgData) {
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('*')
        .eq('org_id', orgData.id)
        .order('created_at', { ascending: false })

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('org_id', orgData.id)
        .order('created_at', { ascending: false })

      setProposals(proposalsData || [])
      setEvents(eventsData || [])
    }
    setLoading(false)
  }

  const submitBudgetProposal = async (e) => {
    e.preventDefault()
    await supabase.from('proposals').insert({
      org_id: org.id,
      title,
      amount: parseFloat(amount),
      description,
      status: 'pending'
    })
    setTitle('')
    setAmount('')
    setDescription('')
    setShowBudgetForm(false)
    fetchData()
  }

  const submitEventProposal = async (e) => {
    e.preventDefault()
    await supabase.from('events').insert({
      org_id: org.id,
      title: eventTitle,
      description: eventDescription,
      date: eventDate,
      location: eventLocation,
      requires_payment: requiresPayment,
      price: requiresPayment ? parseFloat(eventPrice) : 0,
      status: 'pending'
    })
    setEventTitle('')
    setEventDescription('')
    setEventDate('')
    setEventLocation('')
    setRequiresPayment(false)
    setEventPrice('')
    setShowEventForm(false)
    fetchData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
        <div>
          <h1 className="text-xl font-bold">OrgBridge</h1>
          <p className="text-sm text-gray-500">{org?.name || 'Org Leader Portal'}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-black">Sign out</button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {!org ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-500">You don't have an org yet. Ask an admin to create one for you.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-sm">Total Proposals</p>
                <p className="text-3xl font-bold mt-1">{proposals.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-sm">Approved</p>
                <p className="text-3xl font-bold mt-1 text-green-500">{proposals.filter(p => p.status === 'approved').length}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-3xl font-bold mt-1 text-yellow-500">{proposals.filter(p => p.status === 'pending').length}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-sm">Events</p>
                <p className="text-3xl font-bold mt-1">{events.length}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('budget')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'budget' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                Budget Proposals
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'events' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              >
                Event Proposals
              </button>
            </div>

            {/* Budget Tab */}
            {activeTab === 'budget' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Budget Proposals</h2>
                  <button
                    onClick={() => setShowBudgetForm(!showBudgetForm)}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
                  >
                    + New Proposal
                  </button>
                </div>

                {showBudgetForm && (
                  <form onSubmit={submitBudgetProposal} className="flex flex-col gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                    <input
                      placeholder="Proposal title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <input
                      placeholder="Amount ($)"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <textarea
                      placeholder="Description — what is this budget for?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      rows={3}
                      required
                    />
                    <button type="submit" className="bg-black text-white py-2 rounded-lg text-sm hover:bg-gray-800">
                      Submit Proposal
                    </button>
                  </form>
                )}

                {proposals.length === 0 ? (
                  <p className="text-gray-400 text-sm">No proposals yet</p>
                ) : (
                  <div className="divide-y">
                    {proposals.map(proposal => (
                      <div key={proposal.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{proposal.title}</p>
                          <p className="text-sm text-gray-500">${proposal.amount} · {proposal.description}</p>
                        </div>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusBadge(proposal.status)}`}>
                          {proposal.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Event Proposals</h2>
                  <button
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
                  >
                    + New Event
                  </button>
                </div>

                {showEventForm && (
                  <form onSubmit={submitEventProposal} className="flex flex-col gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                    <input
                      placeholder="Event title"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <textarea
                      placeholder="Description"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      rows={2}
                    />
                    <input
                      placeholder="Location"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={requiresPayment}
                        onChange={(e) => setRequiresPayment(e.target.checked)}
                      />
                      Requires payment
                    </label>
                    {requiresPayment && (
                      <input
                        placeholder="Price ($)"
                        type="number"
                        value={eventPrice}
                        onChange={(e) => setEventPrice(e.target.value)}
                        className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    )}
                    <button type="submit" className="bg-black text-white py-2 rounded-lg text-sm hover:bg-gray-800">
                      Submit Event Proposal
                    </button>
                  </form>
                )}

                {events.length === 0 ? (
                  <p className="text-gray-400 text-sm">No events yet</p>
                ) : (
                  <div className="divide-y">
                    {events.map(event => (
                      <div key={event.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-500">{event.location} · {new Date(event.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-400">{event.description}</p>
                        </div>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusBadge(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}