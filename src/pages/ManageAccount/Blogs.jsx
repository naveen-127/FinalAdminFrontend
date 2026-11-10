import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Blogs.css';
import { API_BASE_URL } from '../../config';

/* =====================================================
   Blogs.jsx  –  Blog management for the admin panel
   Student site only READS the `blogs` collection.
   All endpoints below must sit behind the admin login.
   ===================================================== */

// ── Adjust these if your Spring controller uses different paths ──
const BLOG_API = `${API_BASE_URL}/admin/blogs`;
const UPLOAD_API = `${API_BASE_URL}/admin/blogs/upload-image`; // multipart "file" -> { url }

const DEFAULT_CATEGORIES = ['NEET', 'JEE', 'School Tuition', 'Study Tips', 'Learning App'];
const ADD_NEW = '__add_new__';

const LIMITS = { shortDescription: 160, metaTitle: 60, metaDescription: 155 };
const RECOMMENDED_IMAGE_BYTES = 200 * 1024;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EMPTY_FORM = {
  category: '',
  title: '',
  slug: '',
  shortDescription: '',
  image: '',
  imageAlt: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
  keywords: [],
  status: 'DRAFT',
  publishedAt: '',
};

/* ───────────── helpers ───────────── */

const slugify = (text) =>
  (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

// ISO -> value for <input type="datetime-local">
const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getId = (post) => post._id?.$oid || post._id || post.id;

/* Client-side sanitiser for the editor (the server sanitises again – never trust the browser).
   Allowed: p, h2, h3, strong, em, ul, ol, li, a, img, blockquote, simple tables, br.
   H1 is converted to H2 so a post can never contain a second H1. */
const ALLOWED_TAGS = new Set([
  'P', 'H2', 'H3', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'A', 'IMG', 'BLOCKQUOTE',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'BR',
]);
const DROP_WITH_CONTENT = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META']);
const RENAME = { H1: 'h2', H4: 'h3', H5: 'h3', H6: 'h3', B: 'strong', I: 'em', DIV: 'p' };

const safeUrl = (url, allowMailto) => {
  const u = (url || '').trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (allowMailto && /^mailto:/i.test(u)) return u;
  return '';
};

const sanitizeHtml = (html) => {
  const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');

  const clean = (node, outParent) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        outParent.appendChild(document.createTextNode(child.textContent));
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;

      let tag = child.tagName;
      if (DROP_WITH_CONTENT.has(tag)) return;
      if (RENAME[tag]) tag = RENAME[tag].toUpperCase();

      if (!ALLOWED_TAGS.has(tag)) {
        clean(child, outParent); // unwrap unknown tag, keep its text
        return;
      }

      const el = document.createElement(tag.toLowerCase());
      if (tag === 'A') {
        const href = safeUrl(child.getAttribute('href'), true);
        if (!href) {
          clean(child, outParent);
          return;
        }
        el.setAttribute('href', href);
        if (child.getAttribute('target') === '_blank') el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
      if (tag === 'IMG') {
        const src = safeUrl(child.getAttribute('src'), false);
        if (!src) return;
        el.setAttribute('src', src);
        el.setAttribute('alt', child.getAttribute('alt') || '');
      }
      if (tag !== 'IMG' && tag !== 'BR') clean(child, el);
      outParent.appendChild(el);
    });
  };

  const out = document.createElement('div');
  clean(doc.body, out);
  return out.innerHTML;
};

const isContentEmpty = (html) => {
  if (!html) return true;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return !tmp.textContent.trim() && !tmp.querySelector('img,table');
};

/* ───────────── API ───────────── */

const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, { credentials: 'include', ...options });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
};

const uploadImage = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const data = await apiFetch(UPLOAD_API, { method: 'POST', body: fd });
  if (!data?.url) throw new Error('Upload succeeded but no URL was returned');
  return data.url;
};

/* ───────────── Rich text editor ───────────── */

