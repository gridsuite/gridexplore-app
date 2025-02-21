/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementType } from '@gridsuite/commons-ui';
import { updatedTree } from './treeview-utils';

const otherProperties = {
    description: 'desc',
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
    specificMetadata: {
        type: '',
        equipmentType: '',
    },
};

test('boot1', () => {
    const res = updatedTree([], {}, null, [
        {
            elementUuid: '123e4567-e89b-12d3-a456-426614174000',
            elementName: 'aName',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
    ]);
    expect(res.length).toBe(2);
    expect(res[0].length).toBe(1);
});

test('boot2', () => {
    const res1 = updatedTree([], {}, null, [
        {
            elementUuid: '123e4567-e89b-12d3-a456-426614174000',
            elementName: 'b name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
        {
            elementUuid: '223e4567-e89b-12d3-a456-426614174000',
            elementName: 'c name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
        {
            elementUuid: '323e4567-e89b-12d3-a456-426614174000',
            elementName: 'a1 name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
        {
            elementUuid: '423e4567-e89b-12d3-a456-426614174000',
            elementName: 'd name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
    ]);
    expect(res1[0].length).toBe(4);
    expect(res1[0][0].elementUuid).toBe('323e4567-e89b-12d3-a456-426614174000');
    expect(res1[0][1].elementName).toBe('b name');
    expect(res1[0][1].parentUuid).toBe(null);

    const res2 = updatedTree(res1[0], res1[1], '123e4567-e89b-12d3-a456-426614174000', [
        {
            elementUuid: '523e4567-e89b-12d3-a456-426614174000',
            elementName: 'b2 name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
    ]);

    expect(res2[0].length).toBe(4);
    expect(res2[0][1].elementUuid).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(res2[0][1].children.length).toBe(1);
    expect(res2[0][1].children[0].elementUuid).toBe('523e4567-e89b-12d3-a456-426614174000');
    expect(res2[0][1].children.length).toBe(1);
    expect(Object.keys(res2[1]).length).toBe(5);
    expect(res2[0][1].children[0].parentUuid).toBe('123e4567-e89b-12d3-a456-426614174000');

    const res3 = updatedTree(res2[0], res2[1], '523e4567-e89b-12d3-a456-426614174000', [
        {
            elementUuid: '623e4567-e89b-12d3-a456-426614174000',
            elementName: 'b3 name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
    ]);
    expect(res3[0].length).toBe(4);
    expect(res3[0][1].elementUuid).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(res3[0][1].children.length).toBe(1);
    expect(res3[0][1].children[0].elementUuid).toBe('523e4567-e89b-12d3-a456-426614174000');
    expect(res3[0][1].children[0].children[0].elementUuid).toBe('623e4567-e89b-12d3-a456-426614174000');
    expect(res3[0][1].children[0].children[0].parentUuid).toBe('523e4567-e89b-12d3-a456-426614174000');

    const res1bis = updatedTree(res3[0], res3[1], '323e4567-e89b-12d3-a456-426614174000', [
        {
            elementUuid: '723e4567-e89b-12d3-a456-426614174000',
            elementName: 'a2 name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
    ]);

    const res4 = updatedTree(res1bis[0], res1bis[1], null, [
        {
            elementUuid: '823e4567-e89b-12d3-a456-426614174000',
            elementName: 'e name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
        {
            elementUuid: '323e4567-e89b-12d3-a456-426614174000',
            elementName: 'a1 name',
            type: ElementType.DIRECTORY,
            ...otherProperties,
        },
    ]);
    expect(res4[0].length).toBe(2);
    expect(Object.keys(res4[1]).length).toBe(3);
});
