import yup from '../../utils/yup-config';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
    DISTRIBUTION_KEY,
    EQUIPMENT_ID,
    EQUIPMENT_TABLE,
    EQUIPMENT_TYPE,
    NAME,
} from '../../utils/field-constants';
import { filterEquipmentDefinition } from '../../../utils/equipment-types';
import { useForm } from 'react-hook-form';
import ExplicitNamingFilterForm from './explicit-naming-filter-form';
import { useEffect, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useSelector } from 'react-redux';
import {
    createFilter,
    elementExists,
    getFilterById,
    saveFilter,
} from '../../../utils/rest-api';
import { ElementType, FilterType } from '../../../utils/elementType';
import { useSnackMessage } from '@gridsuite/commons-ui';
import CustomMuiDialog from '../CustomMuiDialog';

const checkNameIsUnique = (name, activeDirectory) => {
    if (!name) {
        return false;
    }
    return new Promise((resolve) => {
        elementExists(activeDirectory, name, ElementType.FILTER).then((val) =>
            resolve(!val)
        );
    });
};

const useStyles = makeStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        minHeight: '600px',
        margin: 'auto',
    },
}));

export const DEFAULT_EQUIPMENT_TABLE_ROWS = [{}, {}, {}, {}];
const emptyFormData = {
    [EQUIPMENT_ID]: null,
    [NAME]: '',
    [EQUIPMENT_TYPE]: null,
    [EQUIPMENT_TABLE]: DEFAULT_EQUIPMENT_TABLE_ROWS,
};
const ExplicitNamingFilterDialog = ({
    open,
    titleId,
    onValidated,
    onClose,
    filterId,
}) => {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const { snackError } = useSnackMessage();
    const [defaultEquipmentType, setDefaultEquipmentType] = useState('');

    const schema = yup.object().shape({
        [EQUIPMENT_ID]: yup.string().nullable(),
        [NAME]: yup
            .string()
            .when([EQUIPMENT_ID], {
                is: null,
                then: (schema) =>
                    schema
                        .required('nameEmpty')
                        .test('checkIfUniqueName', 'nameAlreadyUsed', (name) =>
                            checkNameIsUnique(name, activeDirectory)
                        ),
            })
            .nullable(),
        [EQUIPMENT_TYPE]: yup.string().required('noFilterTypeSelected'),
        [EQUIPMENT_TABLE]: yup
            .array()
            .min(1, 'emptyFilterError')
            .when([EQUIPMENT_TYPE], {
                is:
                    filterEquipmentDefinition.GENERATOR.type ||
                    filterEquipmentDefinition.LOAD.type,
                then: (schema) =>
                    schema.of(
                        yup.object().shape({
                            [EQUIPMENT_ID]: yup.string().nullable(),
                            [DISTRIBUTION_KEY]: yup.number().nullable(),
                        })
                    ),
                otherwise: (schema) =>
                    schema.of(
                        yup.object().shape({
                            [EQUIPMENT_ID]: yup.string().nullable(),
                        })
                    ),
            })
            .test('checkIfEmpty', 'emptyFilterError', (rows) => {
                const validValues = rows.filter((row) => row[EQUIPMENT_ID]);
                return validValues.length > 0;
            }),
    });

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset, setValue } = methods;

    useEffect(() => {
        if (filterId) {
            getFilterById(filterId).then((response) => {
                if (response) {
                    setDefaultEquipmentType(response?.equipmentType);
                    reset({
                        [NAME]: '',
                        [EQUIPMENT_ID]: filterId,
                        [EQUIPMENT_TYPE]: response?.equipmentType,
                        [EQUIPMENT_TABLE]: response?.filterEquipmentsAttributes,
                    }, {keepDefaultValues: false});
                }
            });
        }
    }, [filterId, reset]);

    const closeAndClear = (event) => {
        reset(emptyFormData, { keepDefaultValues: true });
        onClose(event);
    };

    const handleClose = (event) => {
        closeAndClear(event);
    };

    const onSubmit = (filter) => {

        let equipments = filter[EQUIPMENT_TABLE].filter((eq) => eq[EQUIPMENT_ID]);

        // we check if there is equipment with distribution key,
        // if we find one, we set all others' distribution keys that are null to 0
        const atLeastOnDistributionKey = equipments.some((eq) => eq[DISTRIBUTION_KEY] !== null);
        if (atLeastOnDistributionKey) {
            equipments = equipments.map((eq, index) => {
                if (!eq[DISTRIBUTION_KEY]) {
                    setValue(`${EQUIPMENT_TABLE}.${index}.${DISTRIBUTION_KEY}`, 0)
                }
                return eq;
            })
        }
        if (filterId) {
            saveFilter({
                id: filterId,
                type: FilterType.EXPLICIT_NAMING,
                equipmentType: filter[EQUIPMENT_TYPE],
                filterEquipmentsAttributes: equipments,
            })
                .then(() => {
                    handleClose();
                })
                .catch((errorMessage) =>
                    snackError({
                        messageTxt: errorMessage,
                        headerId: 'filterEditingError',
                        headerValues: { name: filter[NAME] },
                    })
                );
        } else {
            createFilter(
                {
                    type: FilterType.EXPLICIT_NAMING,
                    equipmentType: filter[EQUIPMENT_TYPE],
                    filterEquipmentsAttributes: equipments,
                },
                filter[NAME],
                activeDirectory
            )
                .then(() => {
                    handleClose();
                })
                .catch((errorMessage) =>
                    snackError({
                        messageTxt: errorMessage,
                        headerId: 'filterCreationError',
                        headerValues: { name: filter[NAME] },
                    })
                );
        }
    };

    return (
        <CustomMuiDialog
            name={EQUIPMENT_TABLE}
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            schema={schema}
            methods={methods}
            titleId={titleId}
            //disabledSave={}
        >
            <ExplicitNamingFilterForm
                defaultEquipmentType={defaultEquipmentType}
            />
        </CustomMuiDialog>
    );
};

export default ExplicitNamingFilterDialog;
