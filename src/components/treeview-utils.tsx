/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UUID } from 'crypto';
import { IDirectory } from '../redux/types';

export function buildPathToFromMap(nodeId: UUID | undefined, mapDataRef: Record<string, IDirectory> | undefined) {
    const path = [];
    if (mapDataRef && nodeId) {
        let currentUuid: UUID | null = nodeId ?? null;
        while (currentUuid != null && mapDataRef[currentUuid] !== undefined) {
            path.unshift({ ...mapDataRef[currentUuid] });
            currentUuid = mapDataRef[currentUuid].parentUuid;
        }
    }
    return path;
}
