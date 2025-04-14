/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useRef, useState } from 'react';
import {
    fetchAppsMetadata,
    GridSuiteModule,
    LIGHT_THEME,
    logout,
    TopBar,
    UserManagerState,
    useNotificationsListener,
    AnnouncementProps,
} from '@gridsuite/commons-ui';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { APP_NAME, PARAM_LANGUAGE, PARAM_THEME, PARAM_DEVELOPER_MODE } from '../utils/config-params';
import { fetchVersion, getServersInfos } from '../utils/rest-api';
import GridExploreLogoLight from '../images/GridExplore_logo_light.svg?react';
import GridExploreLogoDark from '../images/GridExplore_logo_dark.svg?react';
import { setAppsAndUrls } from '../redux/actions';
import AppPackage from '../../package.json';
import { SearchBar } from './search/search-bar';
import { AppDispatch } from '../redux/store';
import { useParameterState } from './dialogs/use-parameters-dialog';
import { AppState } from '../redux/types';
import {NotificationUrlKeys} from "../utils/notificationsProvider-utils";

export type AppTopBarProps = {
    userManagerInstance: UserManagerState['instance'];
};

export default function AppTopBar({ userManagerInstance }: Readonly<AppTopBarProps>) {
    const navigate = useNavigate();

    const dispatch = useDispatch<AppDispatch>();

    const user = useSelector((state: AppState) => state.user);

    const appsAndUrls = useSelector((state: AppState) => state.appsAndUrls);

    const theme = useSelector((state: AppState) => state[PARAM_THEME]);

    const [themeLocal, handleChangeTheme] = useParameterState(PARAM_THEME);

    const [languageLocal, handleChangeLanguage] = useParameterState(PARAM_LANGUAGE);

    const [enableDeveloperModeLocal, handleChangeDeveloperMode] = useParameterState(PARAM_DEVELOPER_MODE);

    const searchInputRef = useRef<any | null>(null);

    const [announcementInfos, setAnnouncementInfos] = useState<AnnouncementProps | null>(null);

    useNotificationsListener(NotificationUrlKeys.GLOBAL_CONFIG, {
        listenerCallbackMessage: (event) => {
            const eventData = JSON.parse(event.data);
            if (eventData.headers.messageType === "announcement") {
                if (announcementInfos != null && announcementInfos.announcementId == eventData.headers.announcementId) {
                    //If we receive a notification for an announcement that we already received we ignore it
                    return;
                } else {
                    const announcement = {
                        announcementId: eventData.headers.announcementId,
                        message: eventData.payload,
                        severity: eventData.headers.severity,
                        duration: eventData.headers.duration,
                    } as AnnouncementProps;
                    setAnnouncementInfos(announcement);
                }
            } else if (eventData.headers.messageType === "cancelAnnouncement") {
                    setAnnouncementInfos(null);
            }
        },
    });

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
        return undefined;
    }, [user]);

    return (
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
            onDeveloperModeClick={handleChangeDeveloperMode}
            developerMode={enableDeveloperModeLocal}
            onLanguageClick={handleChangeLanguage}
            language={languageLocal}
            globalVersionPromise={() => fetchVersion().then((res) => res?.deployVersion)}
            additionalModulesPromise={getServersInfos as () => Promise<GridSuiteModule[]>}
            announcementInfos={announcementInfos}
        >
            {user && <SearchBar inputRef={searchInputRef} />}
        </TopBar>
    );
}
