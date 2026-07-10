/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    backendFetch,
    backendFetchJson,
    ElementAttributes,
    PREFIX_STUDY_QUERIES,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { UUID } from 'node:crypto';
import { useCallback } from 'react';

const PREFIX_EXPLORE_SERVER_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/explore`;
export interface CaseRef {
    uuid: UUID;
    name: string;
}

export interface RootNetworkExport {
    name: string;
    tag: string;
    caseFormat: string;
    caseRef: CaseRef;
    importParameters: Record<string, unknown>;
}

export interface NodeTreeExport {
    id: string;
    name?: string;
    type: string;
    modificationGroupRef?: string;
    buildStatus?: string;
    children?: NodeTreeExport[];
}

export interface StudyExportInfos {
    studyMetadata: {
        name: string;
        uuid: UUID;
    };
    rootNetworks: RootNetworkExport[];
    nodeTree: NodeTreeExport;
}

export function downloadJson(payload: unknown, filename: string): void {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export function fetchStudyExportInfos(studyUuid: UUID): Promise<StudyExportInfos> {
    const url = `${PREFIX_STUDY_QUERIES}/v1/studies/${studyUuid}/export`;
    console.debug('Fetching study export payload', url);
    return backendFetchJson(url);
}
export function useExportStudyElements() {
    const { snackError } = useSnackMessage();

    return useCallback(
        async (activeElement: ElementAttributes | undefined) => {
            if (!activeElement) {
                return;
            }
            try {
                const payload = await fetchStudyExportInfos(activeElement.elementUuid);
                const filename = `${activeElement.elementName}-export.json`;
                downloadJson(payload, filename);
            } catch (error) {
                snackError({
                    messageTxt: (error as Error).message,
                    headerId: 'export.error',
                });
            }
        },
        [snackError]
    );
}

export async function importStudy(
    studyName: string,
    description: string,
    parentDirectoryUuid: UUID,
    studyExportInfos: StudyExportInfos
): Promise<UUID> {
    const [firstRootNetwork, ...remainingRootNetworks] = studyExportInfos.rootNetworks;
    const studyUuid = crypto.randomUUID() as UUID;

    // 1. étude + 1er root network (flux existant, via explore-server) ; on attend le signal de fin
    const studyReady = waitForStudyNotification(studyUuid, {
        resolveOnUpdateTypes: ['studyCreationFinished'],
    });
    await createStudyFromExport(studyName, description, parentDirectoryUuid, studyUuid, firstRootNetwork);
    await studyReady;

    // 2. root networks suivants, un par un
    for (const rootNetwork of remainingRootNetworks) {
        const rootNetworkReady = waitForStudyNotification(studyUuid, {
            resolveOnUpdateTypes: ['rootNetworksUpdated'],
            rejectOnUpdateTypes: ['rootNetworkUpdateFailed'],
        });
        await addRootNetworkFromExport(studyUuid, rootNetwork);
        await rootNetworkReady;
    }

    await importNodeTree(studyUuid, studyExportInfos.nodeTree);

    return studyUuid;
}