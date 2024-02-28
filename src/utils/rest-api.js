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
import { CONTINGENCY_ENDPOINTS } from './constants-endpoints';

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
const PREFIX_STUDY_QUERIES = process.env.REACT_APP_API_GATEWAY + '/study';

function getToken() {
    const state = store.getState();
    return state.user.id_token;
}

export const getRequestParamFromList = (params, paramName) => {
    return new URLSearchParams(
        params?.length ? params.map((param) => [paramName, param]) : []
    );
};

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

function parseError(text) {
    try {
        return JSON.parse(text);
    } catch (err) {
        return null;
    }
}

function handleError(response) {
    return response.text().then((text) => {
        const errorName = 'HttpResponseError : ';
        let error;
        const errorJson = parseError(text);
        if (
            errorJson &&
            errorJson.status &&
            errorJson.error &&
            errorJson.message
        ) {
            error = new Error(
                errorName +
                    errorJson.status +
                    ' ' +
                    errorJson.error +
                    ', message : ' +
                    errorJson.message
            );
            error.status = errorJson.status;
        } else {
            error = new Error(
                errorName + response.status + ' ' + response.statusText
            );
            error.status = response.status;
        }
        throw error;
    });
}

function prepareRequest(init, token) {
    if (!(typeof init == 'undefined' || typeof init == 'object')) {
        throw new TypeError(
            'Argument 2 of backendFetch is not an object' + typeof init
        );
    }
    const initCopy = Object.assign({}, init);
    initCopy.headers = new Headers(initCopy.headers || {});
    const tokenCopy = token ? token : getToken();
    initCopy.headers.append('Authorization', 'Bearer ' + tokenCopy);
    return initCopy;
}

function safeFetch(url, initCopy) {
    return fetch(url, initCopy).then((response) =>
        response.ok ? response : handleError(response)
    );
}

export function backendFetch(url, init, token) {
    const initCopy = prepareRequest(init, token);
    return safeFetch(url, initCopy);
}

export function backendFetchText(url, init, token) {
    const initCopy = prepareRequest(init, token);
    return safeFetch(url, initCopy).then((safeResponse) => safeResponse.text());
}

export function backendFetchJson(url, init, token) {
    const initCopy = prepareRequest(init, token);
    return safeFetch(url, initCopy).then((safeResponse) => safeResponse.json());
}

const getContingencyUriParamType = (contingencyListType) => {
    switch (contingencyListType) {
        case ContingencyListType.SCRIPT.id:
            return CONTINGENCY_ENDPOINTS.SCRIPT_CONTINGENCY_LISTS;
        case ContingencyListType.CRITERIA_BASED.id:
            return CONTINGENCY_ENDPOINTS.FORM_CONTINGENCY_LISTS;
        case ContingencyListType.EXPLICIT_NAMING.id:
            return CONTINGENCY_ENDPOINTS.IDENTIFIER_CONTINGENCY_LISTS;
        default:
            return null;
    }
};

export function fetchValidateUser(user) {
    const sub = user?.profile?.sub;
    if (!sub) {
        return Promise.reject(
            new Error(
                'Error : Fetching access for missing user.profile.sub : ' + user
            )
        );
    }

    console.info(`Fetching access for user...`);
    const CheckAccessUrl =
        PREFIX_USER_ADMIN_SERVER_QUERIES + `/v1/users/${sub}`;
    console.debug(CheckAccessUrl);

    return backendFetch(
        CheckAccessUrl,
        {
            method: 'head',
        },
        user?.id_token
    )
        .then((response) => {
            //if the response is ok, the responseCode will be either 200 or 204 otherwise it's a Http error and it will be caught
            return response.status === 200;
        })
        .catch((error) => {
            if (error.status === 403) {
                return false;
            } else {
                throw error;
            }
        });
}

function fetchEnv() {
    return fetch('env.json').then((res) => res.json());
}

export function fetchAuthorizationCodeFlowFeatureFlag() {
    console.info(`Fetching authorization code flow feature flag...`);
    return fetchEnv()
        .then((res) =>
            fetch(res.appsMetadataServerUrl + '/authentication.json')
        )
        .then((res) => res.json())
        .then((res) => {
            console.log(
                `Authorization code flow is ${
                    res.authorizationCodeFlowFeatureFlag
                        ? 'enabled'
                        : 'disabled'
                }`
            );
            return res.authorizationCodeFlowFeatureFlag;
        })
        .catch((error) => {
            console.error(error);
            console.warn(
                `Something wrong happened when retrieving authentication.json: authorization code flow will be disabled`
            );
            return false;
        });
}

