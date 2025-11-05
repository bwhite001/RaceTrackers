import React, { useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * Modal Context
 * Provides modal state to child components
 */
const ModalContext = createContext({
  onClose: () => {},
  size: 'md',
});

/**
 * Hook to access Modal context
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within a Modal component');
  }
  return context;
};

/**
 * Modal Component
 * 
 * A flexible modal/dialog component with overlay, focus trap, and keyboard support.
 * Supports multiple sizes and can be closed via backdrop click or ESC key.
 * 
 * @component
 * @example
 * <Modal isOpen={isOpen} onClose={handleClose} size="lg">
 *   <ModalHeader>Title</ModalHeader>
 *   <ModalBody>Content</ModalBody>
 *   <ModalFooter>
 *     <Button onClick={handleClose}>Close</Button>
 *   </ModalFooter>
 * </Modal>
 */
const Modal = ({
  children,
  isOpen = false,
  onClose,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Size styles
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    // Save current active element
    previousActiveElement.current = document.activeElement;

    // Lock scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      // Restore scroll
      document.body.style.overflow = originalOverflow;

      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const contextValue = {
    onClose,
    size,
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white dark:bg-gray-800 rounded-lg shadow-elevated',
          'animate-slide-up',
          'max-h-[90vh] flex flex-col',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <ModalContext.Provider value={contextValue}>
          {/* Close button */}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 z-10',
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-lg p-1'
              )}
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {children}
        </ModalContext.Provider>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

Modal.propTypes = {
  /** Modal content */
  children: PropTypes.node.isRequired,
  
  /** Whether the modal is open */
  isOpen: PropTypes.bool.isRequired,
  
  /** Callback when modal should close */
  onClose: PropTypes.func.isRequired,
  
  /** Size of the modal */
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', 'full']),
  
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick: PropTypes.bool,
  
  /** Whether pressing ESC closes the modal */
  closeOnEsc: PropTypes.bool,
  
  /** Whether to show the close button */
  showCloseButton: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Modal;
