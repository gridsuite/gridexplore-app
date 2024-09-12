/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_NAME, getAppName, PARAM_LANGUAGE, PARAM_THEME } from './config-params';
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
    GsLang,
    GsTheme,
} from '@gridsuite/commons-ui';
import { AppState } from '../redux/reducer';
import { LiteralUnion } from 'type-fest';
import { IncomingHttpHeaders } from 'node:http';
import { User } from 'oidc-client';
import { UUID } from 'crypto';
import { CriteriaBasedEditionFormData } from '../components/dialogs/contingency-list/edition/criteria-based/criteria-based-edition-dialog';
import { PrepareContingencyListForBackend } from '../components/dialogs/contingency-list-helper';
import { Script } from '../components/dialogs/contingency-list/edition/script/script-edition-dialog';

const PREFIX_USER_ADMIN_SERVER_QUERIES = import.meta.env.VITE_API_GATEWAY + '/user-admin';
const PREFIX_CONFIG_NOTIFICATION_WS = import.meta.env.VITE_WS_GATEWAY + '/config-notification';
const PREFIX_CONFIG_QUERIES = import.meta.env.VITE_API_GATEWAY + '/config';
const PREFIX_DIRECTORY_SERVER_QUERIES = import.meta.env.VITE_API_GATEWAY + '/directory';
const PREFIX_EXPLORE_SERVER_QUERIES = import.meta.env.VITE_API_GATEWAY + '/explore';
const PREFIX_ACTIONS_QUERIES = import.meta.env.VITE_API_GATEWAY + '/actions';
const PREFIX_CASE_QUERIES = import.meta.env.VITE_API_GATEWAY + '/case';
const PREFIX_NETWORK_CONVERSION_SERVER_QUERIES = import.meta.env.VITE_API_GATEWAY + '/network-conversion';
const PREFIX_NOTIFICATION_WS = import.meta.env.VITE_WS_GATEWAY + '/directory-notification';
const PREFIX_FILTERS_QUERIES = import.meta.env.VITE_API_GATEWAY + '/filter/v1/filters';
const PREFIX_STUDY_QUERIES = import.meta.env.VITE_API_GATEWAY + '/study';

