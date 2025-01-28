/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Action } from 'redux';
import { PARAM_LANGUAGE } from '../utils/config-params';
import { AppState } from './types';

export type AppActions =
    | ThemeAction
    | LanguageAction
    | ComputedLanguageAction
    | CurrentChildrenAction
    | SelectDirectoryAction
    | ActiveDirectoryAction
    | ItemSelectionForCopyAction
    | CurrentPathAction
    | SetAppsAndUrlsAction
    | AddUploadingElementAction
    | SetUploadingElementsAction
    | RemoveUploadingElementAction
    | DirectoryUpdatedAction
    | TreeDataAction
    | SearchedElementAction
    | ReorderedColumnsAction
    | EnableDeveloperModeAction;

export const SELECT_THEME = 'SELECT_THEME';
export type ThemeAction = Readonly<Action<typeof SELECT_THEME>> & {
    theme: AppState['theme'];
};

export function selectTheme(theme: AppState['theme']): ThemeAction {
    return { type: SELECT_THEME, theme };
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
        computedLanguage,
    };
}

export const ENABLE_DEVELOPER_MODE = 'ENABLE_DEVELOPER_MODE';
export type EnableDeveloperModeAction = Readonly<Action<typeof ENABLE_DEVELOPER_MODE>> & {
    enableDeveloperMode: boolean;
};
export function selectEnableDeveloperMode(
    enableDeveloperMode: AppState['enableDeveloperMode']
): EnableDeveloperModeAction {
    return {
        type: ENABLE_DEVELOPER_MODE,
        enableDeveloperMode,
    };
}

export const CURRENT_CHILDREN = 'CURRENT_CHILDREN';
export type CurrentChildrenAction = Readonly<Action<typeof CURRENT_CHILDREN>> & {
    currentChildren: AppState['currentChildren'];
};

export function setCurrentChildren(currentChildren: AppState['currentChildren']): CurrentChildrenAction {
    return {
        type: CURRENT_CHILDREN,
        currentChildren,
    };
}

export const SELECT_DIRECTORY = 'SELECT_DIRECTORY';
export type SelectDirectoryAction = Readonly<Action<typeof SELECT_DIRECTORY>> & {
    selectedDirectory: AppState['selectedDirectory'];
};

export function setSelectedDirectory(selectedDirectory: AppState['selectedDirectory']): SelectDirectoryAction {
    return {
        type: SELECT_DIRECTORY,
        selectedDirectory,
    };
}

export const ACTIVE_DIRECTORY = 'ACTIVE_DIRECTORY';
export type ActiveDirectoryAction = Readonly<Action<typeof ACTIVE_DIRECTORY>> & {
    activeDirectory: AppState['activeDirectory'];
};

export function setActiveDirectory(activeDirectory: AppState['activeDirectory']): ActiveDirectoryAction {
    return {
        type: ACTIVE_DIRECTORY,
        activeDirectory,
    };
}

export const ITEM_SELECTION_FOR_COPY = 'SELECTION_FOR_COPY';
export type ItemSelectionForCopyAction = Readonly<Action<typeof ITEM_SELECTION_FOR_COPY>> & {
    itemSelectionForCopy: AppState['itemSelectionForCopy'];
};

export function setItemSelectionForCopy(
    selectionForCopy: AppState['itemSelectionForCopy']
): ItemSelectionForCopyAction {
    return {
        type: ITEM_SELECTION_FOR_COPY,
        itemSelectionForCopy: selectionForCopy,
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
        appsAndUrls,
    };
}

export const ADD_UPLOADING_ELEMENT = 'ADD_UPLOADING_ELEMENT';
export type AddUploadingElementAction = Readonly<Action<typeof ADD_UPLOADING_ELEMENT>> & {
    uploadingElement: AppState['uploadingElements'][number];
};

export function addUploadingElement(
    uploadingElement: AppState['uploadingElements'][number]
): AddUploadingElementAction {
    return { type: ADD_UPLOADING_ELEMENT, uploadingElement };
}

export const SET_UPLOADING_ELEMENTS = 'SET_UPLOADING_ELEMENTS';
export type SetUploadingElementsAction = Readonly<Action<typeof SET_UPLOADING_ELEMENTS>> & {
    uploadingElements: AppState['uploadingElements'];
};

export function setUploadingElements(uploadingElements: AppState['uploadingElements']): SetUploadingElementsAction {
    return { type: SET_UPLOADING_ELEMENTS, uploadingElements };
}

export const REMOVE_UPLOADING_ELEMENT = 'REMOVE_UPLOADING_ELEMENTS';
export type RemoveUploadingElementAction = Readonly<Action<typeof REMOVE_UPLOADING_ELEMENT>> & {
    uploadingElement: AppState['uploadingElements'][number];
};

export function removeUploadingElement(
    uploadingElement: AppState['uploadingElements'][number]
): RemoveUploadingElementAction {
    return { type: REMOVE_UPLOADING_ELEMENT, uploadingElement };
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
        treeData,
    };
}

export const SEARCHED_ELEMENT = 'SEARCHED_ELEMENT';
export type SearchedElementAction = Readonly<Action<typeof SEARCHED_ELEMENT>> & {
    searchedElement: AppState['searchedElement'];
};

export function setSearchedElement(searchedElement: AppState['searchedElement']): SearchedElementAction {
    return {
        type: SEARCHED_ELEMENT,
        searchedElement,
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
