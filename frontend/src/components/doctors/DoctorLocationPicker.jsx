import { useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [23.685, 90.3563]; // Bangladesh center fallback
const DEFAULT_ZOOM = 7;
const PICKED_ZOOM = 15;

// Fix Leaflet marker icons by configuring CDN URLs
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const isValidCoordinatePair = (latitude, longitude) => (
  Number.isFinite(latitude)
  && Number.isFinite(longitude)
  && latitude >= -90
  && latitude <= 90
  && longitude >= -180
  && longitude <= 180
);

const toFixedCoordinate = (value) => {
  if (!Number.isFinite(value)) return '';
  return Number(value).toFixed(6);
};

const buildNominatimUrl = (path, params) => {
  const searchParams = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    ...params,
  });
  return `https://nominatim.openstreetmap.org/${path}?${searchParams.toString()}`;
};

function FlyToLocation({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (!center || !Number.isFinite(center[0]) || !Number.isFinite(center[1])) return;
    map.flyTo(center, zoom, {
      animate: true,
      duration: 0.8,
    });
  }, [center, zoom, map]);

  return null;
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function DoctorLocationPicker({
  value,
  onChange,
  onSave,
  isSaving,
  isOpen,
  onToggleOpen,
}) {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [validationError, setValidationError] = useState('');

  const hasCoordinates = isValidCoordinatePair(value.latitude, value.longitude);

  const mapCenter = useMemo(() => {
    if (hasCoordinates) {
      return [Number(value.latitude), Number(value.longitude)];
    }
    return DEFAULT_CENTER;
  }, [hasCoordinates, value.latitude, value.longitude]);

  useEffect(() => {
    if (!isOpen) {
      setMapError('');
      setSearchError('');
      setValidationError('');
    }
  }, [isOpen]);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(buildNominatimUrl('reverse', {
        lat: String(latitude),
        lon: String(longitude),
      }), {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Unable to reverse geocode this location.');
      }

      const data = await response.json();
      if (data?.display_name) {
        onChange({
          address: data.display_name,
          latitude,
          longitude,
        });
      } else {
        onChange({
          ...value,
          latitude,
          longitude,
        });
      }
      setSearchError('');
    } catch (_error) {
      onChange({
        ...value,
        latitude,
        longitude,
      });
      setSearchError('Location selected, but address lookup failed. You can type the address manually.');
    }
  };

  const handlePickLocation = async (latitude, longitude) => {
    setValidationError('');
    await reverseGeocode(latitude, longitude);
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!searchText.trim()) {
      setSearchError('Please type a location to search.');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const response = await fetch(buildNominatimUrl('search', {
        q: searchText.trim(),
        limit: '1',
      }), {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Search request failed.');
      }

      const places = await response.json();
      const firstPlace = places?.[0];

      if (!firstPlace) {
        setSearchError('No matching location found. Try a more specific search.');
        return;
      }

      const latitude = Number(firstPlace.lat);
      const longitude = Number(firstPlace.lon);

      if (!isValidCoordinatePair(latitude, longitude)) {
        setSearchError('Found location has invalid coordinates. Please try another query.');
        return;
      }

      onChange({
        address: firstPlace.display_name || value.address,
        latitude,
        longitude,
      });
      setValidationError('');
    } catch (_error) {
      setSearchError('Location search is currently unavailable. Please try map click selection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!isValidCoordinatePair(value.latitude, value.longitude)) {
      setValidationError('Please choose a location from the map before saving.');
      return;
    }

    if (!value.address?.trim()) {
      setValidationError('Address is required. Please enter chamber address before saving.');
      return;
    }

    setValidationError('');
    await onSave({
      address: value.address.trim(),
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
    });
  };

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Chamber Map Location</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Search a place, click the map, or drag marker to set exact location.</p>
        </div>
        <button
          type="button"
          onClick={onToggleOpen}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-700/60 dark:bg-brand-900/30 dark:text-brand-200"
        >
          <MapPin size={16} />
          {isOpen ? 'Close Map Picker' : 'Set Location on Map'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search location (e.g., Rangpur Medical, Bangladesh)"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Chamber Address</label>
              <textarea
                rows={2}
                value={value.address}
                onChange={(event) => onChange({ ...value, address: event.target.value })}
                placeholder="Chamber Address"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Latitude</label>
              <input
                type="text"
                value={toFixedCoordinate(Number(value.latitude))}
                readOnly
                placeholder="Not selected"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Longitude</label>
              <input
                type="text"
                value={toFixedCoordinate(Number(value.longitude))}
                readOnly
                placeholder="Not selected"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={isSaving}
                className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Location'
                )}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <MapContainer
              center={mapCenter}
              zoom={hasCoordinates ? PICKED_ZOOM : DEFAULT_ZOOM}
              className="h-72 w-full md:h-80"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                eventHandlers={{
                  tileerror: () => {
                    setMapError('Map tiles failed to load. Please check network and try again.');
                  },
                }}
              />
              <FlyToLocation center={mapCenter} zoom={hasCoordinates ? PICKED_ZOOM : DEFAULT_ZOOM} />
              <MapClickHandler onPick={handlePickLocation} />

              {hasCoordinates && (
                <Marker
                  position={[Number(value.latitude), Number(value.longitude)]}
                  draggable
                  eventHandlers={{
                    dragend: (event) => {
                      const latLng = event.target.getLatLng();
                      handlePickLocation(latLng.lat, latLng.lng);
                    },
                  }}
                >
                  <Popup>
                    {value.address?.trim() || 'Selected chamber location'}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {(mapError || searchError || validationError) && (
            <div className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/70 dark:bg-amber-900/20 dark:text-amber-200">
              {mapError && <p>{mapError}</p>}
              {searchError && <p>{searchError}</p>}
              {validationError && <p>{validationError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DoctorSavedLocationPreview({ address, latitude, longitude }) {
  const hasCoordinates = isValidCoordinatePair(latitude, longitude);

  if (!hasCoordinates) return null;

  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-3 dark:border-emerald-800/60 dark:bg-emerald-900/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Saved Chamber Map Preview</p>
      <div className="overflow-hidden rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60">
        <MapContainer
          center={[Number(latitude), Number(longitude)]}
          zoom={PICKED_ZOOM}
          className="h-48 w-full"
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[Number(latitude), Number(longitude)]}>
            <Popup>{address || 'Saved chamber location'}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="grid gap-1 text-xs text-emerald-800 dark:text-emerald-200 sm:grid-cols-3">
        <p><strong>Address:</strong> {address || 'N/A'}</p>
        <p><strong>Latitude:</strong> {toFixedCoordinate(Number(latitude))}</p>
        <p><strong>Longitude:</strong> {toFixedCoordinate(Number(longitude))}</p>
      </div>
    </div>
  );
}

export default DoctorLocationPicker;
