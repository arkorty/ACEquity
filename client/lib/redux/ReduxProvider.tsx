'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ReactNode, useEffect } from 'react';
import { parseCookies } from 'nookies';
import { fetchUser, setLoading } from './slices/authSlice';

export function ReduxProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        const cookies = parseCookies();
        const userid = cookies.userid;
        if (userid) {
            store.dispatch(fetchUser(userid));
        } else {
            store.dispatch(setLoading(false));
        }
    }, []);

  return <Provider store={store}>{children}</Provider>;
}