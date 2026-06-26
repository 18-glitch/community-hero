import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { Shield, Sparkles, MapPin, Eye, AlertTriangle } from 'lucide-react';

interface MapContainerProps {
  onSelectIssue?: (issue: Issue) => void;
  selectedIssueId?: string | null;
  activeCategoryFilter?: string;
  activeStatusFilter?: string;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  onSelectIssue,
  selectedIssueId,
  activeCategoryFilter = 'all',
  activeStatusFilter = 'all'
}) => {
  const { issues } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const heatCirclesRef = useRef<L.Circle[]>([]);
  const [heatmapMode, setHeatmapMode] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // 1. Initialise Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default view centered on Bangalore (Indiranagar area) or New Delhi depending on reports, let's use Bangalore center
    console.log('Initializing Leaflet Map...');
    const mapInstance = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: false // we will place it custom for aesthetics
    });

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    // Standard high contrast dark theme/light theme tiles.
    // Let's use Stadia Alidade Smooth Dark or standard OSM with deep slate CSS filter!
    // Adding standard OSM with a gorgeous CSS style in dark mode makes it visually phenomenal!
    const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    });

    tiles.addTo(mapInstance);
    mapRef.current = mapInstance;
    setMapLoaded(true);

    // Trigger map resize buffer
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 400);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Pan to selected issue when selectedIssueId changes
  useEffect(() => {
    if (!mapRef.current || !selectedIssueId || !issues.length) return;
    const active = issues.find(i => i.id === selectedIssueId);
    if (active) {
      mapRef.current.setView([active.location.lat, active.location.lng], 15, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedIssueId, issues]);

  // 3. Render Markers & Heatmap Circles
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    // Clear existing markers & heat layers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    heatCirclesRef.current.forEach(hc => hc.remove());
    heatCirclesRef.current = [];

    // Filter issues as specified
    const filteredIssues = issues.filter(issue => {
      if (issue.duplicateOf) return false; // Hide merged duplicates to prevent clutter
      
      const matchCat = activeCategoryFilter === 'all' || issue.category === activeCategoryFilter;
      const matchStat = activeStatusFilter === 'all' || issue.status === activeStatusFilter;
      return matchCat && matchStat;
    });

    if (heatmapMode) {
      // -----------------------------------------------------------
      // HEATMAP OVERLAY MODE
      // Simulate real-time density by mapping overlay points with high blurring radii
      // -----------------------------------------------------------
      filteredIssues.forEach(issue => {
        // Find cluster severity
        let color = '#f43f5e'; // red
        let fillOpacity = 0.25;
        let radius = 180; // meters

        if (issue.status === 'Resolved') {
          color = '#10b981'; // green
          fillOpacity = 0.12;
          radius = 120;
        } else if (issue.status === 'In Progress' || issue.status === 'Verified') {
          color = '#f59e0b'; // amber
          fillOpacity = 0.2;
          radius = 150;
        }

        const circle = L.circle([issue.location.lat, issue.location.lng], {
          color: 'transparent',
          fillColor: color,
          fillOpacity: fillOpacity * (issue.severity === 'critical' ? 2 : 1),
          radius: radius * (issue.severity === 'critical' ? 1.5 : 1)
        }).addTo(map);

        heatCirclesRef.current.push(circle);
      });
    } else {
      // -----------------------------------------------------------
      // STANDARD PINS MODE
      // -----------------------------------------------------------
      filteredIssues.forEach(issue => {
        // Icon template matching status
        let pinHTML = '';
        if (issue.status === 'Resolved') {
          pinHTML = `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-[ping_3s_infinite]"></div>
              <div class="w-6 h-6 rounded-full border-2 border-slate-900 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center text-[11px] font-bold text-white">✓</div>
            </div>`;
        } else if (issue.status === 'In Progress' || issue.status === 'Verified') {
          pinHTML = `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-amber-500/20 animate-[pulse_2s_infinite]"></div>
              <div class="w-6 h-6 rounded-full border-2 border-slate-900 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center text-[11px] font-bold text-white">⚠</div>
            </div>`;
        } else { // Reported / Open
          pinHTML = `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-rose-500/30 animate-[pulse_1.5s_infinite]"></div>
              <div class="w-6 h-6 rounded-full border-2 border-slate-900 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] flex items-center justify-center text-[11px] font-bold text-white">!</div>
            </div>`;
        }

        const customIcon = L.divIcon({
          html: pinHTML,
          className: 'custom-pin-element',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([issue.location.lat, issue.location.lng], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            if (onSelectIssue) {
              onSelectIssue(issue);
            }
          });

        // Add a premium styled popup description
        const catBadgeColors: Record<IssueCategory, string> = {
          pothole: 'bg-red-500/20 text-red-300 border-red-500/30',
          water_leakage: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          streetlight: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          waste_garbage: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          other: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };

        const statusLabelColors: Record<IssueStatus, string> = {
          Reported: 'text-rose-400 bg-rose-400/10',
          Verified: 'text-blue-400 bg-blue-400/10',
          'In Progress': 'text-amber-400 bg-amber-400/10',
          'Pending Verification': 'text-orange-400 bg-orange-400/10',
          Resolved: 'text-emerald-400 bg-emerald-400/10'
        };

        const content = `
          <div class="p-3 text-slate-100 bg-slate-950 rounded-xl border border-slate-800 font-sans max-w-[240px]">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${catBadgeColors[issue.category]}">${issue.category.toUpperCase().replace('_', ' ')}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold ${statusLabelColors[issue.status]}">${issue.status}</span>
            </div>
            <h4 class="font-bold text-xs text-white line-clamp-1 mb-1">${issue.title}</h4>
            <p class="text-[11px] text-slate-400 line-clamp-2 mb-2">${issue.description}</p>
            <div class="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800">
              <span class="text-amber-500 font-medium">★ ${issue.upvotes.length} Upvotes</span>
              <span class="text-slate-500 font-medium">${issue.location.locality?.split(',')[0]}</span>
            </div>
          </div>
        `;

        const popup = L.popup({
          className: 'custom-leaflet-popup-class',
          closeButton: false,
          offset: [0, -6]
        }).setContent(content);

        marker.bindPopup(popup);
        markersRef.current.push(marker);
      });
    }

    // Adjust bound view if multiple markers exist and none is focused currently
    if (filteredIssues.length > 0 && !selectedIssueId) {
      const bounds = L.latLngBounds(filteredIssues.map(i => [i.location.lat, i.location.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

  }, [issues, heatmapMode, activeCategoryFilter, activeStatusFilter, mapLoaded, selectedIssueId]);

  return (
    <div id="wrapper-map-rel" className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.8)]">
      {/* Absolute Header Controls */}
      <div id="controls-top-align" className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
        <button
          id="btn-toggle-heat"
          onClick={() => setHeatmapMode(!heatmapMode)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-lg border transition-all duration-300 backdrop-blur-md ${
            heatmapMode 
              ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white border-orange-500 scale-105' 
              : 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 border-slate-700/80 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {heatmapMode ? 'Deactivate Heatmap' : 'Hotspot Heatmap'}
        </button>

        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-950/90 border border-slate-800 backdrop-blur-md text-slate-300 shadow-md">
          <Shield className="w-3.5 h-3.5 text-orange-500" />
          <span>Hyperlocal GPS Active</span>
        </span>
      </div>

      <div id="map-container" ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '380px' }} />

      {/* Map CSS Custom Style Injection */}
      <style>{`
        .custom-pin-element {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-container {
          background-color: #0f172a !important; /* matches dark mode background */
        }
      `}</style>
    </div>
  );
};
