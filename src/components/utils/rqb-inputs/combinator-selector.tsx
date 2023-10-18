/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CombinatorSelectorProps } from 'react-querybuilder';
import React, { useState } from 'react';
import PopupConfirmationDialog from '../popup-confirmation-dialog';
import { MaterialValueSelector } from '@react-querybuilder/material';

const CombinatorSelector = (props: CombinatorSelectorProps) => {
    const [tempC, setTempC] = useState(props.value);
    const [openPopup, setOpenPopup] = useState(false);

    const handlePopupConfirmation = () => {
        props.handleOnChange(tempC);
        setOpenPopup(false);
    };
    return (
        <>
            <PopupConfirmationDialog
                message={'changeOperatorMessage'}
                openConfirmationPopup={openPopup}
                setOpenConfirmationPopup={setOpenPopup}
                handlePopupConfirmation={handlePopupConfirmation}
            />
            <MaterialValueSelector
                handleOnChange={(newC) => {
                    setTempC(newC);
                    setOpenPopup(true);
                }}
                className={props.className}
                level={props.level}
                options={props.options}
                path={props.path}
                schema={props.schema}
                value={props.value}
                title={props.title}
                disabled={props.disabled}
                validation={props.validation}
                rules={props.rules}
                testID={props.testID}
                context={props.context}
            />
        </>
    );
};
export default CombinatorSelector;
