import { useState, useEffect, useRef } from 'react';
import { adminApiService } from '../services/api';

const News = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    news_title: '',
    content: '',
    image: null,
    keyword: '',
  });
  const [previewImage, setPreviewImage] = useState(null);
  const editorRef = useRef(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.news.getAll();
      setNewsList(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (news = null) => {
    if (news) {
      setEditingNews(news);
      setFormData({
        news_title: news.news_title || news.title || '',
        content: news.content || '',
        image: null,
        keyword: Array.isArray(news.keyword) ? news.keyword.join(', ') : (news.keyword || ''),
      });
      setPreviewImage(news.image || (news.news_image && news.news_image[0]));
    } else {
      setEditingNews(null);
      setFormData({
        news_title: '',
        content: '',
        image: null,
        keyword: '',
      });
      setPreviewImage(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNews(null);
    setFormData({
      news_title: '',
      content: '',
      image: null,
      keyword: '',
    });
    setPreviewImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.news_title || !formData.news_title.trim()) {
        setError('News title is required');
        return;
      }
      
      if (!formData.content || !formData.content.trim()) {
        setError('Content is required');
        return;
      }

      const data = new FormData();
      data.append('news_title', formData.news_title.trim());
      data.append('content', formData.content);
      
      // Send keyword as plain text (backend will handle comma-separated conversion)
      if (formData.keyword && formData.keyword.trim()) {
        data.append('keyword', formData.keyword.trim());
      }
      
      if (formData.image) {
        data.append('image', formData.image);
      }

      console.log('Submitting news data:');
      console.log('- Title:', formData.news_title);
      console.log('- Content length:', formData.content.length);
      console.log('- Keyword:', formData.keyword);
      console.log('- Has image:', !!formData.image);

      if (editingNews) {
        await adminApiService.news.update(editingNews.id, data);
      } else {
        await adminApiService.news.create(data);
      }

      fetchNews();
      handleCloseModal();
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data 
        ? JSON.stringify(err.response.data, null, 2) 
        : `Failed to ${editingNews ? 'update' : 'create'} news`;
      setError(errorMsg);
      console.error('Error saving news:', err);
      console.error('Error response:', err.response?.data);
      
      // Show detailed error in alert for debugging
      if (err.response?.data) {
        alert('Error details:\n' + JSON.stringify(err.response.data, null, 2));
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await adminApiService.news.delete(id);
        fetchNews();
        setError('');
      } catch (err) {
        setError('Failed to delete news');
        console.error('Error deleting news:', err);
      }
    }
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setFormData({ ...formData, content: editorRef.current.innerHTML });
    }
  };

  useEffect(() => {
    if (editorRef.current && showModal) {
      editorRef.current.innerHTML = formData.content;
    }
    // only seed the contentEditable when the modal opens; re-running on every keystroke would reset the caret
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">News Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Create News
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {newsList.map((news) => (
                <tr key={news.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(news.image || (news.news_image && news.news_image[0])) && (
                      <img
                        src={news.image || news.news_image[0]}
                        alt={news.title || news.news_title}
                        className="h-16 w-16 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{news.title || news.news_title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(news.created_at || news.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(news)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(news.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {newsList.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No news items found. Create your first news item!
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingNews ? 'Edit News' : 'Create News'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.news_title}
                  onChange={(e) => setFormData({ ...formData, news_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword
                </label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., technology, business, healthcare"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Recommended: Upload an image with 1:4 ratio (portrait orientation) for best display. Example: 300x1200px, 400x1600px
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {previewImage && (
                  <div className="mt-4">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-w-xs object-cover rounded-lg shadow-md"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                
                {/* Toolbar */}
                <div className="mb-2 flex gap-2 flex-wrap border border-gray-300 p-2 rounded-t-lg bg-gray-50">
                  <button
                    type="button"
                    onClick={() => applyFormat('formatBlock', 'h1')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-lg"
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('formatBlock', 'h2')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('formatBlock', 'h3')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <div className="border-l border-gray-300 mx-2"></div>
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('italic')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('underline')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
                    title="Underline"
                  >
                    U
                  </button>
                  <div className="border-l border-gray-300 mx-2"></div>
                  <button
                    type="button"
                    onClick={() => applyFormat('formatBlock', 'p')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Paragraph"
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
                      editorRef.current.focus();
                    }}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Tab (5 spaces)"
                  >
                    ↹ Tab
                  </button>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleContentChange}
                  className="w-full min-h-[380px] px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white admin-prose admin-prose-lg max-w-none focus:outline-none"
                  style={{ maxHeight: '500px', overflowY: 'auto' }}
                  suppressContentEditableWarning
                />
                <p className="mt-2 text-sm text-gray-500">
                  Select text and click formatting buttons to style your content
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingNews ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;