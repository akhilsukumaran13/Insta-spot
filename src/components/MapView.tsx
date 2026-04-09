import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Custom Colored Icons
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default fallback
L.Marker.prototype.options.icon = blueIcon;

function LocationMarker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      // Don't auto-select on load for admin creation to avoid overwriting if they are editing (though editing isn't impl yet)
    });
  }, [map]);

  const eventHandlers = {
    dragend(e: any) {
      const marker = e.target;
      const newPos = marker.getLatLng();
      setPosition(newPos);
      if (onLocationSelect) {
        onLocationSelect(newPos.lat, newPos.lng);
      }
    },
  };

  return position === null ? null : (
    <Marker 
        position={position} 
        draggable={true}
        eventHandlers={eventHandlers}
        icon={redIcon}
        ref={(ref) => {
            if (ref) {
                // Fix for marker icon not showing sometimes on drag
                // ref.openPopup();
            }
        }}
    >
      <Popup>Location set</Popup>
    </Marker>
  );
}

function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap();
    useEffect(() => {
        if(lat && lng) {
            map.setView([lat, lng], 15);
        }
    }, [lat, lng, map]);
    return null;
}

function RoutingMachine({ from, to }: { from: [number, number], to: [number, number] }) {
    const [route, setRoute] = useState<[number, number][]>([]);
    const map = useMap();

    useEffect(() => {
        if (!from || !to) return;

        const fetchRoute = async () => {
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
                );
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                    const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
                    setRoute(coordinates);
                    
                    // Fit bounds to show route
                    const bounds = L.latLngBounds([from, to]);
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (error) {
                console.error("Error fetching route:", error);
                // Fallback to straight line
                setRoute([from, to]);
            }
        };

        fetchRoute();
    }, [from, to, map]);

    return route.length > 0 ? <Polyline positions={route} color="#ef4444" weight={5} opacity={0.7} /> : null;
}

function MapInvalidator() {
    const map = useMap();
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        const container = map.getContainer();
        if (container) {
            resizeObserver.observe(container);
        }
        
        // Also invalidate on mount after a small delay just in case
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => {
            resizeObserver.disconnect();
        };
    }, [map]);
    return null;
}

export default function MapView({ 
    lots = [], 
    onLotClick, 
    selectable = false, 
    onLocationSelect,
    center = [28.6139, 77.2090],
    userLocation = null,
    destination = null,
    selectedLot = null
}: any) {
  // If a lot is selected, only show that one. Otherwise show all.
  const lotsToShow = selectedLot ? [selectedLot] : lots;

  return (
    <MapContainer center={center as L.LatLngExpression} zoom={13} scrollWheelZoom={true} className="h-full w-full rounded-xl z-0">
      <MapInvalidator />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {selectable && <LocationMarker onLocationSelect={onLocationSelect} />}
      
      {/* User Location Marker - Green */}
      {userLocation && !selectable && (
          <Marker position={userLocation} icon={greenIcon}>
              <Popup>You are here</Popup>
          </Marker>
      )}
      
      {!selectable && lotsToShow.map((lot: any) => (
        <Marker 
            key={lot.id} 
            position={[lot.latitude, lot.longitude]}
            icon={selectedLot && selectedLot.id === lot.id ? redIcon : blueIcon}
            eventHandlers={{
                click: () => onLotClick && onLotClick(lot),
            }}
        >
          <Popup>
            <div className="text-slate-900">
                <strong className="block text-lg">{lot.name}</strong>
                <span className="block text-sm text-slate-600">{lot.address}</span>
                <span className="block font-bold text-indigo-600 mt-1">₹{lot.price_per_hour}/hr</span>
                <span className={`block text-xs font-bold mt-1 ${lot.available_slots > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {lot.available_slots} / {lot.total_slots} Slots Available
                </span>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {center && <RecenterMap lat={center[0]} lng={center[1]} />}
      
      {destination && userLocation && (
        <RoutingMachine from={userLocation} to={[destination.latitude, destination.longitude]} />
      )}
    </MapContainer>
  );
}
