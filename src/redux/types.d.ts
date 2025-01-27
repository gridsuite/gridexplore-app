/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// IDirectory is exactly an IElement, with a specific type value
import { UUID } from 'crypto';
import {
    AuthenticationRouterErrorState,
    CommonStoreState,
    ElementAttributes,
    ElementType,
    GsLang,
    GsLangUser,
    GsTheme,
    type ItemSelectionForCopy,
    Metadata,
} from '@gridsuite/commons-ui';
import { PARAM_LANGUAGE, PARAM_THEME } from '../utils/config-params';

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
    enableDeveloperMode: boolean;
    computedLanguage: GsLangUser;

    // userManager: UserManagerState;
    signInCallbackError: Error | null;
    authenticationRouterError: AuthenticationRouterErrorState | null;
    showAuthenticationRouterLogin: boolean;

    appsAndUrls: Metadata[];
    activeDirectory?: UUID;
    currentChildren?: ElementAttributes[];
    selectedDirectory: ElementAttributes | null;
    searchedElement: ElementAttributesES | null;
    treeData: ITreeData;
    currentPath: ElementAttributes[];
    selectedFile: unknown | null;
    uploadingElements: Record<string, UploadingElement>;
    directoryUpdated: { force: number; eventData: Record<string, Record<string, unknown>> };
    itemSelectionForCopy: ItemSelectionForCopy;
    reorderedColumns: string[];
}
