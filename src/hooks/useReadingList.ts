import { useState, useEffect } from 'react';

export interface SavedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: number;
}

export function useReadingList() {
  const [readingList, setReadingList] = useState<SavedPost[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('devblog_reading_list');
      if (stored) {
        setReadingList(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load reading list', e);
    }
  }, []);

  const saveList = (list: SavedPost[]) => {
    setReadingList(list);
    try {
      localStorage.setItem('devblog_reading_list', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save reading list', e);
    }
  };

  const isSaved = (postId: string) => {
    return readingList.some(p => p.id === postId);
  };

  const toggleSave = (post: SavedPost) => {
    if (isSaved(post.id)) {
      saveList(readingList.filter(p => p.id !== post.id));
    } else {
      saveList([...readingList, post]);
    }
  };

  return { readingList, isSaved, toggleSave };
}
