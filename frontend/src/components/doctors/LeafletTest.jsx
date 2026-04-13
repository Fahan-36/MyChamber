import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons by configuring CDN URLs
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LeafletTest() {
  return (
    <div className="w-full h-96 border border-red-500">
      <p className="text-red-600 font-bold">Leaflet Test Component</p>
      <MapContainer
        center={[23.685, 90.3563]}
        zoom={7}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[23.8103, 90.4625]}>
          <Popup>Test Marker - Dhaka</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
