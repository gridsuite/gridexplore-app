/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_NAME, getAppName } from './config-params';
import { store } from '../redux/store';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { ContingencyListType } from './elementType';

const PREFIX_USER_ADMIN_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/user-admin';
const PREFIX_CONFIG_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/config-notification';
const PREFIX_CONFIG_QUERIES = process.env.REACT_APP_API_GATEWAY + '/config';
const PREFIX_DIRECTORY_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/directory';
const PREFIX_EXPLORE_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/explore';
const PREFIX_ACTIONS_QUERIES = process.env.REACT_APP_API_GATEWAY + '/actions';
const PREFIX_CASE_QUERIES = process.env.REACT_APP_API_GATEWAY + '/case';
const PREFIX_NETWORK_CONVERSION_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/network-conversion';
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

    const reconnectingWebSocket = new ReconnectingWebSocket(
        () => webSocketUrl + '&access_token=' + getToken()
    );
    reconnectingWebSocket.onopen = function () {
        console.info(
            'Connected Websocket update config ui ' + webSocketUrl + ' ...'
        );
    };
    return reconnectingWebSocket;
}

function handleResponse(response, expectsJson) {
    if (response.ok) {
        return expectsJson ? response.json() : response;
    } else {
        return response.text().then((text) => {
            return Promise.reject({
                message: text ? text : response.statusText,
                status: response.status,
                statusText: response.statusText,
            });
        });
    }
}

function backendFetch(url, expectsJson, init, withAuth = true) {
    if (!(typeof init == 'undefined' || typeof init == 'object')) {
        throw new TypeError(
            'Argument 2 of backendFetch is not an object' + typeof init
        );
    }
    const initCopy = Object.assign({}, init);
    initCopy.headers = new Headers(initCopy.headers || {});
    if (withAuth) {
        initCopy.headers.append('Authorization', 'Bearer ' + getToken());
    }

    return fetch(url, initCopy).then((response) =>
        handleResponse(response, expectsJson)
    );
}

export function fetchValidateUser(user) {
    const sub = user?.profile?.sub;
    if (!sub)
        return Promise.reject(
            new Error(
                'Error : Fetching access for missing user.profile.sub : ' + user
            )
        );

    console.info(`Fetching access for user...`);
    const CheckAccessUrl =
        PREFIX_USER_ADMIN_SERVER_QUERIES + `/v1/users/${sub}`;
    console.debug(CheckAccessUrl);

    return backendFetch(
        CheckAccessUrl,
        false,
        {
            method: 'head',
            headers: {
                Authorization: 'Bearer ' + user?.id_token,
            },
        },
        false
    )
        .then((response) => {
            if (response.status === 200) return true;
            else if (response.status === 204) return false;
        })
        .catch((error) => {
            if (error.status === 403) return false;
            else throw new Error(error.status + ' ' + error.statusText);
        });
}

export function fetchAppsAndUrls() {
    console.info(`Fetching apps and urls...`);
    return backendFetch('env.json', true).then((res) => {
        return backendFetch(
            res.appsMetadataServerUrl + '/apps-metadata.json',
            true,
            undefined,
            false
        );
    });
}

export function fetchConfigParameters(appName) {
    console.info('Fetching UI configuration params for app : ' + appName);
    const fetchParams =
        PREFIX_CONFIG_QUERIES + `/v1/applications/${appName}/parameters`;
    return backendFetch(fetchParams, true);
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
    return backendFetch(fetchParams, true);
}

