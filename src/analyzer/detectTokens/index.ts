import * as std from "../../law/std";
import { __Text, ____LawNum, ____PointerRanges } from "../../node/el/controls";
import { ErrorMessage } from "../../parser/cst/error";
import { WithErrorValue } from "../../parser/std/util";
import { isIgnoreAnalysis } from "../common";
import { SentenceEnvsStruct } from "../getSentenceEnvs";
import matchLawNum from "./matchLawNum";
import { matchPointerRanges } from "./matchPointerRanges";

export interface TokensStruct {
    pointerRangesList: ____PointerRanges[],
    lawNums: ____LawNum[],
}


export const detectTokensByEL = (elToBeModified: std.StdEL | std.__EL): WithErrorValue<TokensStruct> => {

    const pointerRangesList: ____PointerRanges[] = [];
    const lawNums: ____LawNum[] = [];
    const errors: ErrorMessage[] = [];

    for (let childIndex = 0; childIndex < elToBeModified.children.length; childIndex++) {

        const child = elToBeModified.children[childIndex];

        if (isIgnoreAnalysis(child)) {
            continue;

        } else if (typeof child === "string") {
            continue;

        } else if (child instanceof __Text) {

            {
                // match before pointerRanges
                const match = matchLawNum(child);
                if (match) {
                    lawNums.push(match.value.lawNum);
                    errors.push(...match.errors);

                    elToBeModified.children.splice(
                        childIndex,
                        1,
                        ...match.value.newItems,
                    );

                    childIndex += match.value.proceedOffset - 1;
                    continue;
                }
            }

            {
                const match = matchPointerRanges(child);
                if (match) {
                    pointerRangesList.push(match.value.pointerRanges);
                    errors.push(...match.errors);

                    elToBeModified.children.splice(
                        childIndex,
                        1,
                        ...match.value.newItems,
                    );

                    childIndex += match.value.proceedOffset - 1;
                    continue;
                }
            }

        } else {
            const newResult = detectTokensByEL(child as std.StdEL | std.__EL);
            pointerRangesList.push(...newResult.value.pointerRangesList);
            lawNums.push(...newResult.value.lawNums);
            errors.push(...newResult.errors);
        }
    }

    return {
        value: {
            pointerRangesList,
            lawNums,
        },
        errors,
    };
};


export const detectTokens = (sentenceEnvsStruct: SentenceEnvsStruct): WithErrorValue<TokensStruct> => {

    const pointerRangesList: ____PointerRanges[] = [];
    const lawNums: ____LawNum[] = [];
    const errors: ErrorMessage[] = [];

    for (const sentenceEnv of sentenceEnvsStruct.sentenceEnvs) {
        const newResult = detectTokensByEL(sentenceEnv.el);
        pointerRangesList.push(...newResult.value.pointerRangesList);
        lawNums.push(...newResult.value.lawNums);
        errors.push(...newResult.errors);
    }

    return {
        value: {
            pointerRangesList,
            lawNums,
        },
        errors,
    };
};

export default detectTokens;
