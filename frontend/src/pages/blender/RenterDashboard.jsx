import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const RenterDashboard = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pollInterval, setPollInterval] = useState(null);
  const [renderResult, setRenderResult] = useState(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await api.get(`/blendsession/${sessionId}`);
        
        setSession(response.data.session);
        setLoading(false);

        // Start polling for render results if session is active
        if (response.data.session.status === 'active') {
          startPolling();
        } else if (response.data.session.status === 'completed') {
          // If session is already completed, fetch the results once
          fetchRenderResults();
        }
      } catch (error) {
        console.error('Error fetching session details:', error);
        toast.error('Failed to load session details: ' + (error.response?.data?.message || error.message));
        setLoading(false);
      }
    };

    fetchSessionDetails();

    return () => {
      // Clean up polling on component unmount
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [sessionId]);

  // Function to fetch render results once
  const fetchRenderResults = async () => {
    try {
      const response = await api.get(`/blendsession/${sessionId}/result`);
      setRenderResult(response.data.result);
    } catch (error) {
      console.error('Error fetching render results:', error);
    }
  };

  const startPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/blendsession/${sessionId}/result`);
        
        setRenderResult(response.data.result);
        
        // If we have rendered files in the output, show a notification
        if (response.data.result.renderedFiles && 
            response.data.result.renderedFiles.length > 0 && 
            (!renderResult || renderResult.renderedFiles.length !== response.data.result.renderedFiles.length)) {
          toast.success('New render outputs are available!');
        }
        
        // Stop polling if session is completed
        if (response.data.result.status === 'completed') {
          clearInterval(interval);
          setPollInterval(null);
          toast.success('Render completed!');
        }
      } catch (error) {
        console.error('Error polling results:', error);
      }
    }, 5000); // Poll every 5 seconds

    setPollInterval(interval);
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    // Check for .blend file
    const hasBlendFile = selectedFiles.some(file => file.name.endsWith('.blend'));
    if (!hasBlendFile) {
      toast.error('You must include at least one .blend file');
      return;
    }

    setUploadLoading(true);
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      // We need to create a special instance for file uploads
      const response = await api.post(
        `/blendsession/${sessionId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Files uploaded successfully!');
        setSelectedFiles([]);
        
        // Refresh session details
        const sessionResponse = await api.get(`/blendsession/${sessionId}`);
        setSession(sessionResponse.data.session);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadOutput = () => {
    // Redirect to download endpoint
    window.location.href = `${api.defaults.baseURL}/blendsession/${sessionId}/download`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          to="/blender-marketplace" 
          className="text-blue-600 hover:underline flex items-center"
        >
          ← Back to Marketplace
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Blender Rendering Session</h1>
          <div className="flex justify-between items-center mt-2">
            <div>
              <span className="inline-block px-3 py-1 bg-white text-blue-600 rounded font-medium">
                Status: {session.status}
              </span>
            </div>
            <div className="text-sm">
              Session ID: {sessionId}
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-2">Device Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Device Name:</span> {session.device.deviceName}</p>
              <p><span className="font-medium">Device Type:</span> {session.device.deviceType}</p>
              <p><span className="font-medium">Price:</span> ${session.device.price}/hr</p>
            </div>
            <div>
              <p className="font-medium">Specifications:</p>
              <ul className="list-disc pl-5 mt-1">
                {session.device.specs && Object.entries(session.device.specs).map(([key, value]) => (
                  <li key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        {(session.status === 'requested' || session.status === 'active') && (
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-2">Upload Blender Files</h2>
            <p className="text-sm text-gray-600 mb-3">
              Upload your .blend file and any assets it requires
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <div className="mt-2">
                  {selectedFiles.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium">Selected Files:</p>
                      <ul className="list-disc pl-5 mt-1">
                        {selectedFiles.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleFileUpload}
                disabled={uploadLoading || selectedFiles.length === 0}
                className={`px-4 py-2 rounded text-white ${
                  uploadLoading || selectedFiles.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploadLoading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
            
            {session.blendFile && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded">
                <p className="font-medium">Current Blend File: {session.blendFile}</p>
                <p className="text-sm">Your file has been uploaded and is ready for rendering.</p>
              </div>
            )}
          </div>
        )}

        {/* Render Results */}
        {(session.status === 'active' || session.status === 'completed') && renderResult && (
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-2">Render Results</h2>
            
            {renderResult.resourceUsage && (
              <div className="mb-4">
                <h3 className="font-medium">Resource Usage:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="text-sm font-medium">CPU</p>
                    <p className="text-lg">{renderResult.resourceUsage.cpuPercent || 0}%</p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="text-sm font-medium">Memory</p>
                    <p className="text-lg">{renderResult.resourceUsage.memoryUsage || 0} MB</p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="text-sm font-medium">GPU</p>
                    <p className="text-lg">{renderResult.resourceUsage.gpuUtilization || 0}%</p>
                  </div>
                </div>
              </div>
            )}
            
            {renderResult.renderedFiles && renderResult.renderedFiles.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium">Rendered Files:</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {renderResult.cloudinaryUrls && renderResult.cloudinaryUrls.length > 0 ? 
                    renderResult.cloudinaryUrls.map((item, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="p-2 bg-gray-50 border-b truncate text-sm">
                          {item.filename}
                        </div>
                        <div className="p-2 flex items-center justify-center">
                          <img 
                            src={item.url}
                            alt={item.filename}
                            className="max-h-48 max-w-full object-contain"
                          />
                        </div>
                      </div>
                    )) : 
                    renderResult.renderedFiles.map((file, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="p-2 bg-gray-50 border-b truncate text-sm">
                          {file}
                        </div>
                        <div className="p-2 flex items-center justify-center">
                          <img 
                            src={`${api.defaults.baseURL}/blendsession/${sessionId}/preview/${file}`}
                            alt={file}
                            className="max-h-48 max-w-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/200x150?text=Preview+Not+Available';
                            }}
                          />
                        </div>
                      </div>
                    ))
                  }
                </div>
                <button
                  onClick={handleDownloadOutput}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Download All Rendered Files
                </button>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium">Render Log:</h3>
              <pre className="mt-2 p-3 bg-gray-800 text-green-400 rounded overflow-auto max-h-64 text-sm">
                {renderResult.output || "No output available yet"}
              </pre>
            </div>
            
            {session.status === 'completed' && renderResult.cost > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded">
                <p className="font-medium">Final Cost: ${renderResult.cost.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}

        {/* Session Status */}
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">Session Timeline</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="relative pl-10 pb-4">
              <div className="absolute left-0 rounded-full bg-blue-500 text-white flex items-center justify-center w-8 h-8">1</div>
              <div>
                <p className="font-medium">Session Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            {session.status !== 'requested' && (
              <div className="relative pl-10 pb-4">
                <div className="absolute left-0 rounded-full bg-blue-500 text-white flex items-center justify-center w-8 h-8">2</div>
                <div>
                  <p className="font-medium">Session Activated</p>
                  <p className="text-sm text-gray-600">
                    {session.startTime && new Date(session.startTime).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {session.status === 'completed' && (
              <div className="relative pl-10">
                <div className="absolute left-0 rounded-full bg-green-500 text-white flex items-center justify-center w-8 h-8">3</div>
                <div>
                  <p className="font-medium">Session Completed</p>
                  <p className="text-sm text-gray-600">
                    {session.endTime && new Date(session.endTime).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {session.status === 'rejected' && (
              <div className="relative pl-10">
                <div className="absolute left-0 rounded-full bg-red-500 text-white flex items-center justify-center w-8 h-8">3</div>
                <div>
                  <p className="font-medium">Session Rejected</p>
                  <p className="text-sm text-gray-600">
                    The device owner has declined this render request.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;
