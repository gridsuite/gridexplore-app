/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ElementType } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';

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
    type: ElementType;
    owner: string;
    subdirectoriesCount: number;
    creationDate: string;
    lastModificationDate: string;
    lastModifiedBy: string;
    children: any[];
    parentUuid: null | UUID;
}

// IDirectory is exactly an IElement, with a specific type value
export type IDirectory = IElement & {
    type: ElementType.DIRECTORY;
};

export interface ITreeData {
    rootDirectories: IDirectory[];
    mapData: Record<string, IDirectory>;
}

export interface ReduxState {
    activeDirectory: UUID;
    selectedDirectory: IDirectory;
    treeData: ITreeData;
    user: IUser;
}
