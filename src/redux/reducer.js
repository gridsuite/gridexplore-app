/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createReducer } from '@reduxjs/toolkit';

import {
    getLocalStorageComputedLanguage,
    getLocalStorageLanguage,
    getLocalStorageTheme,
    saveLocalStorageTheme,
    saveLocalStorageLanguage,
} from './local-storage';

import {
    SELECT_COMPUTED_LANGUAGE,
    SELECT_THEME,
    SELECT_LANGUAGE,
    CURRENT_CHILDREN,
    SELECT_DIRECTORY,
    CURRENT_PATH,
    SET_APPS_AND_URLS,
    LOAD_CASES_SUCCESS,
    SELECT_CASE,
    REMOVE_SELECTED_CASE,
    SELECT_FILE,
    REMOVE_SELECTED_FILE,
    ACTIVE_DIRECTORY,
    ADD_UPLOADING_ELEMENT,
    REMOVE_UPLOADING_ELEMENT,
    SET_FORMAT_WITH_PARAMS,
    SET_TEMP_CASE_UUID,
    SET_FORMAT_INVALID_ERROR,
} from './actions';

import {
    USER,
    SIGNIN_CALLBACK_ERROR,
    UNAUTHORIZED_USER_INFO,
    SHOW_AUTH_INFO_LOGIN,
} from '@gridsuite/commons-ui';
import { PARAM_LANGUAGE, PARAM_THEME } from '../utils/config-params';

const paramsInitialState = {
    [PARAM_THEME]: getLocalStorageTheme(),
    [PARAM_LANGUAGE]: getLocalStorageLanguage(),
};

const initialState = {
    computedLanguage: getLocalStorageComputedLanguage(),
    currentChildren: null,
    selectedDirectory: null,
    activeDirectory: null,
    currentPath: [],
    user: null,
    signInCallbackError: null,
    unauthorizedUserInfo: null,
    showAuthenticationRouterLogin: false,
    appsAndUrls: [],
    cases: [],
    selectedCase: null,
    selectedFile: null,
    uploadingElements: {},
    ...paramsInitialState,
    formatWithParams: [],
    tempCaseUuid: null,
    formatInvalidMsgError: null,
};

export const reducer = createReducer(initialState, {
    [SELECT_THEME]: (state, action) => {
        state.theme = action.theme;
        saveLocalStorageTheme(state.theme);
    },

    [SELECT_LANGUAGE]: (state, action) => {
        state.language = action.language;
        saveLocalStorageLanguage(state.language);
    },

    [USER]: (state, action) => {
        state.user = action.user;
    },

    [SIGNIN_CALLBACK_ERROR]: (state, action) => {
        state.signInCallbackError = action.signInCallbackError;
    },

    [UNAUTHORIZED_USER_INFO]: (state, action) => {
        state.unauthorizedUserInfo = action.unauthorizedUserInfo;
    },

    [SHOW_AUTH_INFO_LOGIN]: (state, action) => {
        state.showAuthenticationRouterLogin =
            action.showAuthenticationRouterLogin;
    },

    [SELECT_COMPUTED_LANGUAGE]: (state, action) => {
        state.computedLanguage = action.computedLanguage;
    },

    [CURRENT_CHILDREN]: (state, action) => {
        state.currentChildren = action.currentChildren;
    },

    [SELECT_DIRECTORY]: (state, action) => {
        state.selectedDirectory = action.selectedDirectory
            ? { ...action.selectedDirectory }
            : null;
    },

    [ACTIVE_DIRECTORY]: (state, action) => {
        state.activeDirectory = action.activeDirectory;
    },

    [CURRENT_PATH]: (state, action) => {
        state.currentPath = action.currentPath;
    },

    [SET_APPS_AND_URLS]: (state, action) => {
        state.appsAndUrls = action.appsAndUrls;
    },

    [LOAD_CASES_SUCCESS]: (state, action) => {
        state.cases = action.cases;
    },

    [SELECT_CASE]: (state, action) => {
        state.selectedCase = action.selectedCase;
    },

    [REMOVE_SELECTED_CASE]: (state) => {
        state.selectedCase = null;
    },

    [SELECT_FILE]: (state, action) => {
        state.selectedFile = action.selectedFile;
    },

    [REMOVE_SELECTED_FILE]: (state) => {
        state.selectedFile = null;
    },

    [ADD_UPLOADING_ELEMENT]: (state, action) => {
        state.uploadingElements = {
            ...state.uploadingElements,
            ...{ [action.uploadingElement.id]: action.uploadingElement },
        };
    },

    [REMOVE_UPLOADING_ELEMENT]: (state, action) => {
        let newUploadingElements = { ...state.uploadingElements };
        delete newUploadingElements[action.uploadingElement.id];
        state.uploadingElements = newUploadingElements;
    },

    [SET_FORMAT_WITH_PARAMS]: (state, action) => {
        state.formatWithParams = action.formatWithParams;
    },

    [SET_TEMP_CASE_UUID]: (state, action) => {
        state.tempCaseUuid = action.tempCaseUuid;
    },

    [SET_FORMAT_INVALID_ERROR]: (state, action) => {
        state.formatInvalidMsgError = action.formatInvalidMsgError;
    },
});
