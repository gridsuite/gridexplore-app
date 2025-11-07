/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { UUID } from 'node:crypto';

export enum NotificationType {
    DELETE_DIRECTORY = 'DELETE_DIRECTORY',
    ADD_DIRECTORY = 'ADD_DIRECTORY',
    UPDATE_DIRECTORY = 'UPDATE_DIRECTORY',
    CASE_EXPORT_FINISHED = 'caseExportFinished',
}

export interface ExportCaseEventData {
    headers: ExportCaseEventDataHeaders;
    payload: undefined;
}

interface ExportCaseEventDataHeaders {
    notificationType: NotificationType.CASE_EXPORT_FINISHED;
    userId: string;
    exportUuid: UUID;
    error: string | null;
}

export function isExportCaseNotification(notif: unknown): notif is ExportCaseEventData {
    return (notif as ExportCaseEventData).headers?.notificationType === NotificationType.CASE_EXPORT_FINISHED;
}
