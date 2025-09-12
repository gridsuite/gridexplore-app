/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    backendFetch,
    backendFetchJson,
    type CriteriaBasedData,
    ElementType,
    fetchEnv,
    FieldConstants,
    getRequestParamFromList,
    getUserToken,
    type GsLang,
    type GsTheme,
    LAST_SELECTED_DIRECTORY,
    PARAM_DEVELOPER_MODE,
    PARAM_LANGUAGE,
    PARAM_THEME,
} from '@gridsuite/commons-ui';
import type { LiteralUnion } from 'type-fest';
import { IncomingHttpHeaders } from 'node:http';
import { UUID } from 'crypto';
import { store } from '../redux/store';
import { ContingencyListType } from './elementType';
import { CONTINGENCY_ENDPOINTS } from './constants-endpoints';
import { AppState } from '../redux/types';
import { PrepareContingencyListForBackend } from '../components/dialogs/contingency-list-helper';
import { UsersIdentities } from './user-identities.type';
import { HTTP_OK } from './UIconstants';
import { FilterMetaData } from './contingency-list-types';

const PREFIX_USER_ADMIN_SERVER_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/user-admin`;
const PREFIX_EXPLORE_SERVER_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/explore`;
const PREFIX_ACTIONS_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/actions`;
const PREFIX_CASE_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/case`;
const PREFIX_NETWORK_CONVERSION_SERVER_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/network-conversion`;
const PREFIX_FILTERS_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/filter/v1/filters`;
const PREFIX_STUDY_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/study`;
const PREFIX_SPREADSHEET_CONFIG_QUERIES = `${import.meta.env.VITE_API_GATEWAY}/study-config`;

export type KeyOfWithoutIndexSignature<T> = {
    // copy every declared property from T but remove index signatures
    [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};

export type HttpMethod = 'GET' | 'POST' | 'HEAD' | 'OPTIONS' | 'PUT' | 'DELETE' | 'TRACE'; // Limited by HttpURLConnection in JDK
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

export interface ErrorWithStatus extends Error {
    status?: number;
}

export const getWsBase = () => document.baseURI.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');

export function getUrlWithToken(baseUrl: string) {
    if (baseUrl.includes('?')) {
        return `${baseUrl}&access_token=${getUserToken()}`;
    }
    return `${baseUrl}?access_token=${getUserToken()}`;
}

export interface PermissionDTO {
    allUsers: boolean;
    groups: UUID[];
    type: PermissionType;
}

export interface GroupDTO {
    id: UUID;
    name: string;
    users: string[];
}

export enum PermissionType {
    READ = 'READ',
    WRITE = 'WRITE',
    MANAGE = 'MANAGE',
}

export function getToken(): Token | null {
    const state: AppState = store.getState();
    return state.user?.id_token ?? null;
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
        if (errorJson?.status && errorJson?.error && errorJson?.message) {
            error = new Error(`${errorName + errorJson.status} ${errorJson.error}, message : ${errorJson.message}`);
            error.status = errorJson.status;
        } else {
            error = new Error(`${errorName + response.status} ${response.statusText}`);
            error.status = response.status;
        }
        throw error;
    });
}

function prepareRequest(init: InitRequest, token?: Token) {
    if (!(typeof init === 'undefined' || typeof init === 'object')) {
        throw new TypeError(`Argument 2 of backendFetch is not an object${typeof init}`);
    }
    const initCopy = { ...init };
    initCopy.headers = new Headers(initCopy.headers || {});
    const tokenCopy = token ?? getToken();
    initCopy.headers.append('Authorization', `Bearer ${tokenCopy}`);
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
        case ContingencyListType.CRITERIA_BASED.id:
            return CONTINGENCY_ENDPOINTS.FORM_CONTINGENCY_LISTS;
        case ContingencyListType.EXPLICIT_NAMING.id:
            return CONTINGENCY_ENDPOINTS.IDENTIFIER_CONTINGENCY_LISTS;
        case ContingencyListType.FILTERS.id:
            return CONTINGENCY_ENDPOINTS.FILTERS_CONTINGENCY_LISTS;
        default:
            return null;
    }
};

export function fetchIdpSettings() {
    return fetch('idpSettings.json').then((res) => res.json());
}

export function fetchVersion() {
    console.info(`Fetching global metadata...`);
    return fetchEnv()
        .then((env) => fetch(`${env.appsMetadataServerUrl}/version.json`))
        .then((response) => response.json())
        .catch((reason) => {
            console.error(`Error while fetching the version : ${reason}`);
            return reason;
        });
}

export function fetchUsersIdentities(elementUuids: string[]) {
    if (elementUuids.length === 0) {
        return Promise.resolve();
    }
    console.info('fetching users identities for %s elements.', elementUuids.length);
    const idsParams = getRequestParamFromList('ids', elementUuids).toString();
    const fetchParams = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/elements/users-identities?${idsParams}`;
    return backendFetchJson(fetchParams, {
        method: 'get',
    }) as Promise<UsersIdentities>;
}

