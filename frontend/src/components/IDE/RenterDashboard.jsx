import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCpu, FiClock, FiDollarSign, FiMessageSquare } from 'react-icons/fi';
import CodeEditor from './CodeEditor';
import ProofDetails from './ProofDetails ';
import useZKProofManager from './ZKProofManager';

const RenterDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const { lastProof } = useZKProofManager();

  const API_BASE = "http://localhost:5000"

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/session/renter`);
      setSessions(response.data.sessions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  const calculateSessionDuration = (session) => {
    if (!session.startTime) return 'Not started';
    
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  const calculateCost = (session) => {
    if (!session.device || !session.startTime) return '$0.00';
    
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    
    const diffHrs = (end - start) / (1000 * 60 * 60);
    const cost = diffHrs * session.device.price;
    
    return `$${cost.toFixed(2)}`;
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
      <h2 className="text-2xl font-bold text-white mb-6">My Computing Sessions</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {sessions.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium text-white mb-2">No sessions found</h3>
              <p className="text-gray-400">
                Rent a device from the marketplace to start a computing session
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
                      <FiCpu className="text-indigo-400 text-xl" />
                      <h3 className="text-xl font-medium text-white">
                        {session.device.deviceName}
                      </h3>
                      <span className={`${getSessionStatusColor(session.status)} text-xs font-medium px-2.5 py-0.5 rounded`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {calculateCost(session)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-gray-400">
                      <span className="font-medium text-gray-300">Device Type:</span> {session.device.deviceType}
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium text-gray-300">Duration:</span> {calculateSessionDuration(session)}
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium text-gray-300">Status:</span> {session.status}
                    </div>
                  </div>
                </div>
                
                {/* Expanded View with ZK Proof and Code Editor */}
                {activeSession === session._id && session.status === 'active' && (
                  <div className="border-t border-gray-700 p-4">
                    {/* Display ZK Proof if available */}
                    {lastProof && activeSession === session._id && (
                      <ProofDetails proof={lastProof} />
                    )}
                    
                    {/* Code Editor */}
                    <CodeEditor sessionId={session._id} isLender={false} />
                  </div>
                )}
                
                {/* Status Message for non-active sessions */}
                {activeSession === session._id && session.status !== 'active' && (
                  <div className="border-t border-gray-700 p-6 text-center">
                    {session.status === 'requested' && (
                      <p className="text-yellow-300">
                        Waiting for device owner to accept your request.
                      </p>
                    )}
                    {session.status === 'completed' && (
                      <p className="text-blue-300">
                        This session has been completed.
                      </p>
                    )}
                    {session.status === 'rejected' && (
                      <p className="text-red-300">
                        This session request was rejected by the device owner.
                      </p>
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

export default RenterDashboard;