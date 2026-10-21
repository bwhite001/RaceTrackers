import React from 'react';
import { ArrowDownTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import RACE_TEMPLATES from '../../data/templates/index';

/**
 * Step 0 of the race setup wizard.
 * User selects a template to pre-fill the form, imports from WebScorer, or starts from scratch.
 *
 * Props:
 *   onSelect(template|null)   — proceed with template (or null = scratch)
 *   onImportFromWebScorer()   — open the WebScorer import wizard
 */
function TemplateSelectionStep({ onSelect, onImportFromWebScorer }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Choose a Race Template
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start from an existing template, import a WebScorer participant list, or build from scratch.
        </p>
      </div>

      {/* Import from WebScorer */}
      <button
        onClick={onImportFromWebScorer}
        className="w-full text-left p-4 rounded-lg border-2 border-navy-300 dark:border-navy-700 hover:border-navy-500 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/20 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <ArrowDownTrayIcon className="w-7 h-7 text-vk-blue" aria-hidden="true" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white group-hover:text-navy-700 dark:group-hover:text-navy-300">
              Import from WebScorer
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a race directly from a WebScorer participant export (.xlsx)
            </p>
          </div>
        </div>
      </button>

      {/* Start from scratch */}
      <button
        onClick={() => onSelect(null)}
        className="w-full text-left p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-navy-500 dark:hover:border-navy-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <PlusIcon className="w-7 h-7 text-vk-blue" aria-hidden="true" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white group-hover:text-navy-700 dark:group-hover:text-navy-300">
              Start from Scratch
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a completely new race configuration
            </p>
          </div>
        </div>
      </button>

      {/* Template cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {RACE_TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-navy-500 dark:hover:border-navy-400 hover:shadow-md dark:hover:bg-gray-800 bg-white dark:bg-gray-900 transition-all"
          >
            <p className="font-semibold text-gray-900 dark:text-white">
              {template.name}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {template.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-vk-band text-vk-navy dark:bg-gray-700 dark:text-gray-100">
                {template.checkpoints.length} checkpoints
              </span>
              <span className="px-2 py-0.5 rounded-full bg-vk-band text-vk-navy dark:bg-gray-700 dark:text-gray-100">
                {template.runnerRanges.map(r => `${r.min}–${r.max}`).join(', ')}
              </span>
              {template.defaultBatches.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-vk-band text-vk-navy dark:bg-gray-700 dark:text-gray-100">
                  {template.defaultBatches.length} wave{template.defaultBatches.length !== 1 ? 's' : ''}
                </span>
              )}
              {template.defaultStartTime && (
                <span className="px-2 py-0.5 rounded-full bg-vk-band text-vk-navy dark:bg-gray-700 dark:text-gray-100">
                  Start {template.defaultStartTime.slice(0, 5)}
                </span>
              )}
              {template.baseLocation && (
                <span className="px-2 py-0.5 rounded-full bg-vk-gold-tint border border-vk-gold text-vk-ink dark:text-gray-100">
                  {template.baseLocation}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TemplateSelectionStep;
