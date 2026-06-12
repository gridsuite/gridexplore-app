/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UUID } from 'node:crypto';

export enum ProcessType {
    SECURITY_ANALYSIS = 'SECURITY_ANALYSIS',
    LOADFLOW = 'LOADFLOW', // not used yet, will be once modification dialog is implemented
}

// Backend types
export function isProcessType(type: string): type is ProcessType {
    return Object.values(ProcessType).includes(type as ProcessType);
}

export interface ProcessConfigBaseBackend {
    processType: ProcessType;
    modificationUuids: string[];
}

export interface SecurityAnalysisProcessConfigBackend extends ProcessConfigBaseBackend {
    processType: ProcessType.SECURITY_ANALYSIS;
    securityAnalysisParametersUuid: string;
    loadflowParametersUuid: string;
}

export type ProcessConfigBackend = SecurityAnalysisProcessConfigBackend; // will be union between all ProcessConfig types

export type PersistedProcessConfigBackend = {
    id: UUID;
    processConfig: ProcessConfigBackend;
};

// Form types
export interface NamedElement {
    id: string;
    name: string;
}

export type SecurityAnalysisProcessConfig = Omit<
    SecurityAnalysisProcessConfigBackend,
    'securityAnalysisParametersUuid' | 'loadflowParametersUuid' | 'modificationUuids'
> & {
    modifications: (NamedElement & {
        enabled: boolean;
        description?: string;
    })[];
    loadflowParameters: NamedElement;
    securityAnalysisParameters: NamedElement;
};
