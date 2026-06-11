import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export async function fetchPosts() {
  try {
    const q = query(collection(db, 'posts'));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return posts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'posts');
    return [];
  }
}

export async function fetchPostBySlug(slug: string) {
  try {
    const posts = await fetchPosts();
    return posts.find((p: any) => p.slug === slug);
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

export async function fetchComments(postId: string) {
  try {
    const q = query(collection(db, `posts/${postId}/comments`));
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return comments.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `posts/${postId}/comments`);
    return [];
  }
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
  const posts = await fetchPosts();
  const q = queryStr.toLowerCase();
  if (!q) return [];
  return posts.filter((p: any) => 
    (p.title || '').toLowerCase().includes(q) || 
    (p.excerpt || '').toLowerCase().includes(q) ||
    (p.tags || []).some((t: string) => t.toLowerCase().includes(q))
  );
}
