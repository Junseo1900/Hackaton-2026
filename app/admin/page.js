'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [proposals, setProposals] = useState([])
  const [orgs, setOrgs] = useState([])
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

    const { data: orgsData } = await supabase
      .from('orgs')
      .select('*')

    setProposals(proposalsData || [])
    setOrgs(orgsData || [])
    setLoading(false)
  }

  const handleProposal = async (id, status) => {
    await supabase
      .from('proposals')
      .update({ status })
      .eq('id', id)
    fetchData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">OrgBridge</h1>
          <p className="text-sm text-gray-500">University Admin Portal</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-black">
          Sign out
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">Total Orgs</p>
            <p className="text-4xl font-bold mt-1">{orgs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">Pending Proposals</p>
            <p className="text-4xl font-bold mt-1">{proposals.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">Active This Semester</p>
            <p className="text-4xl font-bold mt-1">{orgs.length}</p>
          </div>
        </div>

        {/* Orgs List */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Student Organizations</h2>
          {orgs.length === 0 ? (
            <p className="text-gray-400 text-sm">No organizations yet</p>
          ) : (
            <div className="divide-y">
              {orgs.map(org => (
                <div key={org.id} className="py-3 flex justify-between items-center">
                  <p className="font-medium">{org.name}</p>
                  <p className="text-sm text-gray-400">{org.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proposals Inbox */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Pending Proposals</h2>
          {proposals.length === 0 ? (
            <p className="text-gray-400 text-sm">No pending proposals</p>
          ) : (
            <div className="divide-y">
              {proposals.map(proposal => (
                <div key={proposal.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{proposal.title}</p>
                    <p className="text-sm text-gray-500">{proposal.orgs?.name} · ${proposal.amount}</p>
                    <p className="text-sm text-gray-400">{proposal.description}</p>
                  </div>
                  <div className="flex gap-2">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}