/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef, ReactNode, useImperativeHandle } from 'react';
import { useWatch } from 'react-hook-form';

interface TableCellWrapperProps {
    name: string;
    children: ReactNode;
}

const TableCellWrapper = forwardRef(({ name, children }: TableCellWrapperProps, agGridRef) => {
    const watchValues = useWatch({
        name,
    });

    useImperativeHandle(
        agGridRef,
        () => {
            return {
                getValue: () => {
                    return watchValues;
                },
            };
        },
        [watchValues]
    );

    return <>{children}</>;
});

export default TableCellWrapper;
