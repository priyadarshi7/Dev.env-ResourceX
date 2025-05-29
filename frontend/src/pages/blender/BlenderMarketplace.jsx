import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const BlenderMarketplace = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedType, setSelectedType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await api.get('/device', {
          params: {
            isAvailable: true
          }
        });
        
        // Filter for devices that can run Blender (generally GPU or Full System devices)
        const blenderDevices = response.data.filter(device => 
          device.deviceType === 'GPU' || 
          device.deviceType === 'Full System' ||
          (device.acceptedTaskTypes && device.acceptedTaskTypes.includes('3D Rendering'))
        );
        
        setDevices(blenderDevices);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching devices:', error);
        toast.error('Failed to load devices: ' + (error.response?.data?.message || error.message));
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleRentDevice = async (deviceId) => {
    try {
      const response = await api.post('/blendsession', {
        deviceId
      });
      
      if (response.data.success) {
        toast.success('Blender session created successfully!');
        navigate(`/blender-renter/${response.data.sessionId}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.response?.data?.message || 'Failed to create session');
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (device.specs && Object.values(device.specs).some(spec => 
                            typeof spec === 'string' && spec.toLowerCase().includes(searchTerm.toLowerCase())
                          ));
    
    const matchesPrice = device.price >= priceRange[0] && device.price <= priceRange[1];
    const matchesType = selectedType === '' || device.deviceType === selectedType;
    
    return matchesSearch && matchesPrice && matchesType;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Blender Rendering Marketplace</h1>
      <p className="mb-6">Rent high-performance devices to render your Blender projects faster</p>
      
      {/* Filters */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded"
              placeholder="Search by name or specs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Device Type</label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="GPU">GPU</option>
              <option value="Full System">Full System</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">
              Price Range: ${priceRange[0]} - ${priceRange[1]}/hr
            </label>
            <div className="flex gap-4">
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
              />
              <input
                type="range"
                className="w-full"
                min="0"
                max="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Device Listings */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredDevices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <div 
              key={device._id} 
              className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="bg-gray-50 p-4">
                <h2 className="text-xl font-semibold">{device.deviceName}</h2>
                <p className="text-gray-500">{device.deviceType}</p>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium mb-2">Specifications:</h3>
                <ul className="space-y-1 mb-4">
                  {device.specs && Object.entries(device.specs).map(([key, value]) => (
                    <li key={key} className="text-sm">
                      <span className="font-medium">{key}:</span> {value}
                    </li>
                  ))}
                </ul>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-lg font-bold">${device.price}/hr</p>
                    <p className="text-sm text-gray-500">Performance Score: {device.performance}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleRentDevice(device._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Rent for Blender
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg">No devices found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default BlenderMarketplace;
