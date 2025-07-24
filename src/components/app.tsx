/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useMatch, useNavigate } from 'react-router';
import {
    AnnouncementNotification,
    AuthenticationRouter,
    CardErrorBoundary,
    getComputedLanguage,
    getPreLoginPath,
    GsLangUser,
    initializeAuthenticationProd,
    NotificationsUrlKeys,
    useNotificationsListener,
    UserManagerState,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { FormattedMessage } from 'react-intl';
import { Box } from '@mui/material';
import { selectComputedLanguage, selectEnableDeveloperMode, selectLanguage, selectTheme } from '../redux/actions';
import { ConfigParameters, fetchConfigParameter, fetchConfigParameters, fetchIdpSettings } from '../utils/rest-api';
import {
    APP_NAME,
    COMMON_APP_NAME,
    LAST_SELECTED_DIRECTORY,
    PARAM_DEVELOPER_MODE,
    PARAM_LANGUAGE,
    PARAM_THEME,
} from '../utils/config-params';
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
                    case LAST_SELECTED_DIRECTORY:
                        localStorage.setItem(LAST_SELECTED_DIRECTORY, param.value as string);
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

    const getConfigParameter = useCallback(
        (event: MessageEvent<string>) => {
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
        },
        [updateParams, snackError]
    );

    useNotificationsListener(NotificationsUrlKeys.CONFIG, {
        listenerCallbackMessage: getConfigParameter,
    });

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
        }
        return undefined;
    }, [user, dispatch, updateParams, snackError]);

    // We use <Box flex=.../> instead of <Grid/> because flex rules were too complexes or conflicts with MUI grid rules
    return (
        <Box display="flex" flexDirection="column" width="100%" height="100%">
            <Box flexShrink={0}>
                <AppTopBar userManagerInstance={userManager.instance} />
            </Box>
            <Box flexShrink={0}>
                <AnnouncementNotification user={user} sx={{ marginBottom: '0 !important' }} />
            </Box>
            <Box marginTop={1} flexGrow={1} minHeight={0} display="flex">
                <CardErrorBoundary>
                    {user !== null ? (
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <>
                                        <Box
                                            width="30%"
                                            height="100%"
                                            overflow="auto"
                                            style={{ borderRight: '1px solid rgb(81, 81, 81)' }}
                                        >
                                            <TreeViewsContainer />
                                        </Box>
                                        <Box width="70%" height="100%" display="flex" flexDirection="column">
                                            <Box width="100%" flexShrink={0}>
                                                <DirectoryBreadcrumbs />
                                            </Box>
                                            <DirectoryContent />
                                        </Box>
                                    </>
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
                </CardErrorBoundary>
            </Box>
        </Box>
    );
}
