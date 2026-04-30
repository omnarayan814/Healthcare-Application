import { useEffect } from 'react';
import { subscribeToAuthState } from '@/services/firebase';
import { useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/authSlice';

export function useAuthListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsub = subscribeToAuthState(fbUser => {
      if (fbUser) {
        dispatch(setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        }));
      } else {
        dispatch(setUser(null));
      }
    });
    return () => unsub();
  }, [dispatch]);
}