export type ConfigParameter =
    | {
          readonly name: typeof PARAM_LANGUAGE;
          value: GsLang;
      }
    | {
          readonly name: typeof PARAM_THEME;
          value: GsTheme;
      }
    | {
          readonly name: typeof PARAM_DEVELOPER_MODE;
          value: boolean;
      }
    | {
          readonly name: typeof LAST_SELECTED_DIRECTORY;
          value: UUID | null;
      };
export type ConfigParameters = ConfigParameter[];

export function deleteElement(elementUuid: UUID) {
    console.info("Deleting element %s'", elementUuid);
    const fetchParams = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/elements/${elementUuid}`;
    return backendFetch(fetchParams, {
        method: 'delete',
    });
}

const deleteElementsChunkSize = 50;

export async function deleteElements(elementUuids: UUID[], activeDirectory: string) {
    console.info('Deleting elements : %s', elementUuids);
    for (let i = 0; i < elementUuids.length; i += deleteElementsChunkSize) {
        const idsParams = getRequestParamFromList('ids', elementUuids.slice(i, i + deleteElementsChunkSize)).toString();
        // eslint-disable-next-line no-await-in-loop -- we use await here to avoid to do too many request to the server
        await backendFetch(`${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/elements/${activeDirectory}?${idsParams}`, {
            method: 'delete',
        });
    }
}

export function moveElementsToDirectory(elementsUuids: UUID[], targetDirectoryUuid: UUID) {
    console.info('Moving elements to directory %s', targetDirectoryUuid);

    const fetchParams = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/elements?targetDirectoryUuid=${targetDirectoryUuid}`;
    return backendFetch(fetchParams, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(elementsUuids),
    });
}

export function updateElement(elementUuid: UUID, element: unknown) {
    console.info(`Updating element info for ${elementUuid}`);
    const updateElementUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/elements/${elementUuid}`;
    return backendFetch(updateElementUrl, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(element),
    });
}

export function insertDirectory(directoryName: string, parentUuid: UUID, ownerId: string) {
    console.info("Inserting a new folder '%s'", directoryName);
    const insertDirectoryUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/${parentUuid}/directories`;
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
            owner: ownerId,
        }),
    });
}

