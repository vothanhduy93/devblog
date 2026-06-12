import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function logClientError(error: Error, info: any) {
  console.error("Client Error Caught by Boundary:", error, info);
  try {
    await addDoc(collection(db, 'client_errors'), {
      message: error.message,
      stack: error.stack,
      info: JSON.stringify(info),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  } catch (e) {
    console.error("Failed to log error to Firestore:", e);
  }
}
