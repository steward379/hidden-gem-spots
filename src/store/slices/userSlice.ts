// // src/slices/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from 'firebase/auth';

export enum LoginMethod {
  None,
  Email,
  Google,
}

interface UserState {
  user: User | null;
  loginMethod: LoginMethod;
}

const initialState: UserState = {
  user: null,
  loginMethod: LoginMethod.None,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setLoginMethod: (state, action: PayloadAction<LoginMethod>) => {
      state.loginMethod = action.payload;
    },
  },
});

export const { setUser, setLoginMethod } = userSlice.actions;

export default userSlice.reducer;
