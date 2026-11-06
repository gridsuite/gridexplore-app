/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ContingencyListEquipment, EquipmentType } from '@gridsuite/commons-ui';
import { Info } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { FormattedMessage } from 'react-intl';

interface EquipmentTypeLabelProps {
    equipment: ContingencyListEquipment;
}

function EquipmentTypeLabel({ equipment }: Readonly<EquipmentTypeLabelProps>) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FormattedMessage id={equipment.id !== EquipmentType.SWITCH ? equipment.label : 'CouplingSwitches'} />
            {equipment.id === EquipmentType.SWITCH && (
                <Tooltip title={<FormattedMessage id="infoContingencyCoupler" />}>
                    <Info fontSize="small" color="info" onClick={(event) => event.stopPropagation()} />
                </Tooltip>
            )}
        </Box>
    );
}

export default EquipmentTypeLabel;
