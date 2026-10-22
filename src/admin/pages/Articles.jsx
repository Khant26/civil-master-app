import { useState, useEffect, useRef } from 'react';
import { adminApiService } from '../services/api';

const Articles = () => {
  const [articlesList, setArticlesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    article_title: '',
    content_html: '',
    category: '',
    keyword: [],
    images: [],
    htmlFile: null,
    pdfFile: null,
    existingPdfUrl: null,
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [uploadMethod, setUploadMethod] = useState('editor'); // 'editor' or 'html'
  const editorRef = useRef(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.articles.getAll();
      setArticlesList(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (article = null) => {
    if (article) {
      setEditingArticle(article);
      
      // Handle keywords as array for tag display
      let keywords = [];
      if (Array.isArray(article.keyword)) {
        keywords = article.keyword;
      } else if (typeof article.keyword === 'string' && article.keyword.trim()) {
        keywords = article.keyword.split(',').map(k => k.trim()).filter(k => k);
      }
      
      setFormData({
        article_title: article.article_title || '',
        content_html: article.content_html || '',
        category: article.category || '',
        keyword: keywords,
        images: [],
        htmlFile: null,
        pdfFile: null,
        existingPdfUrl: article.pdf_file || null, // Store existing PDF URL
      });
      setUploadMethod('editor');
    } else {
      setEditingArticle(null);
      setFormData({
        article_title: '',
        content_html: '',
        category: '',
        keyword: [],
        images: [],
        htmlFile: null,
        pdfFile: null,
        existingPdfUrl: null,
      });
      setUploadMethod('editor');
    }
    setKeywordInput('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticle(null);
    setFormData({
      article_title: '',
      content_html: '',
      category: '',
      keyword: [],
      images: [],
      htmlFile: null,
      pdfFile: null,
      existingPdfUrl: null,
    });
    setKeywordInput('');
    setUploadMethod('editor');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData({ ...formData, images: files });
    }
  };

  const handleHtmlFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, content_html: event.target.result, htmlFile: file });
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid HTML file');
    }
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, pdfFile: file });
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      addKeyword();
    } else if (e.key === ',') {
      e.preventDefault();
      addKeyword();
    }
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keyword.includes(keyword)) {
      setFormData({ ...formData, keyword: [...formData.keyword, keyword] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (indexToRemove) => {
    setFormData({
      ...formData,
      keyword: formData.keyword.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = new FormData();
      data.append('article_title', formData.article_title);
      data.append('category', formData.category);
      
      // Convert keyword array to comma-separated string and ensure it's clean
      const keywords = Array.isArray(formData.keyword) ? formData.keyword.filter(k => k && k.trim()).join(',') : '';
      data.append('keyword', keywords);

      if (formData.pdfFile) {
        data.append('pdf_file', formData.pdfFile);
      }

      // Use upload_article endpoint for HTML file uploads with images
      if (uploadMethod === 'html' && formData.htmlFile) {
        data.append('html_file', formData.htmlFile);
        
        // Append all images
        if (formData.images && formData.images.length > 0) {
          formData.images.forEach((image) => {
            data.append('images', image);
          });
        }
        
        await adminApiService.articles.uploadArticle(data);
      } else {
        // Regular create/update for editor mode
        const contentToSend = uploadMethod === 'editor' && editorRef.current 
          ? editorRef.current.innerHTML 
          : formData.content_html;
        data.append('content_html', contentToSend);
        
        // Add featured images for regular editor mode (only if new images are selected)
        if (formData.images && formData.images.length > 0) {
          formData.images.forEach((image) => {
            data.append('article_image', image);
          });
        }
        
        // Keywords are already handled above as array -> comma-separated string
        
        if (editingArticle) {
          console.log('Updating article with data:', Object.fromEntries(data));
          await adminApiService.articles.update(editingArticle.id, data);
        } else {
          console.log('Creating article with data:', Object.fromEntries(data));
          await adminApiService.articles.create(data);
        }
      }

      fetchArticles();
      handleCloseModal();
      setError('');
    } catch (err) {
      setError(`Failed to ${editingArticle ? 'update' : 'create'} article`);
      console.error('Error saving article:', err);
      console.error('Error response:', err.response?.data);
      
      // More detailed error logging
      if (err.response?.data) {
        console.error('Server validation errors:', err.response.data);
        if (typeof err.response.data === 'object') {
          const errorMessages = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(`Validation errors: ${errorMessages}`);
        }
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await adminApiService.articles.delete(id);
        fetchArticles();
        setError('');
      } catch (err) {
        setError('Failed to delete article');
        console.error('Error deleting article:', err);
      }
    }
  };

  const applyFormat = (command, value = null) => {
    if (command === 'formatBlock') {
      // Handle heading formatting with proper tag wrapping
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        if (selectedText) {
          // Create the new heading element
          const headingTag = value; // h1, h2, h3, p
          const newElement = document.createElement(headingTag);
          newElement.textContent = selectedText; // Use textContent to strip existing formatting
          
          // Replace the selection with the new element
          range.deleteContents();
          range.insertNode(newElement);
          
          // Position cursor at the end of the new element
          const newRange = document.createRange();
          newRange.selectNodeContents(newElement);
          newRange.collapse(false); // Collapse to end
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          handleContentChange();
        }
      }
    } else {
      // Handle other formatting (bold, italic, underline)
      document.execCommand(command, false, value);
    }
    editorRef.current.focus();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setFormData({ ...formData, content_html: editorRef.current.innerHTML });
    }
  };

  useEffect(() => {
    if (editorRef.current && showModal) {
      editorRef.current.innerHTML = formData.content_html;
    }
    // only seed the contentEditable when the modal opens; re-running on every keystroke would reset the caret
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Articles Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Create Article
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
                  Category
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
              {articlesList.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {article.article_image && article.article_image[0] && (
                      <img
                        src={article.article_image[0]}
                        alt={article.article_title}
                        className="h-16 w-16 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{article.article_title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {article.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(article.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(article)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {articlesList.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No articles found. Create your first article!
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
                {editingArticle ? 'Edit Article' : 'Create Article'}
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
                  value={formData.article_title}
                  onChange={(e) => setFormData({ ...formData, article_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Technical, Case Study, Industry News"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (press Enter to add)
                </label>
                
                {/* Keywords Tags Display */}
                {formData.keyword.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.keyword.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  onBlur={addKeyword}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type keyword and press Enter"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File (Optional)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Upload a PDF file to be displayed on screens under 450px width. This will provide an alternative view for mobile users.
                </p>
                
                {/* Show existing PDF file when editing */}
                {editingArticle && formData.existingPdfUrl && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">Current PDF file:</p>
                    <div className="flex items-center justify-between">
                      <a 
                        href={formData.existingPdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        View current PDF file
                      </a>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Upload a new file to replace the current one</p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {formData.pdfFile && (
                  <p className="text-sm text-green-600 mt-2">✓ PDF file selected: {formData.pdfFile.name}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                
                {/* Upload Method Toggle - Only show when creating new article */}
                {!editingArticle && (
                  <div className="mb-4 flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="editor"
                        checked={uploadMethod === 'editor'}
                        onChange={(e) => setUploadMethod(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Use Editor</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="html"
                        checked={uploadMethod === 'html'}
                        onChange={(e) => setUploadMethod(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Upload HTML File</span>
                    </label>
                  </div>
                )}

                {!editingArticle && uploadMethod === 'html' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML File
                    </label>
                    <input
                      type="file"
                      accept=".html"
                      onChange={handleHtmlFileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                    />
                    {formData.htmlFile && (
                      <p className="text-sm text-green-600">✓ HTML file loaded: {formData.htmlFile.name}</p>
                    )}

                    <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                      Images (Multiple files supported)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                    />
                    {formData.images && formData.images.length > 0 && (
                      <p className="text-sm text-green-600">✓ {formData.images.length} image(s) selected: {formData.images.map(img => img.name).join(', ')}</p>
                    )}

                    {formData.content_html && (
                      <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-60 overflow-auto">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <div 
                          dangerouslySetInnerHTML={{ __html: formData.content_html }} 
                          className="admin-prose max-w-none text-sm"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Toolbar */}
                    <div className="mb-2 flex gap-2 flex-wrap border border-gray-300 p-2 rounded-t-lg bg-gray-50">
                  <button
                    type="button"
                    onClick={() => applyFormat('formatBlock', 'h1')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-xl"
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('formatBlock', 'h2')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-lg"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('formatBlock', 'h3')}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold text-base"
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

                    <div>
                      <style>
                        {`
                          .content-editor h1 {
                            font-size: 2rem !important;
                            font-weight: bold !important;
                            line-height: 1.2 !important;
                            margin: 0 !important;
                            padding: 0.25rem 0 !important;
                            font-family: inherit !important;
                          }
                          .content-editor h2 {
                            font-size: 1.5rem !important;
                            font-weight: bold !important;
                            line-height: 1.3 !important;
                            margin: 0 !important;
                            padding: 0.2rem 0 !important;
                            font-family: inherit !important;
                          }
                          .content-editor h3 {
                            font-size: 1.25rem !important;
                            font-weight: 600 !important;
                            line-height: 1.4 !important;
                            margin: 0 !important;
                            padding: 0.15rem 0 !important;
                            font-family: inherit !important;
                          }
                          .content-editor p {
                            font-size: 1rem !important;
                            line-height: 1.6 !important;
                            margin: 0 !important;
                            padding: 0.1rem 0 !important;
                            font-family: inherit !important;
                          }
                        `}
                      </style>
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleContentChange}
                        className="content-editor w-full min-h-[380px] px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white max-w-none focus:outline-none"
                        style={{ 
                          maxHeight: '500px', 
                          overflowY: 'auto'
                        }}
                        suppressContentEditableWarning
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Select text and click formatting buttons to style your content
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>Introduction: The Battle Between Old and New Reinforcement

                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingArticle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;
