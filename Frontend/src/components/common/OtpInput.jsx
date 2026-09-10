import React, { useRef } from 'react';
import cx from 'classnames';
import styles from './OtpInput.module.css';
import { useLanguage } from '../../context/LanguageContext';

export default function OtpInput({
  value = '',
  onChange,
  label,
  description,
  maxLength = 6,
  placeholder = 'XXXXXX',
  required = false,
  autoFocus = false,
  variant = 'github', // 'github' (single input with XXXXXX) or 'boxes' (6 individual digit boxes)
  disabled = false,
  error = '',
  style = {}
}) {
  const { t } = useLanguage();
  const digitsCount = value ? value.length : 0;
  const isComplete = digitsCount === maxLength;

  const inputRefs = useRef([]);

  const handleSingleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, maxLength);
    if (onChange) onChange(raw);
  };

  const handleBoxChange = (index, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const valArr = (value || '').padEnd(maxLength, ' ').split('');
    valArr[index] = char || '';
    const newStr = valArr.join('').trimEnd().substring(0, maxLength);
    if (onChange) onChange(newStr.replace(/\s/g, ''));

    if (char && index < maxLength - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && (!value[index] || value[index] === ' ') && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, maxLength);
    if (pastedData && onChange) {
      onChange(pastedData);
      if (variant === 'boxes' && inputRefs.current[Math.min(pastedData.length, maxLength - 1)]) {
        inputRefs.current[Math.min(pastedData.length, maxLength - 1)].focus();
      }
    }
  };

  return (
    <div className={styles.otpFieldGroup} style={style}>
      {/* Header with Label and Digit Counter */}
      {(label || maxLength) && (
        <div className={styles.otpHeader}>
          {label && <label className={styles.otpLabel}>{label}</label>}
          <div className={cx(styles.otpBadge, isComplete && styles.otpBadgeComplete)}>
            {isComplete ? (
              <span>✓ {t('otp_complete')}</span>
            ) : (
              <span>{digitsCount}/{maxLength} {t('otp_digit_unit')}</span>
            )}
          </div>
        </div>
      )}

      {description && <p className={styles.otpDescription}>{description}</p>}

      {/* GitHub Single Input Style */}
      {variant === 'github' ? (
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={cx(
              styles.githubInput,
              isComplete && styles.githubInputComplete,
              error && styles.githubInputError
            )}
            placeholder={placeholder || 'X'.repeat(maxLength)}
            value={value}
            onChange={handleSingleChange}
            onPaste={handlePaste}
            maxLength={maxLength}
            autoFocus={autoFocus}
            disabled={disabled}
            required={required}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
          />
        </div>
      ) : (
        /* 6 Segmented Boxes Style */
        <div className={styles.boxesContainer} onPaste={handlePaste}>
          {Array.from({ length: maxLength }).map((_, idx) => {
            const char = value[idx] || '';
            return (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                className={cx(styles.boxInput, char && styles.boxInputFilled)}
                value={char}
                onChange={(e) => handleBoxChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={disabled}
                autoFocus={autoFocus && idx === 0}
              />
            );
          })}
        </div>
      )}

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