const RichEditor = ({ initialHtml, onChange, error }) => {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const savedRange = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'p');
    if (ref.current) ref.current.innerHTML = sanitizeHtml(initialHtml);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(sanitizeHtml(ref.current.innerHTML));

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount && ref.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };
  const restoreSelection = () => {
    ref.current.focus();
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const run = (command, value = null) => {
    restoreSelection();
    document.execCommand(command, false, value);
    emit();
  };

  const addLink = () => {
    saveSelection();
    const url = window.prompt('Link address (https://…)');
    if (!url) return;
    const href = safeUrl(url, true);
    if (!href) {
      alert('Enter a full link starting with https:// or http://');
      return;
    }
    const external = /^https?:\/\//i.test(href);
    restoreSelection();
    document.execCommand('createLink', false, href);
    if (external) {
      ref.current.querySelectorAll(`a[href="${href}"]`).forEach((a) => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });
    }
    emit();
  };

  const addTable = () => {
    const cell = (tag) => `<${tag}>&nbsp;</${tag}>`;
    const html =
      `<table><thead><tr>${cell('th')}${cell('th')}</tr></thead>` +
      `<tbody><tr>${cell('td')}${cell('td')}</tr><tr>${cell('td')}${cell('td')}</tr></tbody></table><p><br></p>`;
    run('insertHTML', html);
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const alt = window.prompt('Alt text for this image (required)');
    if (!alt || !alt.trim()) {
      alert('Alt text is required for images in the content.');
      return;
    }
    setBusy(true);
    try {
      const url = await uploadImage(file);
      const safeAlt = alt.trim().replace(/"/g, '&quot;');
      run('insertHTML', `<img src="${url}" alt="${safeAlt}"><p><br></p>`);
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    if (html) {
      document.execCommand('insertHTML', false, sanitizeHtml(html));
    } else {
      document.execCommand('insertText', false, text);
    }
    emit();
  };

  const Btn = ({ label, title, onClick }) => (
    <button
      type="button"
      className="blog-tool"
      title={title || label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className={`blog-editor ${error ? 'has-error' : ''}`}>
      <div className="blog-toolbar" onMouseDown={saveSelection}>
        <Btn label="H2" title="Heading 2" onClick={() => run('formatBlock', 'h2')} />
        <Btn label="H3" title="Heading 3" onClick={() => run('formatBlock', 'h3')} />
        <Btn label="Paragraph" onClick={() => run('formatBlock', 'p')} />
        <span className="blog-tool-sep" />
        <Btn label={<b>B</b>} title="Bold" onClick={() => run('bold')} />
        <Btn label={<i>I</i>} title="Italic" onClick={() => run('italic')} />
        <span className="blog-tool-sep" />
        <Btn label="• List" title="Bullet list" onClick={() => run('insertUnorderedList')} />
        <Btn label="1. List" title="Numbered list" onClick={() => run('insertOrderedList')} />
        <Btn label="Quote" title="Blockquote" onClick={() => run('formatBlock', 'blockquote')} />
        <span className="blog-tool-sep" />
        <Btn label="Link" onClick={addLink} />
        <Btn label="Unlink" onClick={() => run('unlink')} />
        <Btn label="Table" onClick={addTable} />
        <Btn
          label={busy ? 'Uploading…' : 'Image'}
          onClick={() => {
            saveSelection();
            fileRef.current?.click();
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={onPickImage}
        />
      </div>
      <div
        ref={ref}
        className="blog-editable blog-prose"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Post content"
        onInput={emit}
        onBlur={() => {
          saveSelection();
          emit();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={onPaste}
      />
    </div>
  );
};

/* ───────────── Tag input ───────────── */

const TagInput = ({ tags, onChange }) => {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const value = raw.trim();
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...tags, value]);
    setDraft('');
  };

  return (
    <div className="blog-tags">
      {tags.map((t) => (
        <span className="blog-tag" key={t}>
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={tags.length ? '' : 'Type a keyword and press Enter'}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(',')) v.split(',').forEach(add);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
      />
    </div>
  );
};

/* ───────────── Counter ───────────── */

const Counter = ({ value, limit }) => {
  const n = (value || '').length;
  return <span className={`blog-counter ${n > limit ? 'over' : ''}`}>{n}/{limit}</span>;
};

/* ───────────── Preview ───────────── */

const Preview = ({ form, onClose, closeLabel = 'Back to editing', onEdit }) => (
  <div className="manage-container blog-container">
    <div className="blog-head">
      <h2>Preview</h2>
      <div className="blog-row-actions">
        {onEdit && (
          <button type="button" className="blog-btn blog-btn-primary" onClick={onEdit}>Edit</button>
        )}
        <button type="button" className="blog-btn" onClick={onClose}>{closeLabel}</button>
      </div>
    </div>
    <p className="blog-hint">
      {form.status ? `${form.status === 'PUBLISHED' ? 'Published' : 'Draft'}. ` : ''}
      This is a rough preview. The public site applies its own styling.
    </p>
    <article className="blog-preview">
      <span className="blog-preview-cat">{form.category || 'Uncategorised'}</span>
      <h1>{form.title || 'Untitled post'}</h1>
      <p className="blog-preview-desc">{form.shortDescription}</p>
      {form.image && <img src={form.image} alt={form.imageAlt} className="blog-preview-cover" />}
      <div className="blog-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content) }} />
    </article>
  </div>
);

/* ───────────── Form ───────────── */

const BlogForm = ({ post, posts, categories, onCancel, onSaved }) => {
  const editing = !!post;
  const originalSlug = post?.slug || '';
  const wasPublished = post?.status === 'PUBLISHED';

  const [form, setForm] = useState(() =>
    post
      ? {
          ...EMPTY_FORM,
          ...post,
          keywords: post.keywords || [],
          publishedAt: toLocalInput(post.publishedAt),
        }
      : EMPTY_FORM
  );
  const [slugTouched, setSlugTouched] = useState(editing);
  const [customCats, setCustomCats] = useState([]);
  const [removedCats, setRemovedCats] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState('');
  const originalPublishedLocal = useRef(toLocalInput(post?.publishedAt));

  const allCategories = useMemo(() => {
    const set = new Set([...categories, ...customCats]);
    if (form.category) set.add(form.category);
    return [...set].filter((c) => !removedCats.includes(c));
  }, [categories, customCats, removedCats, form.category]);

  const isDefaultCat = (c) => DEFAULT_CATEGORIES.some((d) => d.toLowerCase() === c.toLowerCase());
  const currentId = post ? getId(post) : null;
  const usedByOthersOf = (name) =>
    posts.filter((p) => p.category === name && getId(p) !== currentId).length;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const onTitle = (title) => {
    set(slugTouched ? { title } : { title, slug: slugify(title) });
  };

  const onCategory = (value) => {
    if (value === ADD_NEW) {
      const name = (window.prompt('New category name') || '').trim();
      if (!name) return;
      const existing = allCategories.find((c) => c.toLowerCase() === name.toLowerCase());
      if (existing) {
        set({ category: existing });
      } else {
        setCustomCats((c) => [...c, name]);
        setRemovedCats((r) => r.filter((x) => x.toLowerCase() !== name.toLowerCase()));
        set({ category: name });
      }
      return;
    }
    set({ category: value });
  };

  const onDeleteCategory = (name) => {
    if (!window.confirm(`Delete the category "${name}"?`)) return;
    setRemovedCats((r) => [...r, name]);
    setCustomCats((c) => c.filter((x) => x !== name));
    if (form.category === name) set({ category: '' });
  };

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setErrors((x) => ({ ...x, image: 'Use a JPG, PNG or WebP image.' }));
      return;
    }
    setUploading(true);
    setErrors((x) => ({ ...x, image: undefined }));
    try {
      const url = await uploadImage(file);
      set({ image: url });
      if (file.size > RECOMMENDED_IMAGE_BYTES) {
        setMessage(`Cover image is ${Math.round(file.size / 1024)} KB. Under 200 KB loads faster.`);
      }
    } catch (err) {
      setErrors((x) => ({ ...x, image: `Upload failed: ${err.message}` }));
    } finally {
      setUploading(false);
    }
  };

  const validate = (status) => {
    const e = {};
    if (!form.category) e.category = 'Choose a category.';
    if (!form.title.trim()) e.title = 'Enter a title.';
    if (!form.slug.trim()) e.slug = 'Enter a slug.';
    else if (!SLUG_RE.test(form.slug)) e.slug = 'Use lowercase letters, digits and single hyphens only.';
    if (!form.shortDescription.trim()) e.shortDescription = 'Enter a short description.';
    if (form.image && !form.imageAlt.trim()) e.imageAlt = 'Alt text is required when a cover image is set.';
    if (isContentEmpty(form.content)) e.content = 'Write some content.';
    if (!['DRAFT', 'PUBLISHED'].includes(status)) e.status = 'Invalid status.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (forceStatus) => {
    const status = forceStatus || form.status;
    setMessage('');
    if (!validate(status)) {
      setMessage('Fix the highlighted fields and try again.');
      return;
    }
    if (editing && wasPublished && form.slug !== originalSlug) {
      const ok = window.confirm(
        'You changed the slug of a published post. The post URL will change and old links will stop working. Continue?'
      );
      if (!ok) return;
    }

    const payload = {
      category: form.category,
      title: form.title.trim(),
      slug: form.slug.trim(),
      shortDescription: form.shortDescription.trim(),
      image: form.image || '',
      imageAlt: form.image ? form.imageAlt.trim() : '',
      content: sanitizeHtml(form.content),
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      keywords: form.keywords,
      status,
    };
    // Only send publishedAt when marketing changed it. Otherwise the server owns it.
    if (form.publishedAt && form.publishedAt !== originalPublishedLocal.current) {
      payload.publishedAt = new Date(form.publishedAt).toISOString();
    }

    setSaving(true);
    try {
      const url = editing ? `${BLOG_API}/${getId(post)}` : BLOG_API;
      await apiFetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onSaved(status === 'PUBLISHED' ? 'Post published.' : 'Draft saved.');
    } catch (err) {
      if (err.status === 409) {
        setErrors((x) => ({ ...x, slug: 'This slug is already used by another post.' }));
        setMessage('Slug already exists. Choose a different one.');
      } else {
        setMessage(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (previewing) return <Preview form={form} onClose={() => setPreviewing(false)} />;

  const field = (name) => (errors[name] ? 'blog-field has-error' : 'blog-field');
  const err = (name) => errors[name] && <span className="blog-error">{errors[name]}</span>;

  return (
    <div className="manage-container blog-container">
      <div className="blog-head">
        <h2>{editing ? 'Edit blog post' : 'New blog post'}</h2>
        <button type="button" className="blog-btn" onClick={onCancel}>Back to list</button>
      </div>

      {message && <div className="blog-banner" role="status">{message}</div>}

      <div className="blog-form">
        <div className={field('category')}>
          <label htmlFor="blog-category">Category</label>
          <select id="blog-category" value={form.category} onChange={(e) => onCategory(e.target.value)}>
            <option value="">Select a category</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value={ADD_NEW}>+ Add new category…</option>
          </select>
          {allCategories.some((c) => !isDefaultCat(c)) && (
            <div className="blog-cat-manage">
              <span className="blog-hint">Your categories (click × to delete):</span>
              {allCategories
                .filter((c) => !isDefaultCat(c))
                .map((c) => {
                  const n = usedByOthersOf(c);
                  return (
                    <span className="blog-tag" key={c}>
                      {c}
                      <button
                        type="button"
                        disabled={n > 0}
                        aria-label={`Delete category ${c}`}
                        title={
                          n > 0
                            ? `Used by ${n} other post${n === 1 ? '' : 's'}. Change their category first.`
                            : `Delete category ${c}`
                        }
                        onClick={() => onDeleteCategory(c)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
            </div>
          )}
          {err('category')}
        </div>

        <div className={field('title')}>
          <label htmlFor="blog-title">Title (shown as the page H1)</label>
          <input id="blog-title" value={form.title} onChange={(e) => onTitle(e.target.value)} />
          {err('title')}
        </div>

        <div className={field('slug')}>
          <label htmlFor="blog-slug">Slug</label>
          <input
            id="blog-slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set({ slug: e.target.value.toLowerCase() });
            }}
          />
          <span className="blog-hint">URL: /#/blog/{form.slug || 'your-slug'}</span>
          {editing && wasPublished && form.slug !== originalSlug && (
            <span className="blog-warn">This post is published. Changing the slug changes its URL.</span>
          )}
          {err('slug')}
        </div>

        <div className={field('shortDescription')}>
          <label htmlFor="blog-short">
            Short description <Counter value={form.shortDescription} limit={LIMITS.shortDescription} />
          </label>
          <textarea
            id="blog-short"
            rows={3}
            value={form.shortDescription}
            onChange={(e) => set({ shortDescription: e.target.value })}
          />
          <span className="blog-hint">Shown on cards. About 160 characters works best.</span>
          {err('shortDescription')}
        </div>

        <div className={field('image')}>
          <label>Cover image</label>
          <div className="blog-image-row">
            {form.image ? (
              <img className="blog-cover" src={form.image} alt={form.imageAlt || 'Cover preview'} />
            ) : (
              <div className="blog-cover blog-cover-empty">No image. The site shows a logo placeholder.</div>
            )}
            <div className="blog-image-actions">
              <label className="blog-btn blog-btn-primary">
                {uploading ? 'Uploading…' : form.image ? 'Replace image' : 'Upload image'}
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPickCover} disabled={uploading} />
              </label>
              {form.image && (
                <button type="button" className="blog-btn" onClick={() => set({ image: '', imageAlt: '' })}>
                  Remove
                </button>
              )}
              <span className="blog-hint">1200×630 (16:9), JPG or WebP, under about 200 KB.</span>
            </div>
          </div>
          {err('image')}
        </div>

        {form.image && (
          <div className={field('imageAlt')}>
            <label htmlFor="blog-alt">Image alt text</label>
            <input id="blog-alt" value={form.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} />
            {err('imageAlt')}
          </div>
        )}

        <div className={field('content')}>
          <label>Content</label>
          <RichEditor
            initialHtml={form.content}
            error={!!errors.content}
            onChange={(html) => set({ content: html })}
          />
          <span className="blog-hint">Headings start at H2. The title above is the only H1.</span>
          {err('content')}
        </div>

        <fieldset className="blog-seo">
          <legend>SEO config</legend>
          <div className="blog-field">
            <label htmlFor="blog-mt">
              Meta title <Counter value={form.metaTitle} limit={LIMITS.metaTitle} />
            </label>
            <input id="blog-mt" value={form.metaTitle} onChange={(e) => set({ metaTitle: e.target.value })} />
            <span className="blog-hint">Leave empty to use the post title.</span>
          </div>
          <div className="blog-field">
            <label htmlFor="blog-md">
              Meta description <Counter value={form.metaDescription} limit={LIMITS.metaDescription} />
            </label>
            <textarea
              id="blog-md"
              rows={3}
              value={form.metaDescription}
              onChange={(e) => set({ metaDescription: e.target.value })}
            />
            <span className="blog-hint">Leave empty to use the short description.</span>
          </div>
        </fieldset>

        <div className="blog-field">
          <label>Keywords</label>
          <TagInput tags={form.keywords} onChange={(keywords) => set({ keywords })} />
        </div>

        <div className="blog-row">
          <div className={field('status')}>
            <label htmlFor="blog-status">Status</label>
            <select id="blog-status" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
            {err('status')}
          </div>

          {editing && form.publishedAt && (
            <div className="blog-field">
              <label htmlFor="blog-pub">Published date</label>
              <input
                id="blog-pub"
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => set({ publishedAt: e.target.value })}
              />
              <span className="blog-hint">Change only to back-date. Edits never reset it.</span>
            </div>
          )}
        </div>

        <div className="blog-actions">
          <button type="button" className="blog-btn" onClick={() => setPreviewing(true)}>Preview</button>
          <button type="button" className="blog-btn" disabled={saving} onClick={onCancel}>Cancel</button>
          <button type="button" className="blog-btn blog-btn-secondary" disabled={saving} onClick={() => save()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="blog-btn blog-btn-primary" disabled={saving} onClick={() => save('PUBLISHED')}>
            Save &amp; publish
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────── List ───────────── */

const Blogs = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState('list'); // list | form
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiFetch(BLOG_API);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    posts.forEach((p) => p.category && set.add(p.category));
    return [...set];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts
      .filter((p) => (!q || (p.title || '').toLowerCase().includes(q)))
      .filter((p) => !catFilter || p.category === catFilter)
      .filter((p) => !statusFilter || p.status === statusFilter)
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [posts, search, catFilter, statusFilter]);

  const openView = async (post) => {
    try {
      const full = await apiFetch(`${BLOG_API}/${getId(post)}`);
      setViewing(full);
    } catch (err) {
      setNotice(`Could not open the post: ${err.message}`);
    }
  };

  const openEdit = async (post) => {
    try {
      const full = await apiFetch(`${BLOG_API}/${getId(post)}`);
      setEditing(full);
      setView('form');
    } catch (err) {
      setNotice(`Could not open the post: ${err.message}`);
    }
  };

  const toggleStatus = async (post) => {
    const next = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await apiFetch(`${BLOG_API}/${getId(post)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      setNotice(next === 'PUBLISHED' ? 'Post published.' : 'Post unpublished.');
      load();
    } catch (err) {
      setNotice(err.message);
    }
  };

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`${BLOG_API}/${getId(post)}`, { method: 'DELETE' });
      setNotice('Post deleted.');
      load();
    } catch (err) {
      setNotice(err.message);
    }
  };

  if (viewing) {
    return (
      <Preview
        form={viewing}
        closeLabel="Back to list"
        onClose={() => setViewing(null)}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
          setView('form');
        }}
      />
    );
  }

  if (view === 'form') {
    return (
      <BlogForm
        key={editing ? getId(editing) : 'new'}
        post={editing}
        posts={posts}
        categories={categories}
        onCancel={() => {
          setView('list');
          setEditing(null);
        }}
        onSaved={(msg) => {
          setView('list');
          setEditing(null);
          setNotice(msg);
          load();
        }}
      />
    );
  }

  const filtersActive = search || catFilter || statusFilter;

  return (
    <div className="manage-container blog-container">
      <div className="blog-head">
        <h2>Blogs</h2>
        <button
          type="button"
          className="blog-btn blog-btn-primary"
          onClick={() => {
            setEditing(null);
            setView('form');
          }}
        >
          New post
        </button>
      </div>

      {notice && <div className="blog-banner" role="status">{notice}</div>}

      <div className="search-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search posts by title"
          />
          {search && (
            <button type="button" className="clear-search" onClick={() => setSearch('')} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="blog-f-cat">Category</label>
            <select id="blog-f-cat" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="blog-f-status">Status</label>
            <select id="blog-f-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          {filtersActive && (
            <button
              type="button"
              className="reset-filters-btn"
              onClick={() => {
                setSearch('');
                setCatFilter('');
                setStatusFilter('');
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="blog-hint blog-pad">Loading posts…</p>
      ) : loadError ? (
        <div className="empty-state">
          <h4>Could not load posts</h4>
          <p>{loadError}</p>
          <button type="button" className="blog-btn blog-btn-primary" onClick={load}>Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h4>{posts.length ? 'No posts match these filters' : 'No blog posts yet'}</h4>
          <p>{posts.length ? 'Change or reset the filters to see more posts.' : 'Create the first post for the student website.'}</p>
          {!posts.length && (
            <button type="button" className="blog-btn blog-btn-primary" onClick={() => setView('form')}>
              New post
            </button>
          )}
        </div>
      ) : (
        <div className="blog-table-wrap">
          <table className="blog-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={getId(p)}>
                  <td className="blog-title-cell">
                    <strong>{p.title}</strong>
                    <span>/{p.slug}</span>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <span className={`blog-status ${p.status === 'PUBLISHED' ? 'is-live' : 'is-draft'}`}>
                      {p.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{fmtDate(p.publishedAt)}</td>
                  <td>{fmtDate(p.updatedAt)}</td>
                  <td>
                    <div className="blog-row-actions">
                      <button type="button" className="blog-link" onClick={() => openView(p)}>View</button>
                      <button type="button" className="blog-link" onClick={() => openEdit(p)}>Edit</button>
                      <button type="button" className="blog-link" onClick={() => toggleStatus(p)}>
                        {p.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" className="blog-link danger" onClick={() => remove(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Blogs;