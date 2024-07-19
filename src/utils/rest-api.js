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
import {
    ElementType,
    getRequestParamFromList,
    fetchEnv,
    backendFetchJson,
    backendFetch,
} from '@gridsuite/commons-ui';

const PREFIX_USER_ADMIN_SERVER_QUERIES =
    import.meta.env.VITE_API_GATEWAY + '/user-admin';
const PREFIX_CONFIG_NOTIFICATION_WS =
    import.meta.env.VITE_WS_GATEWAY + '/config-notification';
const PREFIX_CONFIG_QUERIES = import.meta.env.VITE_API_GATEWAY + '/config';
const PREFIX_DIRECTORY_SERVER_QUERIES =
    import.meta.env.VITE_API_GATEWAY + '/directory';
const PREFIX_EXPLORE_SERVER_QUERIES =
    import.meta.env.VITE_API_GATEWAY + '/explore';
const PREFIX_ACTIONS_QUERIES = import.meta.env.VITE_API_GATEWAY + '/actions';
const PREFIX_CASE_QUERIES = import.meta.env.VITE_API_GATEWAY + '/case';
const PREFIX_NETWORK_CONVERSION_SERVER_QUERIES =
    import.meta.env.VITE_API_GATEWAY + '/network-conversion';
const PREFIX_NOTIFICATION_WS =
    import.meta.env.VITE_WS_GATEWAY + '/directory-notification';
const PREFIX_FILTERS_QUERIES =
    import.meta.env.VITE_API_GATEWAY + '/filter/v1/filters';
const PREFIX_STUDY_QUERIES = import.meta.env.VITE_API_GATEWAY + '/study';

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

export function backendFetchText(url, init, token) {
    const initCopy = prepareRequest(init, token);
    return safeFetch(url, initCopy).then((safeResponse) => safeResponse.text());
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

export function fetchIdpSettings() {
    return fetch('idpSettings.json').then((res) => res.json());
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
            '?' +
            idsParams,
        {
            method: 'delete',
        }
    );
}

export function moveElementsToDirectory(elementsUuids, targetDirectoryUuid) {
    console.info('Moving elements to directory %s', targetDirectoryUuid);

    const fetchParams =
        PREFIX_EXPLORE_SERVER_QUERIES +
        `/v1/explore/elements?targetDirectoryUuid=${targetDirectoryUuid}`;
    return backendFetch(fetchParams, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(elementsUuids),
    });
}

export function updateElement(elementUuid, element) {
    console.info('Updating element info for ' + elementUuid);
    const updateElementUrl =
        PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/${elementUuid}`;
    return backendFetch(updateElementUrl, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(element),
    });
}

export function insertDirectory(directoryName, parentUuid, owner) {
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
            owner: owner,
        }),
    });
}

export function insertRootDirectory(directoryName, owner) {
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
            owner: owner,
        }),
    });
}

export function renameElement(elementUuid, newElementName) {
    console.info('Renaming element ' + elementUuid);
    const renameElementUrl =
        PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/${elementUuid}`;
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

const getDuplicateEndpoint = (type) => {
    switch (type) {
        case ElementType.CASE:
            return '/cases';
        case ElementType.STUDY:
            return '/studies';
        case ElementType.FILTER:
            return '/filters';
        case ElementType.CONTINGENCY_LIST:
            return '/contingency-lists';
        case ElementType.PARAMETERS:
            return '/parameters';
        case ElementType.MODIFICATION:
            return '/modifications';
        default:
            break;
    }
};

export function duplicateElement(
    sourceCaseUuid,
    parentDirectoryUuid,
    type,
    specificType
) {
    console.info('Duplicating an element of type ' + type + ' ...');
    let queryParams = new URLSearchParams();
    queryParams.append('duplicateFrom', sourceCaseUuid);
    if (parentDirectoryUuid) {
        queryParams.append('parentDirectoryUuid', parentDirectoryUuid);
    }
    if (specificType) {
        queryParams.append('type', specificType);
    }
    const url =
        `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore${getDuplicateEndpoint(
            type
        )}?` + queryParams.toString();

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
    const nameCandidateUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/${elementName}/newNameCandidate?type=${type}`;
    console.debug(nameCandidateUrl);
    return backendFetchText(nameCandidateUrl);
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

export const fetchConvertedCase = (
    caseUuid,
    fileName,
    format,
    formatParameters,
    abortController
) =>
    backendFetch(
        `${PREFIX_CASE_QUERIES}/v1/cases/${caseUuid}?format=${format}&fileName=${fileName}`,
        {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formatParameters),
            signal: abortController.signal,
        }
    );

export const downloadCase = (caseUuid) =>
    backendFetch(`${PREFIX_CASE_QUERIES}/v1/cases/${caseUuid}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    });

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

export function getServersInfos() {
    console.info('get backend servers informations');
    return backendFetchJson(
        PREFIX_STUDY_QUERIES + '/v1/servers/about?view=explore'
    ).catch((reason) => {
        console.error('Error while fetching the servers infos : ' + reason);
        return reason;
    });
}

export const getExportFormats = () => {
    console.info('get export formats');
    const url = PREFIX_NETWORK_CONVERSION_SERVER_QUERIES + '/v1/export/formats';
    console.debug(url);
    return backendFetchJson(url);
};

export function searchElementsInfos(searchTerm, currentDirectoryUuid) {
    console.info(
        "Fetching elements infos matching with '%s' term ... ",
        searchTerm
    );
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('userInput', searchTerm);
    urlSearchParams.append('directoryUuid', currentDirectoryUuid);
    return backendFetchJson(
        PREFIX_DIRECTORY_SERVER_QUERIES +
            '/v1/elements/indexation-infos?' +
            urlSearchParams.toString()
    );
}
