import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Plus, Trash2, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in leaflet with bundlers
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationPicker({ position, setPosition }: { position: any, setPosition: any }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function Locations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState(50);
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get('/api/locations');
      setLocations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      alert('Pilih lokasi pada peta terlebih dahulu');
      return;
    }
    
    try {
      await axios.post('/api/locations', {
        id: crypto.randomUUID(),
        name,
        latitude: position[0],
        longitude: position[1],
        radius
      });
      setName('');
      setRadius(50);
      setPosition(null);
      fetchLocations();
    } catch (err) {
      alert('Gagal menambahkan lokasi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus lokasi ini?')) return;
    try {
      await axios.delete(`/api/locations/${id}`);
      fetchLocations();
    } catch (err) {
      alert('Gagal menghapus lokasi');
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => alert('Gagal mendapatkan lokasi: ' + err.message)
      );
    } else {
      alert('Geolokasi tidak didukung oleh browser Anda');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-xs font-bold text-slate-400 uppercase">Tambah Geofence</h2>
          </div>
          <form onSubmit={handleAddLocation} className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nama Lokasi</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                placeholder="Kantor Pusat"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Radius (Meter)</label>
              <input
                type="number"
                required
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            <div>
               <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Koordinat Terpilih</label>
               <div className="text-sm font-mono text-indigo-300 bg-slate-900 p-2 rounded border border-slate-700">
                 {position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Belum dipilih'}
               </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={useCurrentLocation}
                className="flex-1 flex items-center justify-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition-colors"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Current
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors uppercase"
              >
                + ADD
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 mb-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase">Daftar Lokasi</h2>
          </div>
          <div className="p-3 pt-0 space-y-2 max-h-[300px] overflow-y-auto">
             {locations.map((loc) => (
                <div key={loc.id} className="bg-slate-900 p-2 rounded border border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-200 text-sm flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-emerald-400" />
                      {loc.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Radius: {loc.radius}m
                    </div>
                  </div>
                  <button onClick={() => handleDelete(loc.id)} className="text-red-500 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
             ))}
             {locations.length === 0 && <div className="text-xs text-slate-500 text-center py-4">Belum ada lokasi tersimpan</div>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden min-h-[400px] relative">
         <div className="absolute top-0 left-0 w-full h-full z-0">
          <MapContainer center={[-6.200000, 106.816666]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker position={position} setPosition={setPosition} radius={radius} />
            {locations.map(loc => (
              <React.Fragment key={loc.id}>
                <Marker position={[loc.latitude, loc.longitude]} />
                <Circle center={[loc.latitude, loc.longitude]} radius={loc.radius} pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.2 }} />
              </React.Fragment>
            ))}
          </MapContainer>
         </div>
         <div className="absolute top-2 left-20 z-10 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded shadow text-[10px] text-slate-300 pointer-events-none">
           Klik pada peta untuk menentukan lokasi geofence
         </div>
      </div>
    </div>
  );
}
