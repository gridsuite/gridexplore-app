/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UUID } from 'crypto';
import { ElementType } from '@gridsuite/commons-ui';

type UserProfile = {
    sub: string;
    name: string;
    email: string;
    s_hash: string;
};

interface IUser {
    id_token: string;
    access_token: string;
    token_type: string;
    scope: string;
    profile: UserProfile;
    expires_at: number;
}

export interface IElement {
    elementUuid: UUID;
    elementName: string;
    description: string;
    type: ElementType;
    accessRights: {
        isPrivate: boolean;
    };
    owner: string;
    subdirectoriesCount: number;
    creationDate: string;
    lastModificationDate: string;
    lastModifiedBy: string;
    children: any[];
    parentUuid: null | UUID;
    uploading?: boolean;
}

export interface IElementMetadata {
    elementUuid: UUID;
    elementName: string;
    specificMetadata: {
        type: string;
        equipmentType: string;
        format: string | null;
    };
}

export interface ITreeData {
    rootDirectories: IDirectory[];
    mapData: Record<string, IDirectory[]>;
}

export interface ReduxState {
    activeDirectory: UUID;
    currentChildren: IElement[];
    selectedDirectory: IElement;
    searchedElement: IElement;
    user: IUser;
    treeData: ITreeData;
}
