/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { updateConfigParameter } from '../../utils/rest-api';
import { PARAM_DEVELOPER_MODE, PARAM_LANGUAGE, PARAM_THEME } from '../../utils/config-params';
import { AppState } from '../../redux/types';

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
            updateConfigParameter(paramName, value).catch((error) => {
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
