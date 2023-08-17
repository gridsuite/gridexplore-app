/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';

const styles = {
    midFormErrorMessage: (theme) => ({
        color: theme.palette.error.main,
        fontSize: 'small',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
    }),
};

// component to display error message in the middle of dialogue
const MidFormError = ({ message }) => {
    return <Box sx={styles.midFormErrorMessage}>{message}</Box>;
};

export default MidFormError;
