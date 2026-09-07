import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import CustomSelect from '../common/CustomSelect';
import styles from './ProfileTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function ProfileTab() {
  const { loggedInUser } = useAuth();
  const { language, t } = useLanguage();
  const {
    profileForm,
    setProfileForm,
    handleProfileSubmit,
    setActiveTab,
    setSelectedContact
  } = useChat();

  const genderOptions = [
    { value: 'Male', label: language === 'en' ? 'Male' : 'Nam' },
    { value: 'Female', label: language === 'en' ? 'Female' : 'Nữ' },
    { value: 'Other', label: language === 'en' ? 'Other' : 'Khác' }
  ];

  const maritalOptions = [
    { value: 'Single', label: language === 'en' ? 'Single' : 'Độc thân' },
    { value: 'Married', label: language === 'en' ? 'Married' : 'Đã kết hôn' },
    { value: 'Divorced', label: language === 'en' ? 'Divorced' : 'Ly hôn' }
  ];

  const workStatusOptions = [
    { value: 'Employed', label: language === 'en' ? 'Employed' : 'Đang đi làm' },
    { value: 'Student', label: language === 'en' ? 'Student' : 'Học sinh / Sinh viên' },
    { value: 'Unemployed', label: language === 'en' ? 'Unemployed' : 'Thất nghiệp' }
  ];

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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            type="button" 
            className="mobile-back-btn" 
            onClick={() => {
              setActiveTab('chats');
              setSelectedContact(null);
            }}
            title={language === 'en' ? 'Back' : 'Quay lại'}
          >
            ←
          </button>
          <div>
            <h1>{t('edit_profile')}</h1>
            <p>{t('edit_profile_desc')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className={cx('profile__grid')}>
        <div className={cx('profile__avatar-column')}>
          <img
            src={profileForm.profilePhoto || loggedInUser.profilePhoto}
            alt="Profile"
            className={cx('profile__avatar')}
          />
          <label className={cx('profile__upload-btn')}>
            {language === 'en' ? 'Choose New Photo' : 'Chọn ảnh mới'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className={cx('profile__details-column')}>
          <div className={cx('profile__section-card')}>
            <h3 className={cx('profile__section-title')}>{t('personal_details')}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>{t('fullname')} *</label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name || ''}
                  onChange={handleProfileFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('gender')}</label>
                <CustomSelect
                  options={genderOptions}
                  value={profileForm.gender || 'Male'}
                  onChange={(val) => setProfileForm({ ...profileForm, gender: val })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('dob')}</label>
                <input
                  type="date"
                  name="dob"
                  value={profileForm.dob ? profileForm.dob.split('T')[0] : ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>{t('marital_status')}</label>
                <CustomSelect
                  options={maritalOptions}
                  value={profileForm.maritalStatus || 'Single'}
                  onChange={(val) => setProfileForm({ ...profileForm, maritalStatus: val })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>{t('address')}</label>
              <input
                type="text"
                name="address"
                value={profileForm.address || ''}
                onChange={handleProfileFormChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('hobbies')}</label>
                <input
                  type="text"
                  name="hobbies"
                  value={profileForm.hobbies || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>{t('sports')}</label>
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
                <label>{t('likes')}</label>
                <input
                  type="text"
                  name="likes"
                  value={profileForm.likes || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>{t('dislikes')}</label>
                <input
                  type="text"
                  name="dislikes"
                  value={profileForm.dislikes || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('cuisines')}</label>
              <input
                type="text"
                name="cuisines"
                value={profileForm.cuisines || ''}
                onChange={handleProfileFormChange}
              />
            </div>
          </div>

          <div className={cx('profile__section-card')}>
            <h3 className={cx('profile__section-title')}>{t('professional_details')}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>{t('qualification')}</label>
                <input
                  type="text"
                  name="qualification"
                  value={profileForm.qualification || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>{t('work_status')}</label>
                <CustomSelect
                  options={workStatusOptions}
                  value={profileForm.workStatus || 'Employed'}
                  onChange={(val) => setProfileForm({ ...profileForm, workStatus: val })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('school_name')}</label>
                <input
                  type="text"
                  name="school"
                  value={profileForm.school || ''}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="form-group">
                <label>{t('college_name')}</label>
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
                <label>{t('company_name')}</label>
                <input
                  type="text"
                  name="organization"
                  value={profileForm.organization || ''}
                  onChange={handleProfileFormChange}
                  disabled={profileForm.workStatus === 'Student'}
                />
              </div>
              <div className="form-group">
                <label>{t('designation')}</label>
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
              {t('reset_changes')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('save_profile')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
