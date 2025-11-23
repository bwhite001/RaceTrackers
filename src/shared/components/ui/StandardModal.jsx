import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../design-system/components/Modal/Modal';
import ModalBody from '../../../design-system/components/Modal/ModalBody';
import DialogHeader from './DialogHeader';
import DialogFooter from './DialogFooter';

/**
 * StandardModal - A standardized modal wrapper following DRY and SOLID principles
 * 
 * Combines Modal, DialogHeader, and DialogFooter into a single reusable component
 * with consistent styling and behavior across the application.
 * 
 * Features:
 * - Full-width responsive design (max-w-7xl by default)
 * - Prominent, easy-to-use close button
 * - Consistent header and footer styling
 * - Flexible content area
 * - Keyboard shortcuts (ESC to close)
 * - Focus management
 * 
 * @component
 * @example
 * <StandardModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Edit Runner"
 *   subtitle="Update runner information"
 *   size="lg"
 *   primaryAction={{
 *     label: 'Save',
 *     onClick: handleSave,
 *     disabled: !isValid
 *   }}
 *   secondaryAction={{
 *     label: 'Cancel',
 *     onClick: handleClose
 *   }}
 * >
 *   <form>
 *     {/* Your form content *\/}
 *   </form>
 * </StandardModal>
 */
const StandardModal = ({
  // Modal props
  isOpen,
  onClose,
  size = '2xl',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  
  // Header props
  title,
  subtitle,
  icon,
  headerActions,
  stickyHeader = true,
  
  // Footer props
  primaryAction,
  secondaryAction,
  tertiaryAction,
  footerAlign = 'end',
  stickyFooter = false,
  showFooter = true,
  
  // Content
  children,
  
  // Additional customization
  className,
  bodyClassName,
  ...props
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEsc={closeOnEsc}
      showCloseButton={showCloseButton}
      className={className}
      {...props}
    >
      {/* Header */}
      <DialogHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        onClose={onClose}
        showCloseButton={false} // Modal handles close button
        sticky={stickyHeader}
        actions={headerActions}
      />

      {/* Body */}
      <ModalBody className={bodyClassName}>
        {children}
      </ModalBody>

      {/* Footer */}
      {showFooter && (primaryAction || secondaryAction || tertiaryAction) && (
        <DialogFooter
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          tertiaryAction={tertiaryAction}
          align={footerAlign}
          sticky={stickyFooter}
        />
      )}
    </Modal>
  );
};

StandardModal.propTypes = {
  // Modal props
  /** Whether the modal is open */
  isOpen: PropTypes.bool.isRequired,
  
  /** Callback when modal should close */
  onClose: PropTypes.func.isRequired,
  
  /** Size of the modal */
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', 'full']),
  
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick: PropTypes.bool,
  
  /** Whether ESC key closes modal */
  closeOnEsc: PropTypes.bool,
  
  /** Whether to show close button */
  showCloseButton: PropTypes.bool,
  
  // Header props
  /** Modal title */
  title: PropTypes.string.isRequired,
  
  /** Optional subtitle */
  subtitle: PropTypes.string,
  
  /** Optional icon element */
  icon: PropTypes.node,
  
  /** Additional header actions */
  headerActions: PropTypes.node,
  
  /** Whether header should be sticky */
  stickyHeader: PropTypes.bool,
  
  // Footer props
  /** Primary action button config */
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    variant: PropTypes.oneOf(['primary', 'danger', 'success', 'warning'])
  }),
  
  /** Secondary action button config */
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool
  }),
  
  /** Tertiary action button config */
  tertiaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool
  }),
  
  /** Footer button alignment */
  footerAlign: PropTypes.oneOf(['start', 'center', 'end', 'between']),
  
  /** Whether footer should be sticky */
  stickyFooter: PropTypes.bool,
  
  /** Whether to show footer */
  showFooter: PropTypes.bool,
  
  // Content
  /** Modal content */
  children: PropTypes.node.isRequired,
  
  // Customization
  /** Additional CSS classes for modal */
  className: PropTypes.string,
  
  /** Additional CSS classes for body */
  bodyClassName: PropTypes.string,
};

export default StandardModal;
