/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Button } from '@mui/material';
import { useFormState } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { FunctionComponent, ReactNode } from 'react';

interface ISubmitButton {
    onClick: () => void;
    disabled?: boolean;
    children: ReactNode;
}

const SubmitButton: FunctionComponent<ISubmitButton> = ({
    onClick,
    disabled = false,
    children,
}) => {
    const { isDirty } = useFormState();

    return (
        <Button onClick={onClick} disabled={!isDirty || disabled}>
            {children ? children : <FormattedMessage id="validate" />}
        </Button>
    );
};

export default SubmitButton;
