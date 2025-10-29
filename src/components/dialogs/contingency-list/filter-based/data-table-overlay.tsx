/*
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage } from 'react-intl';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { Refresh } from '@mui/icons-material';

export function DataTableOverlay({ loading, ...buttonProps }: Readonly<{ loading: boolean } & ButtonProps>) {
    return loading ? (
        <CircularProgress />
    ) : (
        <Button variant="outlined" size="large" startIcon={<Refresh />} {...buttonProps}>
            <FormattedMessage id="reload" />
        </Button>
    );
}
