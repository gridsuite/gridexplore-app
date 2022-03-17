import { updatedTree } from './tree-views-container';

test('boot1', () => {
    let res = updatedTree([], {}, null, [
        { elementUuid: 'aId', elementName: 'aName', accessRights: 'user' },
    ]);
    expect(res.length).toBe(2);
    expect(res[0].length).toBe(1);
});

test('boot2', () => {
    let res1 = updatedTree([], {}, null, [
        { elementUuid: 'b1', elementName: 'b name', accessRights: 'user' },
        { elementUuid: 'c', elementName: 'c name', accessRights: 'user' },
        { elementUuid: 'a1', elementName: 'a1 name', accessRights: 'user' },
        { elementUuid: 'd', elementName: 'd name', accessRights: 'user' },
    ]);
    expect(res1[0].length).toBe(4);
    expect(res1[0][0].elementUuid).toBe('a1');
    expect(res1[1].b1.elementName).toBe('b name');
    expect(res1[1].b1.parentUuid).toBe(null);

    let res2 = updatedTree(res1[0], res1[1], 'b1', [
        { elementUuid: 'b2', elementName: 'b2 name', accessRights: 'user' },
    ]);
    expect(res2[0].length).toBe(4);
    expect(res2[0][1].elementUuid).toBe('b1');
    expect(res2[0][1].children.length).toBe(1);
    expect(res2[0][1].children[0].elementUuid).toBe('b2');
    expect(res2[1].b1.children.length).toBe(1);
    expect(Object.keys(res2[1]).length).toBe(5);
    expect(res2[1].b1.children[0].parentUuid).toBe('b1');

    let res3 = updatedTree(res2[0], res2[1], 'b2', [
        { elementUuid: 'b3', elementName: 'b3 name', accessRights: 'user' },
    ]);
    expect(res3[0].length).toBe(4);
    expect(res3[0][1].elementUuid).toBe('b1');
    expect(res3[0][1].children.length).toBe(1);
    expect(res3[0][1].children[0].elementUuid).toBe('b2');
    expect(res3[0][1].children[0].children[0].elementUuid).toBe('b3');
    expect(res3[1].b2.children.length).toBe(1);
    expect(Object.keys(res3[1]).length).toBe(6);
    expect(res3[1].b2.children[0].parentUuid).toBe('b2');

    let res1_1 = updatedTree(res3[0], res3[1], 'a1', [
        { elementUuid: 'a2', elementName: 'a2 name', accessRights: 'user' },
    ]);

    let res1_2 = updatedTree(res1_1[0], res1_1[1], 'a1', [
        { elementUuid: 'a2', elementName: 'a2 name', accessRights: 'user' },
    ]);

    let res1_3 = updatedTree(res1_1[0], res1_1[1], 'a1', [
        { elementUuid: 'a2', elementName: 'a2 nom', accessRights: 'user' },
    ]);

    let res4 = updatedTree(res1_1[0], res1_1[1], null, [
        { elementUuid: 'e', elementName: 'e name', accessRights: 'user' },
        { elementUuid: 'a1', elementName: 'a1 name', accessRights: 'user' },
    ]);
    expect(res4[0].length).toBe(2);
    expect(Object.keys(res4[1]).length).toBe(3);
});
