/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useState } from 'react';
import { IntlShape, useIntl } from 'react-intl';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { ErrorMessageByHttpError, SnackError } from '../components/utils/rest-errors';

export type GenericFunction<T, TArgs extends unknown[] = any[]> = (...args: TArgs) => Promise<T>;

export enum PromiseStatus {
    FULFILLED = 'fulfilled',
}

/**
 * This custom hook manage a fetch workflow and return a unique callback to defer process execution when needed.
 * It also returns a unique state which contains fetch status, results and error message if it failed.
 * @param {function} fetchFunction the fetch function to call
 * @param {function} onSuccess callback to call on request success
 * @param errorsMessageIds
 * @param {function} onError callback to call if request failed
 * @returns {function} fetchCallback The callback to call to execute the request.
 *                     It accepts params as argument which must follow fetch function params.
 * @returns {state} state complete state of the request
 *          {Enum}  state.status Status of the request
 *          {String} state.errorMessage error message of the request
 *          {Object} state.data The JSON results of the request (see hasResult)
 */
export const useDeferredFetch = <T, TArgs extends unknown[] = any[]>(
    fetchFunction: GenericFunction<T, TArgs>,
    onSuccess?: (args: TArgs, data?: T) => void,
    errorsMessageIds: ErrorMessageByHttpError = {},
    onError?: (error: string, snackError: SnackError) => void
): [(...args: TArgs) => Promise<void>, string] => {
    const { snackError } = useSnackMessage();
    const [errorMessage, setErrorMessage] = useState<string>('');

    const fetch = useCallback(
        async (...args: TArgs) => {
            try {
                const data = await fetchFunction(...args);
                onSuccess?.(args, data);
            } catch (error: any) {
                const errorMessageId = errorsMessageIds[error.message] ?? error.message;
                setErrorMessage(errorMessageId);
                onError?.(errorMessageId, snackError);
            }
        },
        [fetchFunction, onSuccess, errorsMessageIds, onError, snackError]
    );

    return [fetch, errorMessage];
};

/**
 * This custom hook manage multiple fetchs workflows and return a unique callback to defer process execution when needed.
 * It also returns a unique state which concatenate all fetch results independently.
 * @param {function} fetchFunction the fetch function to call for each request
 * @param {function} onSuccess callback to call on all request success
 * @param errorsMessageIds
 * @param {function} onError callback to call if one or more requests failed
 * @returns {function} fetchCallback The callback to call to execute the collection of requests.
 *                      It accepts params array as arguments which define the number of fetch to execute.
 */

export const useMultipleDeferredFetch = <T>(
    fetchFunction: GenericFunction<T>,
    onSuccess?: (data: T[]) => void,
    errorsMessageIds: ErrorMessageByHttpError = {},
    onError?: (errorMessages: string[], params: unknown[][], intl: IntlShape, snackError: SnackError) => void
): [(paramsList: unknown[][]) => Promise<void>] => {
    const { snackError } = useSnackMessage();
    const intl = useIntl();

    const fetch = useCallback(
        async (paramsList: unknown[][]) => {
            const results = await Promise.allSettled(
                paramsList.map((params) =>
                    fetchFunction(...params).then(
                        (data) => ({ data }),
                        (error) => {
                            const errorMessageId = errorsMessageIds[error.message] ?? error.message;
                            return Promise.reject(new Error(errorMessageId));
                        }
                    )
                )
            );

            const successes: T[] = [];
            const errors: string[] = [];
            results.forEach((result) => {
                if (result.status === PromiseStatus.FULFILLED) {
                    successes.push(result.value.data);
                } else {
                    errors.push(result.reason);
                }
            });

            if (errors.length > 0) {
                onError?.(errors, paramsList, intl, snackError);
            } else {
                onSuccess?.(successes);
            }
        },
        [fetchFunction, errorsMessageIds, onError, intl, snackError, onSuccess]
    );
    return [fetch];
};
