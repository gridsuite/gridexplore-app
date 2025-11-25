/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementAttributes, ElementType, hasElementPermission, PermissionType } from '@gridsuite/commons-ui';

export function checkPermissionOnDirectory(element: ElementAttributes, permission: PermissionType) {
    const directoryUuid = element.type === ElementType.DIRECTORY ? element.elementUuid : element.parentUuid;
    return hasElementPermission(directoryUuid!, permission);
}
