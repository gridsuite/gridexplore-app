/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as constants from '../../utils/UIconstants';

import Dialog from '@mui/material/Dialog';

export const BaseDialog = (props) => {
    const { open, handleClose, ariaLabel, handleKeyPressed } = props;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby={ariaLabel}
            onKeyPress={handleKeyPressed}
            //Call to stopPropagation in order to prevent contextual menu to appear
            onContextMenu={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
                if (e.button === constants.MOUSE_EVENT_RIGHT_BUTTON) {
                    e.stopPropagation();
                }
            }}
        >
            {props.children}
        </Dialog>
    );
};
