'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('./MapInner'), { ssr: false })

export default function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  // Nominatim autocomplete search (free OpenStreetMap)
  const searchAddress = async (q) => {
    if (q.length < 3) { setSuggestions([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setSuggestions(data)
    } catch { setSuggestions([]) }
    setLoading(false)
  }

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAddress(val), 400)
  }

  const selectSuggestion = (place) => {
    const address = place.display_name
    const lat = parseFloat(place.lat)
    const lng = parseFloat(place.lon)
    setQuery(address)
    setSelected({ lat, lng, address })
    onChange(address)
    setSuggestions([])
    setShowMap(true)
  }

  const handleMapClick = (lat, lng) => {
    setSelected(prev => ({ ...prev, lat, lng }))
    // Reverse geocode
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(r => r.json())
      .then(data => {
        const addr = data.display_name
        setQuery(addr)
        onChange(addr)
        setSelected({ lat, lng, address: addr })
      })
  }

  return (
    <>
      <style>{`
        .loc-wrap { display: flex; flex-direction: column; gap: 8px; position: relative; }
        .loc-row { display: flex; gap: 8px; }
        .loc-suggestions {
          position: absolute;
          top: 46px;
          left: 0;
          right: 0;
          background: #fff;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          z-index: 999;
          overflow: hidden;
        }
        .loc-suggestion {
          padding: 10px 14px;
          font-size: 13px;
          color: #1a1a2e;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          line-height: 1.4;
          transition: background 0.1s;
        }
        .loc-suggestion:last-child { border-bottom: none; }
        .loc-suggestion:hover { background: #f0f4ff; }
        .loc-suggestion strong { color: #000; font-size: 13px; }
        .loc-suggestion span { color: #9ca3af; font-size: 11px; display: block; margin-top: 2px; }
        .map-btn {
          background: #000;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          white-space: nowrap;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .map-btn:hover { background: #333; }
        .selected-addr {
          font-size: 12px;
          color: #16a34a;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 7px 12px;
          line-height: 1.4;
        }
        .map-wrap {
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #e5e7eb;
          height: 280px;
        }
        .map-hint {
          font-size: 11px;
          color: #9ca3af;
          text-align: center;
          margin-top: 4px;
        }
        .loading-dot { color: #9ca3af; font-size: 12px; padding: 8px 14px; }
      `}</style>

      <div className="loc-wrap">
        <div className="loc-row">
          <input
            className="form-input"
            placeholder="Search address or location..."
            value={query}
            onChange={handleInput}
            style={{ margin: 0, flex: 1 }}
            autoComplete="off"
          />
          <button
            type="button"
            className="map-btn"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? '🗺 Hide' : '📍 Map'}
          </button>
        </div>

        {/* AUTOCOMPLETE SUGGESTIONS */}
        {suggestions.length > 0 && (
          <div className="loc-suggestions">
            {loading && <div className="loading-dot">Searching...</div>}
            {suggestions.map((s, i) => {
              const parts = s.display_name.split(', ')
              return (
                <div key={i} className="loc-suggestion" onClick={() => selectSuggestion(s)}>
                  <strong>{parts[0]}</strong>
                  <span>{parts.slice(1).join(', ')}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* SELECTED ADDRESS */}
        {selected && (
          <div className="selected-addr">
            📍 {selected.address}
          </div>
        )}

        {/* MAP */}
        {showMap && (
          <>
            <div className="map-wrap">
              <MapComponent
                center={selected ? [selected.lat, selected.lng] : [40.7128, -74.0060]}
                marker={selected ? [selected.lat, selected.lng] : null}
                onMapClick={handleMapClick}
              />
            </div>
            <div className="map-hint">Click anywhere on the map to drop a pin</div>
          </>
        )}
      </div>
    </>
  )
}