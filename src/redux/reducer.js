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
    ACTIVE_DIRECTORY,
    ADD_UPLOADING_ELEMENT,
    REMOVE_UPLOADING_ELEMENT,
    DIRECTORY_UPDATED,
    TREE_DATA,
    SELECTION_FOR_COPY,
} from './actions';

import {
    USER,
    SIGNIN_CALLBACK_ERROR,
    UNAUTHORIZED_USER_INFO,
    LOGOUT_ERROR,
    USER_VALIDATION_ERROR,
    RESET_AUTHENTICATION_ROUTER_ERROR,
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
    authenticationRouterError: null,
    showAuthenticationRouterLogin: false,
    appsAndUrls: [],
    selectedFile: null,
    uploadingElements: {},
    directoryUpdated: { force: 0, eventData: {} },
    treeData: { mapData: {}, rootDirectories: [] },
    selectionForCopy: {
        sourceItemUuid: null,
        typeItem: null,
        nameItem: null,
        descriptionItem: null,
        parentDirectoryUuid: null,
    },
    ...paramsInitialState,
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
        state.authenticationRouterError = action.authenticationRouterError;
    },

    [LOGOUT_ERROR]: (state, action) => {
        state.authenticationRouterError = action.authenticationRouterError;
    },

    [USER_VALIDATION_ERROR]: (state, action) => {
        state.authenticationRouterError = action.authenticationRouterError;
    },

    [RESET_AUTHENTICATION_ROUTER_ERROR]: (state, action) => {
        state.authenticationRouterError = null;
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

    [DIRECTORY_UPDATED]: (state, action) => {
        state.directoryUpdated = {
            force: 1 - state.directoryUpdated.force,
            eventData: action.eventData,
        };
    },
    [TREE_DATA]: (state, action) => {
        state.treeData = action.treeData;
    },
    [SELECTION_FOR_COPY]: (state, action) => {
        const selectionForCopy = action.selectionForCopy;
        state.selectionForCopy = selectionForCopy;
    },
});
