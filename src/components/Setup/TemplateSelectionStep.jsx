import React from 'react';
import RACE_TEMPLATES from '../../data/templates/index';

/**
 * Step 0 of the race setup wizard.
 * User selects a template to pre-fill the form, or starts from scratch.
 */
function TemplateSelectionStep({ onSelect }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Choose a Race Template
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start from an existing template or build your race from scratch.
          Templates pre-fill checkpoints, runner ranges, and wave configuration.
        </p>
      </div>

      {/* Start from scratch */}
      <button
        onClick={() => onSelect(null)}
        className="w-full text-left p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-navy-500 dark:hover:border-navy-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">➕</span>
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
      <div className="grid gap-4 sm:grid-cols-2">
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
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {template.checkpoints.length} checkpoints
              </span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                {template.runnerRanges.map(r => `${r.min}–${r.max}`).join(', ')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                {template.defaultBatches.length} wave{template.defaultBatches.length !== 1 ? 's' : ''}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TemplateSelectionStep;
