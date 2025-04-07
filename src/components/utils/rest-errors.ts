/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE, PermissionCheckResult } from 'utils/UIconstants';
import { IntlShape } from 'react-intl';
import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../../utils/rest-api';
import { ErrorMessageByHttpError } from '../../utils/custom-hooks';

export interface CustomError extends Error {
    status: number;
}

export const generateGenericPermissionErrorMessages = (intl: IntlShape): ErrorMessageByHttpError => ({
    [HTTP_FORBIDDEN]: intl.formatMessage({ id: 'genericPermissionDeniedError' }),
});

export const generateRenameErrorMessages = (intl: IntlShape): ErrorMessageByHttpError => ({
    [HTTP_FORBIDDEN]: intl.formatMessage({ id: 'renameDirectoryError' }),
    [HTTP_NOT_FOUND]: intl.formatMessage({ id: 'renameElementNotFoundError' }),
});

export const generateMoveErrorMessages = (intl: IntlShape): ErrorMessageByHttpError => ({
    [HTTP_FORBIDDEN]: intl.formatMessage({ id: 'moveElementNotAllowedError' }),
    [HTTP_NOT_FOUND]: intl.formatMessage({ id: 'moveElementNotFoundError' }),
});

export const generatePasteErrorMessages = (intl: IntlShape): ErrorMessageByHttpError => ({
    ...generateGenericPermissionErrorMessages(intl),
    [HTTP_NOT_FOUND]: intl.formatMessage({ id: 'elementPasteFailed404' }),
});

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

export const handleGenericError = (error: string, snackError: Function): boolean | void => {
    snackError({
        messageId: error,
    });
};

export const handlePasteError = (error: CustomError, intl: IntlShape, snackError: Function) => {
    console.log(generatePasteErrorMessages(intl), error.status);
    const message =
        generatePasteErrorMessages(intl)[error.status] ??
        intl.formatMessage({ id: 'elementPasteFailed' }) + (error?.message ?? '');

    return handleGenericError(message, snackError);
};
