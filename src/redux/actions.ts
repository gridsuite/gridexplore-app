/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Action } from 'redux';
import { PARAM_LANGUAGE } from '../utils/config-params';
import { AppState } from './reducer';

export type AppActions =
    | ThemeAction
    | LanguageAction
    | ComputedLanguageAction
    | CurrentChildrenAction
    | SelectDirectoryAction
    | ActiveDirectoryAction
    | SelectionForCopyAction
    | CurrentPathAction
    | SetAppsAndUrlsAction
    | AddUploadingElementAction
    | SetUploadingElementsAction
    | DirectoryUpdatedAction
    | TreeDataAction
    | SearchedElementAction
    | ReorderedColumnsAction;

export const SELECT_THEME = 'SELECT_THEME';
export type ThemeAction = Readonly<Action<typeof SELECT_THEME>> & {
    theme: AppState['theme'];
};

export function selectTheme(theme: AppState['theme']): ThemeAction {
    return { type: SELECT_THEME, theme: theme };
}

export const SELECT_LANGUAGE = 'SELECT_LANGUAGE';
export type LanguageAction = Readonly<Action<typeof SELECT_LANGUAGE>> & {
    [PARAM_LANGUAGE]: AppState['language'];
};

export function selectLanguage(language: AppState['language']): LanguageAction {
    return { type: SELECT_LANGUAGE, [PARAM_LANGUAGE]: language };
}

export const SELECT_COMPUTED_LANGUAGE = 'SELECT_COMPUTED_LANGUAGE';
export type ComputedLanguageAction = Readonly<Action<typeof SELECT_COMPUTED_LANGUAGE>> & {
    computedLanguage: AppState['computedLanguage'];
};

export function selectComputedLanguage(computedLanguage: AppState['computedLanguage']): ComputedLanguageAction {
    return {
        type: SELECT_COMPUTED_LANGUAGE,
        computedLanguage: computedLanguage,
    };
}

export const CURRENT_CHILDREN = 'CURRENT_CHILDREN';
export type CurrentChildrenAction = Readonly<Action<typeof CURRENT_CHILDREN>> & {
    currentChildren: AppState['currentChildren'];
};
export function setCurrentChildren(currentChildren: AppState['currentChildren']): CurrentChildrenAction {
    return {
        type: CURRENT_CHILDREN,
        currentChildren: currentChildren,
    };
}

export const SELECT_DIRECTORY = 'SELECT_DIRECTORY';
export type SelectDirectoryAction = Readonly<Action<typeof SELECT_DIRECTORY>> & {
    selectedDirectory: AppState['selectedDirectory'];
};

export function setSelectedDirectory(selectedDirectory: AppState['selectedDirectory']): SelectDirectoryAction {
    return {
        type: SELECT_DIRECTORY,
        selectedDirectory: selectedDirectory,
    };
}

export const ACTIVE_DIRECTORY = 'ACTIVE_DIRECTORY';
export type ActiveDirectoryAction = Readonly<Action<typeof ACTIVE_DIRECTORY>> & {
    activeDirectory: AppState['activeDirectory'];
};
export function setActiveDirectory(activeDirectory: AppState['activeDirectory']): ActiveDirectoryAction {
    return {
        type: ACTIVE_DIRECTORY,
        activeDirectory: activeDirectory,
    };
}

export const SELECTION_FOR_COPY = 'SELECTION_FOR_COPY';
export type SelectionForCopyAction = Readonly<Action<typeof SELECTION_FOR_COPY>> & {
    selectionForCopy: AppState['selectionForCopy'];
};
export function setSelectionForCopy(selectionForCopy: AppState['selectionForCopy']): SelectionForCopyAction {
    return {
        type: SELECTION_FOR_COPY,
        selectionForCopy: selectionForCopy,
    };
}

export const CURRENT_PATH = 'CURRENT_PATH';
export type CurrentPathAction = Readonly<Action<typeof CURRENT_PATH>> & {
    currentPath: AppState['currentPath'];
};

export function setCurrentPath(path: AppState['currentPath']): CurrentPathAction {
    return {
        type: CURRENT_PATH,
        currentPath: path,
    };
}

export const SET_APPS_AND_URLS = 'SET_APPS_AND_URLS';
export type SetAppsAndUrlsAction = Readonly<Action<typeof SET_APPS_AND_URLS>> & {
    appsAndUrls: AppState['appsAndUrls'];
};

export function setAppsAndUrls(appsAndUrls: AppState['appsAndUrls']): SetAppsAndUrlsAction {
    return {
        type: SET_APPS_AND_URLS,
        appsAndUrls: appsAndUrls,
    };
}

export const ADD_UPLOADING_ELEMENT = 'ADD_UPLOADING_ELEMENT';
export type AddUploadingElementAction = Readonly<Action<typeof ADD_UPLOADING_ELEMENT>> & {
    uploadingElement: AppState['uploadingElements'][number];
};

export function addUploadingElement(
    uploadingElement: AppState['uploadingElements'][number]
): AddUploadingElementAction {
    return { type: ADD_UPLOADING_ELEMENT, uploadingElement: uploadingElement };
}

export const SET_UPLOADING_ELEMENTS = 'SET_UPLOADING_ELEMENTS';
export type SetUploadingElementsAction = Readonly<Action<typeof SET_UPLOADING_ELEMENTS>> & {
    uploadingElements: AppState['uploadingElements'];
};

export function setUploadingElements(uploadingElements: AppState['uploadingElements']): SetUploadingElementsAction {
    return { type: SET_UPLOADING_ELEMENTS, uploadingElements: uploadingElements };
}

export const DIRECTORY_UPDATED = 'DIRECTORY_UPDATED';
export type DirectoryUpdatedAction = Readonly<Action<typeof DIRECTORY_UPDATED>> & {
    eventData: AppState['directoryUpdated']['eventData'];
};

export function directoryUpdated(eventData: AppState['directoryUpdated']['eventData']): DirectoryUpdatedAction {
    return { type: DIRECTORY_UPDATED, eventData };
}

export const TREE_DATA = 'TREE_DATA';
export type TreeDataAction = Readonly<Action<typeof TREE_DATA>> & {
    treeData: AppState['treeData'];
};

export function setTreeData(treeData: AppState['treeData']): TreeDataAction {
    return {
        type: TREE_DATA,
        treeData: treeData,
    };
}

export const SEARCHED_ELEMENT = 'SEARCHED_ELEMENT';
export type SearchedElementAction = Readonly<Action<typeof SEARCHED_ELEMENT>> & {
    searchedElement: AppState['searchedElement'];
};

export function setSearchedElement(searchedElement: AppState['searchedElement']): SearchedElementAction {
    return {
        type: SEARCHED_ELEMENT,
        searchedElement: searchedElement,
    };
}

export const REORDERED_COLUMNS = 'REORDERED_COLUMNS';
export type ReorderedColumnsAction = Readonly<Action<typeof REORDERED_COLUMNS>> & {
    reorderedColumns: AppState['reorderedColumns'];
};

export function setReorderedColumns(columns: AppState['reorderedColumns']): ReorderedColumnsAction {
    return {
        type: REORDERED_COLUMNS,
        reorderedColumns: columns,
    };
}