export type KeyOfWithoutIndexSignature<T> = {
    // copy every declared property from T but remove index signatures
    [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};

export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
type StandardHeader = keyof KeyOfWithoutIndexSignature<IncomingHttpHeaders>;
export type HttpHeaderName = LiteralUnion<StandardHeader, string>;
type HeadersInitExt = [HttpHeaderName, string][] | Partial<Record<HttpHeaderName, string>> | Headers;

type RequestInitExt = RequestInit & {
    method?: HttpMethod;
    headers?: HeadersInitExt;
};

export type Token = string;
export type Url = string | URL;
export type InitRequest = HttpMethod | Partial<RequestInitExt>;

type ElementUUID = string | UUID;

export interface ErrorWithStatus extends Error {
    status?: number;
}

export function getToken(): Token | null {
    const state: AppState = store.getState();
    return state.user?.id_token ?? null;
}

export function connectNotificationsWsUpdateConfig() {
    const webSocketBaseUrl = document.baseURI.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
    const webSocketUrl = webSocketBaseUrl + PREFIX_CONFIG_NOTIFICATION_WS + '/notify?appName=' + APP_NAME;

    const reconnectingWebSocket = new ReconnectingWebSocket(() => webSocketUrl + '&access_token=' + getToken());
    reconnectingWebSocket.onopen = function () {
        console.info('Connected Websocket update config ui ' + webSocketUrl + ' ...');
    };
    return reconnectingWebSocket;
}

function parseError(text: string) {
    try {
        return JSON.parse(text);
    } catch (err) {
        return null;
    }
}

function handleError(response: Response): Promise<never> {
    return response.text().then((text) => {
        const errorName = 'HttpResponseError : ';
        let error: ErrorWithStatus;
        const errorJson = parseError(text);
        if (errorJson && errorJson.status && errorJson.error && errorJson.message) {
            error = new Error(
                errorName + errorJson.status + ' ' + errorJson.error + ', message : ' + errorJson.message
            );
            error.status = errorJson.status;
        } else {
            error = new Error(errorName + response.status + ' ' + response.statusText);
            error.status = response.status;
        }
        throw error;
    });
}

function prepareRequest(init: InitRequest, token?: Token) {
    if (!(typeof init == 'undefined' || typeof init == 'object')) {
        throw new TypeError('Argument 2 of backendFetch is not an object' + typeof init);
    }
    const initCopy = Object.assign({}, init);
    initCopy.headers = new Headers(initCopy.headers || {});
    const tokenCopy = token ? token : getToken();
    initCopy.headers.append('Authorization', 'Bearer ' + tokenCopy);
    return initCopy;
}

function safeFetch(url: Url, initCopy: RequestInit) {
    return fetch(url, initCopy).then((response) => (response.ok ? response : handleError(response)));
}

export function backendFetchText(url: Url, init: InitRequest) {
    const initCopy = prepareRequest(init);
    return safeFetch(url, initCopy).then((safeResponse) => safeResponse.text());
}

const getContingencyUriParamType = (contingencyListType: string | null | undefined) => {
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

export function fetchValidateUser(user: User) {
    const sub = user?.profile?.sub;
    if (!sub) {
        return Promise.reject(new Error('Error : Fetching access for missing user.profile.sub : ' + user));
    }

    console.info(`Fetching access for user...`);
    const CheckAccessUrl = PREFIX_USER_ADMIN_SERVER_QUERIES + `/v1/users/${sub}`;
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

export type ConfigParameter =
    | {
          readonly name: typeof PARAM_LANGUAGE;
          value: GsLang;
      }
    | {
          readonly name: typeof PARAM_THEME;
          value: GsTheme;
      };
export type ConfigParameters = ConfigParameter[];

export function fetchConfigParameters(appName: string) {
    console.info('Fetching UI configuration params for app : ' + appName);
    const fetchParams = PREFIX_CONFIG_QUERIES + `/v1/applications/${appName}/parameters`;
    return backendFetchJson(fetchParams, {
        method: 'get',
    }) as Promise<ConfigParameters>;
}

export function fetchConfigParameter(name: string) {
    const appName = getAppName(name);
    console.info("Fetching UI config parameter '%s' for app '%s' ", name, appName);
    const fetchParams = PREFIX_CONFIG_QUERIES + `/v1/applications/${appName}/parameters/${name}`;
    return backendFetchJson(fetchParams, {
        method: 'get',
    }) as Promise<ConfigParameters>;
}

export function deleteElement(elementUuid: ElementUUID) {
    console.info("Deleting element %s'", elementUuid);
    const fetchParams = PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/${elementUuid}`;
    return backendFetch(fetchParams, {
        method: 'delete',
    });
}

export function deleteElements(elementUuids: ElementUUID[], activeDirectory: ElementUUID) {
    console.info('Deleting elements : %s', elementUuids);
    const idsParams = getRequestParamFromList('ids', elementUuids).toString();
    return backendFetch(PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/` + activeDirectory + '?' + idsParams, {
        method: 'delete',
    });
}

export function moveElementsToDirectory(elementsUuids: ElementUUID[], targetDirectoryUuid: ElementUUID) {
    console.info('Moving elements to directory %s', targetDirectoryUuid);

    const fetchParams =
        PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements?targetDirectoryUuid=${targetDirectoryUuid}`;
    return backendFetch(fetchParams, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(elementsUuids),
    });
}

export function updateElement(elementUuid: ElementUUID, element: unknown) {
    console.info('Updating element info for ' + elementUuid);
    const updateElementUrl = PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/${elementUuid}`;
    return backendFetch(updateElementUrl, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(element),
    });
}

export function insertDirectory(directoryName: string, parentUuid: ElementUUID, owner: string) {
    console.info("Inserting a new folder '%s'", directoryName);
    const insertDirectoryUrl = PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/directories/${parentUuid}/elements`;
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

export function insertRootDirectory(directoryName: string, owner: string) {
    console.info("Inserting a new root folder '%s'", directoryName);
    const insertRootDirectoryUrl = PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/root-directories`;
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

export function renameElement(elementUuid: ElementUUID, newElementName: string) {
    console.info('Renaming element ' + elementUuid);
    const renameElementUrl = PREFIX_EXPLORE_SERVER_QUERIES + `/v1/explore/elements/${elementUuid}`;
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

export function updateConfigParameter(name: string, value: string) {
    const appName = getAppName(name);
    console.info("Updating config parameter '%s=%s' for app '%s' ", name, value, appName);
    const updateParams =
        PREFIX_CONFIG_QUERIES + `/v1/applications/${appName}/parameters/${name}?value=` + encodeURIComponent(value);
    return backendFetch(updateParams, { method: 'put' });
}

export function createStudy(
    studyName: string,
    studyDescription: string,
    caseUuid: ElementUUID,
    duplicateCase: boolean,
    parentDirectoryUuid: ElementUUID,
    importParameters: string,
    caseFormat: string
) {
    console.info('Creating a new study...');
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateCase', duplicateCase.toString());
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

export function createCase(name: string, description: string, file: Blob, parentDirectoryUuid: ElementUUID) {
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

const getDuplicateEndpoint = (type: string) => {
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
    sourceCaseUuid: ElementUUID,
    parentDirectoryUuid: ElementUUID | undefined,
    type: string,
    specificType?: string | object
) {
    console.info('Duplicating an element of type ' + type + ' ...');
    let queryParams = new URLSearchParams();
    queryParams.append('duplicateFrom', sourceCaseUuid);
    if (parentDirectoryUuid) {
        queryParams.append('parentDirectoryUuid', parentDirectoryUuid);
    }
    if (specificType) {
        queryParams.append('type', specificType as string);
    }
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore${getDuplicateEndpoint(type)}?` + queryParams.toString();

    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    });
}

export function elementExists(directoryUuid: ElementUUID | null | undefined, elementName: string, type: string) {
    const elementNameEncoded = encodeURIComponent(elementName);
    const existsElementUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/elements/${elementNameEncoded}/types/${type}`;
    console.debug(existsElementUrl);
    return backendFetch(existsElementUrl, { method: 'head' }).then((response) => {
        return response.status !== 204; // HTTP 204 : No-content
    });
}

export function getNameCandidate(directoryUuid: ElementUUID, elementName: string, type: string) {
    const nameCandidateUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${directoryUuid}/${elementName}/newNameCandidate?type=${type}`;
    console.debug(nameCandidateUrl);
    return backendFetchText(nameCandidateUrl, {
        method: 'GET',
    });
}

export function rootDirectoryExists(directoryName: string) {
    const existsRootDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/root-directories?` +
        new URLSearchParams({
            directoryName: directoryName,
        }).toString();

    console.debug(existsRootDirectoryUrl);

    return backendFetch(existsRootDirectoryUrl, { method: 'head' }).then((response) => {
        return response.status !== 204; // HTTP 204 : No-content
    });
}

export function createContingencyList(
    contingencyListType: string | null | undefined,
    contingencyListName: string,
    description: string,
    formContent: any,
    parentDirectoryUuid: ElementUUID
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
export function getContingencyList(type: string, id: string) {
    let url = PREFIX_ACTIONS_QUERIES + '/v1' + getContingencyUriParamType(type) + '/' + id;

    return backendFetchJson(url, {
        method: 'get',
    });
}

/**
 * Saves a Filter contingency list
 * @returns {Promise<Response>}
 */

export function saveCriteriaBasedContingencyList(id: string, form: CriteriaBasedEditionFormData) {
    const { name, equipmentType, criteriaBased } = form;
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('contingencyListType', ContingencyListType.CRITERIA_BASED.id);

    const url =
        PREFIX_EXPLORE_SERVER_QUERIES + '/v1/explore/contingency-lists/' + id + '?' + urlSearchParams.toString();

    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...criteriaBased,
            equipmentType,
            nominalVoltage1: criteriaBased?.nominalVoltage1 ?? -1,
        }),
    });
}

/**
 * Saves a script contingency list
 * @returns {Promise<Response>}
 */
export function saveScriptContingencyList(scriptContingencyList: Script, name: string) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('contingencyListType', ContingencyListType.SCRIPT.id);
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
    explicitNamingContingencyList: PrepareContingencyListForBackend,
    name: string
) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('contingencyListType', ContingencyListType.EXPLICIT_NAMING.id);
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
export function replaceFormContingencyListWithScript(id: ElementUUID, parentDirectoryUuid: ElementUUID) {
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
    id: ElementUUID,
    newName: string,
    parentDirectoryUuid: ElementUUID
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
    const webSocketBaseUrl = document.baseURI.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
    const webSocketUrl = webSocketBaseUrl + PREFIX_NOTIFICATION_WS + '/notify?updateType=directories';

    const reconnectingWebSocket = new ReconnectingWebSocket(() => webSocketUrl + '&access_token=' + getToken());
    reconnectingWebSocket.onopen = function () {
        console.info('Connected Websocket update studies ' + webSocketUrl + ' ...');
    };
    return reconnectingWebSocket;
}

/**
 * Get filter by id
 * @returns {Promise<Response>}
 */
export function getFilterById(id: string) {
    const url = PREFIX_FILTERS_QUERIES + '/' + id;
    return backendFetchJson(url, { method: 'get' });
}

/**
 * Replace filter with script filter
 * @returns {Promise<Response>}
 */
export function replaceFiltersWithScript(id: ElementUUID, parentDirectoryUuid: ElementUUID) {
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
export function newScriptFromFilter(id: ElementUUID, newName: string, parentDirectoryUuid: ElementUUID) {
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

export function getCaseImportParameters(caseUuid: ElementUUID) {
    console.info(`get import parameters for case '${caseUuid}' ...`);
    const getExportFormatsUrl =
        PREFIX_NETWORK_CONVERSION_SERVER_QUERIES + '/v1/cases/' + caseUuid + '/import-parameters';
    console.debug(getExportFormatsUrl);
    return backendFetchJson(getExportFormatsUrl, {
        method: 'get',
    });
}

export function createCaseWithoutDirectoryElementCreation(selectedFile: Blob) {
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

export function deleteCase(caseUuid: ElementUUID) {
    const deleteCaseUrl = PREFIX_CASE_QUERIES + '/v1/cases/' + caseUuid;
    return backendFetch(deleteCaseUrl, {
        method: 'delete',
    });
}

export const fetchConvertedCase = (
    caseUuid: ElementUUID,
    fileName: string,
    format: string,
    formatParameters: unknown,
    abortController: AbortController
) =>
    backendFetch(`${PREFIX_CASE_QUERIES}/v1/cases/${caseUuid}?format=${format}&fileName=${fileName}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatParameters),
        signal: abortController.signal,
    });

export const downloadCase = (caseUuid: ElementUUID) =>
    backendFetch(`${PREFIX_CASE_QUERIES}/v1/cases/${caseUuid}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    });

/**
 * Retrieves the original name of a case using its UUID.
 * @param {string} caseUuid - The UUID of the element.
 * @returns {Promise<string|boolean>} - A promise that resolves to the original name of the case if found, or false if not found.
 */
export function getCaseOriginalName(caseUuid: ElementUUID) {
    const caseNameUrl = PREFIX_CASE_QUERIES + `/v1/cases/${caseUuid}/name`;
    console.debug(caseNameUrl);
    return backendFetchText(caseNameUrl, { method: 'GET' }).catch((error) => {
        if (error.status === 404) {
            return false;
        } else {
            throw error;
        }
    });
}

export function getServersInfos() {
    console.info('get backend servers informations');
    return backendFetchJson(PREFIX_STUDY_QUERIES + '/v1/servers/about?view=explore', { method: 'get' }).catch(
        (reason) => {
            console.error('Error while fetching the servers infos : ' + reason);
            return reason;
        }
    );
}

export const getExportFormats = () => {
    console.info('get export formats');
    const url = PREFIX_NETWORK_CONVERSION_SERVER_QUERIES + '/v1/export/formats';
    console.debug(url);
    return backendFetchJson(url, {
        method: 'get',
    });
};

export function searchElementsInfos(searchTerm: string, currentDirectoryUuid: ElementUUID | undefined) {
    console.info("Fetching elements infos matching with '%s' term ... ", searchTerm);
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('userInput', searchTerm);
    if (currentDirectoryUuid) {
        urlSearchParams.append('directoryUuid', currentDirectoryUuid);
    }
    return backendFetchJson(
        PREFIX_DIRECTORY_SERVER_QUERIES + '/v1/elements/indexation-infos?' + urlSearchParams.toString(),
        {
            method: 'get',
        }
    );
}