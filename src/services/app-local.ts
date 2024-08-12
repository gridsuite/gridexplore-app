/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AppLocalComSvc, Env } from '@gridsuite/commons-ui';

export type EnvJson = Env & typeof import('../../public/env.json');

export default class AppLocalSvc extends AppLocalComSvc {
    public constructor() {
        super();
    }

    public async fetchEnv() {
        return (await super.fetchEnv()) as EnvJson;
    }
}
