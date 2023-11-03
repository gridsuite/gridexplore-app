/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CombinatorSelectorProps } from 'react-querybuilder';
import React, { useCallback, useState } from 'react';
import PopupConfirmationDialog from '../popup-confirmation-dialog';
import { MaterialValueSelector } from '@react-querybuilder/material';

const CombinatorSelector = (props: CombinatorSelectorProps) => {
    const [tempCombinator, setTempCombinator] = useState(props.value);
    const [openPopup, setOpenPopup] = useState(false);

    const handlePopupConfirmation = useCallback(() => {
        props.handleOnChange(tempCombinator);
        setOpenPopup(false);
    }, [props, tempCombinator]);

    return (
        <>
            <PopupConfirmationDialog
                message={'changeOperatorMessage'}
                openConfirmationPopup={openPopup}
                setOpenConfirmationPopup={setOpenPopup}
                handlePopupConfirmation={handlePopupConfirmation}
            />
            <MaterialValueSelector
                {...props}
                handleOnChange={(newCombinator) => {
                    setTempCombinator(newCombinator);
                    setOpenPopup(true);
                }}
            />
        </>
    );
};
export default CombinatorSelector;
