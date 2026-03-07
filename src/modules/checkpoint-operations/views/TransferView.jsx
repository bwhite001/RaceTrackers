import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import SendPanel from '../components/transfer/SendPanel';
import ReceivePanel from '../components/transfer/ReceivePanel';
import useRaceMaintenanceStore from '../../race-maintenance/store/raceMaintenanceStore';

const TABS = [
  { id: 'send', label: 'Send' },
  { id: 'receive', label: 'Receive' },
];

/**
 * Full-screen transfer view for device-to-device checkpoint data exchange.
 * Route: /checkpoint/:checkpointId/transfer
 */
export default function TransferView() {
  const { checkpointId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('send');
  const { currentRace } = useRaceMaintenanceStore();

  const checkpointNumber = parseInt(checkpointId, 10);
  const raceId = currentRace?.id ?? null;

  const handleBack = () => navigate(`/checkpoint/${checkpointId}`, { replace: true });

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <button
          onClick={handleBack}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Back to checkpoint"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Transfer Data</p>
          <p className="text-xs text-gray-400 leading-tight">Checkpoint {checkpointNumber}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-y-auto relative">
        {raceId == null ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No active race loaded.</p>
          </div>
        ) : activeTab === 'send' ? (
          <SendPanel
            raceId={raceId}
            checkpointNumber={checkpointNumber}
            onDone={handleBack}
          />
        ) : (
          <ReceivePanel
            raceId={raceId}
            checkpointNumber={checkpointNumber}
            onDone={handleBack}
          />
        )}
      </div>
    </div>
  );
}
