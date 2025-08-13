/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LAST_SELECTED_DIRECTORY, PARAM_DEVELOPER_MODE, PARAM_LANGUAGE, PARAM_THEME } from '@gridsuite/commons-ui';

export const COMMON_APP_NAME = 'common';
export const APP_NAME = 'Explore';

const COMMON_CONFIG_PARAMS_NAMES = new Set([
    PARAM_THEME,
    PARAM_LANGUAGE,
    LAST_SELECTED_DIRECTORY,
    PARAM_DEVELOPER_MODE,
]);

export function getAppName(paramName: string) {
    return COMMON_CONFIG_PARAMS_NAMES.has(paramName) ? COMMON_APP_NAME : APP_NAME;
}
