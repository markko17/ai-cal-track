import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface UserProfileData {
  uid: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  authProvider?: string;
}

/**
 * Saves user basic information in Firebase Firestore database if it does not already exist.
 * If user already exists in Firebase, syncs missing fields without overwriting user data.
 */
export const saveUserToFirestore = async (userData: UserProfileData) => {
  if (!userData?.uid) return;

  try {
    const userRef = doc(db, 'users', userData.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // User does not exist in Firebase -> Create new user document
      const newUserPayload = {
        uid: userData.uid,
        email: userData.email || '',
        fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Fitness Enthusiast',
        imageUrl: userData.imageUrl || '',
        authProvider: userData.authProvider || 'clerk',
        dailyCalorieGoal: 2000,
        macroGoals: {
          protein: 150,
          carbs: 200,
          fat: 65,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, newUserPayload);
      console.log('🔥 [Firebase] New user information saved to Firestore:', userData.uid);
      return { status: 'created', data: newUserPayload };
    } else {
      // User already exists in Firebase -> Sync updated/missing fields
      const existingData = userSnap.data();
      const updates: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (userData.email && !existingData.email) updates.email = userData.email;
      if (userData.fullName && !existingData.fullName) updates.fullName = userData.fullName;
      if (userData.imageUrl && !existingData.imageUrl) updates.imageUrl = userData.imageUrl;

      await setDoc(userRef, updates, { merge: true });
      console.log('🔥 [Firebase] User information already exists in Firestore:', userData.uid);
      return { status: 'exists', data: existingData };
    }
  } catch (error) {
    console.error('❌ [Firebase] Error saving user profile to Firestore:', error);
  }
};

