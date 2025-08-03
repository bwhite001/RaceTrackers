import React from "react";
import { APP_MODES } from "../../types/index.js";
import { useRaceStore } from "../../store/useRaceStore.js";

const BreadcrumbNav = () => {
    const { mode, setMode, currentCheckpoint, setCurrentCheckpoint } = useRaceStore();
    const getBreadcrumbs = () => {

        switch (mode) {
            case APP_MODES.RACE_CONFIG:
                return [
                    { label: "Setup", mode: APP_MODES.SETUP },
                    { label: "Config", mode: APP_MODES.RACE_CONFIG },
                ];
            case APP_MODES.RACE_OVERVIEW:
                return [
                    { label: "Setup", mode: APP_MODES.SETUP },
                    { label: "Overview", mode: APP_MODES.RACE_OVERVIEW },
                ];
            case APP_MODES.CHECKPOINT:
                return [
                    { label: "Setup", mode: APP_MODES.SETUP },
                    { label: "Overview", mode: APP_MODES.RACE_OVERVIEW },
                    { label: "Checkpoint "+currentCheckpoint, mode: APP_MODES.CHECKPOINT },
                ];
            case APP_MODES.BASE_STATION:
                return [
                    { label: "Setup", mode: APP_MODES.SETUP },
                    { label: "Overview", mode: APP_MODES.RACE_OVERVIEW },
                    { label: "Base Station", mode: APP_MODES.BASE_STATION },
                ];
            default:
                return [{ label: "Setup", mode: APP_MODES.SETUP }];
        }
    }

    const handleBreadcrumbClick = (targetMode) => {
        switch (targetMode) {
            case APP_MODES.SETUP:
                // Logic to handle going back to setup
                break;
            default:
                // Handle other modes if needed
                break;
        }
        setMode(targetMode)
    }

    const breadcrumbs = getBreadcrumbs();
    return (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
            {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.mode}>
                    {index > 0 && <span className="mx-1">/</span>}
                    {index === breadcrumbs.length - 1 ? (
                        <span className="text-gray-700 dark:text-gray-200">{crumb.label}</span>
                    ) : (
                        <button
                            type="button"
                            className="hover:underline focus:outline-none"
                            onClick={() => handleBreadcrumbClick(crumb.mode)}
                        >
                            {crumb.label}
                        </button>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default BreadcrumbNav;
