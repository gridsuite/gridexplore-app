/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { backendFetchJson, ElementAttributes, PREFIX_STUDY_QUERIES, useSnackMessage } from '@gridsuite/commons-ui';
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

async function createStudyFromExport(
    studyName: string,
    description: string,
    parentDirectoryUuid: UUID,
    studyUuid: UUID,
    rootNetwork: RootNetworkExport
): Promise<void> {
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/studies/${studyName}`;
    const params = new URLSearchParams({
        description: description || '',
        parentDirectoryUuid,
        studyUuid,
        caseUuid: rootNetwork.caseRef.uuid,
        caseFormat: rootNetwork.caseFormat,
        duplicateCase: 'false',
    });

    if (rootNetwork.name) {
        params.append('firstRootNetworkName', rootNetwork.name);
    }

    await backendFetchJson(`${url}?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rootNetwork.importParameters || {}),
    });
}

async function addRootNetworkFromExport(studyUuid: UUID, rootNetwork: RootNetworkExport): Promise<void> {
    const url = `${PREFIX_STUDY_QUERIES}/v1/studies/${studyUuid}/root-networks`;
    await backendFetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: rootNetwork.name,
            tag: rootNetwork.tag,
            caseUuid: rootNetwork.caseRef.uuid,
            caseFormat: rootNetwork.caseFormat,
            importParameters: rootNetwork.importParameters || {},
        }),
    });
}

async function importNodeTree(studyUuid: UUID, nodeTree: NodeTreeExport): Promise<void> {
    const url = `${PREFIX_STUDY_QUERIES}/v1/studies/${studyUuid}/tree/import`;
    await backendFetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeTree),
    });
}

export async function importStudy(
    studyName: string,
    description: string,
    parentDirectoryUuid: UUID,
    studyExportInfos: StudyExportInfos
): Promise<UUID> {
    const [firstRootNetwork, ...remainingRootNetworks] = studyExportInfos.rootNetworks;
    const studyUuid = crypto.randomUUID() as UUID;

    await createStudyFromExport(studyName, description, parentDirectoryUuid, studyUuid, firstRootNetwork);

    await remainingRootNetworks.reduce(async (previousPromise, rootNetwork) => {
        await previousPromise;
        await addRootNetworkFromExport(studyUuid, rootNetwork);
    }, Promise.resolve());

    await importNodeTree(studyUuid, studyExportInfos.nodeTree);

    return studyUuid;
}
