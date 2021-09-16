/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useState } from 'react';
import { LIGHT_THEME, logout, TopBar } from '@gridsuite/commons-ui';
import Parameters, { useParameterState } from './parameters';
import { APP_NAME, PARAM_LANGUAGE, PARAM_THEME } from '../utils/config-params';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAppsAndUrls } from '../utils/rest-api';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { ReactComponent as GridExploreLogoLight } from '../images/GridExplore_logo_light.svg';
import { ReactComponent as GridExploreLogoDark } from '../images/GridExplore_logo_dark.svg';
import { setAppsAndUrls } from '../redux/actions';
const AppTopBar = ({ user, userManager }) => {
    const history = useHistory();

    const dispatch = useDispatch();

    const appsAndUrls = useSelector((state) => state.appsAndUrls);

    const theme = useSelector((state) => state[PARAM_THEME]);

    const [themeLocal, handleChangeTheme] = useParameterState(PARAM_THEME);

    const [languageLocal, handleChangeLanguage] =
        useParameterState(PARAM_LANGUAGE);

    const [showParameters, setShowParameters] = useState(false);

    useEffect(() => {
        if (user !== null) {
            fetchAppsAndUrls().then((res) => {
                dispatch(setAppsAndUrls(res));
            });
        }
    }, [user, dispatch]);

    function hideParameters() {
        setShowParameters(false);
    }

    function onLogoClicked() {
        history.replace('/');
    }

    return (
        <>
            <TopBar
                appName={APP_NAME}
                appColor="#33AFED"
                appLogo={
                    theme === LIGHT_THEME ? (
                        <GridExploreLogoLight />
                    ) : (
                        <GridExploreLogoDark />
                    )
                }
                onParametersClick={() => setShowParameters(true)}
                onLogoutClick={() => logout(dispatch, userManager.instance)}
                onLogoClick={() => onLogoClicked()}
                user={user}
                appsAndUrls={appsAndUrls}
                onAboutClick={() => console.debug('about')}
                onThemeClick={handleChangeTheme}
                theme={themeLocal}
                onLanguageClick={handleChangeLanguage}
                language={languageLocal}
            />
            <Parameters
                showParameters={showParameters}
                hideParameters={hideParameters}
            />
        </>
    );
};

AppTopBar.propTypes = {
    user: PropTypes.object,
    userManager: PropTypes.object.isRequired,
};

export default AppTopBar;
