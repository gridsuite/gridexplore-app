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
    saveLocalStorageLanguage,
    saveLocalStorageTheme,
} from './local-storage';

import {
    ACTIVE_DIRECTORY,
    ActiveDirectoryAction,
    ADD_UPLOADING_ELEMENT,
    AddUploadingElementAction,
    AppActions,
    ComputedLanguageAction,
    CURRENT_CHILDREN,
    CURRENT_PATH,
    CurrentChildrenAction,
    CurrentPathAction,
    DIRECTORY_UPDATED,
    DirectoryUpdatedAction,
    LanguageAction,
    REORDERED_COLUMNS,
    ReorderedColumnsAction,
    SEARCHED_ELEMENT,
    SearchedElementAction,
    SELECT_COMPUTED_LANGUAGE,
    SELECT_DIRECTORY,
    SELECT_LANGUAGE,
    SELECT_THEME,
    SelectDirectoryAction,
    SELECTION_FOR_COPY,
    SelectionForCopyAction,
    SET_APPS_AND_URLS,
    SetAppsAndUrlsAction,
    SET_UPLOADING_ELEMENTS,
    SetUploadingElementsAction,
    ThemeAction,
    TREE_DATA,
    TreeDataAction,
    REMOVE_UPLOADING_ELEMENT,
    RemoveUploadingElementAction,
} from './actions';

import {
    AuthenticationActions,
    AuthenticationRouterErrorAction,
    AuthenticationRouterErrorState,
    Metadata,
    CommonStoreState,
    ElementAttributes,
    ElementType,
    GsLang,
    GsLangUser,
    GsTheme,
    LOGOUT_ERROR,
    LogoutErrorAction,
    RESET_AUTHENTICATION_ROUTER_ERROR,
    SHOW_AUTH_INFO_LOGIN,
    ShowAuthenticationRouterLoginAction,
    SIGNIN_CALLBACK_ERROR,
    SignInCallbackErrorAction,
    UNAUTHORIZED_USER_INFO,
    UnauthorizedUserAction,
    USER,
    USER_VALIDATION_ERROR,
    UserAction,
    UserValidationErrorAction,
} from '@gridsuite/commons-ui';
import { PARAM_LANGUAGE, PARAM_THEME } from '../utils/config-params';
import { UUID } from 'crypto';
import { SelectionForCopy } from '@gridsuite/commons-ui/dist/components/filter/filter.type';

// IDirectory is exactly an IElement, with a specific type value
export type IDirectory = ElementAttributes & {
    type: ElementType.DIRECTORY;
};

export interface ElementAttributesES {
    id: UUID;
    name: string;
    parentId: UUID;
    type: ElementType;
    owner: string;
    subdirectoriesCount: number;
    lastModificationDate: string;
    pathName: string[];
    pathUuid: UUID[];
}

export interface ITreeData {
    rootDirectories: IDirectory[];
    mapData: Record<string, IDirectory>;
    initialized: boolean;
}

export type UploadingElement = {
    id: number;
    elementName: string;
    directory?: UUID;
    type: ElementType;
    owner?: string;
    lastModifiedBy?: string;
    uploading: boolean;
    caseFormat?: string;
};

export interface AppState extends CommonStoreState {
    [PARAM_THEME]: GsTheme;
    [PARAM_LANGUAGE]: GsLang;
    computedLanguage: GsLangUser;

    //userManager: UserManagerState;
    signInCallbackError: Error | null;
    authenticationRouterError: AuthenticationRouterErrorState | null;
    showAuthenticationRouterLogin: boolean;

    appsAndUrls: Metadata[];
    activeDirectory?: UUID;
    currentChildren?: ElementAttributes[];
    selectedDirectory: ElementAttributes | null;
    searchedElement: ElementAttributesES | null;
    treeData: ITreeData;
    currentPath: any[];
    selectedFile: unknown | null;
    uploadingElements: Record<string, UploadingElement>;
    directoryUpdated: { force: number; eventData: Record<string, Record<string, unknown>> };
    selectionForCopy: SelectionForCopy;
    reorderedColumns: string[];
}

const initialState: AppState = {
    // authentication
    user: null,
    signInCallbackError: null,
    authenticationRouterError: null,
    showAuthenticationRouterLogin: false,

    // params
    computedLanguage: getLocalStorageComputedLanguage(),
    [PARAM_THEME]: getLocalStorageTheme(),
    [PARAM_LANGUAGE]: getLocalStorageLanguage(),

    currentChildren: undefined,
    selectedDirectory: null,
    activeDirectory: undefined,
    searchedElement: null,
    currentPath: [],
    appsAndUrls: [],
    selectedFile: null,
    uploadingElements: {},
    directoryUpdated: { force: 0, eventData: {} },
    treeData: { mapData: {}, rootDirectories: [], initialized: false },
    selectionForCopy: {
        sourceItemUuid: null,
        typeItem: null,
        nameItem: null,
        descriptionItem: null,
        parentDirectoryUuid: null,
        specificTypeItem: null,
    },
    reorderedColumns: [],
};

export type Actions = AuthenticationActions | AppActions;

export type ArrayFilter<V> = (value: V, index: number, array: V[]) => boolean;
function filterFromObject<K extends string | number | symbol, V>(
    objectToFilter: Record<K, V>,
    filterMethod: ArrayFilter<[K, V]>
) {
    return Object.fromEntries((Object.entries(objectToFilter) as Array<[K, V]>).filter(filterMethod)) as Record<K, V>;
}

