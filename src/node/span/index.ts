import { Env } from "../container/env";
import { __PEnd, __PStart, __Text, ____PointerRanges, ____LawNum } from "../el/controls";
import * as std from "../../law/std";
import { EL } from "../el";

export const spanTags = [
    "Ruby",
    "__Text",
    "__PStart",
    "__PEnd",
    "____PointerRanges",
    "____LawNum",
] as const;

export type SpanEL = (
    | std.Ruby
    | __Text
    | __PStart
    | __PEnd
    | ____PointerRanges
    | ____LawNum
);

export const isSpanEL = (el: EL | string): el is SpanEL =>
    typeof el !== "string" && (spanTags as readonly string[]).includes(el.tag);

export interface SpanOptions {
    index: number,
    el: SpanEL,
    env: Env,
}

export class Span {
    public index: number;
    public el: SpanEL;
    public env: Env;
    constructor(options: SpanOptions) {
        const { index, el, env } = options;
        this.index = index;
        this.el = el;
        this.env = env;
    }
}
