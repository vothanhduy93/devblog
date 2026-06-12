import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, setDoc, where, onSnapshot, increment } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { db, auth, handleFirestoreError, OperationType, analytics } from '../firebase';

export async function fetchPosts() {
  try {
    const q = query(collection(db, 'posts'));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, views: 0, ...doc.data() }));
    return posts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'posts');
    return [];
  }
}

export async function trackPageView(postId: string, postTitle: string) {
  try {
    if (analytics) {
      logEvent(analytics, 'page_view', { page_title: postTitle });
    }
    await updateDoc(doc(db, 'posts', postId), {
      views: increment(1)
    });
    
    // Also log engagement for charts (group by day)
    const today = new Date().toISOString().split('T')[0];
    await setDoc(doc(db, 'analytics', `views_${today}`), {
      date: today,
      views: increment(1),
      timestamp: new Date().toISOString()
    }, { merge: true });

  } catch (err) {
    console.error('Failed to track view', err);
  }
}

export async function fetchAuthorByName(name: string) {
  try {
    const q = query(collection(db, 'authors'), where('name', '==', name));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function fetchPostsByAuthor(authorName: string) {
  try {
    const q = query(collection(db, 'posts'), where('author', '==', authorName));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, views: 0, ...doc.data() }));
    return posts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'posts');
    return [];
  }
}

export async function fetchAnalytics() {
  try {
    const q = query(collection(db, 'analytics'), orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchPostBySlug(slug: string) {
  try {
    const q = query(collection(db, 'posts'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function createPost(data: any) {
  try {
    const newId = Date.now().toString();
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const postDate = new Date().toISOString();
    
    await setDoc(doc(db, 'posts', newId), {
      ...data,
      slug,
      date: postDate,
      author: data.author || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Admin',
      readTime: data.readTime || Math.max(1, Math.ceil(data.content.length / 500))
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'posts');
  }
}

export async function updatePost(id: string, data: any) {
  try {
    const updateData = {
      ...data,
      readTime: data.readTime || (data.content ? Math.max(1, Math.ceil(data.content.length / 500)) : undefined)
    };
    // remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    await updateDoc(doc(db, 'posts', id), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
  }
}

export async function deletePost(id: string) {
  try {
    await deleteDoc(doc(db, 'posts', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
  }
}

export function subscribeToComments(postId: string, callback: (comments: any[]) => void) {
  const pathForOnSnapshot = `posts/${postId}/comments`;
  const q = query(collection(db, pathForOnSnapshot));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    comments.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    callback(comments);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

export async function createComment(postId: string, data: any) {
  try {
    const commentId = Date.now().toString();
    await setDoc(doc(db, `posts/${postId}/comments`, commentId), {
      ...data,
      date: new Date().toISOString(),
      postId
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${postId}/comments`);
  }
}

export async function searchPosts(queryStr: string) {
  try {
    const posts = await fetchPosts();
    const q = queryStr.toLowerCase();
    if (!q) return [];
    return posts.filter((p: any) => 
      (p.title || '').toLowerCase().includes(q) || 
      (p.excerpt || '').toLowerCase().includes(q) ||
      (p.tags || []).some((t: string) => t.toLowerCase().includes(q))
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function subscribeNewsletter(email: string) {
  try {
    const subscriberId = Date.now().toString() + Math.random().toString(36).substring(7);
    await setDoc(doc(db, 'subscribers', subscriberId), {
      email,
      subscribeDate: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return { success: false, error };
  }
}

export async function fetchSubscribers() {
  try {
    const q = query(collection(db, 'subscribers'), orderBy('subscribeDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function saveDraft(data: any) {
  try {
    const draftId = 'current_draft'; // we can just overwrite the same draft
    await setDoc(doc(db, 'drafts', draftId), {
      ...data,
      lastSaved: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

