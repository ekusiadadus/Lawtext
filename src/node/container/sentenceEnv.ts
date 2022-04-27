import { Container, ContainerType } from ".";
import { isIgnoreAnalysis } from "../../analyzer/common";
import { SentenceEnvsStruct } from "../../analyzer/getSentenceEnvs";
import * as std from "../../law/std";
import { EL } from "../el";
import { __MismatchEndParenthesis, __MismatchStartParenthesis, __PEnd, __PStart, __Text, ____Declaration, ____LawNum, ____PointerRanges, ____VarRef } from "../el/controls";

export interface SentenceTextPos {
    sentenceIndex: number,
    textOffset: number,
}

export interface SentenceTextRange {
    start: SentenceTextPos,
    end: SentenceTextPos, // half open
}

const pushRange = (ranges: SentenceTextRange[], range: SentenceTextRange) => {
    if (ranges.length === 0) {
        ranges.push(range);
    } else {
        const lastRange = ranges[ranges.length - 1];
        if (lastRange.end.sentenceIndex === range.start.sentenceIndex && lastRange.end.textOffset === range.start.textOffset) {
            lastRange.end = range.end;
        } else {
            ranges.push(range);
        }
    }
};

export const toSentenceTextRanges = (
    origContainerIDRanges: readonly (string | [from:string, toIncluded:string])[],
    sentenceEnvsStruct: SentenceEnvsStruct,
    following?: SentenceTextPos | null,
) => {
    const origRanges: SentenceTextRange[] = [];
    for (const containerIDRange of origContainerIDRanges) {
        const [from, toIncluded] = Array.isArray(containerIDRange) ? containerIDRange : [containerIDRange, undefined];
        if (toIncluded) {
            const fromContainer = sentenceEnvsStruct.containers.get(from);
            const toContainer = sentenceEnvsStruct.containers.get(toIncluded);
            if (fromContainer && toContainer) {
                pushRange(origRanges, {
                    start: {
                        sentenceIndex: fromContainer.sentenceRange[0],
                        textOffset: 0,
                    },
                    end: {
                        sentenceIndex: toContainer.sentenceRange[1],
                        textOffset: 0,
                    },
                });
            }
        } else {
            const container = sentenceEnvsStruct.containers.get(from);
            if (container) {
                if (container.type === ContainerType.ROOT) {
                    // "この法律" does not contain SupplProvision of other amendments.
                    for (const rootChild of container.children) {
                        if (std.isSupplProvision(rootChild.el) && rootChild.el.attr.AmendLawNum) {
                            continue;
                        }
                        pushRange(origRanges, {
                            start: {
                                sentenceIndex: rootChild.sentenceRange[0],
                                textOffset: 0,
                            },
                            end: {
                                sentenceIndex: rootChild.sentenceRange[1],
                                textOffset: 0,
                            },
                        });
                    }

                } else {
                    pushRange(origRanges, {
                        start: {
                            sentenceIndex: container.sentenceRange[0],
                            textOffset: 0,
                        },
                        end: {
                            sentenceIndex: container.sentenceRange[1],
                            textOffset: 0,
                        },
                    });
                }
            }
        }
    }

    if (following) {

        const ranges: SentenceTextRange[] = [];
        for (const origRange of origRanges) {
            if (origRange.end.sentenceIndex === following.sentenceIndex) {
                if (origRange.end.textOffset < following.textOffset) {
                    continue;
                }
            } else if (origRange.end.sentenceIndex < following.sentenceIndex) {
                continue;
            }

            const range = { start: { ...origRange.start }, end: { ...origRange.end } };
            if (range.start.sentenceIndex === following.sentenceIndex) {
                if (range.start.textOffset < following.textOffset) {
                    Object.assign(range.start, following);
                }
            } else if (range.start.sentenceIndex < following.sentenceIndex) {
                Object.assign(range.start, following);
            }
            ranges.push(range);
        }
        return ranges;
    } else {
        return origRanges;
    }
};

export const sentenceTextTags = [
    "Ruby",
    "QuoteStruct",
    "__Text",
    "__PStart",
    "__PEnd",
    "__MismatchStartParenthesis",
    "__MismatchEndParenthesis",
    "____PointerRanges",
    "____LawNum",
    "____Declaration",
    "____VarRef",
] as const;

export type SentenceText = (
    | std.Ruby
    | std.QuoteStruct
    | __Text
    | __PStart
    | __PEnd
    | __MismatchStartParenthesis
    | __MismatchEndParenthesis
    | ____PointerRanges
    | ____LawNum
    | ____Declaration
    | ____VarRef
);

export const isSentenceText = (el: EL | string): el is SentenceText =>
    typeof el !== "string" && (sentenceTextTags as readonly string[]).includes(el.tag);

export const textOfSentenceText = (el: SentenceText): string => {
    if (el.tag === "Ruby") {
        return el.children.map(c => {
            if (typeof c === "string") {
                return c;
            } else if (c instanceof __Text) {
                return c.text();
            } else {
                return "";
            }
        }).join("");
    } else {
        return el.text();
    }
};

export function *enumerateSentenceTexts(el: EL): Iterable<SentenceText> {
    if (isSentenceText(el)) {
        yield el;
    } else if (!isIgnoreAnalysis(el)) {
        for (const child of el.children) {
            if (typeof child === "string") continue;
            yield *enumerateSentenceTexts(child);
        }
    }
}

export type SentenceLike = (
    | std.Sentence
);

export const sentenceLikeTags = ["Sentence"] as const;

export const isSentenceLike = (el: EL | string): el is SentenceLike =>
    typeof el !== "string" && (sentenceLikeTags as readonly string[]).includes(el.tag);

export interface SentenceEnvOptions {
    index: number,
    el: SentenceLike,
    lawType: string,
    parentELs: EL[],
    container: Container,
}

export class SentenceEnv {
    public readonly index: number;
    public readonly el: SentenceLike;
    public lawType: string;
    public parentELs: EL[];
    public container: Container;
    private _text: string;

    public get text(): string { return this._text; }

    constructor(options: SentenceEnvOptions) {
        const { index, el, lawType, parentELs, container } = options;

        this.index = index;
        this.el = el;
        this.lawType = lawType;
        this.parentELs = parentELs;
        this.container = container;

        this._text = [...enumerateSentenceTexts(el)].map(textOfSentenceText).join("");
    }

    public textRageOfEL(el: EL): [number, number] | null {
        if (isSentenceText(el)) {
            let offset = 0;
            for (const sentenceText of enumerateSentenceTexts(this.el)) {
                const length = textOfSentenceText(sentenceText).length;
                if (sentenceText === el) {
                    return [offset, offset + length];
                }
                offset += length;
            }
            return null;
        } else {
            const targetSentenceTexts = [...enumerateSentenceTexts(el)];
            const firstTarget = targetSentenceTexts[0];
            const lastTarget = targetSentenceTexts[targetSentenceTexts.length - 1];
            let offset = 0;
            let start: number | null = null;
            for (const sentenceText of enumerateSentenceTexts(this.el)) {
                const length = textOfSentenceText(sentenceText).length;
                if (sentenceText === firstTarget) {
                    start = offset;
                }
                if (sentenceText === lastTarget) {
                    return ((start !== null) && [start, offset + length]) || null;
                }
                offset += length;
            }
            return null;
        }
    }

    // public with(options: Partial<SentenceEnvOptions>): SentenceEnv {
    //     const {
    //         el = this.el,
    //         lawType = this.lawType,
    //         parentELs = this.parentELs,
    //         container = this.container,
    //     } = options;
    //     return new SentenceEnv({ el, lawType, parentELs, container });
    // }
}
