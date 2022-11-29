/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import {
    Navigate,
    Route,
    Routes,
    useNavigate,
    useLocation,
} from 'react-router-dom';

import {
    selectComputedLanguage,
    selectLanguage,
    selectTheme,
} from '../redux/actions';

import {
    AuthenticationRouter,
    CardErrorBoundary,
    getPreLoginPath,
    initializeAuthenticationProd,
    setShowAuthenticationRouterLogin,
} from '@gridsuite/commons-ui';

import { useMatch } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import {
    connectNotificationsWsUpdateConfig,
    fetchConfigParameter,
    fetchConfigParameters,
    fetchValidateUser,
} from '../utils/rest-api';
import {
    APP_NAME,
    COMMON_APP_NAME,
    PARAM_LANGUAGE,
    PARAM_THEME,
} from '../utils/config-params';
import { getComputedLanguage } from '../utils/language';
import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';
import { useSnackbar } from 'notistack';
import AppTopBar from './app-top-bar';
import Grid from '@mui/material/Grid';
import TreeViewsContainer from './tree-views-container';
import DirectoryContent from './directory-content';
import DirectoryBreadcrumbs from './directory-breadcrumbs';

const noUserManager = { instance: null, error: null };

const App = () => {
    const intlRef = useIntlRef();

    const { enqueueSnackbar } = useSnackbar();

    const user = useSelector((state) => state.user);

    const signInCallbackError = useSelector(
        (state) => state.signInCallbackError
    );
    const authenticationRouterError = useSelector(
        (state) => state.authenticationRouterError
    );
    const showAuthenticationRouterLogin = useSelector(
        (state) => state.showAuthenticationRouterLogin
    );

    const [userManager, setUserManager] = useState(noUserManager);

    const navigate = useNavigate();

    const dispatch = useDispatch();

    const location = useLocation();

    const updateParams = useCallback(
        (params) => {
            console.debug('received UI parameters : ', params);
            params.forEach((param) => {
                switch (param.name) {
                    case PARAM_THEME:
                        dispatch(selectTheme(param.value));
                        break;
                    case PARAM_LANGUAGE:
                        dispatch(selectLanguage(param.value));
                        dispatch(
                            selectComputedLanguage(
                                getComputedLanguage(param.value)
                            )
                        );
                        break;
                    default:
                }
            });
        },
        [dispatch]
    );

    //remove the default contextMenu
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

        ws.onmessage = function (event) {
            let eventData = JSON.parse(event.data);
            if (eventData.headers && eventData.headers['parameterName']) {
                fetchConfigParameter(eventData.headers['parameterName'])
                    .then((param) => updateParams([param]))
                    .catch((error) =>
                        displayErrorMessageWithSnackbar({
                            errorMessage: error.message,
                            enqueueSnackbar: enqueueSnackbar,
                            headerMessage: {
                                headerMessageId: 'paramsRetrievingError',
                                intlRef: intlRef,
                            },
                        })
                    );
            }
        };
        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }, [updateParams, enqueueSnackbar, intlRef]);

    // Can't use lazy initializer because useMatch is a hook
    const [initialMatchSilentRenewCallbackUrl] = useState(
        useMatch({
            path: '/silent-renew-callback',
        })
    );

    useEffect(() => {
        initializeAuthenticationProd(
            dispatch,
            initialMatchSilentRenewCallbackUrl != null,
            fetch('idpSettings.json'),
            fetchValidateUser
        )
            .then((userManager) => {
                setUserManager({ instance: userManager, error: null });
                return userManager.getUser().then((user) => {
                    if (
                        user == null &&
                        initialMatchSilentRenewCallbackUrl == null
                    ) {
                        return userManager.signinSilent().catch((error) => {
                            dispatch(setShowAuthenticationRouterLogin(true));
                            const oidcHackReloaded =
                                'gridsuite-oidc-hack-reloaded';
                            if (
                                !sessionStorage.getItem(oidcHackReloaded) &&
                                error.message ===
                                    'authority mismatch on settings vs. signin state'
                            ) {
                                sessionStorage.setItem(oidcHackReloaded, true);
                                console.log(
                                    'Hack oidc, reload page to make login work'
                                );
                                window.location.reload();
                            }
                        });
                    }
                });
            })
            .catch(function (error) {
                setUserManager({ instance: null, error: error.message });
                console.debug('error when importing the idp settings');
                dispatch(setShowAuthenticationRouterLogin(true));
            });
        // Note: initialMatchSilentRenewCallbackUrl and dispatch don't change
    }, [initialMatchSilentRenewCallbackUrl, dispatch]);

    useEffect(() => {
        if (user !== null) {
            fetchConfigParameters(COMMON_APP_NAME)
                .then((params) => updateParams(params))
                .catch((error) =>
                    displayErrorMessageWithSnackbar({
                        errorMessage: error.message,
                        enqueueSnackbar: enqueueSnackbar,
                        headerMessage: {
                            headerMessageId: 'paramsRetrievingError',
                            intlRef: intlRef,
                        },
                    })
                );

            fetchConfigParameters(APP_NAME)
                .then((params) => updateParams(params))
                .catch((error) =>
                    displayErrorMessageWithSnackbar({
                        errorMessage: error.message,
                        enqueueSnackbar: enqueueSnackbar,
                        headerMessage: {
                            headerMessageId: 'paramsRetrievingError',
                            intlRef: intlRef,
                        },
                    })
                );

            const ws = connectNotificationsUpdateConfig();
            return function () {
                ws.close();
            };
        }
    }, [
        user,
        dispatch,
        updateParams,
        enqueueSnackbar,
        intlRef,
        connectNotificationsUpdateConfig,
    ]);

    return (
        <div
            className="singlestretch-child"
            style={{
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <AppTopBar user={user} userManager={userManager} />
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
                                    <>
                                        <Grid
                                            container
                                            style={{ height: '100%' }}
                                        >
                                            <Grid
                                                item
                                                xs={12}
                                                sm={3}
                                                style={{
                                                    borderRight:
                                                        '1px solid rgba(81, 81, 81, 1)',
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
                                    </>
                                }
                            />
                            <Route
                                path="/sign-in-callback"
                                element={
                                    <Navigate
                                        replace
                                        to={getPreLoginPath() || '/'}
                                    />
                                }
                            />
                            <Route
                                path="/logout-callback"
                                element={
                                    <h1>
                                        Error: logout failed; you are still
                                        logged in.
                                    </h1>
                                }
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
                            authenticationRouterError={
                                authenticationRouterError
                            }
                            showAuthenticationRouterLogin={
                                showAuthenticationRouterLogin
                            }
                            dispatch={dispatch}
                            navigate={navigate}
                            location={location}
                        />
                    )}
                </div>
            </CardErrorBoundary>
        </div>
    );
};

export default App;
