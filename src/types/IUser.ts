export interface IUser {
    uid: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    following: string[];  
    followers: string[]; 
  }