export function insertRootDirectory(directoryName: string, ownerId: string) {
    console.info("Inserting a new root folder '%s'", directoryName);
    const insertRootDirectoryUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/root-directories`;
    return backendFetchJson(insertRootDirectoryUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            elementName: directoryName,
            owner: ownerId,
        }),
    });
}

export function renameElement(elementUuid: UUID, newElementName: string) {
    console.info(`Renaming element ${elementUuid}`);
    const renameElementUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/elements/${elementUuid}`;
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

export function createStudy(
    studyName: string,
    studyDescription: string,
    caseUuid: UUID,
    duplicateCase: boolean,
    parentDirectoryUuid: UUID,
    importParameters: string,
    caseFormat: string
) {
    console.info('Creating a new study...');
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('duplicateCase', duplicateCase.toString());
    urlSearchParams.append('description', studyDescription);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);
    urlSearchParams.append('caseFormat', caseFormat);

    const createStudyUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/studies/${encodeURIComponent(
        studyName
    )}/cases/${encodeURIComponent(caseUuid)}?${urlSearchParams.toString()}`;
    console.debug(createStudyUrl);
    return backendFetch(createStudyUrl, {
        method: 'post',
        body: importParameters,
        headers: { 'Content-Type': 'application/json' },
    });
}

export function createCase(name: string, description: string, file: Blob, parentDirectoryUuid: UUID) {
    console.info('Creating a new case...');
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/cases/${encodeURIComponent(
        name
    )}?${urlSearchParams.toString()}`;
    const formData = new FormData();
    formData.append('caseFile', file);
    console.debug(url);

    return backendFetch(url, {
        method: 'post',
        body: formData,
    });
}

const getDuplicateEndpoint = (type: ElementType) => {
    switch (type) {
        case ElementType.CASE:
            return '/cases';
        case ElementType.STUDY:
            return '/studies';
        case ElementType.FILTER:
            return '/filters';
        case ElementType.CONTINGENCY_LIST:
            return '/contingency-lists';
        case ElementType.VOLTAGE_INIT_PARAMETERS:
        case ElementType.SECURITY_ANALYSIS_PARAMETERS:
        case ElementType.SENSITIVITY_PARAMETERS:
        case ElementType.LOADFLOW_PARAMETERS:
        case ElementType.SHORT_CIRCUIT_PARAMETERS:
        case ElementType.NETWORK_VISUALIZATIONS_PARAMETERS:
            return '/parameters';
        case ElementType.MODIFICATION:
            return '/composite-modifications';
        case ElementType.DIAGRAM_CONFIG:
            return '/diagram-config';
        default:
            return undefined;
    }
};

export function duplicateElement(
    sourceCaseUuid: UUID,
    parentDirectoryUuid: UUID | undefined,
    type: ElementType,
    specificType?: string
) {
    console.info(`Duplicating an element of type ${type} ...`);
    const queryParams = new URLSearchParams();
    queryParams.append('duplicateFrom', sourceCaseUuid);
    if (parentDirectoryUuid) {
        queryParams.append('parentDirectoryUuid', parentDirectoryUuid);
    }
    if (specificType) {
        queryParams.append('type', specificType);
    }
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore${getDuplicateEndpoint(type)}?${queryParams.toString()}`;

    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    });
}

export function duplicateSpreadsheetConfig(sourceCaseUuid: UUID, parentDirectoryUuid?: UUID) {
    console.info('Duplicating a spreadsheet config...');
    const queryParams = new URLSearchParams();
    queryParams.append('duplicateFrom', sourceCaseUuid);
    if (parentDirectoryUuid) {
        queryParams.append('parentDirectoryUuid', parentDirectoryUuid);
    }
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/spreadsheet-configs?${queryParams.toString()}`;

    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    });
}

export function duplicateSpreadsheetConfigCollection(sourceCaseUuid: UUID, parentDirectoryUuid?: UUID) {
    console.info('Duplicating a spreadsheet config collection...');
    const queryParams = new URLSearchParams();
    queryParams.append('duplicateFrom', sourceCaseUuid);
    if (parentDirectoryUuid) {
        queryParams.append('parentDirectoryUuid', parentDirectoryUuid);
    }
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/spreadsheet-config-collections?${queryParams.toString()}`;

    console.debug(url);

    return backendFetch(url, {
        method: 'post',
    });
}

export function downloadSpreadsheetConfig(configId: string) {
    console.info(`Downloading spreadsheet config with id: ${configId}`);
    const fetchUrl = `${PREFIX_SPREADSHEET_CONFIG_QUERIES}/v1/spreadsheet-configs/${configId}`;

    return backendFetch(fetchUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function downloadSpreadsheetConfigCollection(collectionId: string) {
    console.info(`Downloading spreadsheet config collection with id: ${collectionId}`);
    const fetchUrl = `${PREFIX_SPREADSHEET_CONFIG_QUERIES}/v1/spreadsheet-config-collections/${collectionId}`;

    return backendFetch(fetchUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function createSpreadsheetConfigCollectionFromConfigIds(
    name: string,
    description: string,
    directoryUuid: UUID,
    configUuidList: string[]
) {
    console.info(`Creating a spreadsheet config collection from models ids: ${configUuidList}`);
    const queryParams = new URLSearchParams();
    queryParams.append('name', name);
    queryParams.append('description', description);
    queryParams.append('parentDirectoryUuid', directoryUuid);
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/spreadsheet-config-collections/merge?${queryParams.toString()}`;
    console.debug(url);
    return backendFetch(url, {
        method: 'post',
        body: JSON.stringify(configUuidList),
        headers: { 'Content-Type': 'application/json' },
    });
}

