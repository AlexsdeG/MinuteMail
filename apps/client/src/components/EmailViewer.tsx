import React from 'react';
import DOMPurify from 'dompurify';
import { Email } from '../types';
import Button from './Button';
import { Download, Trash2, ExternalLink } from 'lucide-react';

interface EmailViewerProps {
  email: Email;
  onDelete?: (emailId: string) => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({ email, onDelete }) => {
  
  const sanitize = (html: string) => {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      // Strict allow-list for email safety
      ALLOWED_TAGS: [
        'b', 'i', 'u', 'strong', 'em', 'p', 'br', 'div', 'span', 'a', 'img', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 
        'blockquote', 'pre', 'code', 'hr'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'target', 'alt', 'title', 'class', 'style', 
        'width', 'height', 'align', 'valign', 'colspan', 'rowspan'
      ],
      ADD_ATTR: ['target'], 
    });
  };

  // Modify links to open in new tab for safety
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if ('target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const handleDownload = () => {
    const content = email.bodyHtml || email.bodyText || '';
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${email.subject || 'email'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-slate-900 leading-snug break-words flex-1">
            {email.subject || '(No Subject)'}
          </h2>
          <div className="flex items-center space-x-2 shrink-0">
             <Button variant="outline" size="sm" onClick={handleDownload} title="Download HTML">
                <Download className="h-4 w-4 mr-2" /> Save
             </Button>
             {onDelete && (
               <Button variant="ghost" size="sm" onClick={() => onDelete(email.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Delete Email">
                  <Trash2 className="h-4 w-4" />
               </Button>
             )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-2">
           <div className="flex items-center text-slate-700">
             <span className="font-semibold mr-2">From:</span> 
             <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800 break-all">{email.sender}</span>
           </div>
           <div className="text-slate-500 whitespace-nowrap">
             {new Date(email.receivedAt).toLocaleString()}
           </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto bg-white">
        {email.bodyHtml ? (
          <div 
            className="prose max-w-none prose-slate prose-sm sm:prose-base prose-a:text-blue-600 hover:prose-a:underline font-sans break-words"
            dangerouslySetInnerHTML={{ __html: sanitize(email.bodyHtml) }} 
          />
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 bg-slate-50 p-4 rounded border border-slate-100">
            {email.bodyText || '(No Content)'}
          </pre>
        )}
      </div>
    </div>
  );
};

export default EmailViewer;