export function fetchAppsAndUrls() {
    console.info(`Fetching apps and urls...`);
    return fetchEnv()
        .then((env) => fetch(env.appsMetadataServerUrl + '/apps-metadata.json'))
        .then((response) => response.json());
}

export function fetchVersion() {
    console.info(`Fetching global metadata...`);
    return fetchEnv()
        .then((env) => fetch(env.appsMetadataServerUrl + '/version.json'))
        .then((response) => response.json())
        .catch((reason) => {
            console.error('Error while fetching the version : ' + reason);
            return reason;
        });
}

export function fetchConfigParameters(appName) {
    console.info('Fetching UI configuration params for app : ' + appName);
    const fetchParams =
        PREFIX_CONFIG_QUERIES + `/v1/applications/${appName}/parameters`;
    return backendFetchJson(fetchParams);
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
    return backendFetchJson(fetchParams);
}

export function fetchDirectoryContent(directoryUuid, elementTypes) {
    console.info("Fetching Folder content '%s'", directoryUuid);
    const typeParams = getRequestParamFromList(
        elementTypes,
        'elementTypes'
    ).toString();
    let fetchDirectoryContentUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/elements`;
    if (typeParams.length > 0) {
        fetchDirectoryContentUrl += '?' + typeParams;
    }
    return backendFetchJson(fetchDirectoryContentUrl);
}

export function deleteElement(elementUuid) {
    console.info("Deleting element %s'", elementUuid);
    const fetchParams =
        PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/${elementUuid}`;
    return backendFetch(fetchParams, {
        method: 'delete',
    });
}

