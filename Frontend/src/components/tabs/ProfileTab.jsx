import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function ProfileTab() {
  const { loggedInUser } = useAuth();
  const {
    profileForm,
    setProfileForm,
    handleProfileSubmit
  } = useChat();

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm({ ...profileForm, profilePhoto: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>Edit Profile</h1>
        <p>Customize your personal and professional profile details.</p>
      </div>

      <form onSubmit={handleProfileSubmit} className="profile-grid">
        <div className="profile-avatar-column">
          <img
            src={profileForm.profilePhoto || loggedInUser.profilePhoto}
            alt="Profile"
            className="profile-avatar-large"
          />
          <label className="avatar-upload-label">
            Choose New Photo
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className="profile-details-column">
          <div className="profile-section-card">
            <h3>Personal Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name || ''}
                  onChange={handleProfileFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={profileForm.gender || ''} onChange={handleProfileFormChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={profileForm.dob ? profileForm.dob.split('T')[0] : ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>Marital Status</label>
                <select name="maritalStatus" value={profileForm.maritalStatus || ''} onChange={handleProfileFormChange}>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={profileForm.address || ''}
                onChange={handleProfileFormChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hobbies</label>
                <input
                  type="text"
                  name="hobbies"
                  value={profileForm.hobbies || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>Sports</label>
                <input
                  type="text"
                  name="sports"
                  value={profileForm.sports || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Likes</label>
                <input
                  type="text"
                  name="likes"
                  value={profileForm.likes || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>Dislikes</label>
                <input
                  type="text"
                  name="dislikes"
                  value={profileForm.dislikes || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Preferred Cuisines</label>
              <input
                type="text"
                name="cuisines"
                value={profileForm.cuisines || ''}
                onChange={handleProfileFormChange}
              />
            </div>
          </div>

          <div className="profile-section-card">
            <h3>Professional Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={profileForm.qualification || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>Work Status</label>
                <select name="workStatus" value={profileForm.workStatus || ''} onChange={handleProfileFormChange}>
                  <option value="Employed">Employed</option>
                  <option value="Student">Student</option>
                  <option value="Unemployed">Unemployed</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>School Name</label>
                <input
                  type="text"
                  name="school"
                  value={profileForm.school || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>College Name</label>
                <input
                  type="text"
                  name="college"
                  value={profileForm.college || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Company / Organization</label>
                <input
                  type="text"
                  name="organization"
                  value={profileForm.organization || ''}
                  onChange={handleProfileFormChange}
                  disabled={profileForm.workStatus === 'Student'}
                />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={profileForm.designation || ''}
                  onChange={handleProfileFormChange}
                  disabled={profileForm.workStatus === 'Student'}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setProfileForm(loggedInUser)}>
              Reset Changes
            </button>
            <button type="submit" className="btn btn-primary">
              Save Profile
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