export function replaceAllSpreadsheetConfigsInCollection(
    collectionId: string,
    name: string,
    description: string,
    configUuidList: string[]
) {
    console.info(`Replacing all spreadsheet configs in collection with id: ${collectionId}`);
    const queryParams = new URLSearchParams();
    queryParams.append('name', name);
    queryParams.append('description', description);
    const url = `${PREFIX_SPREADSHEET_CONFIG_QUERIES}/v1/spreadsheet-config-collections/${collectionId}/spreadsheet-configs/replace-all?${queryParams.toString()}`;
    console.debug(url);
    return backendFetch(url, {
        method: 'put',
        body: JSON.stringify(configUuidList),
        headers: { 'Content-Type': 'application/json' },
    });
}

export function elementExists(directoryUuid: UUID | null | undefined, elementName: string, type: string) {
    const elementNameEncoded = encodeURIComponent(elementName);
    const existsElementUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/${directoryUuid}/elements/${elementNameEncoded}/types/${type}`;
    console.debug(existsElementUrl);
    return backendFetch(existsElementUrl, { method: 'head' }).then(
        (response) => response.status !== 204 // HTTP 204 : No-content
    );
}

export function getNameCandidate(directoryUuid: UUID, elementName: string, type: string) {
    const nameCandidateUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/${directoryUuid}/${elementName}/newNameCandidate?type=${type}`;
    console.debug(nameCandidateUrl);
    return backendFetchText(nameCandidateUrl, {
        method: 'GET',
    });
}

export function rootDirectoryExists(directoryName: string) {
    const existsRootDirectoryUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/root-directories?${new URLSearchParams(
        { directoryName }
    ).toString()}`;
    console.debug(existsRootDirectoryUrl);
    return backendFetch(existsRootDirectoryUrl, { method: 'head' }).then(
        (response) => response.status !== 204 // HTTP 204 : No-content
    );
}

export function createContingencyList(
    contingencyListType: string | null | undefined,
    contingencyListName: string,
    description: string,
    formContent: any,
    parentDirectoryUuid: UUID
) {
    console.info('Creating a new contingency list...');
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid);

    const typeUriParam = getContingencyUriParamType(contingencyListType);

    const createContingencyListUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore${typeUriParam}/${encodeURIComponent(
        contingencyListName
    )}?${urlSearchParams.toString()}`;
    console.debug(createContingencyListUrl);

    return backendFetch(createContingencyListUrl, {
        method: 'post',
        body: JSON.stringify(formContent),
    });
}
export function createFilterBasedContingency(
    name: string,
    description: string,
    filtersUuids: FilterMetaData[],
    parentDirectoryUuid: UUID | undefined
) {
    console.info('Creating a new filter based contingency list...');
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('description', description);
    urlSearchParams.append('parentDirectoryUuid', parentDirectoryUuid ?? '');

    const createContingencyListUrl = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore${CONTINGENCY_ENDPOINTS.FILTERS_CONTINGENCY_LISTS}/${encodeURIComponent(
        name
    )}?${urlSearchParams.toString()}`;
    console.debug(createContingencyListUrl);

    return backendFetch(createContingencyListUrl, {
        method: 'post',
        body: JSON.stringify({ filters: filtersUuids }),
    });
}

/**
 * Get contingency list by type and id
 * @returns {Promise<Response>}
 */
export function getContingencyList(type: string, id: string) {
    const url = `${PREFIX_ACTIONS_QUERIES}/v1${getContingencyUriParamType(type)}/${id}`;

    return backendFetchJson(url, {
        method: 'get',
    });
}

export function getIdentifiablesFromFitlers(studyUuid: UUID, filters: UUID[]) {
    console.info('get identifiables resulting from application of filters list on study root network');

    const filtersListsQueryParams = getRequestParamFromList('filtersUuid', filters);
    const urlSearchParams = new URLSearchParams(filtersListsQueryParams);

    return backendFetchJson(`${PREFIX_STUDY_QUERIES}/v1/studies/${studyUuid}/filters/elements?${urlSearchParams}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    });
}

export interface CriteriaBasedEditionFormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.EQUIPMENT_TYPE]?: string | null;
    [FieldConstants.CRITERIA_BASED]?: CriteriaBasedData;
}

/**
 * Get the basic data of the network modifications contained in a composite modification
 */
export function fetchCompositeModificationContent(id: string) {
    const url: string = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/composite-modification/${id}/network-modifications`;

    return backendFetchJson(url, {
        method: 'get',
    });
}

export function saveCompositeModification(id: string, moidificationUuids: UUID[], name: string, description?: string) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('description', description ?? '');

    const url: string = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/composite-modifications/${id}?${urlSearchParams.toString()}`;

    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moidificationUuids),
    });
}

/**
 * Saves a Filter contingency list
 * @returns {Promise<Response>}
 */
export function saveCriteriaBasedContingencyList(id: string, form: CriteriaBasedEditionFormData) {
    const { name, description, equipmentType, criteriaBased } = form;
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('description', description ?? '');
    urlSearchParams.append('contingencyListType', ContingencyListType.CRITERIA_BASED.id);

    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/contingency-lists/${id}?${urlSearchParams.toString()}`;

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
 * Saves a Filter contingency list
 * @returns {Promise<Response>}
 */
export function saveFilterBasedContingencyList(
    id: string,
    name: string,
    description: string,
    filters: FilterMetaData[]
) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('description', description ?? '');
    urlSearchParams.append('contingencyListType', ContingencyListType.FILTERS.id);

    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/contingency-lists/${id}?${urlSearchParams.toString()}`;

    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filters: [...filters],
        }),
    });
}

/**
 * Saves an explicit naming contingency list
 * @returns {Promise<Response>}
 */
export function saveExplicitNamingContingencyList(
    explicitNamingContingencyList: PrepareContingencyListForBackend,
    name: string,
    description: string
) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('name', name);
    urlSearchParams.append('description', description);
    urlSearchParams.append('contingencyListType', ContingencyListType.EXPLICIT_NAMING.id);
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/contingency-lists/${
        explicitNamingContingencyList.id
    }?${urlSearchParams.toString()}`;
    return backendFetch(url, {
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(explicitNamingContingencyList),
    });
}

/**
 * Get filter by id
 * @returns {Promise<Response>}
 */
export function getFilterById(id: string) {
    const url = `${PREFIX_FILTERS_QUERIES}/${id}`;
    return backendFetchJson(url, { method: 'get' });
}

export function getCaseImportParameters(caseUuid: UUID) {
    console.info(`get import parameters for case '${caseUuid}' ...`);
    const getExportFormatsUrl = `${PREFIX_NETWORK_CONVERSION_SERVER_QUERIES}/v1/cases/${caseUuid}/import-parameters`;
    console.debug(getExportFormatsUrl);
    return backendFetchJson(getExportFormatsUrl, {
        method: 'get',
    });
}

export function createCaseWithoutDirectoryElementCreation(selectedFile: Blob) {
    const createCaseUrl = `${PREFIX_CASE_QUERIES}/v1/cases`;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('withExpiration', encodeURIComponent(true));
    console.debug(createCaseUrl);

    return backendFetchJson(createCaseUrl, {
        method: 'post',
        body: formData,
    });
}

export function deleteCase(caseUuid: UUID) {
    const deleteCaseUrl = `${PREFIX_CASE_QUERIES}/v1/cases/${caseUuid}`;
    return backendFetch(deleteCaseUrl, {
        method: 'delete',
    });
}

export const fetchConvertedCase = (
    caseUuid: UUID,
    fileName: string,
    format: string,
    formatParameters: unknown,
    abortController: AbortController
) =>
    backendFetch(
        `${PREFIX_NETWORK_CONVERSION_SERVER_QUERIES}/v1/cases/${caseUuid}/convert/${format}?fileName=${fileName}`,
        {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formatParameters),
            signal: abortController.signal,
        }
    );

export const downloadCase = (caseUuid: string) =>
    backendFetch(`${PREFIX_CASE_QUERIES}/v1/cases/${caseUuid}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    });

