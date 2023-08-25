/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

global.IS_REACT_ACT_ENVIRONMENT = true;

// make crypto.randomUUID() available in tests
import crypto from 'crypto';

window.crypto = {
    randomUUID: function () {
        return crypto.randomUUID();
    },
};