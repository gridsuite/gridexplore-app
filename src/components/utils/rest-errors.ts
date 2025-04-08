/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    HTTP_FORBIDDEN,
    HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE,
    HTTP_NOT_FOUND,
    PermissionCheckResult,
} from 'utils/UIconstants';
import { UseSnackMessageReturn } from '@gridsuite/commons-ui';
import { IntlShape } from 'react-intl';
import { type Dispatch, SetStateAction } from 'react';

export interface ErrorMessageByHttpError {
    [httpCode: string]: string;
}

export interface CustomError extends Error {
    status: number;
}

export type SnackError = UseSnackMessageReturn['snackError'];

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

export const handleGenericTxtError = (error: string, snackError: SnackError) => {
    snackError({
        messageTxt: error,
    });
};

export const handleMaxElementsExceededError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE)) {
        const limit = error.message.split(/[: ]+/).pop();
        if (limit) {
            snackError({
                messageId: 'maxElementExceededError',
                messageValues: { limit },
            });
            return true;
        }
    }
    return false;
};

export const handleNotAllowedError = (error: CustomError, snackError: SnackError): boolean => {
    if (
        error.status === HTTP_FORBIDDEN &&
        Object.values(PermissionCheckResult).some((permissionCheckResult) =>
            error.message.includes(permissionCheckResult)
        )
    ) {
        snackError({ messageId: 'genericPermissionDeniedError' });
        return true;
    }
    return false;
};

export const handleMoveConflictError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({ messageId: 'moveConflictError' });
        return true;
    }
    return false;
};

export const handleDeleteConflictError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({ messageId: 'deleteConflictError' });
        return true;
    }
    return false;
};

export const handlePasteError = (error: CustomError, intl: IntlShape, snackError: SnackError) => {
    const message = generatePasteErrorMessages(intl)[error.status];
    if (message) {
        snackError({ messageId: message });
    } else {
        snackError({ messageTxt: intl.formatMessage({ id: 'elementPasteFailed' }) + (error?.message ?? '') });
    }
    return true;
};

export const handleDeleteError = (
    setDeleteError: Dispatch<SetStateAction<string>>,
    error: CustomError,
    intl: IntlShape,
    snackError: SnackError
) => {
    if (handleDeleteConflictError(error, snackError)) {
        setDeleteError(intl.formatMessage({ id: 'deleteConflictError' }));
        return;
    }

    let message = generateGenericPermissionErrorMessages(intl)[error.status];
    if (message) {
        snackError({ messageId: message });
    } else {
        message = error.message;
        snackError({ messageTxt: error.message });
    }
    // show the error message and don't close the underlying dialog
    setDeleteError(message);
};
