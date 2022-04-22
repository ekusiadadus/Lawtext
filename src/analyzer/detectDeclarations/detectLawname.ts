// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sha512 from "hash.js/lib/hash/sha/512";
import { LAWNUM_TABLE, KEY_LENGTH } from "../../law/lawNumTable";
import { Span } from "../../node/span";
import { EL } from "../../node/el";
import getScope from "../getScope";
import { SpanTextPos } from "../../node/span/spanTextPos";
import { ____Declaration } from "../../node/el/controls/declaration";

export const getLawNameLength = (lawNum: string): number => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const digest = sha512().update(lawNum).digest("hex") as string;
    const key = parseInt(digest.slice(0, KEY_LENGTH), 16);
    return LAWNUM_TABLE[key];
};


export const detectLawname = (spans: Span[], spanIndex: number) => {
    if (spans.length <= spanIndex + 3) return null;
    const [
        lawnameSpan,
        startSpan,
        lawnumSpan,
    ] = spans.slice(spanIndex, spanIndex + 3);

    if (!(
        startSpan.el.tag === "__PStart" &&
        startSpan.el.attr.type === "round"
    )) return null;

    const match = /^(?:明治|大正|昭和|平成|令和)[元〇一二三四五六七八九十]+年\S+?第[〇一二三四五六七八九十百千]+号/.exec(lawnumSpan.text);
    if (!match) return null;

    const lawNum = match[0];
    const lawnameLength = getLawNameLength(lawNum);
    const lawnameTextIndex = lawnameSpan.text.length - lawnameLength;
    const lawName = lawnameSpan.text.slice(lawnameTextIndex);

    const lawNumRange = lawnumSpan.el.range ? [
        lawnumSpan.el.range[0] + match.index,
        lawnumSpan.el.range[0] + match.index + lawNum.length,
    ] as [number, number] : null;

    const lawnumEl = new EL("____LawNum", {}, [lawNum], lawNumRange);

    if (
        lawnumSpan.text.length <= lawNum.length &&
        lawnumSpan.index + 1 < spans.length
    ) {

        const afterSpan = spans[lawnumSpan.index + 1];

        if (
            afterSpan.el.tag === "__PEnd" &&
            afterSpan.el.attr.type === "round"
        ) {
            const scope = [
                {
                    startSpanIndex: afterSpan.index + 1,
                    startTextIndex: 0,
                    endSpanIndex: spans.length, // half open
                    endTextIndex: 0, // half open
                },
            ];

            const namePos: SpanTextPos = {
                spanIndex: lawnameSpan.index,
                textIndex: lawnameTextIndex,
                length: lawnameLength,
                range: lawnameSpan.el.range,
            };

            const range = lawnameSpan.el.range ? [
                lawnameSpan.el.range[0] + lawnameTextIndex,
                lawnameSpan.el.range[0] + lawnameTextIndex + lawnameLength,
            ] as [number, number] : null;

            const declaration = new ____Declaration({
                type: "LawName",
                name: lawName,
                value: lawNum,
                scope: scope,
                namePos: namePos,
                range,
            });

            lawnameSpan.el.replaceSpan(lawnameTextIndex, lawnameTextIndex + lawnameLength, declaration);
            lawnumSpan.el.replaceSpan(0, lawNum.length, lawnumEl);

            return declaration;
        }

    } else if (
        lawNum.length < lawnumSpan.text.length &&
        lawnumSpan.text[lawNum.length] === "。" &&
        lawnumSpan.index + 5 < spans.length
    ) {
        const [
            nameStartSpan,
            nameSpan,
            nameEndSpan,
            nameAfterSpan,
        ] = spans.slice(lawnumSpan.index + 1, lawnumSpan.index + 5);

        const scopeMatch = /^(以下)?(?:([^。]+?)において)?(?:単に)?$/.exec(lawnumSpan.text.slice(lawNum.length + 1));
        const nameAfterMatch = /^という。/.exec(nameAfterSpan.text);
        if (
            scopeMatch &&
            nameStartSpan.el.tag === "__PStart" &&
            nameStartSpan.el.attr.type === "square" &&
            nameEndSpan.el.tag === "__PEnd" &&
            nameEndSpan.el.attr.type === "square" &&
            nameAfterMatch
        ) {
            const following = scopeMatch[1] !== undefined;
            const scopeText = scopeMatch[2] || null;

            const scope = scopeText
                ? getScope(lawnumSpan, scopeText, following, nameAfterSpan.index)
                : [
                    {
                        startSpanIndex: nameAfterSpan.index,
                        startTextIndex: 0,
                        endSpanIndex: spans.length,
                        endTextIndex: 0,
                    },
                ];

            const namePos: SpanTextPos = {
                spanIndex: nameSpan.index,
                textIndex: 0,
                length: nameSpan.text.length,
                range: nameSpan.el.range,
            };

            const range = lawnameSpan.el.range ? [
                lawnameSpan.el.range[0] + lawnameTextIndex,
                lawnameSpan.el.range[0] + lawnameTextIndex + lawnameLength,
            ] as [number, number] : null;

            const declaration = new ____Declaration({
                type: "LawName",
                name: nameSpan.text,
                value: lawNum,
                scope: scope,
                namePos: namePos,
                range,
            });

            lawnameSpan.el.replaceSpan(lawnameTextIndex, lawnameTextIndex + lawnameLength, new EL("____DeclarationVal", {}, [lawName]));
            nameSpan.el.replaceSpan(0, nameSpan.text.length, declaration);
            lawnumSpan.el.replaceSpan(0, lawNum.length, lawnumEl);
            return declaration;
        }
    }
    return null;

};

export default detectLawname;