export function getServersInfos() {
    console.info('get backend servers informations');
    return backendFetchJson(`${PREFIX_STUDY_QUERIES}/v1/servers/about?view=explore`, { method: 'get' }).catch(
        (reason) => {
            console.error(`Error while fetching the servers infos : ${reason}`);
            return reason;
        }
    );
}

export const getExportFormats = () => {
    console.info('get export formats');
    const url = `${PREFIX_NETWORK_CONVERSION_SERVER_QUERIES}/v1/export/formats`;
    console.debug(url);
    return backendFetchJson(url, {
        method: 'get',
    });
};

export function searchElementsInfos(searchTerm: string, currentDirectoryUuid: UUID | undefined) {
    console.info("Fetching elements infos matching with '%s' term ... ", searchTerm);
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.append('userInput', searchTerm);
    if (currentDirectoryUuid) {
        urlSearchParams.append('directoryUuid', currentDirectoryUuid);
    }
    return backendFetchJson(
        `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/elements/indexation-infos?${urlSearchParams.toString()}`,
        {
            method: 'get',
        }
    );
}

export const getBaseName = (caseName: string) => {
    const caseNameUrl = `${PREFIX_CASE_QUERIES}/v1/cases/caseBaseName?caseName=${encodeURIComponent(caseName)}`;
    console.info('Get base name for case', caseName);
    return backendFetchText(caseNameUrl, {
        method: 'GET',
    });
};

export function hasPermission(directoryUuid: UUID, permission: string) {
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/${directoryUuid}?permission=${permission}`;
    console.debug(url);
    return backendFetch(url, { method: 'head' })
        .then((response) => response.status === HTTP_OK)
        .catch(() => {
            console.info(`Permission to ${permission} in directory ${directoryUuid} denied`);
            return false;
        });
}

export function fetchDirectoryPermissions(directoryUuid: UUID): Promise<PermissionDTO[]> {
    console.info(`Fetching permissions for directory ${directoryUuid}`);
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/${directoryUuid}/permissions`;
    return backendFetchJson(url, {
        method: 'get',
    }) as Promise<PermissionDTO[]>;
}

export function updateDirectoryPermissions(directoryUuid: UUID, permissions: PermissionDTO[]): Promise<Response> {
    console.info(`Updating permissions for directory ${directoryUuid}`);
    const url = `${PREFIX_EXPLORE_SERVER_QUERIES}/v1/explore/directories/${directoryUuid}/permissions`;
    return backendFetch(url, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissions),
    });
}

export function fetchGroups(): Promise<GroupDTO[]> {
    console.info('Fetching groups from user-admin server');
    const url = `${PREFIX_USER_ADMIN_SERVER_QUERIES}/v1/groups`;
    return backendFetchJson(url, {
        method: 'get',
    }) as Promise<GroupDTO[]>;
}

// Function to check if user has MANAGE permission on directory
export function hasManagePermission(directoryUuid: UUID): Promise<boolean> {
    return hasPermission(directoryUuid, 'MANAGE');
}
