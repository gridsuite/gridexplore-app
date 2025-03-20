/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementAttributes, ElementType } from '@gridsuite/commons-ui';
import { hasPermission } from 'utils/rest-api';

export function checkPermissionOnDirectory(element: ElementAttributes, permission: string) {
    const directoryUuid = element.type === ElementType.DIRECTORY ? element.elementUuid : element.parentUuid;
    return hasPermission(directoryUuid!, permission);
}
