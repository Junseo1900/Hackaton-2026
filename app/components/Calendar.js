'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, orgs(name)')
      .eq('status', 'approved')
    setEvents(data || [])
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getEventForDay = (day) => {
    return events.find(event => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      )
    })
  }

  const isToday = (day) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="text-gray-400 hover:text-black text-xl px-3 py-1 rounded-lg hover:bg-gray-100 transition">←</button>
        <h2 className="text-xl font-bold">{monthName} {year}</h2>
        <button onClick={nextMonth} className="text-gray-400 hover:text-black text-xl px-3 py-1 rounded-lg hover:bg-gray-100 transition">→</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b mb-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-semibold py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t">
        {Array.from({ length: totalCells }).map((_, i) => {
          const day = i - firstDay + 1
          const isValid = day >= 1 && day <= daysInMonth
          const event = isValid ? getEventForDay(day) : null
          const today = isValid && isToday(day)

          return (
            <div
              key={i}
              className={`border-r border-b min-h-[100px] p-2 
                ${!isValid ? 'bg-gray-50' : event ? 'bg-black text-white' : 'bg-white'}
              `}
            >
              {isValid && (
                <>
                  {/* Day number */}
                  <div className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full
                    ${today && !event ? 'bg-black text-white' : ''}
                    ${event ? 'text-white' : 'text-gray-700'}
                  `}>
                    {day}
                  </div>

                  {/* Event details */}
                  {event && (
                    <div className="mt-1">
                      <p className="text-xs font-bold text-white leading-tight">{event.title}</p>
                      <p className="text-xs text-gray-300 mt-0.5">{event.orgs?.name}</p>
                      <p className="text-xs text-gray-300">{event.location}</p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {event.requires_payment && (
                        <p className="text-xs text-yellow-300 mt-0.5">💰 ${event.price}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}