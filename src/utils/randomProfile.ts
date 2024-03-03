import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export const getRandomAvatarUrl = async () => {
    const randomNumber = Math.floor(Math.random() * 11) + 1; 
    const storage = getStorage();
    const avatarRef = ref(storage, `/avatar-default/a_${randomNumber}.png`);
  
    try {
      const url = await getDownloadURL(avatarRef);
      return url;
    } catch (error) {
      console.error("Unable to retrieve profile URL", error);
      return null; 
    }
};