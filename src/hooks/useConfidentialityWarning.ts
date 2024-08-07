/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { fetchEnv } from '@gridsuite/commons-ui';

export const useConfidentialityWarning = () => {
    const [confidentialityWarning, setConfidentialityWarning] = useState<string>();

    useEffect(() => {
        fetchEnv().then((res) => {
            setConfidentialityWarning(res?.confidentialityMessageKey);
        });
    }, []);

    return confidentialityWarning;
};
