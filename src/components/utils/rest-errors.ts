/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    HTTP_CONFLICT,
    HTTP_FORBIDDEN,
    HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE,
    HTTP_NOT_FOUND,
    PermissionCheckResult,
} from 'utils/UIconstants';
import {
    BackendErrorSnackbarContent,
    type BackendErrorSnackbarContentProps,
    ElementAttributes,
    UseSnackMessageReturn,
    createBackendErrorDetails,
    extractBackendErrorPayload,
    type BackendErrorPayload,
    type SnackInputs,
} from '@gridsuite/commons-ui';
import { IntlShape } from 'react-intl';
import { type Dispatch, SetStateAction, createElement } from 'react';

const BACKEND_DETAIL_FALLBACK = '-';

const formatBackendDetailValue = (value: string): string => (value.trim().length > 0 ? value : BACKEND_DETAIL_FALLBACK);

type BackendErrorDetails = BackendErrorSnackbarContentProps['details'];

const getBackendErrorDetails = (error: unknown): BackendErrorDetails | undefined => {
    const backendPayload = extractBackendErrorPayload(error);
    if (!backendPayload) {
        return undefined;
    }
    return createBackendErrorDetails(backendPayload);
};

interface BackendErrorPresentation {
    message: string;
    detailsLabel: string;
    detailLabels: BackendErrorSnackbarContentProps['detailLabels'];
    formattedDetails: BackendErrorDetails;
    showDetailsLabel: string;
    hideDetailsLabel: string;
}

const createBackendErrorPresentation = (
    intl: IntlShape,
    details: BackendErrorDetails,
    firstLine?: string
): BackendErrorPresentation => {
    const message = firstLine ?? intl.formatMessage({ id: 'backendError.genericMessage' });
    const detailsLabel = intl.formatMessage({ id: 'backendError.detailsLabel' });
    const serverLabel = intl.formatMessage({ id: 'backendError.serverLabel' });
    const messageLabel = intl.formatMessage({ id: 'backendError.messageLabel' });
    const pathLabel = intl.formatMessage({ id: 'backendError.pathLabel' });
    const showDetailsLabel = intl.formatMessage({ id: 'backendError.showDetails' });
    const hideDetailsLabel = intl.formatMessage({ id: 'backendError.hideDetails' });

    return {
        message,
        detailsLabel,
        detailLabels: {
            service: serverLabel,
            message: messageLabel,
            path: pathLabel,
        },
        formattedDetails: {
            service: formatBackendDetailValue(details.service),
            message: formatBackendDetailValue(details.message),
            path: formatBackendDetailValue(details.path),
        },
        showDetailsLabel,
        hideDetailsLabel,
    };
};

export interface ErrorMessageByHttpError {
    [httpCode: string]: string;
}

export interface CustomError extends Error {
    status: number;
    backendError?: BackendErrorPayload;
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
    [HTTP_CONFLICT]: intl.formatMessage({ id: 'moveNameConflictError' }),
});

export const generatePasteErrorMessages = (intl: IntlShape): ErrorMessageByHttpError => ({
    ...generateGenericPermissionErrorMessages(intl),
    [HTTP_NOT_FOUND]: intl.formatMessage({ id: 'elementPasteFailed404' }),
});

export const handleGenericTxtError = (error: string | Error, snackError: SnackError) => {
    const message = typeof error === 'string' ? error : error.message;
    snackError({
        messageTxt: message,
    });
};

export const snackErrorWithBackendFallback = (
    error: unknown,
    snackError: SnackError,
    intl: IntlShape,
    additionalSnack?: Partial<SnackInputs>
) => {
    const backendDetails = getBackendErrorDetails(error);
    if (backendDetails) {
        const { headerId, headerTxt, headerValues, persist, messageId, messageTxt, messageValues, ...rest } =
            additionalSnack ?? {};
        const otherSnackProps: Partial<SnackInputs> = rest ? { ...(rest as Partial<SnackInputs>) } : {};

        const firstLine = messageTxt ?? (messageId ? intl.formatMessage({ id: messageId }, messageValues) : undefined);

        const presentation = createBackendErrorPresentation(intl, backendDetails, firstLine);

        const snackInputs: SnackInputs = {
            ...(otherSnackProps as SnackInputs),
            messageTxt: presentation.message,
            persist: persist ?? true,
            content: (snackbarKey, snackMessage) =>
                createElement(BackendErrorSnackbarContent, {
                    snackbarKey,
                    message:
                        typeof snackMessage === 'string' && snackMessage.length > 0
                            ? snackMessage
                            : presentation.message,
                    detailsLabel: presentation.detailsLabel,
                    detailLabels: presentation.detailLabels,
                    details: presentation.formattedDetails,
                    showDetailsLabel: presentation.showDetailsLabel,
                    hideDetailsLabel: presentation.hideDetailsLabel,
                }),
        };

        if (headerId !== undefined) {
            snackInputs.headerId = headerId;
        }
        if (headerTxt !== undefined) {
            snackInputs.headerTxt = headerTxt;
        }
        if (headerValues !== undefined) {
            snackInputs.headerValues = headerValues;
        }

        snackError(snackInputs);
        return;
    }
    if (additionalSnack) {
        const { messageTxt: additionalMessageTxt, messageId: additionalMessageId } = additionalSnack;
        if (additionalMessageTxt !== undefined || additionalMessageId !== undefined) {
            snackError(additionalSnack as SnackInputs);
            return;
        }
    }

    const message = error instanceof Error ? error.message : String(error);
    const restSnackInputs: Partial<SnackInputs> = additionalSnack ? { ...additionalSnack } : {};
    delete restSnackInputs.messageId;
    delete restSnackInputs.messageTxt;
    delete restSnackInputs.messageValues;
    snackError({
        ...(restSnackInputs as SnackInputs),
        messageTxt: message,
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

export const handleMoveDirectoryConflictError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({ messageId: 'moveConflictError' });
        return true;
    }
    return false;
};

export const handleMoveNameConflictError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_CONFLICT) {
        snackError({ messageId: 'moveNameConflictError' });
        return true;
    }
    return false;
};

export const handleDeleteDirectoryConflictError = (error: CustomError, snackError: SnackError): boolean => {
    if (error.status === HTTP_FORBIDDEN && error.message.includes(PermissionCheckResult.CHILD_PERMISSION_DENIED)) {
        snackError({ messageId: 'deleteConflictError' });
        return true;
    }
    return false;
};

export const handlePasteError = (error: CustomError, intl: IntlShape, snackError: SnackError) => {
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
    if (handleDeleteDirectoryConflictError(error, snackError)) {
        setDeleteError(intl.formatMessage({ id: 'deleteConflictError' }));
        return;
    }

    const permissionMessage = generateGenericPermissionErrorMessages(intl)[error.status];
    const message = permissionMessage ?? error.message;

    snackErrorWithBackendFallback(error, snackError, intl, { messageTxt: message });

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
            { id: 'duplicateElementFailure' },
            {
                itemName: activeElement.elementName,
                errorMessage: error.message,
            }
        ),
        snackError
    );
};
