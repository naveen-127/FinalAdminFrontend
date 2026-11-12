// src/utils/access.js
// Loads the logged-in user and merges EVERY account (teacher + admin) that has the
// same email and the same password, so one login gets all the access.
import { API_BASE_URL } from '../config';

export const UNRESOLVED = '__unresolved__';

const lc = (v) => String(v || '').toLowerCase();

export const loadCurrentUser = async () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('currentUser'));
  } catch (e) {
    user = null;
  }
  if (!user) return null;

  const email = user.gmail || user.email;
  const loggedRole = lc(user.role);
  const merged = { ...user, roles: loggedRole ? [loggedRole] : [] };

  // 1) ask the backend which accounts are linked to this login
  if (email) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/getLinkedAccounts?gmail=${encodeURIComponent(email)}&role=${encodeURIComponent(loggedRole)}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'pass' && Array.isArray(data.roles) && data.roles.length) {
          merged.roles = data.roles;
          if (data.admin) {
            merged.role = 'admin';
            merged.service = data.admin.service || '';
          }
          if (data.teacher) {
            merged.coursetype = data.teacher.coursetype || '';
            merged.courseName = data.teacher.courseName || '';
            merged.boardType = data.teacher.boardType || '';
            merged.standards = data.teacher.standards || [];
            merged.subjects = data.teacher.subjects || [];
            if (!data.admin) merged.role = 'teacher';
          }
          return merged;
        }
      }
    } catch (e) {
      console.error('Could not load linked accounts:', e);
    }
  }

  // 2) fallback (old behaviour): look the admin account up in the users list
  if (loggedRole === 'admin' && merged.service === undefined) {
    try {
      const res = await fetch(`${API_BASE_URL}/getUsers`, { credentials: 'include' });
      const list = await res.json();
      const me = Array.isArray(list)
        ? list.find((u) => u.gmail === email && lc(u.role) === 'admin')
        : null;
      merged.service = me ? me.service || '' : UNRESOLVED;
    } catch (e) {
      console.error('Could not resolve admin service:', e);
      merged.service = UNRESOLVED;
    }
  }
  return merged;
};