export function fetchDirectoryContent(directoryUuid) {
    console.info("Fetching Folder content '%s'", directoryUuid);
    const fetchDirectoryContentUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/elements`;
    return backendFetch(fetchDirectoryContentUrl, true);
}

export function deleteElement(elementUuid) {
    console.info("Deleting element %s'", elementUuid);
    const fetchParams =
        PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/${elementUuid}`;
    return backendFetch(fetchParams, false, {
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
    return backendFetch(fetchParams, false, {
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
    return backendFetch(updateAccessRightUrl, false, {
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
    return backendFetch(insertDirectoryUrl, true, {
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
    });
}

export function insertRootDirectory(directoryName, isPrivate, owner) {
    console.info("Inserting a new root folder '%s'", directoryName);
    const insertRootDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/root-directories/`;
    return backendFetch(insertRootDirectoryUrl, true, {
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
    });
}

export function renameElement(elementUuid, newElementName) {
    console.info('Renaming element ' + elementUuid);
    const renameElementUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/elements/${elementUuid}`;
    console.debug(renameElementUrl);
    return backendFetch(renameElementUrl, false, {
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
    return backendFetch(fetchRootFoldersUrl, true);
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
    return backendFetch(updateParams, false, { method: 'put' });
}

function getElementsIdsListsQueryParams(ids) {
    if (ids !== undefined && ids.length > 0) {
        const urlSearchParams = new URLSearchParams();
        ids.forEach((id) => urlSearchParams.append('ids', id));
        return '?' + urlSearchParams.toString();
    }
    return '';
}

export function fetchElementsInfos(ids) {
    console.info('Fetching elements metadata ... ');
    const fetchElementsInfosUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/elements/metadata' +
        getElementsIdsListsQueryParams(ids);
    return backendFetch(fetchElementsInfosUrl, true);
}

export function createStudy(
    studyName,
    studyDescription,
    caseName,
    parentDirectoryUuid,
    importParameters
) {
    console.info('Creating a new study...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', studyDescription);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const createStudyUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/studies/' +
        encodeURIComponent(studyName) +
        '/cases/' +
        encodeURIComponent(caseName) +
        '?' +
        urlSearchParams.toString();
    console.debug(createStudyUrl);
    return backendFetch(createStudyUrl, false, {
        method: 'post',
        body: importParameters,
        headers: { 'Content-Type': 'application/json' },
    });
}

export function duplicateStudy(
    studyName,
    studyDescription,
    sourceStudyUuid,
    parentDirectoryUuid
) {
    console.info('Duplicating a study...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', sourceStudyUuid);
    urlSearchParams.append('studyName', studyName);
    urlSearchParams.append('description', studyDescription);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const duplicateStudyUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/studies?' +
        urlSearchParams.toString();
    console.debug(duplicateStudyUrl);

    return backendFetch(duplicateStudyUrl, false, {
        method: 'post',
    });
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

    return backendFetch(url, false, {
        method: 'post',
        body: formData,
    });
}

export function duplicateCase(
    name,
    description,
    sourceCaseUuid,
    parentDirectoryUuid
) {
    console.info('Duplicating a case...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', sourceCaseUuid);
    urlSearchParams.append('caseName', name);
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/cases?' +
        urlSearchParams.toString();
    console.debug(url);

    return backendFetch(url, false, {
        method: 'post',
    });
}

export function fetchCases() {
    console.info('Fetching cases...');
    const fetchCasesUrl = PREFIX_CASE_QUERIES + '/v1/cases';
    console.debug(fetchCasesUrl);
    return backendFetch(fetchCasesUrl, true);
}

export function elementExists(directoryUuid, elementName, type) {
    const existsElementUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/elements/${elementName}/types/${type}`;

    console.debug(existsElementUrl);
    return backendFetch(existsElementUrl, false, { method: 'head' }).then(
        (response) => {
            return response.status !== 204; // HTTP 204 : No-content
        }
    );
}

export function getNameCandidate(directoryUuid, elementName, type) {
    const existsElementUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/${elementName}/newNameCandidate?type=${type}`;

    console.debug(existsElementUrl);
    return backendFetch(existsElementUrl).then((response) => {
        return response.text();
    });
}
export function rootDirectoryExists(directoryName) {
    const existsRootDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/root-directories?` +
        new URLSearchParams({
            directoryName: directoryName,
        }).toString();

    console.debug(existsRootDirectoryUrl);

    return backendFetch(existsRootDirectoryUrl, false, { method: 'head' }).then(
        (response) => {
            return response.status !== 204; // HTTP 204 : No-content
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
        // default form: empty LINE
        body.equipmentType = 'LINE';
        body.nominalVoltage1 = null;
    }
    return backendFetch(createContingencyListUrl, false, {
        method: 'post',
        body: JSON.stringify(body),
    });
}

export function duplicateContingencyList(
    contingencyListType,
    name,
    description,
    sourceContingencyListUuid,
    parentDirectoryUuid
) {
    console.info('Duplicating a contingency list...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', sourceContingencyListUuid);
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

    return backendFetch(url, false, {
        method: 'post',
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
        url += '/v1/form-contingency-lists/';
    }
    url += id;

    return backendFetch(url, true);
}

/**
 * Add new Filter contingency list
 * @returns {Promise<Response>}
 */
export function saveFormContingencyList(form) {
    const { nominalVoltage, ...rest } = form;
    const url =
        PREFIX_ACTIONS_QUERIES + '/v1/form-contingency-lists/' + form.id;
    return backendFetch(url, false, {
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
    return backendFetch(url, false, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptContingencyList),
    });
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

    return backendFetch(url, false, {
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

    return backendFetch(url, false, {
        method: 'post',
    });
}

/**
 * Function will be called to connect with notification websocket to update directories list
 * @returns {ReconnectingWebSocket}
 */
export function connectNotificationsWsUpdateDirectories() {
    const webSocketBaseUrl = document.baseURI
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
    const webSocketUrl =
        webSocketBaseUrl +
        PREFIX_NOTIFICATION_WS +
        '/notify?updateType=directories';

    const reconnectingWebSocket = new ReconnectingWebSocket(
        () => webSocketUrl + '&access_token=' + getToken()
    );
    reconnectingWebSocket.onopen = function () {
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
        false,
        {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFilter),
        }
    );
}

export function duplicateFilter(
    name,
    description,
    sourceFilterUuid,
    parentDirectoryUuid
) {
    console.info('Duplicating a filter...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', sourceFilterUuid);
    urlSearchParams.append('name', name);
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/filters?' +
        urlSearchParams.toString();
    console.debug(url);

    return backendFetch(url, false, {
        method: 'post',
    });
}

/**
 * Get all filters (name & type)
 * @returns {Promise<Response>}
 */
export function getFilters() {
    return backendFetch(PREFIX_FILTERS_QUERIES, true).then((res) =>
        res.sort((a, b) => a.name.localeCompare(b.name))
    );
}

/**
 * Get filter by id
 * @returns {Promise<Response>}
 */
export function getFilterById(id) {
    const url = PREFIX_FILTERS_QUERIES + '/' + id;
    return backendFetch(url, true);
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

    return backendFetch(url, false, {
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

    return backendFetch(url, false, {
        method: 'post',
    });
}

/**
 * Save Filter
 */
export function saveFilter(filter) {
    return backendFetch(PREFIX_FILTERS_QUERIES + '/' + filter.id, false, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter),
    });
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
    return backendFetch(fetchPathUrl, true);
}

export function getCaseImportParameters(caseUuid) {
    console.info(`get import parameters for case '${caseUuid}' ...`);
    const getExportFormatsUrl =
        PREFIX_NETWORK_CONVERSION_SERVER_QUERIES +
        '/v1/cases/' +
        caseUuid +
        '/import-parameters';
    console.debug(getExportFormatsUrl);
    return backendFetch(getExportFormatsUrl, true);
}

export function createPrivateCase(selectedFile) {
    const createPrivateCaseUrl = PREFIX_CASE_QUERIES + '/v1/cases/private';
    const formData = new FormData();
    formData.append('file', selectedFile);
    console.debug(createPrivateCaseUrl);

    return backendFetch(createPrivateCaseUrl, true, {
        method: 'post',
        body: formData,
    });
}

export function deleteCase(caseUuid) {
    const deleteCaseUrl = PREFIX_CASE_QUERIES + '/v1/cases/' + caseUuid;
    return backendFetch(deleteCaseUrl, false, {
        method: 'delete',
    });
}
