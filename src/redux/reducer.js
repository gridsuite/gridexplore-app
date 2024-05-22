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
    SEARCHED_ELEMENT,
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
    searchedElement: null,
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
        specificTypeItem: null,
    },
    ...paramsInitialState,
};

export const reducer = createReducer(initialState, (builder) => {
    builder.addCase(SELECT_THEME, (state, action) => {
        state.theme = action.theme;
        saveLocalStorageTheme(state.theme);
    });

    builder.addCase(SELECT_LANGUAGE, (state, action) => {
        state.language = action.language;
        saveLocalStorageLanguage(state.language);
    });

    builder.addCase(USER, (state, action) => {
        state.user = action.user;
    });

    builder.addCase(SIGNIN_CALLBACK_ERROR, (state, action) => {
        state.signInCallbackError = action.signInCallbackError;
    });

    builder.addCase(UNAUTHORIZED_USER_INFO, (state, action) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(LOGOUT_ERROR, (state, action) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(USER_VALIDATION_ERROR, (state, action) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(RESET_AUTHENTICATION_ROUTER_ERROR, (state, action) => {
        state.authenticationRouterError = null;
    });

    builder.addCase(SHOW_AUTH_INFO_LOGIN, (state, action) => {
        state.showAuthenticationRouterLogin =
            action.showAuthenticationRouterLogin;
    });

    builder.addCase(SELECT_COMPUTED_LANGUAGE, (state, action) => {
        state.computedLanguage = action.computedLanguage;
    });

    builder.addCase(CURRENT_CHILDREN, (state, action) => {
        state.currentChildren = action.currentChildren;
    });

    builder.addCase(SELECT_DIRECTORY, (state, action) => {
        state.selectedDirectory = action.selectedDirectory
            ? { ...action.selectedDirectory }
            : null;
    });

    builder.addCase(SEARCHED_ELEMENT, (state, action) => {
        state.searchedElement = action.searchedElement;
    });

    builder.addCase(ACTIVE_DIRECTORY, (state, action) => {
        state.activeDirectory = action.activeDirectory;
    });

    builder.addCase(CURRENT_PATH, (state, action) => {
        state.currentPath = action.currentPath;
    });

    builder.addCase(SET_APPS_AND_URLS, (state, action) => {
        state.appsAndUrls = action.appsAndUrls;
    });

    builder.addCase(ADD_UPLOADING_ELEMENT, (state, action) => {
        state.uploadingElements = {
            ...state.uploadingElements,
            ...{ [action.uploadingElement.id]: action.uploadingElement },
        };
    });

    builder.addCase(REMOVE_UPLOADING_ELEMENT, (state, action) => {
        let newUploadingElements = { ...state.uploadingElements };
        delete newUploadingElements[action.uploadingElement.id];
        state.uploadingElements = newUploadingElements;
    });

    builder.addCase(DIRECTORY_UPDATED, (state, action) => {
        state.directoryUpdated = {
            force: 1 - state.directoryUpdated.force,
            eventData: action.eventData,
        };
    });

    builder.addCase(TREE_DATA, (state, action) => {
        state.treeData = action.treeData;
    });

    builder.addCase(SELECTION_FOR_COPY, (state, action) => {
        const selectionForCopy = action.selectionForCopy;
        state.selectionForCopy = selectionForCopy;
    });
});
