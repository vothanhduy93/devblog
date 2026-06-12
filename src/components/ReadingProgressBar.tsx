import React, { useEffect, useState } from 'react';

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const [milestones, setMilestones] = useState<{ id: string, percentage: number, text: string }[]>([]);

  useEffect(() => {
    const scrollContainer = document.getElementById('scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      // The total scrollable height is scrollHeight - clientHeight
      const totalScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      if (totalScroll <= 0) {
        setProgress(0);
        return;
      }
      
      const currentScroll = scrollContainer.scrollTop;
      const percentage = (currentScroll / totalScroll) * 100;
      setProgress(Math.min(100, Math.max(0, percentage)));
    };

    const calculateMilestones = () => {
      const totalScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      if (totalScroll <= 0) return;
      
      const headings = scrollContainer.querySelectorAll('.prose h2, .prose h3');
      const newMilestones: { id: string, percentage: number, text: string }[] = [];
      const containerTop = scrollContainer.getBoundingClientRect().top;
      
      headings.forEach((heading) => {
        if (!heading.id) return;
        // Relative top inside the scrolling container
        const relativeTop = heading.getBoundingClientRect().top + scrollContainer.scrollTop - containerTop;
        
        // This is the target scroll position where this element reaches the top of the container
        // We match it with the TableOfContents activation offset (about 100px)
        const targetScrollTop = Math.max(0, relativeTop - 100);
        const percentage = (targetScrollTop / totalScroll) * 100;
        
        newMilestones.push({
          id: heading.id,
          text: heading.textContent || '',
          percentage: Math.min(100, Math.max(0, percentage))
        });
      });
      
      setMilestones(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newMilestones)) return prev;
        return newMilestones;
      });
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial calculation
    const initTimer = setTimeout(() => {
      calculateMilestones();
      handleScroll();
    }, 300);

    // Watch for DOM changes (content loading)
    const observer = new MutationObserver(() => {
      calculateMilestones();
      handleScroll();
    });
    observer.observe(scrollContainer, { childList: true, subtree: true, characterData: true });

    // Re-calculate on window resize
    const handleResize = () => {
      calculateMilestones();
      handleScroll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initTimer);
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-3 z-[100] group">
      {/* Background track */}
      <div className="absolute top-0 left-0 w-full h-1 group-hover:h-1.5 transition-all duration-200 ease-out bg-transparent" />
      
      {/* Progress fill */}
      <div 
        className="absolute top-0 left-0 h-1 group-hover:h-1.5 transition-all duration-200 ease-out"
        style={{ 
          width: `${progress}%`,
          backgroundImage: 'linear-gradient(to right, #0ea5e9, #3b82f6, #8b5cf6, #ec4899)',
          backgroundSize: '100vw 100%'
        }}
      />

      {/* Milestones */}
      {milestones.map((m, i) => {
        const isActive = progress >= m.percentage;
        return (
          <div 
            key={`${m.id}-${i}`}
            className={`absolute top-0 group/milestone cursor-pointer transition-all duration-300 w-1.5 h-1 group-hover:h-1.5 flex items-center justify-center`}
            style={{ left: `${m.percentage}%`, transform: 'translateX(-50%)' }}
            onClick={(e) => {
              e.stopPropagation();
              const el = document.getElementById(m.id);
              const scrollContainer = document.getElementById('scroll-container');
              if (el && scrollContainer) {
                const y = el.getBoundingClientRect().top + scrollContainer.scrollTop - scrollContainer.getBoundingClientRect().top - 80;
                scrollContainer.scrollTo({top: y, behavior: 'smooth'});
              }
            }}
          >
            {/* Visual indicator (lights up) */}
            <div className={`w-1 h-1 group-hover:h-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]' : 'bg-white/30 dark:bg-black/30'}`} />

            {/* Tooltip on hover */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/milestone:opacity-100 transition-opacity whitespace-nowrap bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none z-[110]">
              {m.text}
            </div>
          </div>
        );
      })}

      {/* Global Progress Tooltip */}
      <div 
        className="absolute top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none transform -translate-x-1/2 z-[105]"
        style={{ left: `${Math.max(2, Math.min(98, progress))}%` }}
      >
        {Math.round(progress)}%
      </div>
    </div>
  );
}
