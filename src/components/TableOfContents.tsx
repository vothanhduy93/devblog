import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List } from 'lucide-react';
import GithubSlugger from 'github-slugger';

export default function TableOfContents({ content }: { content: string }) {
  const { t } = useTranslation();
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const slugger = new GithubSlugger();
    const regex = /^(#{2,3})\s+(.+)$/gm;
    let match;
    const extractedHeadings = [];
    
    // Strip out code blocks from content before parsing headings to avoid matching comments
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

    while ((match = regex.exec(contentWithoutCodeBlocks)) !== null) {
      extractedHeadings.push({
        level: match[1].length,
        text: match[2],
        id: slugger.slug(match[2])
      });
    }
    
    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    const scrollContainer = document.getElementById('scroll-container') || window;
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Window;
      const scrollPosition = target === window ? window.scrollY + 100 : (target as HTMLElement).scrollTop + 100;

      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];

      let currentId = '';
      for (const element of headingElements) {
        // Element's offsetTop is relative to its offsetParent. 
        // We might want to use getBoundingClientRect() to be safer if it's deeply nested.
        // A robust way to checking if it's in view:
        const topEdge = element.getBoundingClientRect().top;
        // The container top edge:
        const containerTop = target === window ? 0 : (target as HTMLElement).getBoundingClientRect().top;
        
        // Is it above our threshold from the top of the container?
        if (topEdge - containerTop <= 150) { 
          currentId = element.id;
        } else {
          break;
        }
      }
      
      if (currentId) {
        setActiveId(currentId);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-6 shadow-sm sticky top-8 max-h-[80vh] overflow-y-auto">
      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <List className="w-4 h-4" />
        {t('post.toc', 'Table of Contents')}
      </h4>
      <ul className="space-y-3">
        {headings.map(heading => (
          <li 
            key={heading.id} 
            className={`transition-colors text-sm ${heading.level === 3 ? 'ml-4' : ''}`}
          >
            <a 
              href={`#${heading.id}`}
              className={`${activeId === heading.id ? 'text-blue-500 font-medium' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                const scrollContainer = document.getElementById('scroll-container') || window;
                if (el) {
                   if (scrollContainer === window) {
                     const y = el.getBoundingClientRect().top + window.scrollY - 80;
                     window.scrollTo({top: y, behavior: 'smooth'});
                   } else {
                     const container = scrollContainer as HTMLElement;
                     const y = el.getBoundingClientRect().top + container.scrollTop - container.getBoundingClientRect().top - 80;
                     container.scrollTo({top: y, behavior: 'smooth'});
                   }
                }
                setActiveId(heading.id);
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
