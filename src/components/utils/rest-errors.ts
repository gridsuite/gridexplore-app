/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE, PermissionCheckResult } from 'utils/UIconstants';
import { HTTP_FORBIDDEN } from '../../utils/rest-api';

export interface CustomError extends Error {
    status?: number;
}

export const handleMaxElementsExceededError = (error: CustomError, snackError: Function): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE)) {
        const limit = error.message.split(/[: ]+/).pop();
        snackError({
            messageId: 'maxElementExceededError',
            messageValues: { limit },
        });
        return true;
    }
    return false;
};

export const handleNotAllowedError = (error: CustomError, snackError: Function): boolean => {
    if (
        error.status === HTTP_FORBIDDEN &&
        Object.values(PermissionCheckResult).some((permissionCheckResult) =>
            error.message.includes(permissionCheckResult)
        )
    ) {
        snackError({
            messageId: 'genericPermissionDeniedError',
        });
        return true;
    }
    return false;
};

export const handleMoveConflictError = (error: CustomError, snackError: Function): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({
            messageId: 'moveConflictError',
        });
        return true;
    }
    return false;
};

export const handleDeleteConflictError = (error: CustomError, snackError: Function): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({
            messageId: 'deleteConflictError',
        });
        return true;
    }
    return false;
};
