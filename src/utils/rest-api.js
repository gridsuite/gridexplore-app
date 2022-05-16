/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_NAME, getAppName } from './config-params';
import { store } from '../redux/store';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { EquipmentTypes } from './equipment-types';
import { ContingencyListType } from './elementType';

const PREFIX_CONFIG_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/config-notification';
const PREFIX_CONFIG_QUERIES = process.env.REACT_APP_API_GATEWAY + '/config';
const PREFIX_DIRECTORY_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/directory';
const PREFIX_EXPLORE_SERVER_QUERIES =
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
        `/v1/directories/${directoryUuid}/elements`;
    return backendFetch(fetchDirectoryContentUrl).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function deleteElement(elementUuid) {
    console.info("Deleting element %s'", elementUuid);
    const fetchParams =
        PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/${elementUuid}`;
    return backendFetch(fetchParams, {
        method: 'delete',
    });
}

export function moveElementToDirectory(elementUuid, directoryUuid) {
    console.info(
        'Moving element %s to directory %s',
        elementUuid,
        directoryUuid
    );
    const fetchParams =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/elements/${elementUuid}?newDirectory=${directoryUuid}`;
    return backendFetch(fetchParams, {
        method: 'PUT',
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
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/elements/${elementUuid}`;
    return backendFetch(updateAccessRightUrl, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            accessRights: { isPrivate: isPrivate },
        }),
    });
}

export function insertDirectory(directoryName, parentUuid, isPrivate, owner) {
    console.info("Inserting a new folder '%s'", directoryName);
    const insertDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${parentUuid}/elements`;
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
            accessRights: { isPrivate: isPrivate },
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
            accessRights: { isPrivate: isPrivate },
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

export function renameElement(elementUuid, newElementName) {
    console.info('Renaming element ' + elementUuid);
    const renameElementUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/elements/${elementUuid}`;
    console.debug(renameElementUrl);
    return backendFetch(renameElementUrl, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            elementName: newElementName,
        }),
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
        ids.forEach((id) => urlSearchParams.append('ids', id));
        return '?' + urlSearchParams.toString();
    }
    return '';
}

function handleJsonResponse(response) {
    return handleResponse(response, true);
}
function handleResponse(response, isJson) {
    return response.ok
        ? isJson
            ? response.json()
            : response
        : response
              .text()
              .then((text) =>
                  Promise.reject(text ? text : response.statusText)
              );
}

export function fetchElementsInfos(ids) {
    console.info('Fetching elements metadata ... ');
    const fetchElementsInfosUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/elements/metadata' +
        getElementsIdsListsQueryParams(ids);
    return backendFetch(fetchElementsInfosUrl, {
        method: 'GET',
    }).then((response) => handleJsonResponse(response));
}

export function createStudy(
    caseExist,
    studyName,
    studyDescription,
    caseName,
    selectedFile,
    parentDirectoryUuid
) {
    console.info('Creating a new study...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', studyDescription);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    if (caseExist) {
        const createStudyWithExistingCaseUrl =
            PREFIX_EXPLORE_SERVER_QUERIES +
            '/v1/explore/studies/' +
            encodeURIComponent(studyName) +
            '/cases/' +
            encodeURIComponent(caseName) +
            '?' +
            urlSearchParams.toString();
        console.debug(createStudyWithExistingCaseUrl);
        return backendFetch(createStudyWithExistingCaseUrl, {
            method: 'post',
        }).then((response) => handleResponse(response, false));
    } else {
        const createStudyWithNewCaseUrl =
            PREFIX_EXPLORE_SERVER_QUERIES +
            '/v1/explore/studies/' +
            encodeURIComponent(studyName) +
            '?' +
            urlSearchParams.toString();
        const formData = new FormData();
        formData.append('caseFile', selectedFile);
        console.debug(createStudyWithNewCaseUrl);

        return backendFetch(createStudyWithNewCaseUrl, {
            method: 'post',
            body: formData,
        }).then((response) => handleResponse(response, false));
    }
}

export function duplicateStudy(
    studyName,
    studyDescription,
    parentStudyUuid,
    parentDirectoryUuid
) {
    console.info('Creating a new study...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', parentStudyUuid);
    urlSearchParams.append('studyName', studyName);
    urlSearchParams.append('description', studyDescription);
    urlSearchParams.append('parentStudyUuid', parentStudyUuid);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const duplicateStudyUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/studies?' +
        urlSearchParams.toString();
    console.debug(duplicateStudyUrl);

    return backendFetch(duplicateStudyUrl, {
        method: 'post',
    }).then((response) => handleResponse(response, false));
}

export function createCase({ name, description, file, parentDirectoryUuid }) {
    console.info('Creating a new case...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', encodeURIComponent(description));
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/cases/' +
        encodeURIComponent(name) +
        '?' +
        urlSearchParams.toString();
    const formData = new FormData();
    formData.append('caseFile', file);
    console.debug(url);

    return backendFetch(url, {
        method: 'post',
        body: formData,
    }).then((response) => handleResponse(response, false));
}

export function duplicateCase(
    name,
    description,
    parentCaseUuid,
    parentDirectoryUuid
) {
    console.info('Creating a new case...');
    console.log(name);
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', parentCaseUuid);
    urlSearchParams.append('caseName', name);
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/cases?' +
        urlSearchParams.toString();
    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    }).then((response) => handleResponse(response, false));
}

export function fetchCases() {
    console.info('Fetching cases...');
    const fetchCasesUrl = PREFIX_CASE_QUERIES + '/v1/cases';
    console.debug(fetchCasesUrl);
    return backendFetch(fetchCasesUrl).then((response) => response.json());
}

export function elementExists(directoryUuid, elementName, type) {
    const existsElementUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/elements/${elementName}/types/${type}`;

    console.debug(existsElementUrl);
    return backendFetch(existsElementUrl, { method: 'head' }).then(
        (response) => {
            return response.ok
                ? true
                : response.status === 404
                ? false
                : Promise.reject(response.statusText);
        }
    );
}

export function rootDirectoryExists(directoryName) {
    const existsRootDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/root-directories?` +
        new URLSearchParams({
            directoryName: directoryName,
        }).toString();

    console.debug(existsRootDirectoryUrl);

    return backendFetch(existsRootDirectoryUrl, { method: 'head' }).then(
        (response) => {
            return response.ok
                ? true
                : response.status === 404
                ? false
                : Promise.reject(response.statusText);
        }
    );
}

export function createContingencyList(
    contingencyListType,
    contingencyListName,
    contingencyListDescription,
    parentDirectoryUuid
) {
    console.info('Creating a new contingency list...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', contingencyListDescription);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const typeUriParam =
        contingencyListType === ContingencyListType.SCRIPT
            ? 'script-contingency-lists'
            : 'form-contingency-lists';

    const createContingencyListUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/' +
        typeUriParam +
        '/' +
        encodeURIComponent(contingencyListName) +
        '?' +
        urlSearchParams.toString();
    console.debug(createContingencyListUrl);

    let body = {};
    if (contingencyListType === ContingencyListType.FORM) {
        body.equipmentType = EquipmentTypes.LINE;
        body.nominalVoltage = -1;
        body.nominalVoltageOperator = '=';
        body.equipmentID = '*';
        body.equipmentName = '*';
    }
    return backendFetch(createContingencyListUrl, {
        method: 'post',
        body: JSON.stringify(body),
    }).then((response) => handleResponse(response, false));
}


export function duplicateContingencyList(
    contingencyListType,
    name,
    description,
    parentContingencyListUuid,
    parentDirectoryUuid
) {
    console.info('Duplicating a contingency list...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', parentContingencyListUuid);
    urlSearchParams.append('listName', name);
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const typeUriParam =
        contingencyListType === ContingencyListType.SCRIPT
            ? 'script-contingency-lists'
            : 'form-contingency-lists';

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/' +
        typeUriParam +
        '?' +
        urlSearchParams.toString();
    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    }).then((response) => handleResponse(response, false));
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
        url += '/v1/form-contingency-lists/';
    }
    url += id;

    return backendFetch(url).then((response) => handleJsonResponse(response));
}

/**
 * Add new Filter contingency list
 * @returns {Promise<Response>}
 */
export function saveFormContingencyList(form) {
    const { nominalVoltage, ...rest } = form;
    const url =
        PREFIX_ACTIONS_QUERIES + '/v1/form-contingency-lists/' + form.id;
    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...rest,
            nominalVoltage: nominalVoltage === '' ? -1 : nominalVoltage,
        }),
    }).then((response) => handleResponse(response, false));
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
    }).then((response) => handleResponse(response, false));
}

/**
 * Replace form contingency list with script contingency list
 * @returns {Promise<Response>}
 */
export function replaceFormContingencyListWithScript(id, parentDirectoryUuid) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/form-contingency-lists/' +
        encodeURIComponent(id) +
        '/replace-with-script' +
        '?' +
        urlSearchParams.toString();

    return backendFetch(url, {
        method: 'post',
    });
}

/**
 * Save new script contingency list from form contingency list
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
        '/v1/explore/form-contingency-lists/' +
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
export function createFilter(newFilter, name, parentDirectoryUuid) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('description', '');
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    return backendFetch(
        PREFIX_EXPLORE_SERVER_QUERIES +
            '/v1/explore/filters?' +
            urlSearchParams.toString(),
        {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFilter),
        }
    ).then((response) => handleResponse(response, false));
}

export function duplicateFilter(
    name,
    description,
    parentFilterUuid,
    parentDirectoryUuid,
) {
    console.info('Duplicating a filter...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', parentFilterUuid);
    urlSearchParams.append('name', name);
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/filters?' +
        urlSearchParams.toString();
    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    }).then((response) => handleResponse(response, false));
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
    return backendFetch(url).then((response) => handleJsonResponse(response));
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
        '/v1/explore/filters/' +
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
        '/v1/explore/filters/' +
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
    }).then((response) => handleResponse(response, false));
}

/**
 * Fetch element and all its parents info
 */

export function fetchPath(elementUuid) {
    console.info(`Fetching element '${elementUuid}' and its parents info ...`);
    const fetchPathUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/elements/` +
        encodeURIComponent(elementUuid) +
        `/path`;
    console.debug(fetchPathUrl);
    return backendFetch(fetchPathUrl).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}
