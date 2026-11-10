// src/utils/access.js
// Loads the logged-in user and makes sure we know which service (if any) an admin has.
import { API_BASE_URL } from '../config';

export const UNRESOLVED = '__unresolved__'; // admin whose service could not be determined -> no access

export const loadCurrentUser = async () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('currentUser'));
  } catch (e) {
    user = null;
  }
  if (!user) return null;

  // Login did not store "service" -> look ourselves up in the users list
  if (user.role === 'admin' && user.service === undefined) {
    try {
      const res = await fetch(`${API_BASE_URL}/getUsers`, { credentials: 'include' });
      const list = await res.json();
      const myEmail = user.email || user.gmail;
      const me = Array.isArray(list) ? list.find((u) => u.gmail === myEmail) : null;
      if (!me) return { ...user, service: UNRESOLVED };
      user = { ...user, service: me.service || '' };
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (e) {
      console.error('Could not resolve admin service:', e);
      return { ...user, service: UNRESOLVED };
    }
  }
  return user;
};