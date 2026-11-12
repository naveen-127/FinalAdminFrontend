// src/pages/ManageAccount/services.js
// An admin can be allocated ONE OR MORE sections, stored in `service` as a comma-separated string,
// e.g. "students,blogs".  "full" = Full access (Academics + Professional + all Manage Account).
// Empty string = the original main admin (also full access).

export const SERVICES = [
  { id: 'students',     label: 'Manage Students' },
  { id: 'support',      label: 'Support Tickets' },
  { id: 'people',       label: 'People Tickets' },
  { id: 'coupons',      label: 'Coupons' },
  { id: 'assign-class', label: 'Assign Classes' },
  { id: 'media',        label: 'Media Manager' },
  { id: 'visitors',     label: 'Visitors' },
  { id: 'blogs',        label: 'Blogs' },
];

export const MANAGE_SERVICE_IDS = SERVICES.map((s) => s.id);

export const FULL_ACCESS_ID = 'full';

// Old admins may still have these saved.
export const HOME_SERVICE_IDS = ['academics', 'professional'];
const LEGACY_LABELS = {
  academics: 'Academics',
  professional: 'Professional Training',
  [FULL_ACCESS_ID]: 'Full access (Academics, Professional, Manage Account)',
};

export const parseServices = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map((s) => String(s).trim()).filter(Boolean);
};

export const hasFullAccess = (value) => parseServices(value).includes(FULL_ACCESS_ID);

export const serviceLabel = (id) =>
  SERVICES.find((s) => s.id === id)?.label || LEGACY_LABELS[id] || id || '';

export const serviceLabels = (value) =>
  parseServices(value).map(serviceLabel).join(', ');