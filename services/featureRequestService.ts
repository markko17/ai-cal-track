import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  userId: string;
  upvotes: string[]; // Array of user IDs who upvoted
  createdAt: any;
}

const COLLECTION_NAME = 'featureRequests';

/**
 * Add a new feature request to the database.
 */
export const addFeatureRequest = async (
  title: string,
  description: string,
  userId: string
): Promise<string> => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(colRef, {
      title,
      description,
      userId,
      upvotes: [userId], // Automatically upvote your own request
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding feature request:', error);
    throw error;
  }
};

/**
 * Toggle an upvote for a specific feature request by a user.
 */
export const toggleUpvote = async (featureId: string, userId: string): Promise<void> => {
  if (!featureId || !userId) return;

  try {
    const docRef = doc(db, COLLECTION_NAME, featureId);
    await runTransaction(db, async (transaction) => {
      const featureDoc = await transaction.get(docRef);
      if (!featureDoc.exists()) {
        throw new Error('Feature request does not exist!');
      }

      const data = featureDoc.data();
      const upvotes: string[] = data.upvotes || [];

      let newUpvotes;
      if (upvotes.includes(userId)) {
        // Remove upvote
        newUpvotes = upvotes.filter((id) => id !== userId);
      } else {
        // Add upvote
        newUpvotes = [...upvotes, userId];
      }

      transaction.update(docRef, { upvotes: newUpvotes });
    });
  } catch (error) {
    console.error('Error toggling upvote:', error);
    throw error;
  }
};

/**
 * Get all feature requests, sorted by upvote count descending.
 */
export const getFeatureRequests = async (): Promise<FeatureRequest[]> => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const features: FeatureRequest[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      features.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        userId: data.userId,
        upvotes: data.upvotes || [],
        createdAt: data.createdAt,
      });
    });

    // Sort by upvotes length descending
    features.sort((a, b) => b.upvotes.length - a.upvotes.length);

    return features;
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    throw error;
  }
};
