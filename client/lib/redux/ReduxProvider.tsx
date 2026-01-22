'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ReactNode, useEffect } from 'react';
import { fetchUser } from './slices/authSlice';

export function ReduxProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        store.dispatch(fetchUser());
    }, []);

  return <Provider store={store}>{children}</Provider>;
}