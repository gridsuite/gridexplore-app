/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useReducer, useState } from 'react';
import { UnknownArray } from 'type-fest';
import { FetchStatus, FetchStatusType } from '@gridsuite/commons-ui';
import useDeferredFetch, { ActionType } from './useDeferredFetch';

type MultipleFetchAction<TArgs extends any[]> =
    | {
          type: ActionType.START;
      }
    | {
          type: ActionType.ERROR;
      }
    | {
          type: ActionType.SUCCESS;
      }
    | {
          type: ActionType.ADD_ERROR;
          payload: unknown;
          context: TArgs;
      }
    | {
          type: ActionType.ADD_SUCCESS;
          payload: unknown;
          context: TArgs;
      };

type MultipleFetchState<TArgs extends any[]> = {
    public: {
        status: FetchStatusType;
        data: UnknownArray;
        errorMessage: UnknownArray;
        paramsOnError: TArgs[];
        paramsOnSuccess: TArgs[];
    };
    counter: number;
};

const initialState: MultipleFetchState<any> = {
    public: {
        status: FetchStatus.IDLE,
        errorMessage: [],
        paramsOnError: [],
        data: [],
        paramsOnSuccess: [],
    },
    counter: 0,
};

/**
 * This custom hook manage multiple fetchs workflows and return a unique callback to defer process execution when needed.
 * It also return a unique state which concatenate all fetch results independently.
 * @param {function} fetchFunction the fetch function to call for each request
 * @param {function} onSuccess callback to call on all request success
 * @param {function} errorToString callback to translate HTTPCode to string error messages
 * @param {function} onError callback to call if one or more requests failed
 * @param {boolean} hasResult Configure if fetchFunction return results or only HTTP request response
 * @returns {function} fetchCallback The callback to call to execute the requests collection.
 *                      It accepts params array as arguments which define the number of fetch to execute.
 * @returns {state} state complete states of the requests collection
 *          {Enum}  state.status Status of the requests set
 *          {Array} state.errorMessage error message of the requests set
 *          {Array} state.paramsOnError The parameters used when requests set have failed
 *          {Array} state.data The results array of each request (see hasResult)
 */
export default function useMultipleDeferredFetch<TArgs extends any[]>(
    fetchFunction: (...args: TArgs) => Promise<void>,
    onSuccess: ((data: UnknownArray) => void) | undefined,
    errorToString: ((status: unknown) => string) | undefined = undefined,
    onError: ((errorMessage: UnknownArray, paramList: TArgs, paramsOnError: TArgs[]) => void) | undefined = undefined,
    hasResult = true
) {
    const [state, dispatch] = useReducer((lastState: MultipleFetchState<TArgs>, action: MultipleFetchAction<TArgs>) => {
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
                        data: lastState.public.data.concat([action.payload]),
                        paramsOnSuccess: lastState.public.paramsOnSuccess.concat([action.context]),
                    },
                    counter: lastState.counter + 1,
                };
            case ActionType.ADD_ERROR:
                return {
                    public: {
                        ...lastState.public,
                        errorMessage: lastState.public.errorMessage.concat([action.payload]),
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

    const [paramList, setParamList] = useState<TArgs>([] as unknown as TArgs);

    const onInstanceSuccess = useCallback((data: unknown, paramsOnSuccess: TArgs) => {
        dispatch({
            type: ActionType.ADD_SUCCESS,
            payload: data,
            context: paramsOnSuccess,
        });
    }, []);

    const onInstanceError = useCallback((errorMessage: unknown, paramsOnError: TArgs) => {
        // counter now stored in reducer to avoid counter and state being updated not simultaneously,
        // causing useEffect to be triggered once for each change, which would cause an expected behaviour
        dispatch({
            type: ActionType.ADD_ERROR,
            payload: errorMessage,
            context: paramsOnError,
        });
    }, []);

    const [fetchCB] = useDeferredFetch(fetchFunction, onInstanceSuccess, errorToString, onInstanceError, hasResult);

    const fetchCallback = useCallback(
        (cbParamsList: TArgs) => {
            dispatch({ type: ActionType.START });
            setParamList(cbParamsList);
            for (let params of cbParamsList) {
                fetchCB(...params);
            }
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
}
