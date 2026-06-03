import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Feed } from 'feed';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ========================================
// MOCK HEADLESS CMS DATA (In-Memory)
// ========================================

const mockPosts = [
  {
    id: '1',
    title: 'Building a High-Performance Next.js Architecture',
    slug: 'high-performance-nextjs',
    excerpt: 'Exploring the best practices for caching, SEO, and static generation in modern web apps.',
    content: `
# Introduction to Next.js Performance

When building modern web applications, performance is not just an optional improvement—it is a core feature that affects user retention and SEO ranking.

Next.js provides an incredible foundation, but true optimization requires deep knowledge.

## Caching Strategies

React Server Components (RSC) changed how we cache data. Stale-While-Revalidate (SWR) patterns are now built into the framework directly.

### Code Example
\`\`\`typescript
async function getData() {
  const res = await fetch('https://api.example.com/data', { next: { revalidate: 3600 } });
  return res.json();
}
\`\`\`

## Advanced SEO

Implementing structured JSON-LD format provides search engines with context about your entities. With \`react-helmet-async\` or native \`metadata\` exports, your sites will index instantly.
    `,
    date: '2026-06-01T10:00:00Z',
    author: 'Duy Vo',
    tags: ['Next.js', 'Performance', 'React'],
    readTime: 5
  },
  {
    id: '2',
    title: 'Mastering Tailwind CSS for Scalable UI',
    slug: 'mastering-tailwind-css',
    excerpt: 'How to use Tailwind utility classes efficiently across large teams without creating a mess.',
    content: `
# Scaling Tailwind CSS

Tailwind CSS has become the industry standard replacing complex styled-components architectures.

## The Problem
When components grow, you might see 50+ classes cluttering the \`className\` attribute.

## The Solution
We use utilities like \`clsx\` and \`tailwind-merge\` to dynamically compile robust class strings.

### Snippet
\`\`\`tsx
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
\`\`\`

Using \`cn()\` allows component developers to safely override default padding or coloring securely.
    `,
    date: '2026-05-25T14:30:00Z',
    author: 'Duy Vo',
    tags: ['Tailwind', 'CSS', 'UI'],
    readTime: 4
  }
];

let commentsDb: Record<string, any[]> = {
  '1': [
    { id: 1, author: 'Alex', text: 'Great article on RSC! Changed my perspective completely.', date: '2026-06-02T10:00:00Z' }
  ]
};

// ========================================
// API ENDPOINTS
// ========================================

// 1. Get All Posts (with basic standard caching header)
app.get('/api/posts', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
  const sorted = [...mockPosts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(sorted);
});

// 2. Get Post by Slug
app.get('/api/posts/:slug', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  const post = mockPosts.find(p => p.slug === req.params.slug);
  if (!post) {
     res.status(404).json({ error: 'Post not found' });
     return;
  }
  res.json(post);
});

// 3. Search Posts API
app.get('/api/search', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase();
  if (!q) {
     res.json([]);
     return;
  }
  const results = mockPosts.filter(p => 
    p.title.toLowerCase().includes(q) || 
    p.excerpt.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
  res.json(results);
});

// 4. RSS Feed Endpoint
app.get('/api/rss', (req, res) => {
  const feed = new Feed({
    title: "DevBlog Pro",
    description: "Professional personal blog with Headless CMS, SEO and Real-time capabilities",
    id: "http://localhost:3000/",
    link: "http://localhost:3000/",
    language: "en",
    updated: new Date(),
    copyright: "All rights reserved 2026, Duy Vo",
    author: {
      name: "Duy Vo",
      email: "hcmc.duyvo@gmail.com"
    }
  });

  mockPosts.forEach(post => {
    feed.addItem({
      title: post.title,
      id: `http://localhost:3000/post/${post.slug}`,
      link: `http://localhost:3000/post/${post.slug}`,
      description: post.excerpt,
      content: post.content,
      author: [
        {
          name: post.author,
          email: "hcmc.duyvo@gmail.com"
        }
      ],
      date: new Date(post.date),
    });
  });

  res.set('Content-Type', 'text/xml');
  res.send(feed.rss2());
});

// 5. Comments endpoints (simulating 3rd party like Giscus/Disqus)
app.get('/api/comments/:postId', (req, res) => {
  const postId = req.params.postId;
  res.json(commentsDb[postId] || []);
});

app.post('/api/comments/:postId', (req, res) => {
  const postId = req.params.postId;
  const { author, text } = req.body;
  if (!commentsDb[postId]) commentsDb[postId] = [];
  const newComment = { id: Date.now(), author, text, date: new Date().toISOString() };
  commentsDb[postId].push(newComment);
  
  // Trigger SSE push notification for new comment
  notifyClients({ type: 'NEW_COMMENT', postId, snippet: `${author}: ${text.substring(0,20)}...` });
  
  res.json(newComment);
});

// 6. Real-time Push Notifications (SSE)
let sseClients: any[] = [];
app.get('/api/notifications', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  
  // Send connection ack
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE connection established' })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

function notifyClients(data: any) {
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// ========================================
// VITE MIDDLEWARE & SPA FALLBACK
// ========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
