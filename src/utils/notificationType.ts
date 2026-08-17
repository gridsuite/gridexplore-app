/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { UUID } from 'node:crypto';

const CASE_EXPORT_FINISHED = 'caseExportFinished';

export interface DirectoryInfos {
    uuid: UUID;
    isRoot: boolean;
}

export interface ExportCaseEventData {
    headers: ExportCaseEventDataHeaders;
    payload: undefined;
}

interface ExportCaseEventDataHeaders {
    notificationType: typeof CASE_EXPORT_FINISHED;
    userId: string;
    exportUuid: UUID;
    error: string | null;
}

export function isExportCaseNotification(notif: unknown): notif is ExportCaseEventData {
    return (notif as ExportCaseEventData).headers?.notificationType === CASE_EXPORT_FINISHED;
}
