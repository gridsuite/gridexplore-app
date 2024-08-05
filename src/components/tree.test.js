/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { updatedTree } from './tree-views-container';

test('boot1', () => {
    let res = updatedTree([], {}, null, [{ elementUuid: 'aId', elementName: 'aName' }]);
    expect(res.length).toBe(2);
    expect(res[0].length).toBe(1);
});

test('boot2', () => {
    let res1 = updatedTree([], {}, null, [
        { elementUuid: 'b1', elementName: 'b name' },
        { elementUuid: 'c', elementName: 'c name' },
        { elementUuid: 'a1', elementName: 'a1 name' },
        { elementUuid: 'd', elementName: 'd name' },
    ]);
    expect(res1[0].length).toBe(4);
    expect(res1[0][0].elementUuid).toBe('a1');
    expect(res1[1].b1.elementName).toBe('b name');
    expect(res1[1].b1.parentUuid).toBe(null);

    let res2 = updatedTree(res1[0], res1[1], 'b1', [{ elementUuid: 'b2', elementName: 'b2 name' }]);
    expect(res2[0].length).toBe(4);
    expect(res2[0][1].elementUuid).toBe('b1');
    expect(res2[0][1].children.length).toBe(1);
    expect(res2[0][1].children[0].elementUuid).toBe('b2');
    expect(res2[1].b1.children.length).toBe(1);
    expect(Object.keys(res2[1]).length).toBe(5);
    expect(res2[1].b1.children[0].parentUuid).toBe('b1');

    let res3 = updatedTree(res2[0], res2[1], 'b2', [{ elementUuid: 'b3', elementName: 'b3 name' }]);
    expect(res3[0].length).toBe(4);
    expect(res3[0][1].elementUuid).toBe('b1');
    expect(res3[0][1].children.length).toBe(1);
    expect(res3[0][1].children[0].elementUuid).toBe('b2');
    expect(res3[0][1].children[0].children[0].elementUuid).toBe('b3');
    expect(res3[1].b2.children.length).toBe(1);
    expect(Object.keys(res3[1]).length).toBe(6);
    expect(res3[1].b2.children[0].parentUuid).toBe('b2');

    let res1_1 = updatedTree(res3[0], res3[1], 'a1', [{ elementUuid: 'a2', elementName: 'a2 name' }]);

    let res4 = updatedTree(res1_1[0], res1_1[1], null, [
        { elementUuid: 'e', elementName: 'e name' },
        { elementUuid: 'a1', elementName: 'a1 name' },
    ]);
    expect(res4[0].length).toBe(2);
    expect(Object.keys(res4[1]).length).toBe(3);
});
