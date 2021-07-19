/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_NAME, getAppName } from './config-params';
import { store } from '../redux/store';
import ReconnectingWebSocket from 'reconnecting-websocket';

let PREFIX_CONFIG_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/config-notification';
let PREFIX_CONFIG_QUERIES = process.env.REACT_APP_API_GATEWAY + '/config';
let PREFIX_DIRECTORY_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/directory';
const PREFIX_STUDY_QUERIES = process.env.REACT_APP_API_GATEWAY + '/study';
const PREFIX_CASE_QUERIES = process.env.REACT_APP_API_GATEWAY + '/case';
const PREFIX_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/notification';

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

export function deleteDirectory(elementUuid) {
    console.info("Deleting element %s'", elementUuid);
    const fetchParams =
        PREFIX_DIRECTORY_SERVER_QUERIES + `/v1/directories/${elementUuid}`;
    return backendFetch(fetchParams, {
        method: 'delete',
    });
}

export function renameDirectory(elementUuid, newName) {
    console.info("Deleting element %s'", elementUuid);
    const renameDirectoryUrl =
        PREFIX_DIRECTORY_SERVER_QUERIES +
        `/v1/directories/${elementUuid}/rename/${newName}`;
    return backendFetch(renameDirectoryUrl, {
        method: 'put',
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

export function fetchStudiesInfos(uuids) {
    console.info('Fetching studies metadata ... ');
    const fetchStudiesInfosUrl = PREFIX_STUDY_QUERIES + `/v1/studies/metadata`;
    return backendFetch(fetchStudiesInfosUrl, {
        method: 'GET',
        headers: {
            uuids: uuids,
        },
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
            PREFIX_STUDY_QUERIES +
            '/v1/studies/' +
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
            PREFIX_STUDY_QUERIES +
            '/v1/studies/' +
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
        '/notify?updateType=studies';

    let webSocketUrlWithToken;
    webSocketUrlWithToken = webSocketUrl + '&access_token=' + getToken();

    const reconnectingWebSocket = new ReconnectingWebSocket(
        webSocketUrlWithToken
    );
    reconnectingWebSocket.onopen = function (event) {
        console.info(
            'Connected Websocket update studies' + webSocketUrl + ' ...'
        );
    };
    return reconnectingWebSocket;
}
