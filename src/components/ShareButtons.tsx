import React from 'react';
import { Twitter, Facebook, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mr-2">Share:</span>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-[#1DA1F2] hover:text-white dark:hover:bg-[#1DA1F2] dark:hover:text-white transition-colors"
        aria-label="Share on X (Twitter)"
      >
        <Twitter className="w-4 h-4" fill="currentColor" />
      </a>
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-[#0A66C2] hover:text-white dark:hover:bg-[#0A66C2] dark:hover:text-white transition-colors"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" fill="currentColor" />
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] dark:hover:text-white transition-colors"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4" fill="currentColor" />
      </a>
      <button
        onClick={copyToClipboard}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
        aria-label="Copy link"
      >
        {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}
