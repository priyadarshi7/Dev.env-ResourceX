import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlay, FiSave, FiShare2, FiCpu, FiShield } from 'react-icons/fi';
import useZKProofManager from './ZKProofManager';

const CodeEditor = ({ sessionId, isLender }) => {
  const [code, setCode] = useState('# Write your Python code here\n\n');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const API_BASE = "http://localhost:5000";
  
  // ZK Proof integration
  const { generateProof, verificationStatus, lastProof } = useZKProofManager();

  useEffect(() => {
    // Clean up interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Fetch initial code if available
  useEffect(() => {
    if (sessionId) {
      fetchOutput();
    }
  }, [sessionId]);

  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    } else {
      const interval = setInterval(() => {
        fetchOutput();
      }, 3000); // Refresh every 3 seconds
      setRefreshInterval(interval);
    }
    setAutoRefresh(!autoRefresh);
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const saveCode = async () => {
    try {
      // Create a file blob
      const blob = new Blob([code], { type: 'text/plain' });
      const file = new File([blob], 'code.py', { type: 'text/plain' });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the code
      const response = await axios.post(`${API_BASE}/api/session/${sessionId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Show success message
      console.log('Code saved successfully:', response.data);
      setOutput('Code saved successfully!');
      return response.data;
    } catch (error) {
      console.error('Error saving code:', error);
      setOutput('Error: Failed to save code');
      throw error;
    }
  };

  const runCode = async () => {
    try {
      setIsRunning(true);
      setOutput('Running code...');
      
      // Save code first
      await saveCode();
      
      // Generate ZK proof for this execution
      const proof = await generateProof(code, sessionId);
      
      // Wait for code to execute and fetch output
      setTimeout(() => {
        fetchOutput();
        
        // If we have a proof, show that execution was verified
        if (proof) {
          setOutput(prev => 
            `${prev}\n\n----- EXECUTION VERIFIED -----\nZK Proof Generated: ${proof.signature.slice(0,16)}...`
          );
        }
      }, 2000);
    } catch (error) {
      console.error('Error running code:', error);
      setOutput('Error: Failed to run code');
      setIsRunning(false);
    }
  };

  const fetchOutput = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/session/${sessionId}/result`);
      if (response.data && response.data.success) {
        setOutput(response.data.result || 'No output yet.');
      } else {
        setOutput('No output available yet.');
      }
      setIsRunning(false);
    } catch (error) {
      console.error('Error fetching output:', error);
      setOutput('Error: Failed to fetch execution result');
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 mb-6">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <FiCpu className="text-indigo-400 mr-2" />
          <span className="text-white font-medium">Python Code Editor</span>
          {isLender && <span className="ml-3 bg-indigo-900/50 text-indigo-300 text-xs font-medium px-2.5 py-0.5 rounded">Lender View</span>}
        </div>
        <div className="flex gap-2">
          {/* ZK Proof Status Indicator */}
          {verificationStatus === 'verified' && (
            <div className="bg-green-900/50 text-green-300 px-3 py-1 rounded text-sm flex items-center">
              <FiShield className="mr-1" /> ZK Verified
            </div>
          )}
          {verificationStatus === 'generating' && (
            <div className="bg-yellow-900/50 text-yellow-300 px-3 py-1 rounded text-sm flex items-center">
              <div className="animate-spin h-4 w-4 mr-1 border-2 border-yellow-300 rounded-full border-t-transparent"></div>
              Generating Proof
            </div>
          )}
          
          <button
            onClick={toggleAutoRefresh}
            className={`${
              autoRefresh ? 'bg-green-600' : 'bg-gray-700'
            } text-white px-3 py-1 rounded text-sm flex items-center`}
          >
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </button>
          {!isLender && (
            <>
              <button
                onClick={saveCode}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                <FiSave className="mr-1" /> Save
              </button>
              <button
                onClick={runCode}
                disabled={isRunning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                <FiPlay className="mr-1" /> {isRunning ? 'Running...' : 'Run'}
              </button>
            </>
          )}
          {isLender && (
            <button
              onClick={fetchOutput}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm flex items-center"
            >
              <FiPlay className="mr-1" /> Refresh Output
            </button>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex flex-col md:flex-row h-[500px]">
        {/* Code Editor */}
        <div className="w-full md:w-1/2 h-full">
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="w-full h-full bg-gray-950 text-gray-200 p-4 font-mono text-sm focus:outline-none resize-none border-r border-gray-700"
            spellCheck="false"
            placeholder="Write your Python code here..."
            disabled={isLender} // Lenders can't modify the code
          />
        </div>

        {/* Output Terminal */}
        <div className="w-full md:w-1/2 h-full">
          <div className="bg-black text-gray-300 p-2 text-xs">Terminal Output</div>
          <div className="bg-black text-green-400 p-4 font-mono text-sm h-[calc(100%-28px)] overflow-auto whitespace-pre">
            {isRunning ? 'Running code...' : output || 'No output yet. Run your code to see results.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;