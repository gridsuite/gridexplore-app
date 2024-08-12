/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApiService } from '@gridsuite/commons-ui';
import { getUser } from '../redux/store';
import { getContingencyUriParamType } from './utils';
import { ContingencyListTypeIds } from '../utils/elementType';

export default class ActionsSvc extends ApiService {
    public constructor() {
        super(getUser, 'actions');
    }

    /**
     * Get contingency list by type and id
     * @returns {Promise<unknwon>}
     */
    public async getContingencyList(type: ContingencyListTypeIds, id: string) {
        return this.backendFetchJson(`${this.getPrefix(1)}/${getContingencyUriParamType(type)}/${id}`);
    }
}
