/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import VirtualizedTable from './util/virtualized-table';
import { useIntl } from 'react-intl';

const DirectoryContent = () => {
    const currentChildren = useSelector((state) => state.currentChildren);
    const intl = useIntl();

    useEffect(() => {
        console.log('DirectoryContent currentChildren', currentChildren);
    }, [currentChildren]);

    useEffect(() => {
        console.log('MOUNTED');
        return () => {
            console.log('UNMOUNTED');
        };
    }, []);

    return (
        <>
            {currentChildren && (
                <VirtualizedTable
                    rows={currentChildren}
                    columns={[
                        {
                            width: 300,
                            label: intl.formatMessage({ id: 'elementUuid' }),
                            dataKey: 'elementUuid',
                        },
                        {
                            width: 200,
                            label: intl.formatMessage({ id: 'elementName' }),
                            dataKey: 'elementName',
                        },
                        {
                            width: 200,
                            label: intl.formatMessage({ id: 'owner' }),
                            dataKey: 'owner',
                        },
                        {
                            width: 200,
                            label: intl.formatMessage({ id: 'type' }),
                            dataKey: 'type',
                        },
                    ]}
                />
            )}
        </>
    );
};

export default DirectoryContent;
