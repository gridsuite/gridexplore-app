/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    HTTP_CONFLICT,
    HTTP_FORBIDDEN,
    HTTP_MAX_ELEMENTS_EXCEEDED_BUSINESS_CODE,
    HTTP_NOT_FOUND,
    PermissionCheckResult,
} from 'utils/UIconstants';
import { CustomError, ElementAttributes, snackWithFallback, UseSnackMessageReturn } from '@gridsuite/commons-ui';
import { IntlShape } from 'react-intl';
import { type Dispatch, SetStateAction } from 'react';

export interface ErrorMessageByHttpError {
    [httpCode: string]: string;
}

export const buildSnackMessage = (error: CustomError, fallbackMessage: string): string =>
    error.businessErrorCode != null ? error.businessErrorCode : fallbackMessage;

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
    [HTTP_CONFLICT]: intl.formatMessage({ id: 'moveNameConflictError' }),
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
    if (
        error.status === HTTP_FORBIDDEN &&
        error.businessErrorCode?.includes(HTTP_MAX_ELEMENTS_EXCEEDED_BUSINESS_CODE)
    ) {
        snackWithFallback(snackError, error);
        return true;
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
        snackError({ messageId: buildSnackMessage(error, 'genericPermissionDeniedError') });
        return true;
    }
    return false;
};

export const handleMoveDirectoryConflictError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({ messageId: buildSnackMessage(error, 'moveConflictError') });
        return true;
    }
    return false;
};

export const handleMoveNameConflictError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_CONFLICT) {
        snackError({ messageId: buildSnackMessage(error, 'moveNameConflictError') });
        return true;
    }
    return false;
};

export const handleDeleteDirectoryConflictError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({ messageId: buildSnackMessage(error, 'deleteConflictError') });
        return true;
    }
    return false;
};

export const handlePasteError = (error: CustomError, intl: IntlShape, snackError: SnackError) => {
    const message = generatePasteErrorMessages(intl)[error.status];
    if (message) {
        handleGenericTxtError(message, snackError);
    } else {
        handleGenericTxtError(
            intl.formatMessage({ id: buildSnackMessage(error, 'elementPasteFailed') }) + (error?.message ?? ''),
            snackError
        );
    }
};

export const handleDeleteError = (
    setDeleteError: Dispatch<SetStateAction<string>>,
    error: CustomError,
    intl: IntlShape,
    snackError: SnackError
) => {
    if (handleDeleteDirectoryConflictError(error, snackError)) {
        setDeleteError(intl.formatMessage({ id: buildSnackMessage(error, 'deleteConflictError') }));
        return;
    }

    let message = generateGenericPermissionErrorMessages(intl)[error.status];
    if (message) {
        snackError({ messageId: buildSnackMessage(error, message) });
    } else {
        message = error.message;
        handleGenericTxtError(message, snackError);
    }
    // show the error message and don't close the underlying dialog
    setDeleteError(message);
};

export const handleMoveError = (
    errors: CustomError[],
    paramsOnErrors: unknown[],
    intl: IntlShape,
    snackError: SnackError
) => {
    const predefinedMessages = generateMoveErrorMessages(intl);
    const eligibleError = errors.find((error) => predefinedMessages[error.status.toString()]);
    if (eligibleError) {
        handleGenericTxtError(predefinedMessages[eligibleError.status.toString()], snackError);
        return;
    }

    const msg = intl.formatMessage(
        { id: 'moveElementsFailure' },
        {
            pbn: errors.length,
            stn: paramsOnErrors.length,
            problematic: paramsOnErrors.map((p) => (p as string[])[0]).join(' '),
        }
    );
    console.debug(msg);
    handleGenericTxtError(msg, snackError);
};

export const handleDuplicateError = (
    error: CustomError,
    activeElement: ElementAttributes,
    intl: IntlShape,
    snackError: SnackError
) => {
    if (handleNotAllowedError(error, snackError)) {
        return;
    }
    handleGenericTxtError(
        intl.formatMessage(
            { id: buildSnackMessage(error, 'duplicateElementFailure') },
            {
                itemName: activeElement.elementName,
                errorMessage: error.message,
            }
        ),
        snackError
    );
};
