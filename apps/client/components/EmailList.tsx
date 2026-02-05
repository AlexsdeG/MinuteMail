import React from 'react';
import { formatBytes } from '../utils/format';
import { Mail, MailOpen, Trash2, Download, Check } from 'lucide-react';
import { Email } from '../types';
import { cn } from '../utils/cn';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface EmailListProps {
  emails: Email[];
  selectedIds: Set<string>;
  onSelect: (id: string, isSelected: boolean) => void;
  onSelectAll: (selectAll: boolean) => void;
  onEmailClick: (email: Email) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  activeEmailId?: string;
  isLoading?: boolean;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedIds,
  onSelect,
  onSelectAll,
  onEmailClick,
  onDelete,
  onDownload,
  activeEmailId,
  isLoading = false,
}) => {
  const allSelected = emails.length > 0 && selectedIds.size === emails.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < emails.length;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b bg-slate-50/50">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
            Messages
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b bg-slate-50/50">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
            Messages
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
          <div className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Waiting for emails...</p>
            <p className="text-xs mt-1">New emails will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with select all */}
      <div className="p-3 border-b bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSelectAll(!allSelected)}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              allSelected || someSelected
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-300 hover:border-slate-400'
            )}
          >
            {(allSelected || someSelected) && <Check className="h-3 w-3" />}
          </button>
          <span className="text-sm text-slate-600">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${emails.length} messages`}
          </span>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {emails.map((email) => {
          const isSelected = selectedIds.has(email.id);
          const isActive = activeEmailId === email.id;
          const isUnread = !email.isRead;

          return (
            <div
              key={email.id}
              className={cn(
                'group flex items-start p-3 cursor-pointer transition-colors',
                isActive ? 'bg-blue-50' : 'hover:bg-slate-50',
                isUnread && 'bg-blue-50/30'
              )}
              onClick={() => onEmailClick(email)}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(email.id, !isSelected);
                }}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 mr-3 transition-colors flex-shrink-0',
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300 group-hover:border-slate-400'
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </button>

              {/* Mail icon */}
              <div className="flex-shrink-0 mr-3 mt-0.5">
                {isUnread ? (
                  <Mail className="h-4 w-4 text-blue-600" />
                ) : (
                  <MailOpen className="h-4 w-4 text-slate-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span
                    className={cn(
                      'text-sm truncate',
                      isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'
                    )}
                  >
                    {email.sender}
                  </span>
                  <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                    {dayjs(email.receivedAt).fromNow()}
                  </span>
                </div>
                <p
                  className={cn(
                    'text-sm truncate',
                    isUnread ? 'text-slate-800' : 'text-slate-600'
                  )}
                >
                  {email.subject || '(no subject)'}
                </p>
                {email.sizeBytes && (
                  <span className="text-xs text-slate-400">
                    {formatBytes(email.sizeBytes)}
                  </span>
                )}
              </div>

              {/* Hover actions */}
              <div className="flex-shrink-0 ml-2 hidden group-hover:flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(email.id);
                  }}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(email.id);
                  }}
                  className="p-1.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmailList;
