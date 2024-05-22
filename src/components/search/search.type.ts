/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UUID } from 'crypto';

export interface ElementInfos {
    id: UUID;
    name: string;
    type: string;
    owner: string;
    subdirectoryCount: number;
    lastModificationDate: Date;
    isPrivate: boolean | null;
    pathName: string[];
    pathUuid: UUID[];
}
