/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ElementAttributes, ElementType } from '@gridsuite/commons-ui';
import { UUID } from 'node:crypto';
import { IDirectory } from '../redux/types';

export const openByPathUuid = async ({
    pathUuid,
    fetchDirectoryContent,
    updateMapData,
    selectedDirectoryUuid,
    handleDispatchDirectory,
}: {
    pathUuid: UUID[];
    fetchDirectoryContent: (uuid: UUID) => Promise<ElementAttributes[]>;
    updateMapData: (uuid: string, children: IDirectory[], isDirectoryMoving: boolean) => void;
    selectedDirectoryUuid?: UUID;
    handleDispatchDirectory: (uuid?: UUID) => void;
}) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const uuid of pathUuid) {
        // eslint-disable-next-line no-await-in-loop
        const resources = await fetchDirectoryContent(uuid);

        updateMapData(uuid, resources.filter((res) => res.type === ElementType.DIRECTORY) as IDirectory[], false);
    }

    const lastUuid = pathUuid[pathUuid.length - 1];

    if (lastUuid !== selectedDirectoryUuid) {
        handleDispatchDirectory(lastUuid);
    }
};
