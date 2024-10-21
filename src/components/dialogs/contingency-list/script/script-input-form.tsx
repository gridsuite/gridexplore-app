/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { styled } from '@mui/material';
import { FieldConstants } from '@gridsuite/commons-ui';
import AceInput from '../../../utils/rhf-inputs/ace-input';

const StyledAceInput = styled(AceInput)({
    minWidth: '650px',
    minHeight: '450px',
    marginTop: '4px',
    flexGrow: 1,
});

export default function ScriptInputForm() {
    return (
        <StyledAceInput
            name={FieldConstants.SCRIPT}
            placeholder="Insert your groovy script here"
            editorProps={{ $blockScrolling: true }}
            fontSize="18px"
        />
    );
}
