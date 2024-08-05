/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
    GridSuiteModule,
    fetchAppsMetadata,
    LIGHT_THEME,
    logout,
    TopBar,
    UserManagerState,
} from '@gridsuite/commons-ui';
import ParametersDialog, { useParameterState } from './dialogs/parameters-dialog';
import { APP_NAME, PARAM_LANGUAGE, PARAM_THEME } from '../utils/config-params';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVersion, getServersInfos } from '../utils/rest-api';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import GridExploreLogoLight from '../images/GridExplore_logo_light.svg?react';
import GridExploreLogoDark from '../images/GridExplore_logo_dark.svg?react';
import { setAppsAndUrls } from '../redux/actions';
import AppPackage from '../../package.json';
import { SearchBar } from './search/search-bar';
import { AppState } from '../redux/reducer';
import { AppDispatch } from '../redux/store';

type AppTopBarProps = {
    userManagerInstance: UserManagerState['instance'];
};

export default function AppTopBar({ userManagerInstance }: AppTopBarProps) {
    const navigate = useNavigate();

    const dispatch = useDispatch<AppDispatch>();

    const user = useSelector((state: AppState) => state.user);

    const appsAndUrls = useSelector((state: AppState) => state.appsAndUrls);

    const theme = useSelector((state: AppState) => state[PARAM_THEME]);

    const [themeLocal, handleChangeTheme] = useParameterState(PARAM_THEME);

    const [languageLocal, handleChangeLanguage] = useParameterState(PARAM_LANGUAGE);

    const [showParameters, setShowParameters] = useState(false);

    const searchInputRef = useRef<any | null>(null);

    useEffect(() => {
        if (user !== null) {
            fetchAppsMetadata().then((res) => {
                dispatch(setAppsAndUrls(res));
            });
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (user) {
            const openSearch = (e: DocumentEventMap['keydown']) => {
                if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }
            };
            document.addEventListener('keydown', openSearch);
            return () => document.removeEventListener('keydown', openSearch);
        }
    }, [user]);

    return (
        <>
            <TopBar
                appName={APP_NAME}
                appColor="#3DABE2"
                appLogo={theme === LIGHT_THEME ? <GridExploreLogoLight /> : <GridExploreLogoDark />}
                appVersion={AppPackage.version}
                appLicense={AppPackage.license}
                onLogoutClick={() => logout(dispatch, userManagerInstance)}
                onLogoClick={() => navigate('/', { replace: true })}
                user={user ?? undefined}
                appsAndUrls={appsAndUrls}
                onThemeClick={handleChangeTheme}
                theme={themeLocal}
                onLanguageClick={handleChangeLanguage}
                language={languageLocal}
                globalVersionPromise={() => fetchVersion().then((res) => res?.deployVersion)}
                additionalModulesPromise={getServersInfos as () => Promise<GridSuiteModule[]>}
            >
                {user && <SearchBar inputRef={searchInputRef} />}
            </TopBar>
            <ParametersDialog showParameters={showParameters} hideParameters={() => setShowParameters(false)} />
        </>
    );
}

AppTopBar.propTypes = {
    user: PropTypes.object,
    userManager: PropTypes.object,
};
