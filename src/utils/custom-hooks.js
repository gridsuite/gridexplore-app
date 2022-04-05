import { useEffect, useCallback, useReducer, useState } from 'react';

export const FetchStatus = {
    IDLE: 'IDLE',
    FETCHING: 'FETCHING',
    PARTIALLY_FETCHED: 'PARTIALLY_FETCHED',
    FETCHED: 'FETCHED',
    FETCH_ERROR: 'FETCH_ERROR',
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
export const useDeferredFetch = (
    fetchFunction,
    onSuccess,
    errorToString = undefined,
    onError = undefined,
    hasResult = true
) => {
    const initialState = {
        status: FetchStatus.IDLE,
        errorMessage: '',
        data: null,
    };

    const [state, dispatch] = useReducer((lastState, action) => {
        switch (action.type) {
            case FetchStatus.FETCHING:
                return { ...initialState, status: FetchStatus.FETCHING };
            case FetchStatus.FETCHED:
                return {
                    ...initialState,
                    status: FetchStatus.FETCHED,
                    data: action.payload,
                };
            case FetchStatus.FETCH_ERROR:
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
        (response, paramsOnError) => {
            const defaultErrorMessage = response
                ? response.status.toString() + ' ' + response.statusText
                : 'Exception';
            let errorMessage = defaultErrorMessage;

            if (response && errorToString) {
                const providedErrorMessage = errorToString(response.status);
                if (providedErrorMessage && providedErrorMessage !== '') {
                    errorMessage = providedErrorMessage;
                }
            }

            dispatch({
                type: FetchStatus.FETCH_ERROR,
                payload: errorMessage,
            });
            if (onError) {
                onError(errorMessage, paramsOnError);
            }
        },
        [errorToString, onError]
    );

    const fetchData = useCallback(
        async (...args) => {
            dispatch({ type: FetchStatus.FETCHING });
            try {
                // Params resolution
                const response = await fetchFunction.apply(null, args);

                if (hasResult) {
                    const data = response;
                    dispatch({
                        type: FetchStatus.FETCHED,
                        payload: data,
                    });
                    if (onSuccess) onSuccess(data);
                } else {
                    if (response.ok) {
                        if (onSuccess) onSuccess();
                    } else {
                        handleError(response, args);
                    }
                }
            } catch (error) {
                handleError(null, args);
                throw error;
            }
        },
        [fetchFunction, onSuccess, handleError, hasResult]
    );

    const fetchCallback = useCallback(
        (...args) => {
            fetchData(...args);
        },
        [fetchData]
    );

    return [fetchCallback, state];
};

/////////////////////////////////////////////////////////////////:

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
export const useMultipleDeferredFetch = (
    fetchFunction,
    onSuccess,
    errorToString = undefined,
    onError = undefined,
    hasResult = true
) => {
    const initialState = {
        public: {
            status: FetchStatus.IDLE,
            errorMessage: [],
            paramsOnError: [],
            data: [],
        },
        counter: 0,
    };

    const [state, dispatch] = useReducer((lastState, action) => {
        switch (action.type) {
            case FetchStatus.IDLE:
                return {
                    ...initialState,
                    counter: 0,
                };
            case FetchStatus.FETCHING:
                return {
                    public: {
                        ...lastState.public,
                        status:
                            lastState.public.status === FetchStatus.FETCH_ERROR
                                ? FetchStatus.FETCH_ERROR
                                : FetchStatus.FETCHING,
                    },
                    counter: action.counterIncrement
                        ? lastState.counter + 1
                        : lastState.counter,
                };
            case FetchStatus.PARTIALLY_FETCHED:
                return {
                    ...lastState,
                    public: {
                        ...lastState.public,
                        status: FetchStatus.PARTIALLY_FETCHED,
                        data: lastState.public.data.concat(action.payload),
                    },
                };
            case FetchStatus.FETCHED:
                return {
                    ...lastState,
                    public: {
                        ...lastState.public,
                        status: FetchStatus.FETCHED,
                    },
                };
            case FetchStatus.FETCH_ERROR:
                return {
                    public: {
                        ...lastState.public,
                        status: FetchStatus.FETCH_ERROR,
                        errorMessage: lastState.public.errorMessage.concat(
                            action.payload
                        ),
                        paramsOnError: lastState.public.paramsOnError.concat([
                            action.context,
                        ]),
                    },
                    counter: action.counterIncrement
                        ? lastState.counter + 1
                        : lastState.counter,
                };
            default:
                return lastState;
        }
    }, initialState);

    const [paramList, setParamList] = useState([]);

    const reset = () => {
        setParamList([]);
        dispatch({
            type: FetchStatus.IDLE,
        });
    };

    const onInstanceSuccess = useCallback((data) => {
        dispatch({
            type: FetchStatus.FETCHING,
            counterIncrement: true,
        });
    }, []);

    const onInstanceError = useCallback((errorMessage, paramsOnError) => {
        // counter now stored in reducer to avoid counter and state being updated not simultenaously,
        // causing useEffect to be triggered once for each change, which would cause an expected behaviour
        dispatch({
            type: FetchStatus.FETCH_ERROR,
            payload: errorMessage,
            context: paramsOnError,
            counterIncrement: true,
        });
    }, []);

    const [fetchCB] = useDeferredFetch(
        fetchFunction,
        onInstanceSuccess,
        errorToString,
        onInstanceError,
        hasResult
    );

    const fetchCallback = useCallback(
        (cbParamsList) => {
            dispatch({ type: FetchStatus.FETCHING, counterIncrement: false });
            setParamList(cbParamsList);
            for (let params of cbParamsList) {
                fetchCB(...params);
            }
        },
        [fetchCB]
    );

    useEffect(() => {
        if (paramList.length !== 0 && paramList.length === state.counter) {
            if (state.public.status === FetchStatus.FETCH_ERROR) {
                if (onError)
                    onError(
                        state.public.errorMessage,
                        paramList,
                        state.public.paramsOnError
                    );
            } else {
                dispatch({
                    type: FetchStatus.FETCHED,
                });
                if (onSuccess) onSuccess(state.data);
            }
            reset();
        }
    }, [paramList, onError, onSuccess, state]);

    return [fetchCallback, state.public];
};
