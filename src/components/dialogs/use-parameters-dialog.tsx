/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    PARAM_DEVELOPER_MODE,
    PARAM_LANGUAGE,
    PARAM_THEME,
    updateConfigParameter,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { AppState } from '../../redux/types';
import { APP_NAME } from '../../utils/config-params';

type ParamName = typeof PARAM_THEME | typeof PARAM_LANGUAGE | typeof PARAM_DEVELOPER_MODE;

export function useParameterState<TParamName extends ParamName>(
    paramName: TParamName
): [AppState[TParamName], (value: AppState[TParamName]) => void] {
    const { snackError } = useSnackMessage();

    const paramGlobalState = useSelector((state: AppState) => state[paramName]);

    const [paramLocalState, setParamLocalState] = useState<AppState[TParamName]>(paramGlobalState);

    useEffect(() => {
        setParamLocalState(paramGlobalState);
    }, [paramGlobalState]);

    const handleChangeParamLocalState = useCallback(
        (value: AppState[TParamName]) => {
            setParamLocalState(value);
            updateConfigParameter(APP_NAME, paramName, value.toString()).catch((error) => {
                setParamLocalState(paramGlobalState);
                snackError({
                    messageTxt: error.message,
                    headerId: 'paramsChangingError',
                });
            });
        },
        [paramName, snackError, setParamLocalState, paramGlobalState]
    );

    return [paramLocalState, handleChangeParamLocalState];
}
