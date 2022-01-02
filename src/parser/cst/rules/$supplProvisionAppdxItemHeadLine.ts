import factory from "../factory";
import { $INLINE_EXCLUDE_TRAILING_SPACES } from "../../inline";
import { newStdEL } from "../../../law/std";
import $indents from "./$indents";
import { SupplProvisionAppdxItemHeadLine, LineType } from "../../../node/line";
import { $_EOL } from "../../lexical";
import { mergeAdjacentTexts } from "../util";


export const $supplProvisionAppdxItemHeadLine = factory
    .withName("supplProvisionAppdxItemHeadLine")
    .sequence(s => s
        .and(() => $indents, "indentsStruct")
        .and(r => r
            .choice(c => c
                .orSequence(s => s
                    .and(r => r.seqEqual(":suppl-provision-appdx:"), "control")
                    .action(({ control }) => {
                        return {
                            mainTag: "SupplProvisionAppdx",
                            titleTag: "SupplProvisionAppdxTitle",
                            control,
                            head: "",
                        } as const;
                    })
                )
                .orSequence(s => s
                    .and(r => r.seqEqual(":suppl-provision-appdx-table:"), "control")
                    .action(({ control }) => {
                        return {
                            mainTag: "SupplProvisionAppdxTable",
                            titleTag: "SupplProvisionAppdxTableTitle",
                            control,
                            head: "",
                        } as const;
                    })
                )
                .orSequence(s => s
                    .and(r => r.seqEqual(":suppl-provision-appdx-style:"), "control")
                    .action(({ control }) => {
                        return {
                            mainTag: "SupplProvisionAppdxStyle",
                            titleTag: "SupplProvisionAppdxStyleTitle",
                            control,
                            head: "",
                        } as const;
                    })
                )
                .orSequence(s => s
                    .and(r => r.regExp(/^[付附]則(?:別表)/), "head")
                    .action(({ head }) => {
                        return {
                            mainTag: "SupplProvisionAppdxTable",
                            titleTag: "SupplProvisionAppdxTableTitle",
                            control: "",
                            head,
                        } as const;
                    })
                )
            )
        , "headStruct")
        .and(() => $INLINE_EXCLUDE_TRAILING_SPACES, "tail")
        .and(() => $_EOL, "lineEndText")
        .action(({ indentsStruct, headStruct, tail, lineEndText, text }) => {
            const el = newStdEL(headStruct.mainTag);
            const inline = mergeAdjacentTexts([headStruct.head, ...tail]);
            if (inline.slice(-1)[0]?.tag === "__Parentheses" && inline.slice(-1)[0].attr.type === "round") {
                const numInline = inline.splice(-1, 1);
                el.append(newStdEL(headStruct.titleTag, {}, inline));
                el.append(newStdEL("RelatedArticleNum", {}, numInline));
            } else {
                el.append(newStdEL(headStruct.titleTag, {}, inline));
            }
            return {
                type: LineType.SPA,
                text: text(),
                ...indentsStruct,
                content: el,
                contentText: headStruct.control + el.text,
                lineEndText,
            } as SupplProvisionAppdxItemHeadLine;
        })
    )
    ;

export default $supplProvisionAppdxItemHeadLine;
