import React, { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function CustomSelect({ options, value, onChange, placeholder, className, disabled, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options?.find(opt => opt.value === value) || options?.[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      id={id}
      className={cx('custom-select', { 'custom-select--open': isOpen, 'custom-select--disabled': disabled }, className)}
    >
      <div
        className={cx('custom-select__trigger')}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className={cx('custom-select__label')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={cx('custom-select__arrow')}>▼</span>
      </div>

      {isOpen && (
        <div className={cx('custom-select__dropdown')}>
          {options?.map((option) => (
            <div
              key={option.value}
              className={cx('custom-select__option', {
                'custom-select__option--selected': option.value === value
              })}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <span className={cx('custom-select__check')}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
