/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { PARAM_LANGUAGE, PARAM_THEME, useSnackMessage } from '@gridsuite/commons-ui';
import { AppState } from 'redux/reducer';
import { configSrv } from '../../services';

type ParamName = typeof PARAM_THEME | typeof PARAM_LANGUAGE;

export function useParameterState<TParam extends ParamName>(
    paramName: TParam
): [AppState[TParam], (value: AppState[TParam]) => void] {
    const { snackError } = useSnackMessage();

    const paramGlobalState = useSelector((state: AppState) => state[paramName]);
    const [paramLocalState, setParamLocalState] = useState<AppState[TParam]>(paramGlobalState);

    useEffect(() => {
        setParamLocalState(paramGlobalState);
    }, [paramGlobalState]);

    const handleChangeParamLocalState = useCallback(
        (value: AppState[TParam]) => {
            setParamLocalState(value);
            configSrv.updateConfigParameter(paramName, value).catch((error) => {
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
