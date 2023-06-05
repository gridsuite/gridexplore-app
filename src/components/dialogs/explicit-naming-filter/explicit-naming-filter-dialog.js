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
import { useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useSelector } from 'react-redux';
import {
    createFilter,
    elementExists,
    getFilterById,
    saveFilter,
} from '../../../utils/rest-api';
import {ElementType, FilterType} from '../../../utils/elementType';
import { useSnackMessage } from '@gridsuite/commons-ui';
import CustomMuiDialog from '../CustomMuiDialog';

const checkNameIsUnique = (name, activeDirectory) => {
    return new Promise((resolve) => {
        elementExists(activeDirectory, name, ElementType.FILTER).then((val) => resolve(!val));
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

const emptyFormData = {
    [NAME]: '',
    [EQUIPMENT_TYPE]: null,
    [EQUIPMENT_TABLE]: [],
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

    const schema = yup.object().shape({
        [NAME]: yup
            .string()
            .required()
            .nullable()
            .test('checkIfUniqueName', 'nameAlreadyUsed', (name) =>
                checkNameIsUnique(name, activeDirectory)
            ),
        [EQUIPMENT_TYPE]: yup.string().required().nullable(),
        [EQUIPMENT_TABLE]: yup
            .array()
            .min(1, 'At least one')
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
            }),
    });

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset } = methods;

    useEffect(() => {
        if (filterId) {
            getFilterById(filterId).then((response) => {
                if (response) {
                    reset({
                        [EQUIPMENT_ID]: filterId,
                        [EQUIPMENT_TYPE]: response?.equipmentType,
                        [EQUIPMENT_TABLE]: response?.filterEquipmentsAttributes,
                    });
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
        console.log('handle data validation : ', filter);
        onValidated && onValidated();
        if (filterId) {
            saveFilter({
                id: filterId,
                type: FilterType.EXPLICIT_NAMING,
                equipmentType: filter[EQUIPMENT_TYPE],
                filterEquipmentsAttributes: filter[EQUIPMENT_TABLE],
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
                    filterEquipmentsAttributes: filter[EQUIPMENT_TABLE],
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
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            schema={schema}
            methods={methods}
            titleId={titleId}
        >
            <ExplicitNamingFilterForm defaultEquipmentType={''} />
        </CustomMuiDialog>
    );
};

export default ExplicitNamingFilterDialog;
