/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_NAME, getAppName } from './config-params';
import { store } from '../redux/store';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { ScriptTypes } from './script-types';
import { EquipmentTypes } from './equipment-types';

let PREFIX_CONFIG_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/config-notification';
let PREFIX_CONFIG_QUERIES = process.env.REACT_APP_API_GATEWAY + '/config';
let PREFIX_DIRECTORY_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/directory';
let PREFIX_EXPLORE_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/explore';
const PREFIX_STUDY_QUERIES = process.env.REACT_APP_API_GATEWAY + '/study';
const PREFIX_ACTIONS_QUERIES = process.env.REACT_APP_API_GATEWAY + '/actions';
const PREFIX_CASE_QUERIES = process.env.REACT_APP_API_GATEWAY + '/case';
const PREFIX_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/directory-notification';
const PREFIX_FILTERS_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/filter/v1/filters';

function getToken() {
    const state = store.getState();
    return state.user.id_token;
}

export function connectNotificationsWsUpdateConfig() {
    const webSocketBaseUrl = document.baseURI
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
    const webSocketUrl =
        webSocketBaseUrl +
        PREFIX_CONFIG_NOTIFICATION_WS +
        '/notify?appName=' +
        APP_NAME;

    let webSocketUrlWithToken;
    webSocketUrlWithToken = webSocketUrl + '&access_token=' + getToken();

    const reconnectingWebSocket = new ReconnectingWebSocket(
        webSocketUrlWithToken
    );
    reconnectingWebSocket.onopen = function (event) {
        console.info(
            'Connected Websocket update config ui ' + webSocketUrl + ' ...'
        );
    };
    return reconnectingWebSocket;
}

function backendFetch(url, init) {
    if (!(typeof init == 'undefined' || typeof init == 'object')) {
        throw new TypeError(
            'Argument 2 of backendFetch is not an object' + typeof init
        );
    }
    const initCopy = Object.assign({}, init);
    initCopy.headers = new Headers(initCopy.headers || {});
    initCopy.headers.append('Authorization', 'Bearer ' + getToken());
    return fetch(url, initCopy);
}

export function fetchAppsAndUrls() {
    console.info(`Fetching apps and urls...`);
    return fetch('env.json')
        .then((res) => res.json())
        .then((res) => {
            return fetch(
                res.appsMetadataServerUrl + '/apps-metadata.json'
            ).then((response) => {
                return response.json();
            });
        });
}

export function fetchConfigParameters(appName) {
    console.info('Fetching UI configuration params for app : ' + appName);
    const fetchParams =
        PREFIX_CONFIG_QUERIES + `/v1/applications/${appName}/parameters`;
    return backendFetch(fetchParams).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function fetchConfigParameter(name) {
    const appName = getAppName(name);
    console.info(
        "Fetching UI config parameter '%s' for app '%s' ",
        name,
        appName
    );
    const fetchParams =
        PREFIX_CONFIG_QUERIES +
        `/v1/applications/${appName}/parameters/${name}`;
    return backendFetch(fetchParams).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function fetchDirectoryContent(directoryUuid) {
    console.info("Fetching Folder content '%s'", directoryUuid);
    const fetchDirectoryContentUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/content`;
    return backendFetch(fetchDirectoryContentUrl).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function deleteElement(elementUuid) {
    console.info("Deleting element %s'", elementUuid);
    const fetchParams =
        PREFIX_EXPLORE_SERVER_QUERIES + `/v1/directories/${elementUuid}`;
    return backendFetch(fetchParams, {
        method: 'delete',
    });
}

export function updateAccessRights(elementUuid, isPrivate) {
    console.info(
        'Updating access rights for ' +
            elementUuid +
            ' to isPrivate = ' +
            isPrivate
    );
    const updateAccessRightUrl =
        PREFIX_EXPLORE_SERVER_QUERIES + `/v1/directories/${elementUuid}/rights`;
    return backendFetch(updateAccessRightUrl, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: isPrivate === 'true',
    });
}

export function insertDirectory(directoryName, parentUuid, isPrivate, owner) {
    console.info("Inserting a new folder '%s'", directoryName);
    const insertDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/directories/` + parentUuid;

    return backendFetch(insertDirectoryUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            elementUuid: null,
            elementName: directoryName,
            type: 'DIRECTORY',
            accessRights: { private: isPrivate },
            owner: owner,
        }),
    }).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function insertRootDirectory(directoryName, isPrivate, owner) {
    console.info("Inserting a new root folder '%s'", directoryName);
    const insertRootDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/root-directories/`;

    return backendFetch(insertRootDirectoryUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            elementName: directoryName,
            accessRights: { private: isPrivate },
            owner: owner,
        }),
    }).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function getAvailableExportFormats() {
    console.info('get export formats');
    const getExportFormatsUrl =
        PREFIX_STUDY_QUERIES + '/v1/export-network-formats';
    console.debug(getExportFormatsUrl);
    return backendFetch(getExportFormatsUrl, {
        method: 'get',
    }).then((response) => response.json());
}

function getUrlWithToken(baseUrl) {
    return baseUrl + '?access_token=' + getToken();
}

function getStudyUrl(studyUuid) {
    return (
        PREFIX_STUDY_QUERIES + '/v1/studies/' + encodeURIComponent(studyUuid)
    );
}

export function getExportUrl(studyUuid, exportFormat) {
    const url = getStudyUrl(studyUuid) + '/export-network/' + exportFormat;
    return getUrlWithToken(url);
}

export function renameElement(studyUuid, newStudyName) {
    console.info('Renaming study ' + studyUuid);
    const renameElementUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${studyUuid}/rename/${newStudyName}`;

    console.debug(renameElementUrl);
    return backendFetch(renameElementUrl, {
        method: 'PUT',
    });
}

