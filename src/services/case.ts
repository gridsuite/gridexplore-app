/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UUID } from 'crypto';
import { ApiService } from '@gridsuite/commons-ui';
import { getUser } from '../redux/store';

export default class CaseSvc extends ApiService {
    public constructor() {
        super(getUser, 'case');
    }

    public async createCaseWithoutDirectoryElementCreation(selectedFile: File) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('withExpiration', encodeURIComponent(true));
        return this.backendSendFetchJson<UUID>(`${this.getPrefix(1)}/cases`, 'POST', formData);
    }

    public async deleteCase(caseUuid: UUID) {
        await this.backendFetch(`${this.getPrefix(1)}/cases/${caseUuid}`, 'DELETE');
    }

    public async fetchConvertedCase(
        caseUuid: UUID,
        fileName: string,
        format: string,
        formatParameters: Record<string, unknown>,
        abortController: AbortController
    ) {
        return this.backendSendFetch(
            `${this.getPrefix(1)}/cases/${caseUuid}?format=${format}&fileName=${fileName}`,
            {
                method: 'POST',
                signal: abortController.signal,
            },
            JSON.stringify(formatParameters)
        );
    }

    public async downloadCase(caseUuid: UUID) {
        return this.backendFetchFile(`${this.getPrefix(1)}/cases/${caseUuid}`, 'GET');
    }

    /**
     * Retrieves the original name of a case using its UUID.
     * @param {string} caseUuid - The UUID of the element.
     * @returns {Promise<string|boolean>} - A promise that resolves to the original name of the case if found, or false if not found.
     */
    public async getCaseOriginalName(caseUuid: UUID) {
        try {
            return await this.backendFetchText(`/${this.getPrefix(1)}/cases/${caseUuid}/name`);
        } catch (error: any) {
            if (error.status === 404) {
                return false;
            } else {
                throw error;
            }
        }
    }
}
