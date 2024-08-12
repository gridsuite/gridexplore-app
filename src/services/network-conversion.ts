/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApiService } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { getUser } from '../redux/store';

export type ExportFormats =
    | Record<
          string,
          {
              formatName: string;
              parameters: {
                  name: string;
                  type: string;
                  defaultValue: any;
                  possibleValues: any;
              }[];
          }
      >
    | [];

export default class NetworkConversionSvc extends ApiService {
    public constructor() {
        super(getUser, 'network-conversion');
    }

    public async getCaseImportParameters(caseUuid: UUID) {
        console.debug(`get import parameters for case '${caseUuid}' ...`);
        return this.backendFetchJson(`${this.getPrefix(1)}/cases/${caseUuid}/import-parameters`);
    }

    public async getExportFormats() {
        return this.backendFetchJson<ExportFormats>(`${this.getPrefix(1)}/export/formats`);
    }
}
