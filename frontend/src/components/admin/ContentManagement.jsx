import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Pencil, Trash2, Plus, X, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState('blogs'); // 'blogs' or 'pages'
  const [blogs, setBlogs] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal / Form States
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Forms
  const [blogForm, setBlogForm] = useState({ title: '', slug: '', excerpt: '', content: '', status: 'DRAFT' });
  const [blogImage, setBlogImage] = useState(null);
  const [blogImagePreview, setBlogImagePreview] = useState(null);

  const [pageForm, setPageForm] = useState({ title: '', slug: '', content: '' });
  const [pageImage, setPageImage] = useState(null);
  const [pageImagePreview, setPageImagePreview] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        adminService.listBlogs({ limit: 100 }),
        adminService.listPages({ limit: 100 })
      ]);
      setBlogs(bRes.data.blogs || []);
      setPages(pRes.data.pages || []);
    } catch (e) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- BLOGS ---
  const handleOpenBlogModal = (blog = null) => {
    if (blog) {
      setEditingId(blog._id);
      setBlogForm({ title: blog.title, slug: blog.slug, excerpt: blog.excerpt || '', content: blog.content || '', status: blog.status });
      setBlogImagePreview(blog.heroImage?.url || null);
    } else {
      setEditingId(null);
      setBlogForm({ title: '', slug: '', excerpt: '', content: '', status: 'DRAFT' });
      setBlogImagePreview(null);
    }
    setBlogImage(null);
    setIsBlogModalOpen(true);
  };

  const handleBlogImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBlogImage(file);
      setBlogImagePreview(URL.createObjectURL(file));
    }
  };

  const saveBlog = async (e) => {
    e.preventDefault();
    const id = toast.loading(editingId ? 'Updating blog...' : 'Creating blog...');
    try {
      let blogId = editingId;
      if (editingId) {
        await adminService.updateBlog(editingId, blogForm);
      } else {
        const res = await adminService.createBlog(blogForm);
        blogId = res.data.blog._id;
      }

      if (blogImage) {
        const fd = new FormData();
        fd.append('image', blogImage);
        await adminService.uploadBlogHero(blogId, fd);
      }

      toast.success(editingId ? 'Blog updated' : 'Blog created', { id });
      setIsBlogModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving blog', { id });
    }
  };

  const deleteBlog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await adminService.deleteBlog(id);
      toast.success('Blog deleted');
      loadData();
    } catch (e) { toast.error('Failed to delete blog'); }
  };

  // --- PAGES ---
  const handleOpenPageModal = (page = null) => {
    if (page) {
      setEditingId(page._id);
      setPageForm({ title: page.title, slug: page.slug, content: page.content || '' });
      setPageImagePreview(page.heroImage?.url || null);
    } else {
      setEditingId(null);
      setPageForm({ title: '', slug: '', content: '' });
      setPageImagePreview(null);
    }
    setPageImage(null);
    setIsPageModalOpen(true);
  };

  const handlePageImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPageImage(file);
      setPageImagePreview(URL.createObjectURL(file));
    }
  };

  const savePage = async (e) => {
    e.preventDefault();
    const id = toast.loading(editingId ? 'Updating page...' : 'Creating page...');
    try {
      let pageId = editingId;
      if (editingId) {
        await adminService.updatePage(editingId, pageForm);
      } else {
        const res = await adminService.createPage(pageForm);
        pageId = res.data.page._id;
      }

      if (pageImage) {
        const fd = new FormData();
        fd.append('image', pageImage);
        await adminService.uploadPageHero(pageId, fd);
      }

      toast.success(editingId ? 'Page updated' : 'Page created', { id });
      setIsPageModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving page', { id });
    }
  };

  const deletePage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await adminService.deletePage(id);
      toast.success('Page deleted');
      loadData();
    } catch (e) { toast.error('Failed to delete page'); }
  };

  // ReactQuill modules for rich text
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Content Management</h1>
          <p className="text-sm text-slate-500">Manage website pages and blog posts</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'blogs' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Blogs
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'pages' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Pages
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-10 text-slate-500">Loading content...</div>}

      {/* --- BLOGS TAB --- */}
      {!loading && activeTab === 'blogs' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-semibold text-slate-800">Blog Posts</h2>
            <button onClick={() => handleOpenBlogModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              <Plus size={16} /> New Blog
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blogs.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-400">No blog posts found</td></tr>
                ) : blogs.map(b => (
                  <tr key={b._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {b.heroImage?.url ? (
                          <img src={b.heroImage.url} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400"><ImageIcon size={16} /></div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{b.title}</p>
                          <p className="text-xs text-slate-400">/{b.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${b.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {b.status === 'PUBLISHED' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{b.author?.name || 'Admin'}</td>
                    <td className="py-3 px-4">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleOpenBlogModal(b)} className="p-1.5 text-slate-400 hover:text-blue-600 transition"><Pencil size={16} /></button>
                      <button onClick={() => deleteBlog(b._id)} className="p-1.5 text-slate-400 hover:text-red-600 transition ml-2"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PAGES TAB --- */}
      {!loading && activeTab === 'pages' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-semibold text-slate-800">Static Pages</h2>
            <button onClick={() => handleOpenPageModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              <Plus size={16} /> New Page
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.length === 0 ? (
                  <tr><td colSpan="3" className="py-8 text-center text-slate-400">No pages found</td></tr>
                ) : pages.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.heroImage?.url ? (
                          <img src={p.heroImage.url} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400"><ImageIcon size={16} /></div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{p.title}</p>
                          <p className="text-xs text-slate-400">/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleOpenPageModal(p)} className="p-1.5 text-slate-400 hover:text-blue-600 transition"><Pencil size={16} /></button>
                      <button onClick={() => deletePage(p._id)} className="p-1.5 text-slate-400 hover:text-red-600 transition ml-2"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- BLOG MODAL --- */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">{editingId ? 'Edit Blog Post' : 'Create Blog Post'}</h2>
              <button onClick={() => setIsBlogModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="blogForm" onSubmit={saveBlog} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input required type="text" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
                    <input required type="text" value={blogForm.slug} onChange={e => setBlogForm({...blogForm, slug: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select value={blogForm.status} onChange={e => setBlogForm({...blogForm, status: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hero Image</label>
                    <div className="flex items-center gap-4">
                      {blogImagePreview && <img src={blogImagePreview} alt="Preview" className="w-12 h-12 rounded object-cover border border-slate-200" />}
                      <input type="file" accept="image/*" onChange={handleBlogImageChange} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt (Short Summary)</label>
                  <textarea rows="2" value={blogForm.excerpt} onChange={e => setBlogForm({...blogForm, excerpt: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                  <div className="border border-slate-200 rounded-lg overflow-hidden h-[300px] flex flex-col">
                    <ReactQuill 
                      theme="snow" 
                      value={blogForm.content} 
                      onChange={val => setBlogForm({...blogForm, content: val})} 
                      modules={quillModules}
                      className="flex-1 overflow-y-auto"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsBlogModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancel</button>
              <button form="blogForm" type="submit" className="px-5 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition">
                {editingId ? 'Update Blog' : 'Publish Blog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE MODAL --- */}
      {isPageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">{editingId ? 'Edit Page' : 'Create Page'}</h2>
              <button onClick={() => setIsPageModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="pageForm" onSubmit={savePage} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input required type="text" value={pageForm.title} onChange={e => setPageForm({...pageForm, title: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
                    <input required type="text" value={pageForm.slug} onChange={e => setPageForm({...pageForm, slug: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hero Image</label>
                  <div className="flex items-center gap-4">
                    {pageImagePreview && <img src={pageImagePreview} alt="Preview" className="w-12 h-12 rounded object-cover border border-slate-200" />}
                    <input type="file" accept="image/*" onChange={handlePageImageChange} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                  <div className="border border-slate-200 rounded-lg overflow-hidden h-[300px] flex flex-col">
                    <ReactQuill 
                      theme="snow" 
                      value={pageForm.content} 
                      onChange={val => setPageForm({...pageForm, content: val})} 
                      modules={quillModules}
                      className="flex-1 overflow-y-auto"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsPageModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancel</button>
              <button form="pageForm" type="submit" className="px-5 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition">
                {editingId ? 'Update Page' : 'Publish Page'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
