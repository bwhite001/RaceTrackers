import React from 'react';
import PropTypes from 'prop-types';
import {
  BoltIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import IconButton from './ui/IconButton';
import OfflineBadge from './ui/OfflineBadge';
import { MODULE_TYPES } from '../store/navigationStore';

// ─── Module badge config ──────────────────────────────────────────────────────

const MODULE_BADGE = {
  [MODULE_TYPES.CHECKPOINT]: {
    label: 'Checkpoint',
    classes: 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30',
  },
  [MODULE_TYPES.BASE_STATION]: {
    label: 'Base Station',
    classes: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30',
  },
  [MODULE_TYPES.RACE_MAINTENANCE]: {
    label: 'Race Maintenance',
    classes: 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30',
  },
};

// ─── PageHeader ───────────────────────────────────────────────────────────────

/**
 * PageHeader — unified navy gradient header used across all views.
 *
 * Landing mode:
 *   <PageHeader variant="landing" onHelp={fn} onSettings={fn} />
 *
 * Operational mode:
 *   <PageHeader
 *     variant="operational"
 *     title="Race Name"
 *     moduleType={MODULE_TYPES.CHECKPOINT}
 *     moduleLabel="Checkpoint 3"
 *     onExit={fn}
 *     actions={[{ icon: <ArrowDownTrayIcon />, label: 'Export', onClick: fn }]}
 *     onHelp={fn}
 *     onSettings={fn}
 *   />
 */
const PageHeader = ({
  variant = 'landing',
  title,
  moduleType,
  moduleLabel,
  onExit,
  actions = [],
  onHelp,
  onSettings,
}) => {
  const badge = moduleType ? MODULE_BADGE[moduleType] : null;
  const resolvedModuleLabel = moduleLabel ?? badge?.label;

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-navy-900 to-navy-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Left section ── */}
          {variant === 'landing' ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/20">
                <BoltIcon className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Race Tracker Pro
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              {onExit && (
                <IconButton
                  icon={<ArrowLeftIcon />}
                  label="Exit operation"
                  onClick={onExit}
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                {title && (
                  <p className="text-sm font-medium text-white truncate leading-none">
                    {title}
                  </p>
                )}
                {badge && resolvedModuleLabel && (
                  <span
                    className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full
                                text-xs font-semibold tracking-wide ${badge.classes}`}
                  >
                    {resolvedModuleLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Right section ── */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <OfflineBadge className="mr-1" />

            {/* Context-specific actions */}
            {actions.map((action) => (
              <IconButton
                key={action.label}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              />
            ))}

            {onHelp && (
              <IconButton
                icon={<QuestionMarkCircleIcon />}
                label="Help"
                onClick={onHelp}
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              />
            )}

            {onSettings && (
              <IconButton
                icon={<Cog6ToothIcon />}
                label="Settings"
                onClick={onSettings}
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

PageHeader.propTypes = {
  variant: PropTypes.oneOf(['landing', 'operational']),
  title: PropTypes.string,
  moduleType: PropTypes.string,
  moduleLabel: PropTypes.string,
  onExit: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
    })
  ),
  onHelp: PropTypes.func,
  onSettings: PropTypes.func,
};

export default PageHeader;
