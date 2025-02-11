/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useMatch, useNavigate } from 'react-router-dom';
import {
    AuthenticationRouter,
    CardErrorBoundary,
    getComputedLanguage,
    getPreLoginPath,
    GsLangUser,
    initializeAuthenticationProd,
    UserManagerState,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { FormattedMessage } from 'react-intl';
import { Grid } from '@mui/material';
import { selectComputedLanguage, selectEnableDeveloperMode, selectLanguage, selectTheme } from '../redux/actions';
import {
    ConfigParameters,
    connectNotificationsWsUpdateConfig,
    fetchConfigParameter,
    fetchConfigParameters,
    fetchIdpSettings,
    fetchValidateUser,
} from '../utils/rest-api';
import { APP_NAME, COMMON_APP_NAME, PARAM_DEVELOPER_MODE, PARAM_LANGUAGE, PARAM_THEME } from '../utils/config-params';
import AppTopBar from './app-top-bar';
import TreeViewsContainer from './tree-views-container';
import DirectoryContent from './directory-content';
import DirectoryBreadcrumbs from './directory-breadcrumbs';
import { AppDispatch } from '../redux/store';
import { AppState } from '../redux/types';

export default function App() {
    const { snackError } = useSnackMessage();

    const user = useSelector((state: AppState) => state.user);

    const signInCallbackError = useSelector((state: AppState) => state.signInCallbackError);
    const authenticationRouterError = useSelector((state: AppState) => state.authenticationRouterError);
    const showAuthenticationRouterLogin = useSelector((state: AppState) => state.showAuthenticationRouterLogin);

    const [userManager, setUserManager] = useState<UserManagerState>({
        instance: null,
        error: null,
    });

    const navigate = useNavigate();

    const dispatch = useDispatch<AppDispatch>();

    const location = useLocation();

    const updateParams = useCallback(
        (params: ConfigParameters) => {
            console.debug('received UI parameters : ', params);
            params.forEach((param) => {
                switch (param.name) {
                    case PARAM_THEME:
                        dispatch(selectTheme(param.value));
                        break;
                    case PARAM_LANGUAGE:
                        dispatch(selectLanguage(param.value));
                        // TODO remove cast when prototype is fixed in commons-ui
                        dispatch(selectComputedLanguage(getComputedLanguage(param.value) as GsLangUser));
                        break;
                    case PARAM_DEVELOPER_MODE:
                        dispatch(selectEnableDeveloperMode(String(param.value) === 'true'));
                        break;
                    default:
                        break;
                }
            });
        },
        [dispatch]
    );

    // remove the default contextMenu
    useEffect(() => {
        document.addEventListener(
            'contextmenu',
            (event) => {
                event.preventDefault();
            },
            { capture: true }
        );
    });

    const connectNotificationsUpdateConfig = useCallback(() => {
        const ws = connectNotificationsWsUpdateConfig();

        ws.onmessage = function onmessage(event) {
            const eventData = JSON.parse(event.data);
            if (eventData.headers?.parameterName) {
                fetchConfigParameter(eventData.headers.parameterName)
                    .then((param) => updateParams([param]))
                    .catch((error) =>
                        snackError({
                            messageTxt: error.message,
                            headerId: 'paramsRetrievingError',
                        })
                    );
            }
        };
        ws.onerror = function onerror(event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }, [updateParams, snackError]);

    // Can't use lazy initializer because useMatch is a hook
    const [initialMatchSilentRenewCallbackUrl] = useState(
        useMatch({
            path: '/silent-renew-callback',
        })
    );

    const [initialMatchSigninCallbackUrl] = useState(
        useMatch({
            path: '/sign-in-callback',
        })
    );

    useEffect(() => {
        // need subfunction when async as suggested by rule react-hooks/exhaustive-deps
        (async function initializeAuthentication() {
            try {
                setUserManager({
                    instance: await initializeAuthenticationProd(
                        dispatch,
                        initialMatchSilentRenewCallbackUrl != null,
                        fetchIdpSettings,
                        fetchValidateUser,
                        initialMatchSigninCallbackUrl != null
                    ),
                    error: null,
                });
            } catch (error: any) {
                setUserManager({ instance: null, error: error.message });
            }
        })();
        // Note: initialMatchSilentRenewCallbackUrl and dispatch don't change
    }, [initialMatchSilentRenewCallbackUrl, dispatch, initialMatchSigninCallbackUrl]);

    useEffect(() => {
        if (user !== null) {
            fetchConfigParameters(COMMON_APP_NAME)
                .then((params) => updateParams(params))
                .catch((error) =>
                    snackError({
                        messageTxt: error.message,
                        headerId: 'paramsRetrievingError',
                    })
                );

            fetchConfigParameters(APP_NAME)
                .then((params) => updateParams(params))
                .catch((error) =>
                    snackError({
                        messageTxt: error.message,
                        headerId: 'paramsRetrievingError',
                    })
                );

            const ws = connectNotificationsUpdateConfig();
            return function closeWS() {
                ws.close();
            };
        }
        return undefined;
    }, [user, dispatch, updateParams, snackError, connectNotificationsUpdateConfig]);

    return (
        <div
            className="singlestretch-child"
            style={{
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <AppTopBar userManagerInstance={userManager.instance} />
            <CardErrorBoundary>
                <div
                    style={{
                        flexGrow: 1,
                        /* autosizer (used in virtual table) can return wrong size
                        (off by 1) and it causes scrollbar to blink
                        * */
                        overflow: 'hidden',
                        marginTop: '20px',
                    }}
                >
                    {user !== null ? (
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <Grid container style={{ height: '100%' }}>
                                        <Grid
                                            item
                                            xs={12}
                                            sm={3}
                                            style={{
                                                borderRight: '1px solid rgba(81, 81, 81, 1)',
                                                height: '100%',
                                                overflow: 'auto',
                                                display: 'flex',
                                            }}
                                        >
                                            <TreeViewsContainer />
                                        </Grid>
                                        <Grid item xs={12} sm={9}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    height: '100%',
                                                }}
                                            >
                                                <DirectoryBreadcrumbs />
                                                <DirectoryContent />
                                            </div>
                                        </Grid>
                                    </Grid>
                                }
                            />
                            <Route
                                path="/sign-in-callback"
                                element={<Navigate replace to={getPreLoginPath() || '/'} />}
                            />
                            <Route
                                path="/logout-callback"
                                element={<h1>Error: logout failed; you are still logged in.</h1>}
                            />
                            <Route
                                path="*"
                                element={
                                    <h1>
                                        <FormattedMessage id="PageNotFound" />
                                    </h1>
                                }
                            />
                        </Routes>
                    ) : (
                        <AuthenticationRouter
                            userManager={userManager}
                            signInCallbackError={signInCallbackError}
                            authenticationRouterError={authenticationRouterError}
                            showAuthenticationRouterLogin={showAuthenticationRouterLogin}
                            dispatch={dispatch}
                            navigate={navigate}
                            location={location}
                        />
                    )}
                </div>
            </CardErrorBoundary>
        </div>
    );
}
