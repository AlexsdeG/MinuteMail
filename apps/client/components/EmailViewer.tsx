import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { 
  Download, 
  Trash2, 
  Mail, 
  MailOpen, 
  AlertTriangle, 
  ExternalLink, 
  Clock,
  User
} from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { Email } from '../types';
import { formatBytes } from '../utils/format';
import dayjs from 'dayjs';

interface EmailViewerProps {
  email: Email | null;
  aliasAddress?: string;
  aliasExpiresAt?: string;
  onMarkRead: (id: string, isRead: boolean) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onClose?: () => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  aliasAddress,
  aliasExpiresAt,
  onMarkRead,
  onDelete,
  onDownload,
  onClose,
}) => {
  const [linksEnabled, setLinksEnabled] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  // Sanitize HTML and optionally disable links
  const sanitizedHtml = useMemo(() => {
    if (!email?.bodyHtml) return null;

    const clean = DOMPurify.sanitize(email.bodyHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'img',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'target'],
      ALLOW_DATA_ATTR: false,
    });

    if (!linksEnabled) {
      // Replace links with disabled versions
      return clean.replace(
        /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1([^>]*)>/gi,
        '<a href="javascript:void(0)" data-original-href="$2" class="text-blue-600 opacity-50 cursor-not-allowed" onclick="return false;"$3>'
      );
    }

    return clean;
  }, [email?.bodyHtml, linksEnabled]);

  // Check if email contains links
  const hasLinks = useMemo(() => {
    if (!email?.bodyHtml) return false;
    return /<a\s+(?:[^>]*?\s+)?href=/i.test(email.bodyHtml);
  }, [email?.bodyHtml]);

  const handleLinkClick = (e: React.MouseEvent) => {
    if (!linksEnabled) {
      const target = e.target as HTMLElement;
      const originalHref = target.getAttribute('data-original-href');
      if (originalHref) {
        e.preventDefault();
        setPendingLink(originalHref);
      }
    }
  };

  const confirmOpenLink = () => {
    if (pendingLink) {
      window.open(pendingLink, '_blank', 'noopener,noreferrer');
      setPendingLink(null);
    }
  };

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 flex flex-col items-center">
          <Mail className="h-12 w-12 mb-2 opacity-20" />
          <p>Select an email to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 mb-1 truncate">
              {email.subject || '(no subject)'}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1.5 text-slate-400" />
                <span className="truncate">{email.sender}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
                <span>{dayjs(email.receivedAt).format('MMM D, YYYY h:mm A')}</span>
              </div>
              {email.sizeBytes && (
                <span className="text-slate-400">{formatBytes(email.sizeBytes)}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkRead(email.id, !email.isRead)}
              title={email.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              {email.isRead ? (
                <Mail className="h-4 w-4" />
              ) : (
                <MailOpen className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(email.id)}
              title="Download email"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(email.id)}
              title="Delete email"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Link warning banner */}
        {hasLinks && !linksEnabled && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mt-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-sm text-amber-800">
                Links are disabled for your safety. Click to enable if you trust this sender.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLinksEnabled(true)}
              className="ml-4"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Enable Links
            </Button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {sanitizedHtml ? (
          <div
            className="prose prose-slate max-w-none email-content"
            onClick={handleLinkClick}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : email.bodyText ? (
          <pre className="whitespace-pre-wrap font-sans text-slate-700 text-sm">
            {email.bodyText}
          </pre>
        ) : (
          <p className="text-slate-400 italic">No content</p>
        )}
      </div>

      {/* Link confirmation modal */}
      <Modal
        isOpen={!!pendingLink}
        onClose={() => setPendingLink(null)}
        title="Open External Link"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingLink(null)}>
              Cancel
            </Button>
            <Button onClick={confirmOpenLink}>
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Open Link
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-700 mb-2">
                You are about to open an external link. Be cautious as this could be a phishing attempt.
              </p>
              <div className="bg-slate-100 rounded p-3 break-all text-sm font-mono text-slate-600">
                {pendingLink}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* CSS for email content */}
      <style>{`
        .email-content img {
          max-width: 100%;
          height: auto;
        }
        .email-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .email-content table {
          border-collapse: collapse;
        }
        .email-content td, .email-content th {
          border: 1px solid #e2e8f0;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default EmailViewer;
