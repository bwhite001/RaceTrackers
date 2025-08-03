import React, { useState, useMemo } from "react";
import { RUNNER_STATUSES, GROUP_SIZES } from "../../types/index.js";
import TimeUtils from "../../services/timeUtils.js";
import SearchInput from "./RunnerGrid/SearchInput";
import ViewModeToggle from "./RunnerGrid/ViewModeToggle";

/**
 * Shared runner grid for tracking runner status.
 * Props:
 * - runners: array of runner objects
 * - onMarkRunner: function to mark a runner as passed
 * - onUnmarkRunner: function to unmark/revert a runner (optional)
 * - onUpdateTime: function to update runner time (optional)
 * - isLoading: boolean
 * - raceConfig: race configuration object
 * - settings: user settings object
 * - contextLabel: string
 */
const SharedRunnerGrid = ({
    runners,
    onMarkRunner,
    onUnmarkRunner,
    onUpdateTime,
    isLoading,
    raceConfig,
    settings,
    contextLabel = "",
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState(
        settings?.runnerViewMode || "grid"
    );
    const [groupSize, setGroupSize] = useState(settings?.groupSize || 50);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [editingTime, setEditingTime] = useState(null); // runnerNumber being edited
    const [editTimeValue, setEditTimeValue] = useState("");
    const [clickTimeout, setClickTimeout] = useState(null);

    // Filter runners based on search term
    const filteredRunners = useMemo(() => {
        if (!searchTerm) return runners;
        const term = searchTerm.toLowerCase();
        return runners.filter((runner) =>
            runner.number.toString().includes(term)
        );
    }, [runners, searchTerm]);

    // Group runners for large ranges
    const groupedRunners = useMemo(() => {
        if (
            !raceConfig ||
            raceConfig.maxRunner - raceConfig.minRunner < groupSize
        ) {
            return [
                { start: raceConfig?.minRunner || 1, runners: filteredRunners },
            ];
        }
        
        const groups = [];
        const totalRunners = raceConfig.maxRunner - raceConfig.minRunner + 1;
        
        for (let i = 0; i < totalRunners; i += groupSize) {
            const start = raceConfig.minRunner + i;
            const end = Math.min(start + groupSize - 1, raceConfig.maxRunner);
            
            // Create a Set to track unique runner numbers in this group
            const seenRunners = new Set();
            const groupRunners = filteredRunners.filter((runner) => {
                const inRange = runner.number >= start && runner.number <= end;
                const notSeen = !seenRunners.has(runner.number);
                
                if (inRange && notSeen) {
                    seenRunners.add(runner.number);
                    return true;
                }
                return false;
            });
            
            if (groupRunners.length > 0 || !searchTerm) {
                groups.push({
                    start,
                    end,
                    runners: groupRunners,
                    label: `${start}-${end}`,
                });
            }
        }
        return groups;
    }, [filteredRunners, raceConfig, groupSize, searchTerm]);

    const handleRunnerClick = async (runner) => {
        // Clear any existing timeout
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);
        }

        // Set a timeout for single click
        const timeout = setTimeout(async () => {
            try {
                // Single click behavior - mark runner as passed
                if (runner.status === RUNNER_STATUSES.PASSED) return;
                if (onMarkRunner) {
                    await onMarkRunner(runner.number);
                }
            } catch (error) {
                console.error("Failed to update runner:", error);
            }
            setClickTimeout(null);
        }, 250); // Reduced delay for better responsiveness

        setClickTimeout(timeout);
    };

    const handleRunnerDoubleClick = async (runner) => {
        // Clear the single click timeout
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);
        }

        try {
            // Double click behavior - unmark/revert runner
            if (runner.status === RUNNER_STATUSES.PASSED && onUnmarkRunner) {
                await onUnmarkRunner(runner.number);
            }
        } catch (error) {
            console.error("Failed to unmark runner:", error);
        }
    };

    const handleTimeClick = (runner, e) => {
        e.stopPropagation(); // Prevent runner click
        if (runner.recordedTime) {
            setEditingTime(runner.number);
            setEditTimeValue(TimeUtils.formatTime(runner.recordedTime, "HH:mm"));
        }
    };

    const handleTimeSubmit = async (runnerNumber) => {
        try {
            if (onUpdateTime && editTimeValue) {
                // Parse the time and create a timestamp for today
                const [hours, minutes] = editTimeValue.split(':').map(Number);
                const now = new Date();
                const newTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                await onUpdateTime(runnerNumber, newTime.toISOString());
            }
            setEditingTime(null);
            setEditTimeValue("");
        } catch (error) {
            console.error("Failed to update time:", error);
        }
    };

    const handleTimeCancel = () => {
        setEditingTime(null);
        setEditTimeValue("");
    };

    const getRunnerButtonClass = (runner) => {
        const baseClass =
            "runner-button flex items-center justify-center text-sm font-medium rounded-lg border-2 focus-visible:focus";
        switch (runner.status) {
            case RUNNER_STATUSES.CALLED_IN:
                return `${baseClass} status-called-in cursor-pointer hover:opacity-80`;
            case RUNNER_STATUSES.MARKED_OFF:
                return `${baseClass} status-marked-off cursor-pointer hover:opacity-80`;
            case RUNNER_STATUSES.PASSED:
                return `${baseClass} status-passed cursor-pointer hover:opacity-80`;
            case RUNNER_STATUSES.NON_STARTER:
                return `${baseClass} status-non-starter cursor-default`;
            case RUNNER_STATUSES.DNF:
                return `${baseClass} status-dnf cursor-default`;
            case RUNNER_STATUSES.PENDING:
                return `${baseClass} status-pending cursor-pointer hover:opacity-80`;
            default:
                return `${baseClass} status-not-started cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600`;
        }
    };

    const getRunnerContent = (runner) => {
        const isEditingThisRunner = editingTime === runner.number;
        
        const timeDisplay = runner.recordedTime && (
            isEditingThisRunner ? (
                <div className="flex items-center space-x-1 mt-1" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="time"
                        value={editTimeValue}
                        onChange={(e) => setEditTimeValue(e.target.value)}
                        className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 w-16"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleTimeSubmit(runner.number);
                            } else if (e.key === 'Escape') {
                                handleTimeCancel();
                            }
                        }}
                        onBlur={() => handleTimeSubmit(runner.number)}
                    />
                </div>
            ) : (
                <span 
                    className="text-xs mt-1 opacity-90 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 px-1 py-0.5 rounded"
                    onClick={(e) => handleTimeClick(runner, e)}
                    title="Click to edit time"
                >
                    {TimeUtils.formatTime(runner.recordedTime, "HH:mm")}
                </span>
            )
        );

        const content = (
            <>
                <span className="font-bold">{runner.number}</span>
                {timeDisplay}
            </>
        );

        if (viewMode === "list") {
            return (
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">{content}</div>
                    <div className="text-xs opacity-75">
                        {runner.status === RUNNER_STATUSES.PASSED ? "✅" : ""}
                    </div>
                </div>
            );
        }
        return <div className="flex flex-col items-center">{content}</div>;
    };

    const toggleGroup = (groupStart) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupStart)) {
            newExpanded.delete(groupStart);
        } else {
            newExpanded.add(groupStart);
        }
        setExpandedGroups(newExpanded);
    };

    const getGroupStats = (groupRunners) => {
        const passed = groupRunners.filter(
            (r) => r.status === RUNNER_STATUSES.PASSED
        ).length;
        const total = groupRunners.length;
        return { passed, total, remaining: total - passed };
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <SearchInput searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <div className="flex items-center space-x-4">
                    {/* Group Size */}
                    {raceConfig &&
                        raceConfig.maxRunner - raceConfig.minRunner >= 50 && (
                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-600 dark:text-gray-300">
                                    Group:
                                </label>
                                <select
                                    value={groupSize}
                                    onChange={(e) =>
                                        setGroupSize(parseInt(e.target.value))
                                    }
                                    className="form-input py-1 text-sm"
                                >
                                    {GROUP_SIZES.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    {/* View Mode Toggle */}
                    <ViewModeToggle
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />
                </div>
            </div>

            {/* Results Count */}
            {searchTerm && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    Found {filteredRunners.length} runner
                    {filteredRunners.length !== 1 ? "s" : ""}
                </div>
            )}

            {/* Runner Groups */}
            <div className="space-y-4">
                {groupedRunners.map((group) => {
                    const isExpanded =
                        expandedGroups.has(group.start) ||
                        groupedRunners.length === 1;
                    const stats = getGroupStats(group.runners);
                    return (
                        <div key={group.start} className="card">
                            {/* Group Header (only show for multiple groups) */}
                            {groupedRunners.length > 1 && (
                                <div
                                    className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    onClick={() => toggleGroup(group.start)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {contextLabel
                                                ? `${contextLabel}: `
                                                : ""}
                                            Runners {group.label}
                                        </h3>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                            <span className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-status-passed mr-1"></div>
                                                {stats.passed}
                                            </span>
                                            <span>/</span>
                                            <span>{stats.total}</span>
                                        </div>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${
                                            isExpanded ? "rotate-180" : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            )}
                            {/* Runner Grid/List */}
                            {isExpanded && (
                                <div className="p-4">
                                    {group.runners.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No runners found in this range
                                        </div>
                                    ) : (
                                        <div
                                            className={
                                                viewMode === "grid"
                                                    ? "runner-grid"
                                                    : "space-y-2"
                                            }
                                        >
                                            {group.runners.map((runner) => (
                                                <button
                                                    key={`runner-${runner.number}-${runner.status}-${group.start}`}
                                                    onClick={() => handleRunnerClick(runner)}
                                                    onDoubleClick={() => handleRunnerDoubleClick(runner)}
                                                    disabled={isLoading}
                                                    className={`
                                                        ${getRunnerButtonClass(runner)}
                                                        ${viewMode === "grid" ? "h-16 w-full" : "h-12 w-full px-4"}
                                                        disabled:opacity-50
                                                    `}
                                                    title={`Runner ${runner.number} - ${runner.status.replace("-", " ")} - Double-click to uncheck`}
                                                >
                                                    {getRunnerContent(runner)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Instructions
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Click on a runner number to mark them as passed</li>
                    <li>• Double-click on a passed runner to uncheck/revert them</li>
                    <li>• Click on a runner's time to edit it</li>
                    <li>• Use the search bar to quickly find specific runners</li>
                    <li>• Switch between grid and list view using the toggle buttons</li>
                    <li>• For large ranges, runners are grouped for easier navigation</li>
                </ul>
            </div>
        </div>
    );
};

export default SharedRunnerGrid;