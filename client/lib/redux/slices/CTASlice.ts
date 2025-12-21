import { createSlice } from '@reduxjs/toolkit';

interface CTAState {
  isLoginPopupOpen: boolean;
}

const initialState: CTAState = {
  isLoginPopupOpen: false,
};

const CTASlice = createSlice({
  name: 'cta',
  initialState,
  reducers: {
    openLoginPopup: (state) => {
      state.isLoginPopupOpen = true;
    },
    closeLoginPopup: (state) => {
      state.isLoginPopupOpen = false;
    },
  },
});

export const { openLoginPopup, closeLoginPopup } = CTASlice.actions;
export default CTASlice.reducer;