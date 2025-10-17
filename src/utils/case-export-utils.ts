/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UUID } from 'node:crypto';
import { getExportState, saveExportState } from '../redux/export-network-state';

export function buildExportIdentifier({ caseUuid, exportUuid }: { caseUuid: UUID; exportUuid: String }): string {
    return `${caseUuid}|${exportUuid}`;
}

export function setExportSubscription(identifier: string): void {
    const currentState = getExportState() || new Set<string>();
    currentState.add(identifier);
    saveExportState(currentState);
}

export function unsetExportSubscription(identifier: string): void {
    const currentState = getExportState();
    if (currentState) {
        currentState.delete(identifier);
        saveExportState(currentState);
    }
}

export function isExportSubscribed(identifier: string): boolean {
    const currentState = getExportState();
    return currentState ? currentState.has(identifier) : false;
}
