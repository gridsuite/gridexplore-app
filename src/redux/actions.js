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

export const LOAD_CASES_SUCCESS = 'LOAD_CASES_SUCCESS';

export function loadCasesSuccess(cases) {
    return { type: LOAD_CASES_SUCCESS, cases: cases };
}

export const REMOVE_SELECTED_CASE = 'REMOVE_SELECTED_CASE';

export function removeSelectedCase() {
    return { type: REMOVE_SELECTED_CASE };
}

export const SELECT_FILE = 'SELECT_FILE';

export function selectFile(selectedFile) {
    return { type: SELECT_FILE, selectedFile: selectedFile };
}

export const REMOVE_SELECTED_FILE = 'REMOVE_SELECTED_FILE';

export function removeSelectedFile() {
    return { type: REMOVE_SELECTED_FILE };
}

export const SELECT_CASE = 'SELECT_CASE';

export function selectCase(selectedCase) {
    return { type: SELECT_CASE, selectedCase: selectedCase };
}

export const ADD_UPLOADING_STUDY = 'ADD_UPLOADING_STUDY';

export function addUploadingStudy(uploadingStudy) {
    return { type: ADD_UPLOADING_STUDY, uploadingStudy: uploadingStudy };
}

export const REMOVE_UPLOADING_STUDY = 'REMOVE_UPLOADING_STUDY';

export function removeUploadingStudy(uploadingStudy) {
    return { type: REMOVE_UPLOADING_STUDY, uploadingStudy: uploadingStudy };
}
