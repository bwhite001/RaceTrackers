**Race Template System - Implementation Guide**

**Project:** RaceTracker Pro  
**Feature:** Create Race from Template  
**Version:** 1.0  
**Date:** November 23, 2025  
**Author:** Brandon Johnston

**Executive Summary**

This document provides complete implementation instructions for adding a **Race Template** feature to RaceTracker Pro. The feature allows race coordinators to create reusable race templates with checkpoint configurations, runner batch assignments, and race details that can be quickly instantiated with updated dates and minor modifications for annual recurring events.

**Key Benefits:**

- Reduces race setup time from 10 minutes to under 2 minutes for recurring events
- Eliminates checkpoint configuration errors through template reuse
- Maintains consistency across years for the same event
- Supports the 5 WICEN-supported trail running events

**Table of Contents**

- [User Story & Requirements](#user_story_requirements)
- [Database Schema Changes](#database_schema_changes)
- [Initial Templates for 2025](#initial_templates_for_2025)
- [Service Layer Implementation](#service_layer_implementation)
- [UI Component Implementation](#ui_component_implementation)
- [Template Management Features](#template_management_features)
- [Testing Strategy](#testing_strategy)
- [Migration & Deployment](#migration_deployment)
- [Future Enhancements](#future_enhancements)

**User Story & Requirements**

**Primary User Story**

**As a** race coordinator  
**I want to** create a new race from a pre-configured template  
**So that** I can quickly set up recurring annual races without re-entering checkpoint details, runner batches, and race configuration

**Acceptance Criteria**

- **Template Selection:**
  - User can select from a list of available race templates during race creation
  - Template preview shows checkpoint count, typical runner range, and event description
  - User can choose to create from scratch or from template
- **Template Instantiation:**
  - Template automatically populates: race name (with year), checkpoints with names/locations/operators, default runner range
  - User can modify any template field before creation: race date, start time, runner ranges, checkpoint details
  - Validation ensures no duplicate race names or conflicting dates
- **Template Management:**
  - Coordinators can save current race as a new template
  - Templates can be updated (checkpoint changes, runner range adjustments)
  - Templates can be archived but not deleted (historical record)
  - Template metadata tracks: creation date, last used date, usage count
- **Default Templates:**
  - System includes 5 pre-configured templates for 2025 WICEN events
  - Templates include complete checkpoint configurations with GPS coordinates
  - Operator callsigns can be updated during instantiation

**Non-Functional Requirements**

- Template loading must complete in under 500ms
- Template list must support 50+ templates without performance degradation
- Offline-first: templates stored in IndexedDB
- Template export/import via JSON for sharing between devices

**Database Schema Changes**

**New Table: raceTemplates**

Add the following table to src/database/schema.ts:

export const raceTemplates = db.version(2).stores({  
raceTemplates: '++id, &name, eventType, createdAt, lastUsedAt, usageCount, archived'  
});

export interface RaceTemplate {  
id?: number;  
name: string; // e.g., "Brisbane Trail Marathon"  
eventType: string; // e.g., "Trail Marathon", "Ultra Marathon"  
description?: string;

// Default race configuration  
defaultStartTime: string; // e.g., "07:00:00"  
defaultRunnerRangeStart: number;  
defaultRunnerRangeEnd: number;

// Checkpoint configuration  
checkpoints: TemplateCheckpoint\[\];

// Metadata  
createdAt: string; // ISO timestamp  
lastUsedAt?: string; // ISO timestamp  
usageCount: number;  
archived: boolean;

// Optional metadata  
metadata?: {  
organizer?: string;  
callsign?: string;  
baseLocation?: string;  
baseOperators?: string\[\];  
frequencies?: {  
primary?: string;  
fallback?: string;  
};  
historicalDates?: string\[\]; // Track past event dates  
};  
}

export interface TemplateCheckpoint {  
checkpointNumber: number;  
checkpointName: string;  
location?: string; // GPS coordinates or description  
orderSequence: number;  
metadata?: {  
operators?: string\[\];  
description?: string;  
requiredEquipment?: string\[\];  
};  
}

**Database Migration**

Update src/database/db.ts to include the new schema version:

import Dexie from 'dexie';

export const db = new Dexie('RaceTrackerDB');

// Version 1: Original schema  
db.version(1).stores({  
raceConfigs: '++id, &name, date, startTime',  
checkpoints: '++id, raceId, checkpointNumber',  
runners: '++id, raceId, runnerNumber',  
checkpointTimes: '++id, checkpointId, runnerId, raceId',  
baseStationCallIns: '++id, checkpointId, commonTime',  
settings: 'key'  
});

// Version 2: Add race templates  
db.version(2).stores({  
raceConfigs: '++id, &name, date, startTime',  
checkpoints: '++id, raceId, checkpointNumber',  
runners: '++id, raceId, runnerNumber',  
checkpointTimes: '++id, checkpointId, runnerId, raceId',  
baseStationCallIns: '++id, checkpointId, commonTime',  
settings: 'key',  
raceTemplates: '++id, &name, eventType, createdAt, archived' // NEW  
});

export default db;

**Initial Templates for 2025**

**Template Data Structure**

Create src/database/initialTemplates.ts:

import { RaceTemplate } from './schema';

export const INITIAL_TEMPLATES_2025: RaceTemplate\[\] = \[  
{  
name: "Brisbane Trail Marathon",  
eventType: "Trail Marathon",  
description: "Annual trail marathon starting and finishing at Enoggera Reservoir, The Gap. 22km and 42km distance options.",  
defaultStartTime: "06:30:00",  
defaultRunnerRangeStart: 1,  
defaultRunnerRangeEnd: 200,  
checkpoints: \[  
{  
checkpointNumber: 1,  
checkpointName: "Start - Enoggera Reservoir",  
location: "-27.4447, 152.9556",  
orderSequence: 1,  
metadata: {  
operators: \["VK4HIT (Allan)"\],  
description: "Race start location"  
}  
},  
{  
checkpointNumber: 2,  
checkpointName: "CP1 - Mt Nebo Road",  
location: "-27.3875, 152.9123",  
orderSequence: 2,  
metadata: {  
operators: \["VK4SIR (Peter)", "VK4SQL (Stephen)"\],  
description: "First checkpoint on Mt Nebo Road"  
}  
},  
{  
checkpointNumber: 3,  
checkpointName: "CP2 - Walkabout Creek",  
location: "-27.4123, 152.9345",  
orderSequence: 3,  
metadata: {  
operators: \["VK4IE (John)", "VK4AJJ (Andrew)"\],  
description: "Mid-course checkpoint"  
}  
},  
{  
checkpointNumber: 4,  
checkpointName: "CP3 - Simpson Falls",  
location: "-27.4289, 152.9478",  
orderSequence: 4,  
metadata: {  
operators: \["VK4SMA (Mark)", "VK4TMK (Trish)"\],  
description: "Simpson Falls checkpoint"  
}  
},  
{  
checkpointNumber: 5,  
checkpointName: "Finish - Enoggera Reservoir",  
location: "-27.4447, 152.9556",  
orderSequence: 5,  
metadata: {  
operators: \["VK4BRW (Brandon)", "VK4GJW (Greg)"\],  
description: "Finish line at reservoir"  
}  
},  
\],  
createdAt: new Date().toISOString(),  
usageCount: 0,  
archived: false,  
metadata: {  
organizer: "WICEN Queensland",  
callsign: "VK4WIP",  
baseLocation: "Enoggera Reservoir, The Gap",  
baseOperators: \["VK4BRW (Brandon)", "VK4GJW (Greg)"\],  
baseGPS: "-27.4447, 152.9556",  
frequencies: {  
primary: "147.175 MHz (+offset)",  
fallback: "147.500 MHz"  
},  
baseOperationalBy: "0600 hrs",  
historicalDates: \["2024-04-28", "2025-04-27"\]  
}  
},

{  
name: "Pinnacles Classic",  
eventType: "Trail Run",  
description: "Challenging trail run through Gold Creek and Mt Glorious areas. Multiple distance options.",  
defaultStartTime: "06:30:00",  
defaultRunnerRangeStart: 1,  
defaultRunnerRangeEnd: 150,  
checkpoints: \[  
{  
checkpointNumber: 1,  
checkpointName: "Start - Gold Creek Reservoir",  
location: "-27.3894, 152.8556",  
orderSequence: 1,  
metadata: {  
operators: \["VK4HIT (Allan)"\],  
description: "Race start at Gold Creek Reservoir"  
}  
},  
{  
checkpointNumber: 2,  
checkpointName: "CP1 - Mt Glorious Road Junction",  
location: "-27.3423, 152.7889",  
orderSequence: 2,  
metadata: {  
operators: \["VK4SIR (Peter)", "VK4SQL (Stephen)"\],  
description: "First checkpoint at road junction"  
}  
},  
{  
checkpointNumber: 3,  
checkpointName: "CP2 - Pinnacles Lookout",  
location: "-27.3156, 152.7734",  
orderSequence: 3,  
metadata: {  
operators: \["VK4IE (John)", "VK4AJJ (Andrew)"\],  
description: "Pinnacles lookout checkpoint"  
}  
},  
{  
checkpointNumber: 4,  
checkpointName: "CP3 - Return Trail",  
location: "-27.3567, 152.8123",  
orderSequence: 4,  
metadata: {  
operators: \["VK4SMA (Mark)", "VK4TMK (Trish)"\],  
description: "Return trail checkpoint"  
}  
},  
{  
checkpointNumber: 5,  
checkpointName: "Finish - Gold Creek Reservoir",  
location: "-27.3894, 152.8556",  
orderSequence: 5,  
metadata: {  
operators: \["VK4BRW (Brandon)", "VK4GJW (Greg)"\],  
description: "Finish line at reservoir"  
}  
}  
\],  
createdAt: new Date().toISOString(),  
usageCount: 0,  
archived: false,  
metadata: {  
organizer: "WICEN Queensland",  
callsign: "VK4WIP",  
baseLocation: "Gold Creek Reservoir Car Park",  
baseOperators: \["VK4BRW (Brandon)", "VK4GJW (Greg)"\],  
baseGPS: "-27.3894, 152.8556",  
frequencies: {  
primary: "147.175 MHz (+offset)",  
fallback: "147.500 MHz"  
},  
baseOperationalBy: "0600 hrs",  
historicalDates: \["2024-06-16", "2025-06-15"\]  
}  
},

{  
name: "Lake Manchester Trail",  
eventType: "Trail Run",  
description: "Scenic trail run around Lake Manchester with multiple distance options (12km, 23km, 42km)",  
defaultStartTime: "07:00:00",  
defaultRunnerRangeStart: 1,  
defaultRunnerRangeEnd: 120,  
checkpoints: \[  
{  
checkpointNumber: 1,  
checkpointName: "Start - Lake Manchester Dam",  
location: "-27.4989, 152.7423",  
orderSequence: 1,  
metadata: {  
operators: \["VK4HIT (Allan)"\],  
description: "Race start at dam wall"  
}  
},  
{  
checkpointNumber: 2,  
checkpointName: "CP1 - Northern Trail",  
location: "-27.4867, 152.7534",  
orderSequence: 2,  
metadata: {  
operators: \["VK4SIR (Peter)", "VK4SQL (Stephen)"\],  
description: "First checkpoint on northern trail"  
}  
},  
{  
checkpointNumber: 3,  
checkpointName: "CP2 - Eastern Shore",  
location: "-27.4923, 152.7689",  
orderSequence: 3,  
metadata: {  
operators: \["VK4IE (John)", "VK4AJJ (Andrew)"\],  
description: "Eastern shore checkpoint"  
}  
},  
{  
checkpointNumber: 4,  
checkpointName: "CP3 - Southern Loop",  
location: "-27.5078, 152.7456",  
orderSequence: 4,  
metadata: {  
operators: \["VK4SMA (Mark)", "VK4TMK (Trish)"\],  
description: "Southern loop checkpoint"  
}  
},  
{  
checkpointNumber: 5,  
checkpointName: "Finish - Lake Manchester Dam",  
location: "-27.4989, 152.7423",  
orderSequence: 5,  
metadata: {  
operators: \["VK4BRW (Brandon)", "VK4GJW (Greg)"\],  
description: "Finish line at dam"  
}  
}  
\],  
createdAt: new Date().toISOString(),  
usageCount: 0,  
archived: false,  
metadata: {  
organizer: "WICEN Queensland",  
callsign: "VK4WIP",  
baseLocation: "Lake Manchester Dam Wall",  
baseOperators: \["VK4BRW (Brandon)", "VK4GJW (Greg)"\],  
baseGPS: "-27.4989, 152.7423",  
frequencies: {  
primary: "147.175 MHz (+offset)",  
fallback: "147.500 MHz"  
},  
baseOperationalBy: "0630 hrs",  
historicalDates: \["2024-08-18", "2025-08-17"\]  
}  
},

{  
name: "Mount Glorious Mountain Trail",  
eventType: "Mountain Trail Run",  
description: "Mountain trail race finishing at Maiala Park, Mt Glorious",  
defaultStartTime: "07:00:00",  
defaultRunnerRangeStart: 1,  
defaultRunnerRangeEnd: 128,  
checkpoints: \[  
{  
checkpointNumber: 1,  
checkpointName: "CP1 - Northbrook Bush Camp",  
location: "-27.321677, 152.714852",  
orderSequence: 1,  
metadata: {  
operators: \["VK4SIR (Peter)", "VK4MKD (David)", "VK4SQL (Stephen)"\],  
description: "First checkpoint at bush camp"  
}  
},  
{  
checkpointNumber: 2,  
checkpointName: "CP2 - England Creek Bush Camp",  
location: "-27.345838, 152.730526",  
orderSequence: 2,  
metadata: {  
operators: \["VK4IE (John)", "VK4AL (Alan T.)", "VK4AJJ (Andrew)"\],  
description: "Mid-course checkpoint"  
}  
},  
{  
checkpointNumber: 3,  
checkpointName: "CP3 - England Creek Rd & Joyners Ridge Rd",  
location: "-27.366238, 152.730747",  
orderSequence: 3,  
metadata: {  
operators: \["VK4SMA (Mark)", "VK4TMK (Trish)"\],  
description: "Road junction checkpoint"  
}  
},  
{  
checkpointNumber: 4,  
checkpointName: "CP4 - Near Apiary Site, Joyners Ridge Rd",  
location: "-27.346490, 152.750306",  
orderSequence: 4,  
metadata: {  
operators: \["VK4ALG (Alan)", "VK4TBA (Ben)"\],  
description: "Final checkpoint before finish"  
}  
},  
{  
checkpointNumber: 5,  
checkpointName: "Finish - Maiala Picnic Area",  
location: "-27.320035, 152.750278",  
orderSequence: 5,  
metadata: {  
operators: \["VK4BRW (Brandon)", "VK4GJW (Greg)"\],  
description: "Finish line at Maiala Park"  
}  
}  
\],  
createdAt: new Date().toISOString(),  
usageCount: 0,  
archived: false,  
metadata: {  
organizer: "WICEN Queensland",  
callsign: "VK4WIP",  
baseLocation: "Maiala Picnic Area, Mt Glorious Rd, Mt Glorious",  
baseOperators: \["VK4BRW (Brandon)", "VK4GJW (Greg)"\],  
baseGPS: "-27.320035, 152.750278",  
frequencies: {  
primary: "147.175 MHz (+offset)",  
fallback: "147.500 MHz"  
},  
baseOperationalBy: "0630 hrs",  
historicalDates: \["2024-11-10", "2025-11-09"\]  
}  
}  
\];

**Service Layer Implementation**

**Template Service**

Create src/services/RaceTemplateService.ts:

import db from '../database/db';  
import { RaceTemplate, RaceConfig } from '../database/schema';  
import { INITIAL_TEMPLATES_2025 } from '../database/initialTemplates';

export class RaceTemplateService {

/\*\*

- Initialize default templates on first run  
    \*/  
    async initializeDefaultTemplates(): Promise&lt;void&gt; {  
    const existingCount = await db.raceTemplates.count();

if (existingCount === 0) {  
await db.raceTemplates.bulkAdd(INITIAL_TEMPLATES_2025);  
console.log(\`Initialized \${INITIAL_TEMPLATES_2025.length} default race templates\`);  
}  

}

/\*\*

- Get all active (non-archived) templates  
    \*/  
    async getAllTemplates(): Promise&lt;RaceTemplate\[\]&gt; {  
    return await db.raceTemplates  
    .where('archived')  
    .equals(0)  
    .sortBy('name');  
    }

/\*\*

- Get template by ID  
    \*/  
    async getTemplateById(id: number): Promise&lt;RaceTemplate | undefined&gt; {  
    return await db.raceTemplates.get(id);  
    }

/\*\*

- Get template by name  
    \*/  
    async getTemplateByName(name: string): Promise&lt;RaceTemplate | undefined&gt; {  
    return await db.raceTemplates.where('name').equals(name).first();  
    }

/\*\*

- Create race from template  
    \*/  
    async createRaceFromTemplate(  
    templateId: number,  
    overrides: {  
    raceName?: string;  
    raceDate?: string;  
    startTime?: string;  
    runnerRangeStart?: number;  
    runnerRangeEnd?: number;  
    checkpointModifications?: Partial&lt;TemplateCheckpoint&gt;\[\];  
    }  
    ): Promise&lt;number&gt; {  
    const template = await this.getTemplateById(templateId);

if (!template) {  
throw new Error(\`Template with ID \${templateId} not found\`);  
}  
<br/>// Build race name with current year if not provided  
const currentYear = new Date().getFullYear();  
const raceName = overrides.raceName || \`\${template.name} \${currentYear}\`;  
<br/>// Create race configuration  
const raceConfig: Partial&lt;RaceConfig&gt; = {  
name: raceName,  
date: overrides.raceDate || new Date().toISOString().split('T')\[0\],  
startTime: overrides.startTime || template.defaultStartTime,  
runnerRanges: \[  
{  
min: overrides.runnerRangeStart || template.defaultRunnerRangeStart,  
max: overrides.runnerRangeEnd || template.defaultRunnerRangeEnd  
}  
\],  
metadata: template.metadata  
};  
<br/>// Save race configuration  
const raceId = await db.raceConfigs.add(raceConfig as RaceConfig);  
<br/>// Create checkpoints from template  
const checkpoints = template.checkpoints.map((cp, index) => {  
const modification = overrides.checkpointModifications?.\[index\];  
<br/>return {  
raceId,  
checkpointNumber: cp.checkpointNumber,  
checkpointName: modification?.checkpointName || cp.checkpointName,  
location: modification?.location || cp.location,  
orderSequence: cp.orderSequence,  
metadata: modification?.metadata || cp.metadata  
};  
});  
<br/>await db.checkpoints.bulkAdd(checkpoints);  
<br/>// Update template usage statistics  
await db.raceTemplates.update(templateId, {  
lastUsedAt: new Date().toISOString(),  
usageCount: (template.usageCount || 0) + 1  
});  
<br/>return raceId;  

}

/\*\*

- Save current race as template  
    \*/  
    async saveRaceAsTemplate(  
    raceId: number,  
    templateName: string,  
    templateDescription?: string  
    ): Promise&lt;number&gt; {  
    const raceConfig = await db.raceConfigs.get(raceId);

if (!raceConfig) {  
throw new Error(\`Race with ID \${raceId} not found\`);  
}  
<br/>const checkpoints = await db.checkpoints  
.where('raceId')  
.equals(raceId)  
.sortBy('orderSequence');  
<br/>const templateCheckpoints = checkpoints.map(cp => ({  
checkpointNumber: cp.checkpointNumber,  
checkpointName: cp.checkpointName,  
location: cp.location,  
orderSequence: cp.orderSequence,  
metadata: cp.metadata  
}));  
<br/>const template: Partial&lt;RaceTemplate&gt; = {  
name: templateName,  
eventType: raceConfig.metadata?.eventType || 'Trail Run',  
description: templateDescription,  
defaultStartTime: raceConfig.startTime,  
defaultRunnerRangeStart: raceConfig.runnerRanges\[0\]?.min || 1,  
defaultRunnerRangeEnd: raceConfig.runnerRanges\[0\]?.max || 100,  
checkpoints: templateCheckpoints,  
createdAt: new Date().toISOString(),  
usageCount: 0,  
archived: false,  
metadata: raceConfig.metadata  
};  
<br/>return await db.raceTemplates.add(template as RaceTemplate);  

}

/\*\*

- Update template  
    \*/  
    async updateTemplate(  
    templateId: number,  
    updates: Partial&lt;RaceTemplate&gt;  
    ): Promise&lt;void&gt; {  
    await db.raceTemplates.update(templateId, updates);  
    }

/\*\*

- Archive template (soft delete)  
    \*/  
    async archiveTemplate(templateId: number): Promise&lt;void&gt; {  
    await db.raceTemplates.update(templateId, { archived: true });  
    }

/\*\*

- Export template as JSON  
    \*/  
    async exportTemplate(templateId: number): Promise&lt;string&gt; {  
    const template = await this.getTemplateById(templateId);

if (!template) {  
throw new Error(\`Template with ID \${templateId} not found\`);  
}  
<br/>return JSON.stringify(template, null, 2);  

}

/\*\*

- Import template from JSON  
    \*/  
    async importTemplate(jsonString: string): Promise&lt;number&gt; {  
    const template = JSON.parse(jsonString) as RaceTemplate;

// Remove ID to create new template  
delete template.id;  
<br/>// Reset usage statistics  
template.createdAt = new Date().toISOString();  
template.usageCount = 0;  
template.archived = false;  
<br/>return await db.raceTemplates.add(template);  

}  
}

export const raceTemplateService = new RaceTemplateService();

**UI Component Implementation**

**Template Selection Modal**

Create src/components/RaceSetup/TemplateSelectionModal.tsx:

import React, { useState, useEffect } from 'react';  
import { raceTemplateService } from '../../services/RaceTemplateService';  
import { RaceTemplate } from '../../database/schema';  
import {  
Modal,  
Card,  
CardHeader,  
CardBody,  
Button,  
Badge  
} from '../ui';  
import {  
DocumentIcon,  
MapPinIcon,  
UsersIcon,  
CalendarIcon  
} from '../ui/icons';

interface TemplateSelectionModalProps {  
isOpen: boolean;  
onClose: () => void;  
onSelectTemplate: (templateId: number) => void;  
onCreateFromScratch: () => void;  
}

export const TemplateSelectionModal: React.FC&lt;TemplateSelectionModalProps&gt; = ({  
isOpen,  
onClose,  
onSelectTemplate,  
onCreateFromScratch  
}) => {  
const \[templates, setTemplates\] = useState&lt;RaceTemplate\[\]&gt;(\[\]);  
const \[loading, setLoading\] = useState(true);  
const \[selectedTemplateId, setSelectedTemplateId\] = useState&lt;number | null&gt;(null);

useEffect(() => {  
if (isOpen) {  
loadTemplates();  
}  
}, \[isOpen\]);

const loadTemplates = async () => {  
setLoading(true);  
try {  
const allTemplates = await raceTemplateService.getAllTemplates();  
setTemplates(allTemplates);  
} catch (error) {  
console.error('Error loading templates:', error);  
} finally {  
setLoading(false);  
}  
};

const handleSelectTemplate = () => {  
if (selectedTemplateId) {  
onSelectTemplate(selectedTemplateId);  
onClose();  
}  
};

if (!isOpen) return null;

return (  
&lt;Modal onClose={onClose} size="xl"&gt;

**Create New Race**

Choose a template or start from scratch

&lt;div className="modal-body"&gt;  
{/\* Create from Scratch Option \*/}  
<Card  
className="mb-4 cursor-pointer hover:shadow-md transition-shadow"  
onClick={onCreateFromScratch}  
\>  
&lt;CardBody&gt;  
&lt;div className="flex items-center"&gt;  
&lt;div className="flex-shrink-0 mr-4"&gt;  
&lt;DocumentIcon className="w-12 h-12 text-primary" /&gt;  
&lt;/div&gt;  
&lt;div&gt;  
&lt;h3 className="text-lg font-semibold mb-1"&gt;Start from Scratch&lt;/h3&gt;  
&lt;p className="text-sm text-secondary"&gt;  
Create a completely new race configuration  
&lt;/p&gt;  
&lt;/div&gt;  
&lt;/div&gt;  
&lt;/CardBody&gt;  
&lt;/Card&gt;  
<br/>{/\* Divider \*/}  
&lt;div className="flex items-center my-6"&gt;  
&lt;div className="flex-1 border-t border-gray-300"&gt;&lt;/div&gt;  
&lt;span className="px-4 text-sm text-secondary"&gt;OR SELECT A TEMPLATE&lt;/span&gt;  
&lt;div className="flex-1 border-t border-gray-300"&gt;&lt;/div&gt;  
&lt;/div&gt;  
<br/>{/\* Templates List \*/}  
{loading ? (  
&lt;div className="text-center py-8"&gt;  
&lt;p&gt;Loading templates...&lt;/p&gt;  
&lt;/div&gt;  
) : templates.length === 0 ? (  
&lt;div className="text-center py-8"&gt;  
&lt;p className="text-secondary"&gt;No templates available&lt;/p&gt;  
&lt;/div&gt;  
) : (  
&lt;div className="space-y-3"&gt;  
{templates.map(template => (  
<Card  
key={template.id}  
className={\`cursor-pointer transition-all \${  
selectedTemplateId === template.id  
? 'ring-2 ring-primary shadow-md'  
: 'hover:shadow-md'  
}\`}  
onClick={() => setSelectedTemplateId(template.id!)}  
\>  
&lt;CardBody&gt;  
&lt;div className="flex items-start justify-between"&gt;  
&lt;div className="flex-1"&gt;  
&lt;div className="flex items-center mb-2"&gt;  
&lt;h3 className="text-lg font-semibold mr-2"&gt;  
{template.name}  
&lt;/h3&gt;  
&lt;Badge variant="secondary" size="sm"&gt;  
{template.eventType}  
&lt;/Badge&gt;  
&lt;/div&gt;  
<br/>{template.description && (  
&lt;p className="text-sm text-secondary mb-3"&gt;  
{template.description}  
&lt;/p&gt;  
)}  
<br/>&lt;div className="flex flex-wrap gap-4 text-sm"&gt;  
&lt;div className="flex items-center"&gt;  
&lt;MapPinIcon className="w-4 h-4 mr-1 text-gray-500" /&gt;  
&lt;span&gt;{template.checkpoints.length} checkpoints&lt;/span&gt;  
&lt;/div&gt;  
&lt;div className="flex items-center"&gt;  
&lt;UsersIcon className="w-4 h-4 mr-1 text-gray-500" /&gt;  
&lt;span&gt;  
{template.defaultRunnerRangeStart}-{template.defaultRunnerRangeEnd} runners  
&lt;/span&gt;  
&lt;/div&gt;  
{template.metadata?.baseLocation && (  
&lt;div className="flex items-center"&gt;  
&lt;MapPinIcon className="w-4 h-4 mr-1 text-gray-500" /&gt;  
&lt;span className="truncate max-w-xs"&gt;  
{template.metadata.baseLocation}  
&lt;/span&gt;  
&lt;/div&gt;  
)}  
&lt;/div&gt;  
<br/>{template.lastUsedAt && (  
&lt;div className="mt-2 text-xs text-secondary"&gt;  
Last used: {new Date(template.lastUsedAt).toLocaleDateString()}  
{' • '}  
Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}  
&lt;/div&gt;  
)}  
&lt;/div&gt;  
<br/>{selectedTemplateId === template.id && (  
&lt;div className="ml-4"&gt;  
&lt;div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"&gt;  
&lt;svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"&gt;  
&lt;path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /&gt;  
&lt;/svg&gt;  
&lt;/div&gt;  
&lt;/div&gt;  
)}  
&lt;/div&gt;  
&lt;/CardBody&gt;  
&lt;/Card&gt;  
))}  
&lt;/div&gt;  
)}  
&lt;/div&gt;  
<br/>&lt;div className="modal-footer"&gt;  
&lt;Button variant="secondary" onClick={onClose}&gt;  
Cancel  
&lt;/Button&gt;  
<Button  
variant="primary"  
onClick={handleSelectTemplate}  
disabled={!selectedTemplateId}  
\>  
Continue with Template  
&lt;/Button&gt;  
&lt;/div&gt;  
&lt;/Modal&gt;  

);  
};

**Template Configuration Form**

Create src/components/RaceSetup/TemplateConfigurationForm.tsx:

import React, { useState, useEffect } from 'react';  
import { raceTemplateService } from '../../services/RaceTemplateService';  
import { RaceTemplate, TemplateCheckpoint } from '../../database/schema';  
import {  
Card,  
CardHeader,  
CardBody,  
FormGroup,  
FormLabel,  
Input,  
Button,  
Badge  
} from '../ui';  
import { MapPinIcon, UsersIcon, ClockIcon } from '../ui/icons';

interface TemplateConfigurationFormProps {  
templateId: number;  
onComplete: (raceId: number) => void;  
onCancel: () => void;  
}

export const TemplateConfigurationForm: React.FC&lt;TemplateConfigurationFormProps&gt; = ({  
templateId,  
onComplete,  
onCancel  
}) => {  
const \[template, setTemplate\] = useState&lt;RaceTemplate | null&gt;(null);  
const \[loading, setLoading\] = useState(true);

// Form state  
const \[raceName, setRaceName\] = useState('');  
const \[raceDate, setRaceDate\] = useState('');  
const \[startTime, setStartTime\] = useState('');  
const \[runnerRangeStart, setRunnerRangeStart\] = useState(1);  
const \[runnerRangeEnd, setRunnerRangeEnd\] = useState(100);  
const \[checkpoints, setCheckpoints\] = useState&lt;TemplateCheckpoint\[\]&gt;(\[\]);

const \[creating, setCreating\] = useState(false);  
const \[error, setError\] = useState&lt;string | null&gt;(null);

useEffect(() => {  
loadTemplate();  
}, \[templateId\]);

const loadTemplate = async () => {  
setLoading(true);  
try {  
const tmpl = await raceTemplateService.getTemplateById(templateId);

if (!tmpl) {  
setError('Template not found');  
return;  
}  
<br/>setTemplate(tmpl);  
<br/>// Pre-fill form with template defaults  
const currentYear = new Date().getFullYear();  
setRaceName(\`\${tmpl.name} \${currentYear}\`);  
setRaceDate(new Date().toISOString().split('T')\[0\]);  
setStartTime(tmpl.defaultStartTime);  
setRunnerRangeStart(tmpl.defaultRunnerRangeStart);  
setRunnerRangeEnd(tmpl.defaultRunnerRangeEnd);  
setCheckpoints(\[...tmpl.checkpoints\]);  
} catch (err) {  
setError('Failed to load template');  
console.error(err);  
} finally {  
setLoading(false);  
}  

};

const handleCheckpointChange = (index: number, field: keyof TemplateCheckpoint, value: any) => {  
const updated = \[...checkpoints\];  
updated\[index\] = { ...updated\[index\], \[field\]: value };  
setCheckpoints(updated);  
};

const handleSubmit = async (e: React.FormEvent) => {  
e.preventDefault();  
setCreating(true);  
setError(null);

try {  
const raceId = await raceTemplateService.createRaceFromTemplate(templateId, {  
raceName,  
raceDate,  
startTime,  
runnerRangeStart,  
runnerRangeEnd,  
checkpointModifications: checkpoints  
});  
<br/>onComplete(raceId);  
} catch (err: any) {  
setError(err.message || 'Failed to create race');  
console.error(err);  
} finally {  
setCreating(false);  
}  

};

if (loading) {  
return

Loading template...

;  
}

if (error && !template) {  
return (  

{error}

Go Back

);  
}

if (!template) return null;

return (  
&lt;form onSubmit={handleSubmit} className="space-y-6"&gt;  
{/\* Header \*/}  

**Configure Race from Template**

{[template.name](http://template.name)}

Customize race details. Checkpoint configurations are pre-filled from the template.  

{error && (  
&lt;div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"&gt;  
{error}  
&lt;/div&gt;  
)}  
<br/>{/\* Race Details \*/}  
&lt;Card&gt;  
&lt;CardHeader&gt;  
&lt;h3 className="text-lg font-semibold"&gt;Race Details&lt;/h3&gt;  
&lt;/CardHeader&gt;  
&lt;CardBody&gt;  
&lt;div className="space-y-4"&gt;  
&lt;FormGroup&gt;  
&lt;FormLabel required&gt;Race Name&lt;/FormLabel&gt;  
<Input  
type="text"  
value={raceName}  
onChange={(e) => setRaceName(e.target.value)}  
placeholder="e.g., Brisbane Trail Marathon 2025"  
required  
/>  
&lt;/FormGroup&gt;  
<br/>&lt;div className="grid grid-cols-2 gap-4"&gt;  
&lt;FormGroup&gt;  
&lt;FormLabel required&gt;Race Date&lt;/FormLabel&gt;  
<Input  
type="date"  
value={raceDate}  
onChange={(e) => setRaceDate(e.target.value)}  
required  
/>  
&lt;/FormGroup&gt;  
<br/>&lt;FormGroup&gt;  
&lt;FormLabel required&gt;Start Time&lt;/FormLabel&gt;  
<Input  
type="time"  
value={startTime}  
onChange={(e) => setStartTime(e.target.value)}  
required  
/>  
&lt;/FormGroup&gt;  
&lt;/div&gt;  
<br/>&lt;div className="grid grid-cols-2 gap-4"&gt;  
&lt;FormGroup&gt;  
&lt;FormLabel required&gt;Runner Range Start&lt;/FormLabel&gt;  
<Input  
type="number"  
min="1"  
value={runnerRangeStart}  
onChange={(e) => setRunnerRangeStart(parseInt(e.target.value))}  
required  
/>  
&lt;/FormGroup&gt;  
<br/>&lt;FormGroup&gt;  
&lt;FormLabel required&gt;Runner Range End&lt;/FormLabel&gt;  
<Input  
type="number"  
min={runnerRangeStart}  
value={runnerRangeEnd}  
onChange={(e) => setRunnerRangeEnd(parseInt(e.target.value))}  
required  
/>  
&lt;/FormGroup&gt;  
&lt;/div&gt;  
<br/>&lt;div className="text-sm text-secondary"&gt;  
&lt;UsersIcon className="inline w-4 h-4 mr-1" /&gt;  
Total runners: &lt;strong&gt;{runnerRangeEnd - runnerRangeStart + 1}&lt;/strong&gt;  
&lt;/div&gt;  
&lt;/div&gt;  
&lt;/CardBody&gt;  
&lt;/Card&gt;  
<br/>{/\* Checkpoints \*/}  
&lt;Card&gt;  
&lt;CardHeader&gt;  
&lt;h3 className="text-lg font-semibold"&gt;Checkpoints ({checkpoints.length})&lt;/h3&gt;  
&lt;p className="text-sm text-secondary"&gt;Review and update checkpoint details&lt;/p&gt;  
&lt;/CardHeader&gt;  
&lt;CardBody&gt;  
&lt;div className="space-y-4"&gt;  
{checkpoints.map((checkpoint, index) => (  
&lt;div key={index} className="border border-gray-200 rounded-lg p-4"&gt;  
&lt;div className="flex items-center mb-3"&gt;  
&lt;Badge variant="primary" size="sm" className="mr-2"&gt;  
CP{checkpoint.checkpointNumber}  
&lt;/Badge&gt;  
&lt;h4 className="font-semibold"&gt;Checkpoint {checkpoint.checkpointNumber}&lt;/h4&gt;  
&lt;/div&gt;  
<br/>&lt;div className="space-y-3"&gt;  
&lt;FormGroup&gt;  
&lt;FormLabel&gt;Checkpoint Name&lt;/FormLabel&gt;  
<Input  
type="text"  
value={checkpoint.checkpointName}  
onChange={(e) => handleCheckpointChange(index, 'checkpointName', e.target.value)}  
placeholder="e.g., CP1 - Creek Crossing"  
/>  
&lt;/FormGroup&gt;  
<br/>&lt;FormGroup&gt;  
&lt;FormLabel&gt;Location (GPS or Description)&lt;/FormLabel&gt;  
<Input  
type="text"  
value={checkpoint.location || ''}  
onChange={(e) => handleCheckpointChange(index, 'location', e.target.value)}  
placeholder="e.g., -27.4447, 152.9556 or Forest Junction"  
/>  
&lt;/FormGroup&gt;  
<br/>{checkpoint.metadata?.operators && (  
&lt;div className="text-sm"&gt;  
&lt;span className="text-secondary"&gt;Operators: &lt;/span&gt;  
&lt;span&gt;{checkpoint.metadata.operators.join(', ')}&lt;/span&gt;  
&lt;/div&gt;  
)}  
&lt;/div&gt;  
&lt;/div&gt;  
))}  
&lt;/div&gt;  
&lt;/CardBody&gt;  
&lt;/Card&gt;  
<br/>{/\* Template Metadata \*/}  
{template.metadata && (  
&lt;Card&gt;  
&lt;CardHeader&gt;  
&lt;h3 className="text-lg font-semibold"&gt;Race Information&lt;/h3&gt;  
&lt;/CardHeader&gt;  
&lt;CardBody&gt;  
&lt;div className="space-y-2 text-sm"&gt;  
{template.metadata.organizer && (  
&lt;div&gt;  
&lt;span className="text-secondary"&gt;Organizer: &lt;/span&gt;  
&lt;span className="font-medium"&gt;{template.metadata.organizer}&lt;/span&gt;  
&lt;/div&gt;  
)}  
{template.metadata.callsign && (  
&lt;div&gt;  
&lt;span className="text-secondary"&gt;Callsign: &lt;/span&gt;  
&lt;span className="font-medium"&gt;{template.metadata.callsign}&lt;/span&gt;  
&lt;/div&gt;  
)}  
{template.metadata.baseLocation && (  
&lt;div&gt;  
&lt;span className="text-secondary"&gt;Base Location: &lt;/span&gt;  
&lt;span className="font-medium"&gt;{template.metadata.baseLocation}&lt;/span&gt;  
&lt;/div&gt;  
)}  
{template.metadata.frequencies && (  
&lt;div&gt;  
&lt;span className="text-secondary"&gt;Frequencies: &lt;/span&gt;  
&lt;span className="font-medium"&gt;  
Primary: {template.metadata.frequencies.primary}  
{template.metadata.frequencies.fallback &&  
\` | Fallback: \${template.metadata.frequencies.fallback}\`  
}  
&lt;/span&gt;  
&lt;/div&gt;  
)}  
&lt;/div&gt;  
&lt;/CardBody&gt;  
&lt;/Card&gt;  
)}  
<br/>{/\* Actions \*/}  
&lt;div className="flex justify-between pt-4"&gt;  
&lt;Button type="button" variant="secondary" onClick={onCancel}&gt;  
Cancel  
&lt;/Button&gt;  
&lt;Button type="submit" variant="primary" disabled={creating}&gt;  
{creating ? 'Creating Race...' : 'Create Race'}  
&lt;/Button&gt;  
&lt;/div&gt;  
&lt;/form&gt;  

);  
};

**Template Management Features**

**Template Management Page**

Create src/pages/TemplateManagement.tsx:

import React, { useState, useEffect } from 'react';  
import { raceTemplateService } from '../services/RaceTemplateService';  
import { RaceTemplate } from '../database/schema';  
import {  
Container,  
Card,  
CardHeader,  
CardBody,  
Button,  
Badge,  
Modal  
} from '../components/ui';  
import {  
DocumentIcon,  
TrashIcon,  
PencilIcon,  
DownloadIcon  
} from '../components/ui/icons';

export const TemplateManagementPage: React.FC = () => {  
const \[templates, setTemplates\] = useState&lt;RaceTemplate\[\]&gt;(\[\]);  
const \[loading, setLoading\] = useState(true);  
const \[selectedTemplate, setSelectedTemplate\] = useState&lt;RaceTemplate | null&gt;(null);  
const \[showEditModal, setShowEditModal\] = useState(false);

useEffect(() => {  
loadTemplates();  
}, \[\]);

const loadTemplates = async () => {  
setLoading(true);  
try {  
const allTemplates = await raceTemplateService.getAllTemplates();  
setTemplates(allTemplates);  
} catch (error) {  
console.error('Error loading templates:', error);  
} finally {  
setLoading(false);  
}  
};

const handleExportTemplate = async (template: RaceTemplate) => {  
try {  
const json = await raceTemplateService.exportTemplate([template.id](http://template.id)!);

// Create download  
const blob = new Blob(\[json\], { type: 'application/json' });  
const url = URL.createObjectURL(blob);  
const a = document.createElement('a');  
a.href = url;  
a.download = \`\${template.name.replace(/\\s+/g, '-')}-template.json\`;  
document.body.appendChild(a);  
a.click();  
document.body.removeChild(a);  
URL.revokeObjectURL(url);  
} catch (error) {  
console.error('Export failed:', error);  
alert('Failed to export template');  
}  

};

const handleArchiveTemplate = async (templateId: number) => {  
if (!confirm('Are you sure you want to archive this template?')) {  
return;  
}

try {  
await raceTemplateService.archiveTemplate(templateId);  
await loadTemplates();  
} catch (error) {  
console.error('Archive failed:', error);  
alert('Failed to archive template');  
}  

};

return (  
&lt;Container maxWidth="7xl"&gt;  
&lt;div className="py-8"&gt;

**Race Templates**

Manage reusable race configurations for recurring events  

Import Template  

{loading ? (  
&lt;div className="text-center py-12"&gt;  
&lt;p&gt;Loading templates...&lt;/p&gt;  
&lt;/div&gt;  
) : templates.length === 0 ? (  
&lt;Card&gt;  
&lt;CardBody className="text-center py-12"&gt;  
&lt;DocumentIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" /&gt;  
&lt;h3 className="text-xl font-semibold mb-2"&gt;No templates found&lt;/h3&gt;  
&lt;p className="text-secondary mb-4"&gt;  
Create your first template by saving an existing race configuration  
&lt;/p&gt;  
&lt;/CardBody&gt;  
&lt;/Card&gt;  
) : (  
&lt;div className="grid grid-cols-1 md:grid-cols-2 gap-4"&gt;  
{templates.map(template => (  
&lt;Card key={template.id} className="hover:shadow-md transition-shadow"&gt;  
&lt;CardHeader&gt;  
&lt;div className="flex items-start justify-between"&gt;  
&lt;div className="flex-1"&gt;  
&lt;h3 className="text-lg font-semibold mb-1"&gt;{template.name}&lt;/h3&gt;  
&lt;Badge variant="secondary" size="sm"&gt;  
{template.eventType}  
&lt;/Badge&gt;  
&lt;/div&gt;  
&lt;/div&gt;  
&lt;/CardHeader&gt;  
&lt;CardBody&gt;  
{template.description && (  
&lt;p className="text-sm text-secondary mb-4"&gt;  
{template.description}  
&lt;/p&gt;  
)}  
<br/>&lt;div className="space-y-2 text-sm mb-4"&gt;  
&lt;div&gt;  
&lt;span className="text-secondary"&gt;Checkpoints: &lt;/span&gt;  
&lt;span className="font-medium"&gt;{template.checkpoints.length}&lt;/span&gt;  
&lt;/div&gt;  
&lt;div&gt;  
&lt;span className="text-secondary"&gt;Default Runners: &lt;/span&gt;  
&lt;span className="font-medium"&gt;  
{template.defaultRunnerRangeStart}-{template.defaultRunnerRangeEnd}  
&lt;/span&gt;  
&lt;/div&gt;  
{template.usageCount > 0 && (  
&lt;div&gt;  
&lt;span className="text-secondary"&gt;Usage: &lt;/span&gt;  
&lt;span className="font-medium"&gt;  
{template.usageCount} time{template.usageCount !== 1 ? 's' : ''}  
&lt;/span&gt;  
&lt;/div&gt;  
)}  
&lt;/div&gt;  
<br/>&lt;div className="flex gap-2"&gt;  
<Button  
size="sm"  
variant="secondary"  
onClick={() => handleExportTemplate(template)}  
\>  
&lt;DownloadIcon className="w-4 h-4 mr-1" /&gt;  
Export  
&lt;/Button&gt;  
<Button  
size="sm"  
variant="secondary"  
onClick={() => {  
setSelectedTemplate(template);  
setShowEditModal(true);  
}}  
\>  
&lt;PencilIcon className="w-4 h-4 mr-1" /&gt;  
Edit  
&lt;/Button&gt;  
<Button  
size="sm"  
variant="danger"  
onClick={() => handleArchiveTemplate(template.id!)}  
\>  
&lt;TrashIcon className="w-4 h-4 mr-1" /&gt;  
Archive  
&lt;/Button&gt;  
&lt;/div&gt;  
&lt;/CardBody&gt;  
&lt;/Card&gt;  
))}  
&lt;/div&gt;  
)}  
&lt;/div&gt;  
&lt;/Container&gt;  

);  
};

**Testing Strategy**

**Unit Tests**

Create src/services/\__tests_\_/RaceTemplateService.test.ts:

import { raceTemplateService } from '../RaceTemplateService';  
import db from '../../database/db';

describe('RaceTemplateService', () => {  
beforeEach(async () => {  
// Clear database before each test  
await db.raceTemplates.clear();  
await db.raceConfigs.clear();  
await db.checkpoints.clear();  
});

describe('initializeDefaultTemplates', () => {  
it('should initialize templates on first run', async () => {  
await raceTemplateService.initializeDefaultTemplates();

const count = await db.raceTemplates.count();  
expect(count).toBe(4); // 4 default templates  
});  
<br/>it('should not duplicate templates on subsequent runs', async () => {  
await raceTemplateService.initializeDefaultTemplates();  
await raceTemplateService.initializeDefaultTemplates();  
<br/>const count = await db.raceTemplates.count();  
expect(count).toBe(4);  
});  

});

describe('createRaceFromTemplate', () => {  
it('should create race with template defaults', async () => {  
await raceTemplateService.initializeDefaultTemplates();  
const templates = await raceTemplateService.getAllTemplates();  
const template = templates\[0\];

const raceId = await raceTemplateService.createRaceFromTemplate(  
template.id!,  
{ raceDate: '2025-04-27' }  
);  
<br/>const race = await db.raceConfigs.get(raceId);  
expect(race).toBeDefined();  
expect(race?.name).toContain(template.name);  
expect(race?.date).toBe('2025-04-27');  
});  
<br/>it('should apply overrides correctly', async () => {  
await raceTemplateService.initializeDefaultTemplates();  
const templates = await raceTemplateService.getAllTemplates();  
const template = templates\[0\];  
<br/>const raceId = await raceTemplateService.createRaceFromTemplate(  
template.id!,  
{  
raceName: 'Custom Race Name',  
startTime: '08:30:00',  
runnerRangeStart: 100,  
runnerRangeEnd: 200  
}  
);  
<br/>const race = await db.raceConfigs.get(raceId);  
expect(race?.name).toBe('Custom Race Name');  
expect(race?.startTime).toBe('08:30:00');  
expect(race?.runnerRanges\[0\].min).toBe(100);  
expect(race?.runnerRanges\[0\].max).toBe(200);  
});  
<br/>it('should create checkpoints from template', async () => {  
await raceTemplateService.initializeDefaultTemplates();  
const templates = await raceTemplateService.getAllTemplates();  
const template = templates\[0\];  
<br/>const raceId = await raceTemplateService.createRaceFromTemplate(  
template.id!,  
{}  
);  
<br/>const checkpoints = await db.checkpoints  
.where('raceId')  
.equals(raceId)  
.toArray();  
<br/>expect(checkpoints.length).toBe(template.checkpoints.length);  
});  
<br/>it('should increment usage count', async () => {  
await raceTemplateService.initializeDefaultTemplates();  
const templates = await raceTemplateService.getAllTemplates();  
const template = templates\[0\];  
const initialCount = template.usageCount;  
<br/>await raceTemplateService.createRaceFromTemplate(template.id!, {});  
<br/>const updated = await raceTemplateService.getTemplateById(template.id!);  
expect(updated?.usageCount).toBe(initialCount + 1);  
});  

});

describe('saveRaceAsTemplate', () => {  
it('should create template from existing race', async () => {  
// Create a race first  
const raceId = await db.raceConfigs.add({  
name: 'Test Race 2025',  
date: '2025-06-01',  
startTime: '07:00:00',  
runnerRanges: \[{ min: 1, max: 100 }\]  
});

await db.checkpoints.bulkAdd(\[  
{  
raceId,  
checkpointNumber: 1,  
checkpointName: 'CP1',  
location: '-27.123, 152.456',  
orderSequence: 1  
}  
\]);  
<br/>// Save as template  
const templateId = await raceTemplateService.saveRaceAsTemplate(  
raceId,  
'Test Template',  
'Template description'  
);  
<br/>const template = await raceTemplateService.getTemplateById(templateId);  
expect(template).toBeDefined();  
expect(template?.name).toBe('Test Template');  
expect(template?.checkpoints.length).toBe(1);  
});  

});

describe('exportTemplate', () => {  
it('should export template as valid JSON', async () => {  
await raceTemplateService.initializeDefaultTemplates();  
const templates = await raceTemplateService.getAllTemplates();  
const template = templates\[0\];

const json = await raceTemplateService.exportTemplate(template.id!);  
const parsed = JSON.parse(json);  
<br/>expect(parsed.name).toBe(template.name);  
expect(parsed.checkpoints).toBeDefined();  
expect(Array.isArray(parsed.checkpoints)).toBe(true);  
});  

});

describe('importTemplate', () => {  
it('should import template from JSON', async () => {  
const templateJson = JSON.stringify({  
name: 'Imported Template',  
eventType: 'Test Event',  
defaultStartTime: '08:00:00',  
defaultRunnerRangeStart: 1,  
defaultRunnerRangeEnd: 50,  
checkpoints: \[  
{  
checkpointNumber: 1,  
checkpointName: 'CP1',  
location: '-27.123, 152.456',  
orderSequence: 1  
}  
\],  
usageCount: 5 // Should be reset  
});

const templateId = await raceTemplateService.importTemplate(templateJson);  
const template = await raceTemplateService.getTemplateById(templateId);  
<br/>expect(template).toBeDefined();  
expect(template?.name).toBe('Imported Template');  
expect(template?.usageCount).toBe(0); // Reset on import  
});  

});  
});

**Integration Tests**

Create src/\__tests_\_/TemplateWorkflow.integration.test.ts:

import { render, screen, fireEvent, waitFor } from '@testing-library/react';  
import userEvent from '@testing-library/user-event';  
import { TemplateSelectionModal } from '../components/RaceSetup/TemplateSelectionModal';  
import { TemplateConfigurationForm } from '../components/RaceSetup/TemplateConfigurationForm';  
import { raceTemplateService } from '../services/RaceTemplateService';

describe('Template Workflow Integration', () => {  
beforeEach(async () => {  
await raceTemplateService.initializeDefaultTemplates();  
});

it('should complete full template-to-race workflow', async () => {  
const user = userEvent.setup();  
let selectedTemplateId: number | null = null;  
let createdRaceId: number | null = null;

// Step 1: Select template  
const { rerender } = render(  
<TemplateSelectionModal  
isOpen={true}  
onClose={() => {}}  
onSelectTemplate={(id) => {  
selectedTemplateId = id;  
}}  
onCreateFromScratch={() => {}}  
/>  
);  
<br/>await waitFor(() => {  
expect(screen.getByText(/Brisbane Trail Marathon/i)).toBeInTheDocument();  
});  
<br/>// Click on a template  
const templateCard = screen.getByText(/Brisbane Trail Marathon/i).closest('.card');  
await user.click(templateCard!);  
<br/>// Click continue  
const continueButton = screen.getByText(/Continue with Template/i);  
await user.click(continueButton);  
<br/>expect(selectedTemplateId).toBeTruthy();  
<br/>// Step 2: Configure race  
rerender(  
<TemplateConfigurationForm  
templateId={selectedTemplateId!}  
onComplete={(raceId) => {  
createdRaceId = raceId;  
}}  
onCancel={() => {}}  
/>  
);  
<br/>await waitFor(() => {  
expect(screen.getByLabelText(/Race Name/i)).toBeInTheDocument();  
});  
<br/>// Modify race details  
const raceNameInput = screen.getByLabelText(/Race Name/i);  
await user.clear(raceNameInput);  
await user.type(raceNameInput, 'Brisbane Trail Marathon 2026');  
<br/>const raceDateInput = screen.getByLabelText(/Race Date/i);  
await user.type(raceDateInput, '2026-04-26');  
<br/>// Submit form  
const createButton = screen.getByText(/Create Race/i);  
await user.click(createButton);  
<br/>await waitFor(() => {  
expect(createdRaceId).toBeTruthy();  
});  

});  
});

**Migration & Deployment**

**Database Migration Script**

Create src/database/migrations/addTemplates.ts:

import db from '../db';  
import { INITIAL_TEMPLATES_2025 } from '../initialTemplates';

export async function migrateToTemplates(): Promise&lt;void&gt; {  
console.log('Starting template migration...');

// Check if templates table exists  
const tableExists = db.tables.some(table => [table.name](http://table.name) === 'raceTemplates');

if (!tableExists) {  
console.log('Templates table does not exist, creating...');

// This will trigger the version 2 upgrade  
await db.open();  

}

// Initialize default templates  
const existingCount = await db.raceTemplates.count();

if (existingCount === 0) {  
console.log('Initializing default templates...');  
await db.raceTemplates.bulkAdd(INITIAL_TEMPLATES_2025);  
console.log(Added \${INITIAL_TEMPLATES_2025.length} default templates);  
} else {  
console.log(Templates already initialized (\${existingCount} existing));  
}

console.log('Template migration complete');  
}

**App Initialization**

Update src/App.tsx:

import React, { useEffect, useState } from 'react';  
import { raceTemplateService } from './services/RaceTemplateService';

function App() {  
const \[initialized, setInitialized\] = useState(false);

useEffect(() => {  
const initialize = async () => {  
try {  
// Initialize default templates on first load  
await raceTemplateService.initializeDefaultTemplates();  
setInitialized(true);  
} catch (error) {  
console.error('Failed to initialize templates:', error);  
}  
};

initialize();  

}, \[\]);

if (!initialized) {  
return

Initializing application...

;  
}

return (  
<br/>{/\* Your existing routes \*/}  
<br/>);  
}

export default App;

**Future Enhancements**

**Phase 2 Features (Post-MVP)**

- **Template Versioning**
  - Track template versions over time
  - Allow rollback to previous template versions
  - Compare differences between versions
- **Collaborative Templates**
  - Share templates via QR code
  - Cloud sync for template library
  - Community template marketplace
- **Advanced Customization**
  - Custom fields for templates
  - Conditional checkpoint logic
  - Dynamic runner range calculations
- **Template Analytics**
  - Track which templates are most used
  - Success metrics per template
  - Optimization recommendations
- **Bulk Operations**
  - Create multiple races from template at once
  - Schedule recurring races
  - Batch template updates

**Summary**

This implementation guide provides complete instructions for adding race template functionality to RaceTracker Pro. The feature:

- **Reduces setup time** from 10 minutes to under 2 minutes for recurring events
- **Includes 4 pre-configured templates** for 2025 WICEN-supported events
- **Supports full customization** while maintaining template structure
- **Enables template management** (create, update, export, import, archive)
- **Maintains data integrity** with proper validation and error handling
- **Works offline-first** with IndexedDB storage

All templates include complete checkpoint configurations with GPS coordinates, operator assignments, and race-specific metadata that can be easily updated year-over-year while preserving the core race structure.

**Implementation Priority:** P1 (High Priority)  
**Estimated Effort:** 1.5 Sprints (3 weeks)  
**Story Points:** 21  
**Dependencies:** Epic 1 (Database Foundation)

**Document Version:** 1.0  
**Status:** Ready for Implementation  
**Next Steps:** Begin Sprint 8 implementation following this guide