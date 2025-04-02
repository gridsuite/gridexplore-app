/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Option, yupConfig as yup } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';

export const READ_ALL_USERS = 'readAllUsers';
export const READ_GROUPS = 'readGroups';
export const WRITE_ALL_USERS = 'writeAllUsers';
export const WRITE_GROUPS = 'writeGroups';

export interface Group {
    id: UUID;
    label: string;
}

export const areIdsEqual = (val1: Option, val2: Option) => {
    if (typeof val1 !== 'string' && typeof val2 !== 'string') {
        return val1.id === val2.id;
    }
    return val1 === val2;
};

export const groupSchema = yup.object().shape({
    id: yup.string().required(),
    label: yup.string().required(),
});

export const schema = yup.object().shape({
    [READ_ALL_USERS]: yup.boolean().required(),
    [READ_GROUPS]: yup.array().of(groupSchema),
    [WRITE_ALL_USERS]: yup.boolean().required(),
    [WRITE_GROUPS]: yup.array().of(groupSchema),
});

export type PermissionForm = yup.InferType<typeof schema>;

export const emptyForm: PermissionForm = {
    [READ_ALL_USERS]: false,
    [READ_GROUPS]: [],
    [WRITE_ALL_USERS]: false,
    [WRITE_GROUPS]: [],
};