export function fetchRootFolders() {
    console.info('Fetching Root Directories');
    const fetchRootFoldersUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/root-directories`;
    return backendFetch(fetchRootFoldersUrl).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function updateConfigParameter(name, value) {
    const appName = getAppName(name);
    console.info(
        "Updating config parameter '%s=%s' for app '%s' ",
        name,
        value,
        appName
    );
    const updateParams =
        PREFIX_CONFIG_QUERIES +
        `/v1/applications/${appName}/parameters/${name}?value=` +
        encodeURIComponent(value);
    return backendFetch(updateParams, { method: 'put' }).then((response) =>
        response.ok
            ? response
            : response.text().then((text) => Promise.reject(text))
    );
}

function getElementsIdsListsQueryParams(ids) {
    if (ids !== undefined && ids.length > 0) {
        const urlSearchParams = new URLSearchParams();
        ids.forEach((id) => urlSearchParams.append('id', id));
        return '?' + urlSearchParams.toString();
    }
    return '';
}

export function fetchElementsInfos(ids) {
    console.info('Fetching elements metadata ... ');
    const fetchElementsInfosUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        '/v1/directories/elements' +
        getElementsIdsListsQueryParams(ids);
    return backendFetch(fetchElementsInfosUrl, {
        method: 'GET',
    }).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function createStudy(
    caseExist,
    studyName,
    studyDescription,
    caseName,
    selectedFile,
    isPrivateStudy,
    parentDirectoryUuid
) {
    console.info('Creating a new study...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', studyDescription);
    urlSearchParams.append('isPrivate', isPrivateStudy);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    if (caseExist) {
        const createStudyWithExistingCaseUrl =
            PREFIX_EXPLORE_SERVER_QUERIES +
            '/v1/directories/studies/' +
            encodeURIComponent(studyName) +
            '/cases/' +
            encodeURIComponent(caseName) +
            '?' +
            urlSearchParams.toString();
        console.debug(createStudyWithExistingCaseUrl);
        return backendFetch(createStudyWithExistingCaseUrl, {
            method: 'post',
        });
    } else {
        const createStudyWithNewCaseUrl =
            PREFIX_EXPLORE_SERVER_QUERIES +
            '/v1/directories/studies/' +
            encodeURIComponent(studyName) +
            '?' +
            urlSearchParams.toString();
        const formData = new FormData();
        formData.append('caseFile', selectedFile);
        console.debug(createStudyWithNewCaseUrl);

        return backendFetch(createStudyWithNewCaseUrl, {
            method: 'post',
            body: formData,
        });
    }
}

export function fetchCases() {
    console.info('Fetching cases...');
    const fetchCasesUrl = PREFIX_CASE_QUERIES + '/v1/cases';
    console.debug(fetchCasesUrl);
    return backendFetch(fetchCasesUrl).then((response) => response.json());
}

function getStudyUrlByStudyNameAndUserId(studyName, userId) {
    return (
        PREFIX_STUDY_QUERIES +
        '/v1/' +
        encodeURIComponent(userId) +
        '/studies/' +
        encodeURIComponent(studyName)
    );
}

export function studyExists(studyName, userId) {
    // current implementation prevent having two studies with the same name and the same user
    // later we will prevent same studyName and userId in the same directory
    const studyExistsUrl =
        getStudyUrlByStudyNameAndUserId(studyName, userId) + '/exists';
    console.debug(studyExistsUrl);
    return backendFetch(studyExistsUrl, { method: 'get' }).then((response) => {
        return response.json();
    });
}

export function createContingencyList(
    contingencyListType,
    contingencyListName,
    contingencyListDescription,
    isPrivateContingencyList,
    parentDirectoryUuid
) {
    console.info('Creating a new contingency list...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('isPrivate', isPrivateContingencyList);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const typeUriParam =
        contingencyListType === ScriptTypes.SCRIPT
            ? 'script-contingency-lists'
            : 'filters-contingency-lists';

    const createContingencyListUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/directories/' +
        typeUriParam +
        '/' +
        encodeURIComponent(contingencyListName) +
        '?' +
        urlSearchParams.toString();
    console.debug(createContingencyListUrl);

    let body = {
        name: contingencyListName,
        description: contingencyListDescription,
    };
    if (contingencyListType === ScriptTypes.FILTERS) {
        body.equipmentType = EquipmentTypes.LINE;
        body.nominalVoltage = -1;
        body.nominalVoltageOperator = '=';
        body.equipmentID = '*';
        body.equipmentName = '*';
    }
    return backendFetch(createContingencyListUrl, {
        method: 'post',
        body: JSON.stringify(body),
    });
}

/**
 * Get contingency list by type and id
 * @returns {Promise<Response>}
 */
export function getContingencyList(type, id) {
    let url = PREFIX_ACTIONS_QUERIES;
    if (type === 'SCRIPT') {
        url += '/v1/script-contingency-lists/';
    } else {
        url += '/v1/filters-contingency-lists/';
    }
    url += id;

    return backendFetch(url).then((response) => response.json());
}

/**
 * Add new Filter contingency list
 * @returns {Promise<Response>}
 */
export function saveFiltersContingencyList(filter) {
    const { nominalVoltage, ...rest } = filter;
    const url =
        PREFIX_ACTIONS_QUERIES + '/v1/filters-contingency-lists/' + filter.id;
    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...rest,
            nominalVoltage: nominalVoltage === '' ? -1 : nominalVoltage,
        }),
    });
}

/**
 * Add new contingency list
 * @returns {Promise<Response>}
 */
export function saveScriptContingencyList(scriptContingencyList) {
    const url =
        PREFIX_ACTIONS_QUERIES +
        '/v1/script-contingency-lists/' +
        scriptContingencyList.id;
    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptContingencyList),
    });
}

/**
 * Replace filter with script filter
 * @returns {Promise<Response>}
 */
export function replaceFiltersWithScriptContingencyList(
    id,
    parentDirectoryUuid
) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/directories/filters-contingency-lists/' +
        encodeURIComponent(id) +
        '/replace-with-script' +
        '?' +
        urlSearchParams.toString();

    return backendFetch(url, {
        method: 'post',
    });
}

/**
 * Save new script contingency list from filters contingency list
 * @returns {Promise<Response>}
 */
export function newScriptFromFiltersContingencyList(
    id,
    newName,
    parentDirectoryUuid
) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/directories/filters-contingency-lists/' +
        encodeURIComponent(id) +
        '/new-script/' +
        encodeURIComponent(newName) +
        '?' +
        urlSearchParams.toString();

    return backendFetch(url, {
        method: 'post',
    });
}

/**
 * Function will be called to connect with notification websocket to update the studies list
 * @returns {ReconnectingWebSocket}
 */
export function connectNotificationsWsUpdateStudies() {
    const webSocketBaseUrl = document.baseURI
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
    const webSocketUrl =
        webSocketBaseUrl +
        PREFIX_NOTIFICATION_WS +
        '/notify?updateType=directories';

    let webSocketUrlWithToken;
    webSocketUrlWithToken = webSocketUrl + '&access_token=' + getToken();

    const reconnectingWebSocket = new ReconnectingWebSocket(
        webSocketUrlWithToken
    );
    reconnectingWebSocket.onopen = function (event) {
        console.info(
            'Connected Websocket update studies ' + webSocketUrl + ' ...'
        );
    };
    return reconnectingWebSocket;
}

/**
 * Create Filter
 * @returns {Promise<Response>}
 */
export function createFilter(newFilter, name, isPrivate, parentDirectoryUuid) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('isPrivate', isPrivate);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    return backendFetch(
        PREFIX_EXPLORE_SERVER_QUERIES +
            '/v1/directories/filters?' +
            urlSearchParams.toString(),
        {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFilter),
        }
    );
}

/**
 * Get all filters (name & type)
 * @returns {Promise<Response>}
 */
export function getFilters() {
    return backendFetch(PREFIX_FILTERS_QUERIES)
        .then((response) => response.json())
        .then((res) => res.sort((a, b) => a.name.localeCompare(b.name)));
}

/**
 * Get filter by id
 * @returns {Promise<Response>}
 */
export function getFilterById(id) {
    const url = PREFIX_FILTERS_QUERIES + '/' + id;
    return backendFetch(url).then((response) => response.json());
}

/**
 * Replace filter with script filter
 * @returns {Promise<Response>}
 */
export function replaceFiltersWithScript(id, parentDirectoryUuid) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/directories/filters/' +
        encodeURIComponent(id) +
        '/replace-with-script' +
        '?' +
        urlSearchParams.toString();

    return backendFetch(url, {
        method: 'post',
    });
}

/**
 * Save new script from filters
 * @returns {Promise<Response>}
 */
export function newScriptFromFilter(id, newName, parentDirectoryUuid) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/directories/filters/' +
        encodeURIComponent(id) +
        '/new-script/' +
        encodeURIComponent(newName) +
        '?' +
        urlSearchParams.toString();

    return backendFetch(url, {
        method: 'post',
    });
}

/**
 * Save Filter
 */
export function saveFilter(filter) {
    return backendFetch(PREFIX_FILTERS_QUERIES + '/' + filter.id, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter),
    });
}
