import React, { useState } from 'react';
import { Sun, Moon, Sparkles, Globe, Shield, Bell, CheckCircle2, Sliders, LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminSettings() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { loggedInUser, handleLogout, triggerAlert } = useAuth();

  const [systemNotifications, setSystemNotifications] = useState(true);
  const [autoRefreshStats, setAutoRefreshStats] = useState(true);
  const [debugLogs, setDebugLogs] = useState(false);

  const handleSavePreferences = () => {
    triggerAlert('success', language === 'vi' ? 'Đã lưu cấu hình cài đặt Admin thành công!' : 'Admin settings saved successfully!');
  };

  const themes = [
    {
      id: 'dark',
      name: t('theme_dark'),
      desc: language === 'vi' ? 'Giao diện tối hiện đại, dịu mắt' : 'Sleek dark theme for night control',
      icon: Moon,
      color: '#3b82f6',
      bg: '#17212b',
      border: '#2481cc'
    },
    {
      id: 'light',
      name: t('theme_light'),
      desc: language === 'vi' ? 'Giao diện sáng sủa, độ tương phản cao' : 'Crisp light mode with high clarity',
      icon: Sun,
      color: '#f59e0b',
      bg: '#ffffff',
      border: '#e5e7eb'
    },
    {
      id: 'glass',
      name: t('theme_glass'),
      desc: language === 'vi' ? 'Hiệu ứng kính mờ sang trọng Glassmorphism' : 'Futuristic frosted glass aesthetics',
      icon: Sparkles,
      color: '#8b5cf6',
      bg: 'rgba(15, 23, 42, 0.6)',
      border: '#8b5cf6'
    }
  ];

  const languages = [
    {
      code: 'vi',
      name: 'Tiếng Việt (VN)',
      native: 'Tiếng Việt',
      flag: '🇻🇳'
    },
    {
      code: 'en',
      name: 'English (US)',
      native: 'English',
      flag: '🇺🇸'
    }
  ];

  return (
    <div className="admin-tab-content" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders size={26} style={{ color: 'var(--color-primary)' }} />
          <span>{t('admin_settings_title')}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          {t('admin_settings_desc')}
        </p>
      </div>

      {/* 1. Theme Mode Selection Card */}
      <div style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
          <span>{t('admin_system_appearance')}</span>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          {language === 'vi' ? 'Thay đổi phong cách giao diện quản trị theo sở thích của bạn' : 'Select your preferred visual style for the administrative workspace'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {themes.map((item) => {
            const IconComp = item.icon;
            const isSelected = theme === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setTheme(item.id)}
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-app)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {isSelected && (
                  <CheckCircle2 size={20} style={{ position: 'absolute', top: '14px', right: '14px', color: 'var(--color-primary)' }} />
                )}
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${item.color}20`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>{item.name}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Language Selection Card */}
      <div style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={20} style={{ color: 'var(--color-primary)' }} />
          <span>{t('admin_language_pref')}</span>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          {language === 'vi' ? 'Chọn ngôn ngữ hiển thị trên toàn bộ bảng quản trị Admin' : 'Select language interface across all admin tabs and components'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <div
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-app)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>{lang.flag}</span>
                <div style={{ flex: '1' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>{lang.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lang.native}</span>
                </div>
                {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--color-primary)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. System Administrative Preferences */}
      <div style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={20} style={{ color: 'var(--color-primary)' }} />
          <span>{language === 'vi' ? 'Tùy chọn Cảnh báo & Hệ thống' : 'System & Alert Preferences'}</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-main)' }}>
                {language === 'vi' ? 'Thông báo Hệ thống thời gian thực' : 'Real-time System Notifications'}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {language === 'vi' ? 'Hiển thị cảnh báo khi có vi phạm từ khóa hoặc sự cố SMS Gateway' : 'Show toast banners when AI content triggers or SMS gateway errors occur'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={systemNotifications}
              onChange={(e) => setSystemNotifications(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-main)' }}>
                {language === 'vi' ? 'Tự động làm mới Thống kê Dashboard' : 'Auto-refresh Dashboard Metrics'}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {language === 'vi' ? 'Cập nhật chỉ số 15 ngày tự động theo chu kỳ' : 'Periodically refresh 15-day analytics without manual reload'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoRefreshStats}
              onChange={(e) => setAutoRefreshStats(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-main)' }}>
                {language === 'vi' ? 'Chế độ Nhật ký Debug Chi tiết' : 'Detailed Debug Logging'}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {language === 'vi' ? 'Ghi vết chi tiết mã phản hồi SMS Gateway vào console' : 'Enable verbose console logs for SMS Gateway & API requests'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={debugLogs}
              onChange={(e) => setDebugLogs(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSavePreferences}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontWeight: '600' }}
          >
            {language === 'vi' ? 'Lưu Cấu Hình' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* 4. Administrator Profile & Logout Card */}
      <div style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} style={{ color: 'var(--color-primary)' }} />
          <span>{language === 'vi' ? 'Thông tin Quản trị viên' : 'Administrator Credentials'}</span>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
              {loggedInUser?.fullName || loggedInUser?.name || 'Administrator'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {loggedInUser?.email}
            </p>
            <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.75rem', fontWeight: '600', padding: '2px 8px', borderRadius: '12px', background: 'rgba(36, 129, 204, 0.15)', color: 'var(--color-primary)' }}>
              SYSTEM ADMIN ROLE
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--color-danger)',
              color: 'var(--color-danger)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
