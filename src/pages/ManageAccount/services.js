// src/pages/ManageAccount/services.js
// An admin user can be allocated ONE OR MORE "Manage Account" sections.
// They are stored in the user's `service` field as a comma-separated string,
// e.g. "students,blogs"  (empty string = main admin with full access).

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

// Old admins may still have these saved. They can no longer be assigned from the form.
export const HOME_SERVICE_IDS = ['academics', 'professional'];
const LEGACY_LABELS = { academics: 'Academics', professional: 'Professional Training' };

// "students,blogs" -> ['students', 'blogs'] | '' / null -> [] | array -> array
export const parseServices = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map((s) => String(s).trim()).filter(Boolean);
};

export const serviceLabel = (id) =>
  SERVICES.find((s) => s.id === id)?.label || LEGACY_LABELS[id] || id || '';

// "students,blogs" -> "Manage Students, Blogs"
export const serviceLabels = (value) =>
  parseServices(value).map(serviceLabel).join(', ');