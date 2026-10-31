import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Waypoint } from '../types/crypto';
import { Lock, Crosshair, MapPin } from 'lucide-react';

interface MapViewProps {
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  isBreached: boolean;
  breachType: string | null;
  currentCoords: { lat: number; lng: number } | null;
  pendingTargetCoords?: { lat: number; lng: number } | null;
  onSelectCoords?: (lat: number, lng: number) => void;
  isConsigneeKeyLoaded?: boolean;
}

// Map Click Listener to pick custom GPS coordinate
function MapClickDispatcher({ onSelectCoords }: { onSelectCoords?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onSelectCoords) {
        onSelectCoords(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
      }
    },
  });
  return null;
}

// Controller component to auto-pan map smoothly to current waypoint
function MapAutoPanner({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 1.2 });
  }, [center, map]);
  return null;
}

type BasemapStyle = 'esriDark' | 'osmCyber' | 'satellite';

export const MapView: React.FC<MapViewProps> = ({
  waypoints,
  currentWaypointIndex,
  isBreached,
  breachType,
  currentCoords,
  pendingTargetCoords,
  onSelectCoords,
  isConsigneeKeyLoaded = true,
}) => {
  const [basemap, setBasemap] = useState<BasemapStyle>('esriDark');

  const activePoint = waypoints[currentWaypointIndex] || waypoints[0];
  const activeLat = currentCoords?.lat ?? activePoint.lat;
  const activeLng = currentCoords?.lng ?? activePoint.lng;

  // Waypoints coordinates array
  const fullRouteCoords = useMemo(
    () => waypoints.map((w) => [w.lat, w.lng] as [number, number]),
    [waypoints]
  );

  // Past completed route coordinates
  const completedRouteCoords = useMemo(() => {
    const passed = waypoints.slice(0, currentWaypointIndex + 1).map((w) => [w.lat, w.lng] as [number, number]);
    if (currentCoords) {
      passed[passed.length - 1] = [currentCoords.lat, currentCoords.lng];
    }
    return passed;
  }, [waypoints, currentWaypointIndex, currentCoords]);

  // Dynamic Vessel DivIcon with rotation and glowing status
  const shipIcon = useMemo(() => {
    const heading = activePoint.heading || 0;
    const pulseColor = isBreached ? '#f43f5e' : '#10b981';
    const glowClass = isBreached ? 'animate-ping' : 'animate-pulse';

    const html = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 48px; height: 48px;">
        <!-- Glowing Radar Ripple -->
        <div class="absolute inset-0 rounded-full ${glowClass} opacity-60" style="background-color: ${pulseColor};"></div>
        <div class="absolute inset-2 rounded-full border border-${isBreached ? 'rose' : 'emerald'}-400 opacity-80"></div>
        
        <!-- Vessel Icon with Heading Rotation -->
        <div class="relative z-10 p-1.5 rounded-full shadow-lg flex items-center justify-center transition-transform duration-700" 
             style="background: #090d16; border: 2px solid ${pulseColor}; transform: rotate(${heading}deg);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${pulseColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
        
        <!-- Vessel label -->
        <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase"
             style="background: rgba(9, 13, 22, 0.95); border: 1px solid ${pulseColor}; color: ${pulseColor};">
          ${isBreached ? '⚠ COMPROMISED' : 'MAERSK KRYPTOS'}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-ship-icon',
      html,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  }, [isBreached, activePoint.heading]);

  // Target Coordinate Marker (When user clicks map to stage next manual coordinate)
  const targetIcon = useMemo(() => {
    const html = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 32px; height: 32px;">
        <div class="absolute inset-0 rounded-full animate-ping bg-amber-400 opacity-60"></div>
        <div class="w-6 h-6 rounded-full bg-amber-500 border-2 border-black flex items-center justify-center text-black font-bold text-xs shadow-lg">
          +
        </div>
      </div>
    `;
    return L.divIcon({
      className: 'custom-target-icon',
      html,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  // Waypoint DivIcon builder
  const createWaypointIcon = (index: number, isPassed: boolean, isCurrent: boolean) => {
    let bgColor = '#1e293b'; // slate-800
    let borderColor = '#475569';
    let textColor = '#94a3b8';

    if (isCurrent) {
      bgColor = isBreached ? '#881337' : '#064e3b';
      borderColor = isBreached ? '#f43f5e' : '#10b981';
      textColor = '#ffffff';
    } else if (isPassed) {
      bgColor = '#064e3b';
      borderColor = '#059669';
      textColor = '#a7f3d0';
    }

    const html = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer" style="width: 26px; height: 26px;">
        <div class="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shadow-md transition-all duration-300 hover:scale-125"
             style="background-color: ${bgColor}; border: 1.5px solid ${borderColor}; color: ${textColor};">
          ${index + 1}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-waypoint-icon',
      html,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  };

  // Basemap Tile Layer configurations (100% Free & No API Key Required)
  const renderBasemap = () => {
    if (basemap === 'satellite') {
      return (
        <TileLayer
          key="satellite"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />
      );
    }
    if (basemap === 'osmCyber') {
      return (
        <TileLayer
          key="osmCyber"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="osm-dark-tiles"
          maxZoom={19}
        />
      );
    }
    return (
      <TileLayer
        key="esriDark"
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, NOAA'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />
    );
  };

  return (
    <div className="relative w-full h-full min-h-[340px] rounded-lg overflow-hidden border border-cyber-border bg-[#05070b]">
      {/* Map Control Overlay */}
      <div className="absolute top-2 right-2 z-[400] flex flex-col gap-1 items-end">
        <div className="flex items-center gap-1 bg-zinc-950/90 backdrop-blur border border-zinc-800 p-0.5 rounded text-[9px] font-mono shadow-lg">
          <button
            onClick={() => setBasemap('esriDark')}
            className={`px-2 py-0.5 rounded transition-all ${
              basemap === 'esriDark' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dark Ocean
          </button>
          <button
            onClick={() => setBasemap('satellite')}
            className={`px-2 py-0.5 rounded transition-all ${
              basemap === 'satellite' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBasemap('osmCyber')}
            className={`px-2 py-0.5 rounded transition-all ${
              basemap === 'osmCyber' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Cyber OSM
          </button>
        </div>

        <div className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-zinc-950/80 backdrop-blur border border-zinc-800 text-zinc-400 pointer-events-none flex items-center gap-1.5">
          <Crosshair className="w-3 h-3 text-emerald-400" />
          <span>Click Map to Set Manual GPS</span>
        </div>

        {isBreached && isConsigneeKeyLoaded && (
          <div className="px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wider uppercase bg-rose-950/90 border border-rose-500 text-rose-300 animate-pulse flex items-center gap-1.5 shadow-lg shadow-rose-950/50 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            ALERT: {breachType || 'BREACH DETECTED AT SEA'}
          </div>
        )}
      </div>

      {/* Unauthorized View Overlay: If Consignee Key is Revoked */}
      {!isConsigneeKeyLoaded && (
        <div className="absolute inset-0 z-[500] bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/70 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-2xl shadow-rose-950/80 mb-3 animate-pulse">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-mono font-black text-rose-300 tracking-wider uppercase">
            LOCKED: VALID SESSION KEY REQUIRED
          </h3>
          <p className="text-xs font-mono text-zinc-400 max-w-md mt-1.5 leading-relaxed">
            Consignee AES-256 session key has been revoked. Real-time vessel coordinates, route polylines, and container health telemetry are mathematically masked by the zero-knowledge enclave.
          </p>
          <div className="mt-4 px-3 py-1.5 rounded bg-black/80 border border-zinc-800 text-[11px] font-mono text-zinc-500">
            Raw Encrypted Stream Available in Center Relay
          </div>
        </div>
      )}

      <MapContainer
        center={[activeLat, activeLng]}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#070a12' }}
      >
        <MapAutoPanner center={[activeLat, activeLng]} />
        <MapClickDispatcher onSelectCoords={onSelectCoords} />

        {/* Dynamic Basemap Layer */}
        {renderBasemap()}

        {/* Full planned maritime corridor (dim dotted) */}
        <Polyline
          positions={fullRouteCoords}
          pathOptions={{
            color: '#475569',
            weight: 2,
            dashArray: '5, 8',
            opacity: 0.7,
          }}
        />

        {/* Traversed corridor (emerald or crimson) */}
        {isConsigneeKeyLoaded && (
          <Polyline
            positions={completedRouteCoords}
            pathOptions={{
              color: isBreached ? '#f43f5e' : '#10b981',
              weight: 3.5,
              opacity: 0.95,
            }}
          />
        )}

        {/* 15 Waypoint Markers */}
        {waypoints.map((wp, idx) => {
          const isPassed = idx < currentWaypointIndex;
          const isCurrent = idx === currentWaypointIndex;

          return (
            <Marker
              key={wp.id}
              position={[wp.lat, wp.lng]}
              icon={createWaypointIcon(idx, isPassed, isCurrent)}
              eventHandlers={{
                click: () => {
                  if (onSelectCoords) {
                    onSelectCoords(wp.lat, wp.lng);
                  }
                },
              }}
            >
              <Popup className="dark-popup">
                <div className="p-2 bg-zinc-950 text-zinc-100 rounded border border-zinc-800 font-mono text-xs max-w-[220px]">
                  <div className="font-bold text-emerald-400 flex items-center justify-between border-b border-zinc-800 pb-1 mb-1">
                    <span>WP #{wp.id}: {wp.name}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">{wp.seaRegion}</div>
                  <div className="text-[10px] text-zinc-300 mt-1">
                    Coords: {wp.lat.toFixed(4)}°N, {wp.lng.toFixed(4)}°E
                  </div>
                  <div className="text-[10px] text-amber-400 mt-1">Click to select as Next GPS Target</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Active Vessel Indicator */}
        {isConsigneeKeyLoaded && (
          <Marker position={[activeLat, activeLng]} icon={shipIcon} zIndexOffset={1000}>
            <Popup>
              <div className="p-2 bg-zinc-950 text-zinc-100 rounded border border-zinc-800 font-mono text-xs">
                <div className="font-bold text-cyan-400 flex items-center justify-between border-b border-zinc-800 pb-1 mb-1">
                  <span>Vessel: MV MAERSK KRYPTOS</span>
                </div>
                <div className="text-[11px] text-zinc-300">
                  Speed: {activePoint.speedKnots} kts • Head: {activePoint.heading}°
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Waypoint #{activePoint.id}: {activePoint.name}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pending User Selected Coordinate (Staged for next transmission) */}
        {pendingTargetCoords && (
          <Marker position={[pendingTargetCoords.lat, pendingTargetCoords.lng]} icon={targetIcon} zIndexOffset={1100}>
            <Popup>
              <div className="p-1.5 bg-zinc-950 text-amber-300 font-mono text-xs rounded border border-amber-500">
                Staged GPS: {pendingTargetCoords.lat.toFixed(4)}°N, {pendingTargetCoords.lng.toFixed(4)}°E
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Legend & Coordinates Bar */}
      <div className="absolute bottom-2 left-2 right-2 z-[400] flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded bg-zinc-950/85 backdrop-blur border border-zinc-800 text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            Verified Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-zinc-500"></span>
            Waypoints (Click to Target)
          </span>
          {pendingTargetCoords && (
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <MapPin className="w-3 h-3 text-amber-400" />
              Target Staged ({pendingTargetCoords.lat.toFixed(2)}°, {pendingTargetCoords.lng.toFixed(2)}°)
            </span>
          )}
        </div>
        <div className="text-zinc-300 font-bold">
          LAT: {activeLat.toFixed(4)}°N • LNG: {activeLng.toFixed(4)}°E • SPEED: {activePoint.speedKnots} KTS
        </div>
      </div>
    </div>
  );
};
