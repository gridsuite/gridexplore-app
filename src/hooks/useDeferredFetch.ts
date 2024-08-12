/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useReducer } from 'react';
import { FetchStatus, FetchStatusType } from '@gridsuite/commons-ui';

export enum ActionType {
    START = 'START',
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
    ADD_ERROR = 'ADD_ERROR', // Use by multipleDeferredFetch when one request respond with error
    ADD_SUCCESS = 'ADD_SUCCESS', // Use by multipleDeferredFetch when one request respond with success
}

type FetchAction =
    | {
          type: ActionType.START;
      }
    | {
          type: ActionType.ERROR;
          payload: unknown;
      }
    | {
          type: ActionType.SUCCESS;
          payload: unknown;
      }
    | {
          type: ActionType.ADD_ERROR;
      }
    | {
          type: ActionType.ADD_SUCCESS;
      };

type FetchState = {
    status: FetchStatusType;
    data: unknown;
    errorMessage: unknown;
};

const initialState: FetchState = {
    status: FetchStatus.IDLE,
    errorMessage: '',
    data: null,
};

/**
 * This custom hook manage a fetch workflow and return a unique callback to defer process execution when needed.
 * It also returns a unique state which contains fetch status, results and error message if it failed.
 * @param {function} fetchFunction the fetch function to call
 * @param {Object} params Params of the fetch function. WARNING: Must respect order here
 * @param {function} onSuccess callback to call on request success
 * @param {function} errorToString callback to translate HTTPCode to string error messages
 * @param {function} onError callback to call if request failed
 * @param {boolean} hasResult Configure if fetchFunction return results or only HTTP request response
 * @returns {function} fetchCallback The callback to call to execute the request.
 *                     It accepts params as argument which must follow fetch function params.
 * @returns {state} state complete state of the request
 *          {Enum}  state.status Status of the request
 *          {String} state.errorMessage error message of the request
 *          {Object} state.data The JSON results of the request (see hasResult)
 */
export default function useDeferredFetch<TArgs extends any[]>(
    fetchFunction: (...args: TArgs) => Promise<void>,
    onSuccess: ((data: unknown | null, args: TArgs) => void) | undefined,
    errorToString: ((status: unknown) => string) | undefined = undefined,
    onError: ((errorMessage: unknown | null, paramsOnError: TArgs) => void) | undefined = undefined,
    hasResult: boolean = true
): [(...args: TArgs) => void, FetchState] {
    const [state, dispatch] = useReducer((lastState: FetchState, action: FetchAction) => {
        switch (action.type) {
            case ActionType.START:
                return { ...initialState, status: FetchStatus.FETCHING };
            case ActionType.SUCCESS:
                return {
                    ...initialState,
                    status: FetchStatus.FETCH_SUCCESS,
                    data: action.payload,
                };
            case ActionType.ERROR:
                return {
                    ...initialState,
                    status: FetchStatus.FETCH_ERROR,
                    errorMessage: action.payload,
                };
            default:
                return lastState;
        }
    }, initialState);

    const handleError = useCallback(
        (error: any, paramsOnError: TArgs) => {
            const defaultErrorMessage = error.message;
            let errorMessage = defaultErrorMessage;
            if (error && errorToString) {
                const providedErrorMessage = errorToString(error.status);
                if (providedErrorMessage && providedErrorMessage !== '') {
                    errorMessage = providedErrorMessage;
                }
            }
            dispatch({
                type: ActionType.ERROR,
                payload: errorMessage,
            });
            if (onError) {
                onError(errorMessage, paramsOnError);
            }
        },
        [errorToString, onError]
    );

    const fetchData = useCallback(
        async (...args: TArgs) => {
            dispatch({ type: ActionType.START });
            try {
                // Params resolution
                const response = await fetchFunction(...args);

                if (hasResult) {
                    dispatch({
                        type: ActionType.SUCCESS,
                        payload: response,
                    });
                    if (onSuccess) {
                        onSuccess(response, args);
                    }
                } else {
                    dispatch({
                        type: ActionType.SUCCESS,
                        payload: null,
                    });
                    if (onSuccess) {
                        onSuccess(null, args);
                    }
                }
            } catch (error: any) {
                if (!error.status) {
                    // an http error
                    handleError(null, args);
                    throw error;
                } else {
                    handleError(error, args);
                }
            }
        },
        [fetchFunction, onSuccess, handleError, hasResult]
    );

    const fetchCallback = useCallback(
        (...args: TArgs) => {
            fetchData(...args);
        },
        [fetchData]
    );

    return [fetchCallback, state];
}
