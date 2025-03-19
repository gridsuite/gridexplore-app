/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useReducer, useState } from 'react';

export enum FetchStatus {
    IDLE = 'IDLE',
    FETCHING = 'FETCHING',
    FETCH_SUCCESS = 'FETCH_SUCCESS',
    FETCH_ERROR = 'FETCH_ERROR',
}

export enum ActionType {
    START = 'START',
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
    ADD_ERROR = 'ADD_ERROR', // Use by multipleDeferredFetch when one request respond with error
    ADD_SUCCESS = 'ADD_SUCCESS', // Use by multipleDeferredFetch when one request respond with success
}

export interface FetchState<T> {
    status: FetchStatus;
    errorMessage: string;
    data: T | null;
}

interface Action<T> {
    type: ActionType;
    payload?: T;
}

interface MultipleFetchState<T> {
    public: {
        status: FetchStatus;
        errorMessage: string[];
        paramsOnError: unknown[];
        data: T[];
        paramsOnSuccess: unknown[];
    };
    counter: number;
}

interface MultipleAction<T> {
    type: ActionType;
    payload?: T;
    context?: unknown;
}

/**
 * This custom hook manage a fetch workflow and return a unique callback to defer process execution when needed.
 * It also returns a unique state which contains fetch status, results and error message if it failed.
 * @param {function} fetchFunction the fetch function to call
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
export const useDeferredFetch = <T, TArgs extends unknown[] = any[]>(
    fetchFunction: GenericFunction<T, TArgs>,
    onSuccess?: (args: TArgs, data?: T) => void,
    errorToString?: (status: string) => string | undefined,
    onError?: (errorMessage: string, args: TArgs) => void
): [(...args: TArgs) => void, FetchState<T>] => {
    const initialState: FetchState<T> = {
        status: FetchStatus.IDLE,
        errorMessage: '',
        data: null,
    };

    const [state, dispatch] = useReducer((lastState: FetchState<T>, action: Action<T>) => {
        switch (action.type) {
            case ActionType.START:
                return { ...initialState, status: FetchStatus.FETCHING };
            case ActionType.SUCCESS:
                return {
                    ...initialState,
                    status: FetchStatus.FETCH_SUCCESS,
                    data: action.payload || null,
                };
            case ActionType.ERROR:
                return {
                    ...initialState,
                    status: FetchStatus.FETCH_ERROR,
                    errorMessage: action.payload as unknown as string,
                };
            default:
                return lastState;
        }
    }, initialState);

    const handleError = useCallback(
        (error: any, paramsOnError: TArgs) => {
            let errorMessage = error.message;
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
                const data = await fetchFunction(...args);
                dispatch({
                    type: ActionType.SUCCESS,
                    payload: data,
                });
                onSuccess?.(args, data);
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
        [fetchFunction, onSuccess, handleError]
    );

    const fetchCallback = useCallback((...args: TArgs) => fetchData(...args), [fetchData]);

    return [fetchCallback, state];
};

// ///////////////////////////////////////////////////////////////:

/**
 * This custom hook manage multiple fetchs workflows and return a unique callback to defer process execution when needed.
 * It also returns a unique state which concatenate all fetch results independently.
 * @param {function} fetchFunction the fetch function to call for each request
 * @param {function} onSuccess callback to call on all request success
 * @param {function} errorToString callback to translate HTTPCode to string error messages
 * @param {function} onError callback to call if one or more requests failed
 * @param {boolean} hasResult Configure if fetchFunction return results or only HTTP request response
 * @returns {function} fetchCallback The callback to call to execute the collection of requests.
 *                      It accepts params array as arguments which define the number of fetch to execute.
 * @returns {state} state complete states of the requests collection
 *          {Enum}  state.status Status of the requests set
 *          {Array} state.errorMessage error message of the requests set
 *          {Array} state.paramsOnError The parameters used when requests set have failed
 *          {Array} state.data The results array of each request (see hasResult)
 */

export type GenericFunction<T, TArgs extends unknown[] = any[]> = (...args: TArgs) => Promise<T>;

export const useMultipleDeferredFetch = <T>(
    fetchFunction: GenericFunction<T>,
    onSuccess?: (data: T[]) => void,
    errorToString?: (status: string) => string | undefined,
    onError?: (errorMessages: string[], params: unknown[], paramsOnError: unknown[]) => void
): [(cbParamsList: unknown[][]) => void] => {
    const initialState: MultipleFetchState<T> = {
        public: {
            status: FetchStatus.IDLE,
            errorMessage: [],
            paramsOnError: [],
            data: [],
            paramsOnSuccess: [],
        },
        counter: 0,
    };

    const [state, dispatch] = useReducer((lastState: MultipleFetchState<T>, action: MultipleAction<T>) => {
        switch (action.type) {
            case ActionType.START:
                return {
                    ...initialState,
                    public: {
                        ...initialState.public,
                        status: FetchStatus.FETCHING,
                    },
                };
            case ActionType.ADD_SUCCESS:
                return {
                    public: {
                        ...lastState.public,
                        data: lastState.public.data.concat([action.payload as T]),
                        paramsOnSuccess: lastState.public.paramsOnSuccess.concat([action.context]),
                    },
                    counter: lastState.counter + 1,
                };
            case ActionType.ADD_ERROR:
                return {
                    public: {
                        ...lastState.public,
                        errorMessage: lastState.public.errorMessage.concat([action.payload as unknown as string]),
                        paramsOnError: lastState.public.paramsOnError.concat([action.context]),
                    },
                    counter: lastState.counter + 1,
                };
            case ActionType.SUCCESS:
                return {
                    ...lastState,
                    public: {
                        ...lastState.public,
                        status: FetchStatus.FETCH_SUCCESS,
                    },
                    counter: 0,
                };
            case ActionType.ERROR:
                return {
                    ...lastState,
                    public: {
                        ...lastState.public,
                        status: FetchStatus.FETCH_ERROR,
                    },
                    counter: 0,
                };
            default:
                return lastState;
        }
    }, initialState);

    const [paramList, setParamList] = useState<unknown[][]>([]);

    const onInstanceSuccess = useCallback((paramsOnSuccess: unknown[], data?: T) => {
        dispatch({
            type: ActionType.ADD_SUCCESS,
            payload: data,
            context: paramsOnSuccess,
        });
    }, []);

    const onInstanceError = useCallback((errorMessage: string, paramsOnError: unknown[]) => {
        // counter now stored in reducer to avoid counter and state being updated not simultaneously,
        // causing useEffect to be triggered once for each change, which would cause an expected behaviour
        dispatch({
            type: ActionType.ADD_ERROR,
            payload: errorMessage as T,
            context: paramsOnError,
        });
    }, []);

    const [fetchCB] = useDeferredFetch(fetchFunction, onInstanceSuccess, errorToString, onInstanceError);

    const fetchCallback = useCallback(
        (cbParamsList: unknown[][]) => {
            dispatch({ type: ActionType.START });
            setParamList(cbParamsList);
            cbParamsList.forEach((params) => fetchCB(...params));
        },
        [fetchCB]
    );

    useEffect(() => {
        if (paramList.length !== 0 && paramList.length === state.counter) {
            if (state.public.errorMessage.length > 0) {
                dispatch({
                    type: ActionType.ERROR,
                });
                if (onError) {
                    onError(state.public.errorMessage, paramList, state.public.paramsOnError);
                }
            } else {
                dispatch({
                    type: ActionType.SUCCESS,
                });
                if (onSuccess) {
                    onSuccess(state.public.data);
                }
            }
        }
    }, [paramList, onError, onSuccess, state]);

    return [fetchCallback];
};
