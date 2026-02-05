import React from 'react';
import { 
  Trash2, 
  Download, 
  Copy, 
  RefreshCw, 
  Clock, 
  PauseCircle, 
  PlayCircle,
  ChevronDown 
} from 'lucide-react';
import Button from './Button';
import CircularProgressTimer from './CircularProgressTimer';
import { ExtendDuration } from '../types';

interface InboxToolbarProps {
  aliasAddress: string;
  expiresAt: string;
  createdAt?: string;
  isPaused?: boolean;
  selectedCount?: number;
  onRefresh: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onExtend: (duration: ExtendDuration) => void;
  onTogglePause: () => void;
  isLoading?: boolean;
}

const extendOptions: { value: ExtendDuration; label: string }[] = [
  { value: '10min', label: '+10 min' },
  { value: '1hour', label: '+1 hour' },
  { value: '1day', label: '+1 day' },
  { value: '1week', label: '+1 week' },
  { value: '1month', label: '+1 month' },
];

const InboxToolbar: React.FC<InboxToolbarProps> = ({
  aliasAddress,
  expiresAt,
  createdAt,
  isPaused = false,
  selectedCount = 0,
  onRefresh,
  onCopy,
  onDelete,
  onDownload,
  onExtend,
  onTogglePause,
  isLoading = false,
}) => {
  const [showExtendMenu, setShowExtendMenu] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(aliasAddress);
    onCopy();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Top row: Email address and timer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-slate-100">
        <div className="flex flex-col space-y-1 mb-3 md:mb-0">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Temporary Email Address
          </span>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight font-mono">
              {aliasAddress}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy to clipboard">
              <Copy className="h-4 w-4" />
            </Button>
            {isPaused && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Paused
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <CircularProgressTimer
            expiresAt={expiresAt}
            createdAt={createdAt}
            size="md"
          />
        </div>
      </div>

      {/* Bottom row: Action buttons */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/50">
        {/* Selection actions */}
        {selectedCount > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title={`Delete ${selectedCount} selected`}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete ({selectedCount})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              title={`Download ${selectedCount} selected`}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
            <div className="w-px h-5 bg-slate-300 mx-1" />
          </>
        )}

        {/* Refresh */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh inbox"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {/* Pause/Resume */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePause}
          className={isPaused ? 'text-green-600 hover:text-green-700' : 'text-amber-600 hover:text-amber-700'}
          title={isPaused ? 'Resume receiving emails' : 'Pause receiving emails'}
        >
          {isPaused ? (
            <>
              <PlayCircle className="h-4 w-4 mr-1.5" />
              Resume
            </>
          ) : (
            <>
              <PauseCircle className="h-4 w-4 mr-1.5" />
              Pause
            </>
          )}
        </Button>

        {/* Extend time dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExtendMenu(!showExtendMenu)}
            title="Extend time"
          >
            <Clock className="h-4 w-4 mr-1.5" />
            Extend
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          
          {showExtendMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowExtendMenu(false)} 
              />
              {/* Menu */}
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                {extendOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onExtend(option.value);
                      setShowExtendMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxToolbar;
