import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import profileService from '../services/profileService';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    setValue,
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm();

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('theme', user.preferences?.theme || 'system');
      setValue('defaultView', user.preferences?.defaultView || 'grid');
    }
  }, [user, setValue]);

  const onSubmitProfile = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await profileService.updateProfile({
        name: data.name,
        preferences: {
          theme: data.theme,
          defaultView: data.defaultView,
        },
      });

      updateUser(response.data.profile);
      setSuccessMessage('Profile updated successfully');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await profileService.changePassword(data.oldPassword, data.newPassword);
      setSuccessMessage('Password changed successfully');
      resetPasswordForm();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Settings</h1>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
        </div>

        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}

        {errorMessage && (
          <div className="alert alert-error">{errorMessage}</div>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="profile-form">
            <div className="form-section">
              <h2>Personal Information</h2>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  className={`form-input ${profileErrors.name ? 'error' : ''}`}
                  {...registerProfile('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                />
                {profileErrors.name && (
                  <span className="error-message">{profileErrors.name.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={user?.email}
                  disabled
                />
                <span className="form-hint">Email cannot be changed</span>
              </div>
            </div>

            <div className="form-section">
              <h2>Preferences</h2>

              <div className="form-group">
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  className="form-input"
                  {...registerProfile('theme')}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="defaultView">Default View</label>
                <select
                  id="defaultView"
                  className="form-input"
                  {...registerProfile('defaultView')}
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="profile-form">
            <div className="form-section">
              <h2>Change Password</h2>

              <div className="form-group">
                <label htmlFor="oldPassword">Current Password</label>
                <input
                  type="password"
                  id="oldPassword"
                  className={`form-input ${passwordErrors.oldPassword ? 'error' : ''}`}
                  {...registerPassword('oldPassword', {
                    required: 'Current password is required',
                  })}
                />
                {passwordErrors.oldPassword && (
                  <span className="error-message">
                    {passwordErrors.oldPassword.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                {passwordErrors.newPassword && (
                  <span className="error-message">
                    {passwordErrors.newPassword.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value, formValues) =>
                      value === formValues.newPassword || 'Passwords do not match',
                  })}
                />
                {passwordErrors.confirmPassword && (
                  <span className="error-message">
                    {passwordErrors.confirmPassword.message}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;