/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { IntlShape } from 'react-intl';
import { type Dispatch, SetStateAction } from 'react';
import {
    HTTP_CONFLICT,
    HTTP_FORBIDDEN,
    HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE,
    HTTP_NOT_FOUND,
    PermissionCheckResult,
} from 'utils/UIconstants';
import {
    ElementAttributes,
    UseSnackMessageReturn,
    getErrorCatalogDefaultMessage,
    isKnownErrorCatalogCode,
    resolveErrorCatalogMessage,
} from '@gridsuite/commons-ui';

export interface ErrorMessageByHttpError {
    [httpCode: string]: string;
}

export interface CustomError extends Error {
    status: number;
    businessErrorCode?: string;
    problemDetail?: {
        businessErrorCode?: string;
    };
}

export type SnackError = UseSnackMessageReturn['snackError'];

export const handleGenericTxtError = (error: string, snackError: SnackError) => {
    snackError({
        messageTxt: error,
    });
};

const extractBusinessErrorCode = (error: CustomError): string | undefined => {
    if (typeof error.businessErrorCode === 'string' && error.businessErrorCode.trim().length > 0) {
        return error.businessErrorCode;
    }
    const detailCode = error.problemDetail?.businessErrorCode;
    if (typeof detailCode === 'string' && detailCode.trim().length > 0) {
        return detailCode;
    }
    return undefined;
};

const getBusinessErrorMessage = (error: CustomError, intl?: IntlShape): string | undefined => {
    const businessErrorCode = extractBusinessErrorCode(error);
    if (isKnownErrorCatalogCode(businessErrorCode)) {
        return intl
            ? resolveErrorCatalogMessage(intl.locale, businessErrorCode)
            : getErrorCatalogDefaultMessage(businessErrorCode);
    }
    return undefined;
};

const handleBusinessError = (error: CustomError, snackError: SnackError, intl?: IntlShape): string | undefined => {
    const message = getBusinessErrorMessage(error, intl);
    if (message) {
        handleGenericTxtError(message, snackError);
    }
    return message;
};

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

export const handleMaxElementsExceededError = (
    error: CustomError,
    snackError: SnackError,
    intl?: IntlShape
): boolean => {
    if (handleBusinessError(error, snackError, intl)) {
        return true;
    }
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

export const handleNotAllowedError = (error: CustomError, snackError: SnackError, intl?: IntlShape): boolean => {
    if (handleBusinessError(error, snackError, intl)) {
        return true;
    }
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

export const handleMoveDirectoryConflictError = (
    error: CustomError,
    snackError: SnackError,
    intl?: IntlShape
): boolean => {
    if (handleBusinessError(error, snackError, intl)) {
        return true;
    }
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({ messageId: 'moveConflictError' });
        return true;
    }
    return false;
};

export const handleMoveNameConflictError = (error: CustomError, snackError: SnackError, intl?: IntlShape): boolean => {
    if (handleBusinessError(error, snackError, intl)) {
        return true;
    }
    if (error.status === HTTP_CONFLICT) {
        snackError({ messageId: 'moveNameConflictError' });
        return true;
    }
    return false;
};

export const handleDeleteDirectoryConflictError = (
    error: CustomError,
    snackError: SnackError,
    intl?: IntlShape
): boolean => {
    if (handleBusinessError(error, snackError, intl)) {
        return true;
    }
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({ messageId: 'deleteConflictError' });
        return true;
    }
    return false;
};

export const handlePasteError = (error: CustomError, intl: IntlShape, snackError: SnackError) => {
    if (handleBusinessError(error, snackError, intl)) {
        return;
    }
    const message = generatePasteErrorMessages(intl)[error.status];
    if (message) {
        handleGenericTxtError(message, snackError);
    } else {
        handleGenericTxtError(intl.formatMessage({ id: 'elementPasteFailed' }) + (error?.message ?? ''), snackError);
    }
};

export const handleDeleteError = (
    setDeleteError: Dispatch<SetStateAction<string>>,
    error: CustomError,
    intl: IntlShape,
    snackError: SnackError
) => {
    const businessMessage = getBusinessErrorMessage(error, intl);
    if (businessMessage) {
        handleGenericTxtError(businessMessage, snackError);
        setDeleteError(businessMessage);
        return;
    }

    if (handleDeleteDirectoryConflictError(error, snackError, intl)) {
        setDeleteError(intl.formatMessage({ id: 'deleteConflictError' }));
        return;
    }

    let message = generateGenericPermissionErrorMessages(intl)[error.status];
    if (message) {
        snackError({ messageId: message });
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
    if (errors.some((error) => handleBusinessError(error, snackError, intl))) {
        return;
    }
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
    if (handleBusinessError(error, snackError, intl)) {
        return;
    }
    if (handleNotAllowedError(error, snackError, intl)) {
        return;
    }
    handleGenericTxtError(
        intl.formatMessage(
            { id: 'duplicateElementFailure' },
            {
                itemName: activeElement.elementName,
                errorMessage: error.message,
            }
        ),
        snackError
    );
};
