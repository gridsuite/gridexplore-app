/*
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UUID } from 'crypto';
import { DirectoryComSvc, Paginated } from '@gridsuite/commons-ui';
import { getUser } from '../redux/store';
import { ElementAttributesES } from '../redux/reducer';

export default class DirectorySvc extends DirectoryComSvc {
    public constructor() {
        super(getUser);
    }

    public async insertDirectory(directoryName: string, parentUuid: UUID, owner: unknown) {
        console.debug("Inserting a new folder '%s'", directoryName);
        return this.backendSendFetchJson(
            `${this.getPrefix(1)}/directories/${parentUuid}/elements`,
            'POST',
            JSON.stringify({
                elementUuid: null,
                elementName: directoryName,
                type: 'DIRECTORY',
                owner: owner,
            })
        );
    }

    public async insertRootDirectory(directoryName: string, owner: unknown) {
        console.debug("Inserting a new root folder '%s'", directoryName);
        return this.backendSendFetchJson(
            `${this.getPrefix(1)}/root-directories`,
            'POST',
            JSON.stringify({
                elementName: directoryName,
                owner: owner,
            })
        );
    }

    public async getNameCandidate(directoryUuid: UUID, elementName: string, type: unknown) {
        return this.backendFetchText(
            `${this.getPrefix(1)}/directories/${directoryUuid}/${elementName}/newNameCandidate?type=${type}`
        );
    }

    public async rootDirectoryExists(directoryName: string) {
        const response = await this.backendFetch(
            `${this.getPrefix(1)}/root-directories?${new URLSearchParams({ directoryName: directoryName })}`,
            'HEAD'
        );
        return response.status !== 204; // HTTP 204 : No-content
    }

    public async searchElementsInfos(searchTerm: string, currentDirectoryUuid: UUID) {
        console.debug("Fetching elements infos matching with '%s' term ... ", searchTerm);
        const urlSearchParams = new URLSearchParams();
        urlSearchParams.append('userInput', searchTerm);
        urlSearchParams.append('directoryUuid', currentDirectoryUuid);
        return this.backendFetchJson<Paginated<ElementAttributesES>>(
            `${this.getPrefix(1)}/elements/indexation-infos?${urlSearchParams}`
        );
    }
}