export function deleteElements(elementUuids, activeDirectory) {
    console.info('Deleting elements : %s', elementUuids);
    const idsParams = getRequestParamFromList(elementUuids, 'ids').toString();
    return backendFetch(
        PREFIX_EXPLORE_SERVER_QUERIES +
            `/v1/explore/elements/` +
            activeDirectory +
            '/delete-stashed?' +
            idsParams,
        {
            method: 'delete',
        }
    );
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

export function updateElement(elementUuid, element) {
    console.info('Updating element info for ' + elementUuid);
    const updateAccessRightUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/elements/${elementUuid}`;
    return backendFetch(updateAccessRightUrl, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(element),
    });
}

export function insertDirectory(directoryName, parentUuid, isPrivate, owner) {
    console.info("Inserting a new folder '%s'", directoryName);
    const insertDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${parentUuid}/elements`;
    return backendFetchJson(insertDirectoryUrl, {
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
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/root-directories`;
    return backendFetchJson(insertRootDirectoryUrl, {
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
    return backendFetchJson(fetchRootFoldersUrl);
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
    return backendFetch(updateParams, { method: 'put' });
}

export function fetchElementsInfos(ids) {
    console.info('Fetching elements metadata ... ');
    const idsParams = getRequestParamFromList(ids, 'ids').toString();
    const fetchElementsInfosUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/elements/metadata?' +
        idsParams;
    return backendFetchJson(fetchElementsInfosUrl);
}

export function createStudy(
    studyName,
    studyDescription,
    caseUuid,
    duplicateCase,
    parentDirectoryUuid,
    importParameters,
    caseFormat
) {
    console.info('Creating a new study...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateCase', duplicateCase);
    urlSearchParams.append('description', studyDescription);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    urlSearchParams.append('caseFormat', caseFormat);

    const createStudyUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/studies/' +
        encodeURIComponent(studyName) +
        '/cases/' +
        encodeURIComponent(caseUuid) +
        '?' +
        urlSearchParams.toString();
    console.debug(createStudyUrl);
    return backendFetch(createStudyUrl, {
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

    return backendFetch(duplicateStudyUrl, {
        method: 'post',
    });
}

export function createCase({ name, description, file, parentDirectoryUuid }) {
    console.info('Creating a new case...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', description);
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

    return backendFetch(url, {
        method: 'post',
    });
}

export function elementExists(directoryUuid, elementName, type) {
    const elementNameEncoded = encodeURIComponent(elementName);
    const existsElementUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/elements/${elementNameEncoded}/types/${type}`;
    console.debug(existsElementUrl);
    return backendFetch(existsElementUrl, { method: 'head' }).then(
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
    return backendFetchText(existsElementUrl).catch((error) => {
        if (error.status === 404) {
            return false;
        } else {
            throw error;
        }
    });
}

/**
 * Retrieves the original name of a case using its UUID.
 * @param {string} caseUuid - The UUID of the element.
 * @returns {Promise<string|boolean>} - A promise that resolves to the original name of the case if found, or false if not found.
 */
export function getCaseOriginalName(caseUuid) {
    const caseNameUrl = PREFIX_CASE_QUERIES + `/v1/cases/${caseUuid}/name`;
    console.debug(caseNameUrl);
    return backendFetchText(caseNameUrl).catch((error) => {
        if (error.status === 404) {
            return false;
        } else {
            throw error;
        }
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

    return backendFetch(existsRootDirectoryUrl, { method: 'head' }).then(
        (response) => {
            return response.status !== 204; // HTTP 204 : No-content
        }
    );
}

export function createContingencyList(
    contingencyListType,
    contingencyListName,
    description,
    formContent,
    parentDirectoryUuid
) {
    console.info('Creating a new contingency list...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    let typeUriParam = getContingencyUriParamType(contingencyListType);

    const createContingencyListUrl =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore' +
        typeUriParam +
        '/' +
        encodeURIComponent(contingencyListName) +
        '?' +
        urlSearchParams.toString();
    console.debug(createContingencyListUrl);

    return backendFetch(createContingencyListUrl, {
        method: 'post',
        body: JSON.stringify(formContent),
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

    const uriParamType = getContingencyUriParamType(contingencyListType);

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore' +
        uriParamType +
        '?' +
        urlSearchParams.toString();
    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    });
}

/**
 * Get contingency list by type and id
 * @returns {Promise<Response>}
 */
export function getContingencyList(type, id) {
    let url =
        PREFIX_ACTIONS_QUERIES +
        '/v1' +
        getContingencyUriParamType(type) +
        '/' +
        id;

    return backendFetchJson(url);
}

/**
 * Saves a Filter contingency list
 * @returns {Promise<Response>}
 */

export function saveCriteriaBasedContingencyList(id, form) {
    const { name, equipmentType, criteriaBased } = form;
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append(
        'contingencyListType',
        ContingencyListType.CRITERIA_BASED.id
    );

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/contingency-lists/' +
        id +
        '?' +
        urlSearchParams.toString();

    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...criteriaBased,
            equipmentType,
            nominalVoltage1:
                criteriaBased.nominalVoltage1 === ''
                    ? -1
                    : criteriaBased.nominalVoltage1,
        }),
    });
}

/**
 * Saves a script contingency list
 * @returns {Promise<Response>}
 */
export function saveScriptContingencyList(scriptContingencyList, name) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append(
        'contingencyListType',
        ContingencyListType.SCRIPT.id
    );
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/contingency-lists/' +
        scriptContingencyList.id +
        '?' +
        urlSearchParams.toString();
    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptContingencyList),
    });
}

/**
 * Saves an explicit naming contingency list
 * @returns {Promise<Response>}
 */
export function saveExplicitNamingContingencyList(
    explicitNamingContingencyList,
    name
) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append(
        'contingencyListType',
        ContingencyListType.EXPLICIT_NAMING.id
    );
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/contingency-lists/' +
        explicitNamingContingencyList.id +
        '?' +
        urlSearchParams.toString();
    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(explicitNamingContingencyList),
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
        '/v1/explore' +
        CONTINGENCY_ENDPOINTS.FORM_CONTINGENCY_LISTS +
        '/' +
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
        '/v1/explore' +
        CONTINGENCY_ENDPOINTS.FORM_CONTINGENCY_LISTS +
        '/' +
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
export function createFilter(
    newFilter,
    name,
    description,
    parentDirectoryUuid
) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('description', description);
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

    return backendFetch(url, {
        method: 'post',
    });
}

