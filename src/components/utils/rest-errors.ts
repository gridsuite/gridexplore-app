/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE } from 'utils/UIconstants';

interface CustomError extends Error {
    status?: number;
}

export const handleMaxElementsExceededError = (
    error: CustomError,
    snackError: Function
): boolean => {
    if (
        error.status === 403 &&
        error.message.includes(HTTP_MAX_ELEMENTS_EXCEEDED_MESSAGE)
    ) {
        let limit = error.message.split(/[: ]+/).pop();
        snackError({
            messageId: 'maxElementExceededError',
            messageValues: { limit: limit },
        });
        return true;
    }
    return false;
};
