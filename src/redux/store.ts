/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { legacy_createStore as createStore, Store } from 'redux';
import { Actions, AppState, reducer } from './reducer';
import { initCommonServices } from '@gridsuite/commons-ui';
import { APP_NAME, PARAM_LANGUAGE } from '../utils/config-params';

export const store: Store<AppState, Actions> = createStore(reducer);
export type AppDispatch = typeof store.dispatch;

initCommonServices(APP_NAME, () => store.getState().user ?? undefined);

// to avoid to reset the state with HMR
// https://redux.js.org/usage/configuring-your-store#hot-reloading
if (import.meta.env.DEV && import.meta.hot) {
    import.meta.hot.accept('./reducer', () => store.replaceReducer(reducer));
}
