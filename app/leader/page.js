'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LeaderDashboard() {
  const [proposals, setProposals] = useState([])
  const [org, setOrg] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
      setProposals(proposalsData || [])
    }
    setLoading(false)
  }

  const submitProposal = async (e) => {
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
    setShowForm(false)
    fetchData()
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
          <p className="text-sm text-gray-500">{org?.name || 'Org Leader Portal'}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-black">
          Sign out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {!org ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-500">You don't have an org yet. Ask an admin to create one for you.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">Total Proposals</p>
                <p className="text-4xl font-bold mt-1">{proposals.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">Approved</p>
                <p className="text-4xl font-bold mt-1 text-green-500">{proposals.filter(p => p.status === 'approved').length}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-4xl font-bold mt-1 text-yellow-500">{proposals.filter(p => p.status === 'pending').length}</p>
              </div>
            </div>

            {/* Submit Proposal */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Budget Proposals</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
                >
                  + New Proposal
                </button>
              </div>

              {showForm && (
                <form onSubmit={submitProposal} className="flex flex-col gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
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
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    rows={3}
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
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        proposal.status === 'approved' ? 'bg-green-100 text-green-700' :
                        proposal.status === 'denied' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}