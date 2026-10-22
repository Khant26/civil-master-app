import React, { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { 
  useAdminPartnerships, 
  useCreatePartnership, 
  useUpdatePartnership, 
  useDeletePartnership 
} from '../hooks/useAdminQueries';

const Partnerships = () => {
  const { data: partnerships = [], isLoading: loading, error } = useAdminPartnerships();
  const createPartnership = useCreatePartnership();
  const updatePartnership = useUpdatePartnership();
  const deletePartnership = useDeletePartnership();
  
  const [showModal, setShowModal] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState(null);
  const [formData, setFormData] = useState({
    partner_name: '',
    partner_image: [''], // Always use array for image
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!editingPartnership && partnerships.length >= 8) {
        alert('Maximum 8 partnerships allowed');
        return;
      }
      const dataToSend = {
        ...formData,
        partner_image: formData.partner_image.filter((img) => img && img.trim() !== ''),
      };
      if (editingPartnership) {
        await updatePartnership.mutateAsync({ id: editingPartnership.id, partnershipData: dataToSend });
      } else {
        await createPartnership.mutateAsync(dataToSend);
      }
      setShowModal(false);
      setFormData({ partner_name: '', partner_image: [] });
      setEditingPartnership(null);
    } catch (err) {
      console.error('Error saving partnership:', err);
      alert('Failed to save partnership');
    }
  };

  const handleEdit = (partnership) => {
    setEditingPartnership(partnership);
    setFormData({
      partner_name: partnership.partner_name,
      partner_image: Array.isArray(partnership.partner_image) ? partnership.partner_image : (partnership.partner_image ? [partnership.partner_image] : []),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this partnership?')) {
      try {
        await deletePartnership.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting partnership:', err);
        alert('Failed to delete partnership');
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      alert('Some files were rejected. Please ensure all files are images under 5MB.');
    }
    
    if (validFiles.length === 0) return;

    const imagePromises = validFiles.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises)
      .then(images => {
        setFormData(prev => ({
          ...prev,
          partner_image: [...prev.partner_image, ...images]
        }));
      })
      .catch(err => {
        console.error('Error processing images:', err);
        alert('Error processing some images. Please try again.');
      });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      partner_image: prev.partner_image.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Partnerships</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Partnership</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.message || 'Failed to load partnerships'}
        </div>
      )}

      {/* Partnerships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partnerships.map((partnership) => (
          <div key={partnership.id} className="bg-white rounded-lg shadow p-6">
            {Array.isArray(partnership.partner_image) && partnership.partner_image[0] ? (
              <img
                src={partnership.partner_image[0]}
                alt={partnership.partner_name}
                className="w-full h-32 object-cover rounded-lg mb-4"
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = `https://via.placeholder.com/400x128/4B5563/FFFFFF?text=${encodeURIComponent(partnership.partner_name || 'Partner')}`;
                }}
              />
            ) : (
              <img
                src={`https://via.placeholder.com/400x128/4B5563/FFFFFF?text=${encodeURIComponent(partnership.partner_name || 'Partner')}`}
                alt={partnership.partner_name}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {partnership.partner_name}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(partnership)}
                className="text-blue-600 hover:text-blue-900"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(partnership.id)}
                className="text-red-600 hover:text-red-900"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingPartnership ? 'Edit Partnership' : 'Add Partnership'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.partner_name}
                  onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                {formData.partner_image.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.partner_image.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700"
                >
                  {editingPartnership ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPartnership(null);
                    setFormData({ partner_name: '', partner_image: [] });
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partnerships;