export const reducer = createReducer(initialState, (builder) => {
    builder.addCase(SELECT_THEME, (state, action: ThemeAction) => {
        state.theme = action.theme;
        saveLocalStorageTheme(state.theme);
    });

    builder.addCase(SELECT_LANGUAGE, (state, action: LanguageAction) => {
        state.language = action.language;
        saveLocalStorageLanguage(state.language);
    });

    builder.addCase(USER, (state, action: UserAction) => {
        state.user = action.user;
    });

    builder.addCase(SIGNIN_CALLBACK_ERROR, (state, action: SignInCallbackErrorAction) => {
        state.signInCallbackError = action.signInCallbackError;
    });

    builder.addCase(SELECT_COMPUTED_LANGUAGE, (state, action: ComputedLanguageAction) => {
        state.computedLanguage = action.computedLanguage;
    });

    builder.addCase(UNAUTHORIZED_USER_INFO, (state, action: UnauthorizedUserAction) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(LOGOUT_ERROR, (state, action: LogoutErrorAction) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(USER_VALIDATION_ERROR, (state, action: UserValidationErrorAction) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(RESET_AUTHENTICATION_ROUTER_ERROR, (state, action: AuthenticationRouterErrorAction) => {
        state.authenticationRouterError = null;
    });

    builder.addCase(SHOW_AUTH_INFO_LOGIN, (state, action: ShowAuthenticationRouterLoginAction) => {
        state.showAuthenticationRouterLogin = action.showAuthenticationRouterLogin;
    });

    builder.addCase(CURRENT_CHILDREN, (state, action: CurrentChildrenAction) => {
        state.currentChildren = action.currentChildren;
    });

    builder.addCase(SELECT_DIRECTORY, (state, action: SelectDirectoryAction) => {
        state.selectedDirectory = action.selectedDirectory ? { ...action.selectedDirectory } : null;
    });

    builder.addCase(ACTIVE_DIRECTORY, (state, action: ActiveDirectoryAction) => {
        state.activeDirectory = action.activeDirectory;
    });

    builder.addCase(SEARCHED_ELEMENT, (state, action: SearchedElementAction) => {
        state.searchedElement = action.searchedElement;
    });

    builder.addCase(CURRENT_PATH, (state, action: CurrentPathAction) => {
        state.currentPath = action.currentPath;
    });

    builder.addCase(SET_APPS_AND_URLS, (state, action: SetAppsAndUrlsAction) => {
        // @ts-expect-error: "WritableDraft<AppMetadataCommon>[]" not correctly inferred
        state.appsAndUrls = action.appsAndUrls;
    });

    builder.addCase(ADD_UPLOADING_ELEMENT, (state, action: AddUploadingElementAction) => {
        state.uploadingElements = {
            ...state.uploadingElements,
            ...{ [action.uploadingElement.id]: action.uploadingElement },
        };
    });

    builder.addCase(SET_UPLOADING_ELEMENTS, (state, action: SetUploadingElementsAction) => {
        state.uploadingElements = action.uploadingElements;
    });

    builder.addCase(REMOVE_UPLOADING_ELEMENT, (state, action: RemoveUploadingElementAction) => {
        delete state.uploadingElements[action.uploadingElement.id];
    });

    builder.addCase(DIRECTORY_UPDATED, (state, action: DirectoryUpdatedAction) => {
        state.directoryUpdated = {
            force: 1 - state.directoryUpdated.force,
            eventData: action.eventData,
        };
    });

    builder.addCase(TREE_DATA, (state, action: TreeDataAction) => {
        //TODO: remove those filters below when this file has been migrated to Typescript
        // it's only here to prevent regressions due to javascript not checking types

        // filtering non DIRECTORY elements from action.treeData
        // used to prevent non DIRECTORY elements from appearing in left menu
        const filteredTreeDataRootDirectories = action.treeData.rootDirectories.filter(
            (element) => element.type === ElementType.DIRECTORY
        );

        // action.treeData.mapData is an object looking like this : {<elementId1>: <element1>, <elementId2>: <element2>}
        // Object.entries changes it to an array looking like [[elementId1, element1], [elementId2, element2]], in order to make it easier to filter
        // Object.fromEntries will turn [[elementId1, element1], [elementId2, element2]] back to {<elementId1>: <element1>, <elementId2>: <element2>} which is the initial form
        const filteredTreeDataMapData = filterFromObject(
            action.treeData.mapData,
            ([elementId, element]) => element.type === ElementType.DIRECTORY
        );

        state.treeData = {
            ...action.treeData,
            rootDirectories: filteredTreeDataRootDirectories,
            mapData: filteredTreeDataMapData,
        };

        // we must override selectedDirectory elementName because it could be the one to have changed
        // if it's the deleted one then it's not in filteredTreeDataMapData anymore then check
        if (state.selectedDirectory && filteredTreeDataMapData[state.selectedDirectory?.elementUuid]) {
            state.selectedDirectory.elementName =
                filteredTreeDataMapData[state.selectedDirectory?.elementUuid].elementName;
        }
    });

    builder.addCase(SELECTION_FOR_COPY, (state, action: SelectionForCopyAction) => {
        state.selectionForCopy = action.selectionForCopy;
    });

    builder.addCase(REORDERED_COLUMNS, (state, action: ReorderedColumnsAction) => {
        state.reorderedColumns = action.reorderedColumns;
    });
});
