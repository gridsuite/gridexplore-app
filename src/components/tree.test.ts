/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { updatedTree } from './tree-views-container';
import { ElementType } from '@gridsuite/commons-ui';

test('boot1', () => {
    let res = updatedTree([], {}, null, [
        {
            elementUuid: '123e4567-e89b-12d3-a456-426614174000',
            elementName: 'aName',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
    ]);
    expect(res.length).toBe(2);
    expect(res[0].length).toBe(1);
});

test('boot2', () => {
    let res1 = updatedTree([], {}, null, [
        {
            elementUuid: '123e4567-e89b-12d3-a456-426614174000',
            elementName: 'b name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
        {
            elementUuid: '223e4567-e89b-12d3-a456-426614174000',
            elementName: 'c name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
        {
            elementUuid: '323e4567-e89b-12d3-a456-426614174000',
            elementName: 'a1 name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
        {
            elementUuid: '423e4567-e89b-12d3-a456-426614174000',
            elementName: 'd name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
    ]);
    expect(res1[0].length).toBe(4);
    expect(res1[0][0].elementUuid).toBe('323e4567-e89b-12d3-a456-426614174000');
    expect(res1[1].b1.elementName).toBe('b name');
    expect(res1[1].b1.parentUuid).toBe(null);

    let res2 = updatedTree(res1[0], res1[1], '123e4567-e89b-12d3-a456-426614174000', [
        {
            elementUuid: '523e4567-e89b-12d3-a456-426614174000',
            elementName: 'b2 name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
    ]);

    expect(res2[0].length).toBe(4);
    expect(res2[0][1].elementUuid).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(res2[0][1].children.length).toBe(1);
    expect(res2[0][1].children[0].elementUuid).toBe('523e4567-e89b-12d3-a456-426614174000');
    expect(res2[1].b1.children.length).toBe(1);
    expect(Object.keys(res2[1]).length).toBe(5);
    expect(res2[1].b1.children[0].parentUuid).toBe('123e4567-e89b-12d3-a456-426614174000');

    let res3 = updatedTree(res2[0], res2[1], '523e4567-e89b-12d3-a456-426614174000', [
        {
            elementUuid: '623e4567-e89b-12d3-a456-426614174000',
            elementName: 'b3 name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
    ]);
    expect(res3[0].length).toBe(4);
    expect(res3[0][1].elementUuid).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(res3[0][1].children.length).toBe(1);
    expect(res3[0][1].children[0].elementUuid).toBe('523e4567-e89b-12d3-a456-426614174000');
    expect(res3[0][1].children[0].children[0].elementUuid).toBe('623e4567-e89b-12d3-a456-426614174000');
    expect(res3[1].b2.children.length).toBe(1);
    expect(Object.keys(res3[1]).length).toBe(6);
    expect(res3[1].b2.children[0].parentUuid).toBe('523e4567-e89b-12d3-a456-426614174000');

    let res1_1 = updatedTree(res3[0], res3[1], '323e4567-e89b-12d3-a456-426614174000', [
        {
            elementUuid: '723e4567-e89b-12d3-a456-426614174000',
            elementName: 'a2 name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
    ]);

    let res4 = updatedTree(res1_1[0], res1_1[1], null, [
        {
            elementUuid: '823e4567-e89b-12d3-a456-426614174000',
            elementName: 'e name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
        {
            elementUuid: '323e4567-e89b-12d3-a456-426614174000',
            elementName: 'a1 name',
            description: 'desc',
            type: ElementType.DIRECTORY,
            accessRights: {
                isPrivate: true,
            },
            owner: 'user1',
            subdirectoriesCount: 0,
            creationDate: '',
            lastModificationDate: '',
            lastModifiedBy: 'user1',
            children: [],
            parentUuid: null,
            specificMetadata: {},
        },
    ]);
    expect(res4[0].length).toBe(2);
    expect(Object.keys(res4[1]).length).toBe(3);
});
