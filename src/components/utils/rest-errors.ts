/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE, HTTP_NOT_ALLOWED_MESSAGE } from 'utils/UIconstants';

export interface CustomError extends Error {
    status?: string;
}

export const handleMaxElementsExceededError = (error: CustomError, snackError: Function): boolean => {
    if (error.status === 'Forbidden' && error.message.includes(HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE)) {
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
    if (error.status === 'Forbidden' && error.message.includes(HTTP_NOT_ALLOWED_MESSAGE)) {
        snackError({
            messageId: 'genericPermissionDeniedError',
        });
        return true;
    }
    return false;
};
