/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { PARAM_LANGUAGE } from '../utils/config-params';

export const SELECT_THEME = 'SELECT_THEME';

export function selectTheme(theme) {
    return { type: SELECT_THEME, theme: theme };
}

export const SELECT_LANGUAGE = 'SELECT_LANGUAGE';

export function selectLanguage(language) {
    return { type: SELECT_LANGUAGE, [PARAM_LANGUAGE]: language };
}

export const SELECT_COMPUTED_LANGUAGE = 'SELECT_COMPUTED_LANGUAGE';

export function selectComputedLanguage(computedLanguage) {
    return {
        type: SELECT_COMPUTED_LANGUAGE,
        computedLanguage: computedLanguage,
    };
}

export const CURRENT_CHILDREN = 'CURRENT_CHILDREN';

export function setCurrentChildren(currentChildren) {
    return {
        type: CURRENT_CHILDREN,
        currentChildren: currentChildren,
    };
}

export const SELECT_DIRECTORY = 'SELECT_DIRECTORY';

export function setSelectedDirectory(selectedDirectory) {
    return {
        type: SELECT_DIRECTORY,
        selectedDirectory: selectedDirectory,
    };
}

export const ACTIVE_DIRECTORY = 'ACTIVE_DIRECTORY';

export function setActiveDirectory(activeDirectory) {
    return {
        type: ACTIVE_DIRECTORY,
        activeDirectory: activeDirectory,
    };
}

export const CURRENT_PATH = 'CURRENT_PATH';
export const SELECTION_FOR_COPY = 'SELECTION_FOR_COPY';

export function setSelectionForCopy(selectionForCopy) {
    return {
        type: SELECTION_FOR_COPY,
        selectionForCopy: selectionForCopy,
    };
}

export function setCurrentPath(path) {
    return {
        type: CURRENT_PATH,
        currentPath: path,
    };
}

export const SET_APPS_AND_URLS = 'SET_APPS_AND_URLS';

export function setAppsAndUrls(appsAndUrls) {
    return {
        type: SET_APPS_AND_URLS,
        appsAndUrls: appsAndUrls,
    };
}

export const ADD_UPLOADING_ELEMENT = 'ADD_UPLOADING_ELEMENT';

export function addUploadingElement(uploadingElement) {
    return { type: ADD_UPLOADING_ELEMENT, uploadingElement: uploadingElement };
}

export const REMOVE_UPLOADING_ELEMENT = 'REMOVE_UPLOADING_ELEMENT';

export function removeUploadingElement(uploadingElement) {
    return {
        type: REMOVE_UPLOADING_ELEMENT,
        uploadingElement: uploadingElement,
    };
}

export const DIRECTORY_UPDATED = 'DIRECTORY_UPDATED';

export function directoryUpdated(eventData) {
    return { type: DIRECTORY_UPDATED, eventData };
}

export const TREE_DATA = 'TREE_DATA';

export function setTreeData(treeData) {
    return {
        type: TREE_DATA,
        treeData: treeData,
    };
}

export const SEARCHED_ELEMENT = 'SEARCHED_ELEMENT';

export function setSearchedElement(searchedElement) {
    return {
        type: SEARCHED_ELEMENT,
        searchedElement: searchedElement,
    };
}
