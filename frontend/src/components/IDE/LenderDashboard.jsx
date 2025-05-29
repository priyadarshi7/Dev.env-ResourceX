import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCpu, FiCheck, FiX, FiUser, FiClock, FiMonitor } from 'react-icons/fi';
import CodeEditor from './CodeEditor';

const LenderDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    fetchSessions();
    
    // Refresh sessions periodically
    const interval = setInterval(() => {
      fetchSessions();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/session/owner`);
      setSessions(response.data.sessions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId, status) => {
    try {
      await axios.put(`${API_BASE}/api/session/${sessionId}/status`, { status });
      
      // Update UI
      setSessions(sessions.map(session => 
        session._id === sessionId ? { ...session, status } : session
      ));
      
      // If accepting, set as active session
      if (status === 'active') {
        setActiveSession(sessionId);
      }
    } catch (error) {
      console.error('Error updating session status:', error);
      alert('Failed to update session status');
    }
  };

  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'active':
        return 'bg-green-900/50 text-green-300';
      case 'completed':
        return 'bg-blue-900/50 text-blue-300';
      case 'rejected':
        return 'bg-red-900/50 text-red-300';
      default:
        return 'bg-gray-900/50 text-gray-300';
    }
  };

  const handleSessionClick = (session) => {
    setActiveSession(session._id === activeSession ? null : session._id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">Device Rental Requests</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {sessions.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium text-white mb-2">No rental requests</h3>
              <p className="text-gray-400">
                You currently have no device rental requests or active sessions
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session._id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                {/* Session Header */}
                <div 
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FiMonitor className="text-indigo-400 text-xl" />
                      <h3 className="text-xl font-medium text-white">
                        {session.device.deviceName}
                      </h3>
                      <span className={`${getSessionStatusColor(session.status)} text-xs font-medium px-2.5 py-0.5 rounded`}>
                        {session.status}
                      </span>
                    </div>
                    
                    {/* Action buttons for requested sessions */}
                    {session.status === 'requested' && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSessionStatus(session._id, 'active');
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center text-sm"
                        >
                          <FiCheck className="mr-1" /> Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSessionStatus(session._id, 'rejected');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg flex items-center text-sm"
                        >
                          <FiX className="mr-1" /> Reject
                        </button>
                      </div>
                    )}
                    
                    {/* Complete button for active sessions */}
                    {session.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSessionStatus(session._id, 'completed');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center text-sm"
                      >
                        <FiCheck className="mr-1" /> Complete Session
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-gray-400">
                      <span className="font-medium text-gray-300">Renter:</span> {session.renter?.name || "Unknown"}
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium text-gray-300">Requested:</span> {new Date(session.createdAt).toLocaleString()}
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium text-gray-300">Language:</span> {session.language || "Python"}
                    </div>
                  </div>
                </div>
                
                {/* Expanded View with Code Editor */}
                {activeSession === session._id && (
                  <div className="border-t border-gray-700 p-4">
                    {session.status === 'active' ? (
                      <CodeEditor sessionId={session._id} isLender={true} />
                    ) : (
                      <div className="p-6 text-center">
                        {session.status === 'requested' && (
                          <p className="text-yellow-300">
                            Accept this request to start the computing session.
                          </p>
                        )}
                        {session.status === 'completed' && (
                          <p className="text-blue-300">
                            This session has been completed.
                          </p>
                        )}
                        {session.status === 'rejected' && (
                          <p className="text-red-300">
                            You rejected this session request.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LenderDashboard;