import CountriesInput from "../../../../utils/countries-input";
import {COUNTRIES_1, COUNTRIES_2, NOMINAL_VOLTAGE_1, NOMINAL_VOLTAGE_2} from "../../../../utils/field-constants";
import RangeInput from "../../../../utils/range-input";
import {Grid} from "@mui/material";
import {gridItem} from "../../../../utils/dialog-utils";
import React from "@types/react";

const HvdcForm = ({

}) => {
    const countries1 = (
        <CountriesInput
            name={COUNTRIES_1}
            titleMessage={'Countries1'}
        />
    );

    const countries2 = (
        <CountriesInput
            name={COUNTRIES_2}
            titleMessage={'Countries2'}
        />
    );

    const nominalValue1Field = (
        <RangeInput
            name={NOMINAL_VOLTAGE_1}
        />
    );

    const nominalValue2Field = (
        <RangeInput
            name={NOMINAL_VOLTAGE_2}
        />
    );

    return (
        <Grid container item>
            {gridItem(countries1, 12)}
            {gridItem(countries2, 12)}
            {gridItem(nominalValue1Field, 12)}
            {gridItem(nominalValue2Field, 12)}
        </Grid>
    );
}

export default HvdcForm;