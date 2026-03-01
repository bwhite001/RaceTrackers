import React from 'react';
import PropTypes from 'prop-types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import StandardModal from './StandardModal';

/**
 * ConfirmModal — a thin wrapper around StandardModal for confirmation dialogs.
 * Replaces window.confirm() with a properly designed modal experience.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete race?"
 *   message="This action cannot be undone. All runner data will be permanently removed."
 *   confirmLabel="Delete Race"
 *   confirmVariant="danger"
 * />
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
}) => {
  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<ExclamationTriangleIcon className="w-6 h-6 text-accent-red-500" aria-hidden="true" />}
      size="sm"
      primaryAction={{
        label: confirmLabel,
        onClick: onConfirm,
        variant: confirmVariant,
        loading,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose,
      }}
    >
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{message}</p>
    </StandardModal>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  confirmVariant: PropTypes.oneOf(['danger', 'primary', 'warning']),
  loading: PropTypes.bool,
};

export default ConfirmModal;
