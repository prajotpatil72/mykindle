import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

const CollectionModal = ({ isOpen, onClose, onSubmit, collection = null, collections = [] }) => {
  const [selectedColor, setSelectedColor] = useState('#4f46e5');
  const [selectedIcon, setSelectedIcon] = useState('📁');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const colors = [
    '#4f46e5', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  ];

  const icons = ['📁', '📂', '📚', '📖', '📝', '📄', '🗂️', '📦', '🎯', '⭐', '💼', '🏠'];

  useEffect(() => {
    if (collection) {
      setValue('name', collection.name);
      setValue('description', collection.description || '');
      setValue('parentId', collection.parentId || '');
      setSelectedColor(collection.color || '#4f46e5');
      setSelectedIcon(collection.icon || '📁');
    } else {
      reset();
      setSelectedColor('#4f46e5');
      setSelectedIcon('📁');
    }
  }, [collection, setValue, reset]);

  const onFormSubmit = (data) => {
    onSubmit({
      ...data,
      color: selectedColor,
      icon: selectedIcon,
      parentId: data.parentId || null,
    });
  };

  if (!isOpen) return null;

  // Filter out current collection and its children from parent options
  const availableParents = collections.filter((c) => {
    if (collection && c._id === collection._id) return false;
    // TODO: Also filter out children
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{collection ? 'Edit Collection' : 'New Collection'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Collection Name *</label>
              <input
                type="text"
                id="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                {...register('name', {
                  required: 'Name is required',
                  maxLength: {
                    value: 100,
                    message: 'Name cannot exceed 100 characters',
                  },
                })}
              />
              {errors.name && (
                <span className="error-message">{errors.name.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-input"
                rows="3"
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'Description cannot exceed 500 characters',
                  },
                })}
              />
              {errors.description && (
                <span className="error-message">{errors.description.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="parentId">Parent Collection (Optional)</label>
              <select
                id="parentId"
                className="form-input"
                {...register('parentId')}
              >
                <option value="">None (Root Level)</option>
                {availableParents.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Icon</label>
              <div className="icon-picker">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="collection-preview">
              <span className="preview-label">Preview:</span>
              <div className="preview-item" style={{ color: selectedColor }}>
                <span className="preview-icon">{selectedIcon}</span>
                <span className="preview-name">
                  {register('name').value || 'Collection Name'}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {collection ? 'Update' : 'Create'} Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionModal;