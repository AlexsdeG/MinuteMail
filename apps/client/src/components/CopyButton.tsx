import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import Button from './Button';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

interface CopyButtonProps {
  text: string;
  className?: string;
  title?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, className, title = "Copy to clipboard" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events (e.g. in a table row)
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
      toast.error("Failed to copy");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleCopy} 
      title={title}
      className={cn("transition-all duration-200", copied ? "text-green-600" : "text-slate-400 hover:text-blue-600", className)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

export default CopyButton;