export function duplicateModification(
    name,
    description,
    sourceModificationUuid,
    parentDirectoryUuid
) {
    console.info('Duplicating a modification...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/modifications?' +
        urlSearchParams.toString();
    console.debug(url);

    return backendFetch(url, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
            {
                elementUuid: sourceModificationUuid,
                description: description,
                elementName: name,
            },
        ]),
    });
}

export function duplicateParameter(
    name,
    parameterType,
    sourceParameterUuid,
    parentDirectoryUuid
) {
    console.info('Duplicating parameters of type ' + parameterType + '...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateFrom', sourceParameterUuid);
    urlSearchParams.append('name', name);
    urlSearchParams.append('type', parameterType);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    const url =
        PREFIX_EXPLORE_SERVER_QUERIES +
        '/v1/explore/parameters?' +
        urlSearchParams.toString();
    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    });
}

/**
 * Get all filters (name & type)
 * @returns {Promise<Response>}
 */
export function getFilters() {
    return backendFetchJson(PREFIX_FILTERS_QUERIES).then((res) =>
        res.sort((a, b) => a.name.localeCompare(b.name))
    );
}

/**
 * Get filter by id
 * @returns {Promise<Response>}
 */
export function getFilterById(id) {
    const url = PREFIX_FILTERS_QUERIES + '/' + id;
    return backendFetchJson(url);
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
export function saveFilter(filter, name) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    const body = JSON.stringify(filter);

    return backendFetch(
        PREFIX_EXPLORE_SERVER_QUERIES +
            '/v1/explore/filters/' +
            filter.id +
            '?' +
            urlSearchParams.toString(),
        {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body,
        }
    );
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
    return backendFetchJson(fetchPathUrl);
}

export function getCaseImportParameters(caseUuid) {
    console.info(`get import parameters for case '${caseUuid}' ...`);
    const getExportFormatsUrl =
        PREFIX_NETWORK_CONVERSION_SERVER_QUERIES +
        '/v1/cases/' +
        caseUuid +
        '/import-parameters';
    console.debug(getExportFormatsUrl);
    return backendFetchJson(getExportFormatsUrl);
}

export function createCaseWithoutDirectoryElementCreation(selectedFile) {
    const createCaseUrl = PREFIX_CASE_QUERIES + '/v1/cases';
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('withExpiration', encodeURIComponent(true));
    console.debug(createCaseUrl);

    return backendFetchJson(createCaseUrl, {
        method: 'post',
        body: formData,
    });
}

export function deleteCase(caseUuid) {
    const deleteCaseUrl = PREFIX_CASE_QUERIES + '/v1/cases/' + caseUuid;
    return backendFetch(deleteCaseUrl, {
        method: 'delete',
    });
}

export function downloadCase(caseUuid) {
    const downloadCaseUrl =
        PREFIX_CASE_QUERIES + '/v1/cases/' + caseUuid + '?xiidm=false';
    return backendFetch(downloadCaseUrl, {
        method: 'get',
    });
}

export function getServersInfos() {
    console.info('get backend servers informations');
    return backendFetchJson(
        PREFIX_STUDY_QUERIES + '/v1/servers/about?view=explore'
    ).catch((reason) => {
        console.error('Error while fetching the servers infos : ' + reason);
        return reason;
    });
}

export function exportFilter(studyUuid, filterUuid) {
    console.info('get filter export on study root node');
    return backendFetchJson(
        PREFIX_STUDY_QUERIES +
            '/v1/studies/' +
            studyUuid +
            '/filters/' +
            filterUuid +
            '/elements'
    );
}

export function stashElements(elementUuids) {
    console.info('Stashing elements: ' + elementUuids);

    const url =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        '/v1/elements/' +
        `stash?ids=` +
        elementUuids;

    return backendFetch(url, {
        method: 'post',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });
}

export function restoreElements(elementUuids, activeDirectory) {
    console.info('Restoring elements: ' + elementUuids);

    const url =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        '/v1/elements/' +
        activeDirectory +
        '/restore';

    return backendFetch(url, {
        method: 'post',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(elementUuids),
    });
}

export function getStashedElements() {
    console.info('get stashed elements');
    const url = PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/elements/stash`;
    return backendFetchJson(url);
}
