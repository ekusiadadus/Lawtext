"use strict";

import * as sha512 from "hash.js/lib/hash/sha/512";
import * as parser from "./parser";
import { EL } from "./util";
import { LAWNUM_TABLE } from "./lawnum_table";
import { isString } from "util";

export function get_law_name_length(law_num) {
    let digest = sha512().update(law_num).digest("hex");
    let key = parseInt(digest.slice(0, 7), 16);
    return LAWNUM_TABLE[key];
}

var toplevel_container_tags = [
    "EnactStatement", "MainProvision", "AppdxTable", "AppdxStyle",
];

var article_container_tags = [
    "Part", "Chapter", "Section", "Subsection", "Division",
];

var span_container_tags = [
    "Article", "Paragraph",
    "Item", "Subitem1", "Subitem2", "Subitem3",
    "Subitem4", "Subitem5", "Subitem6",
    "Subitem7", "Subitem8", "Subitem9",
    "Subitem10",
    "Table", "TableRow", "TableColumn",
];

var container_tags = (<Array<string>>[])
    .concat(toplevel_container_tags)
    .concat(article_container_tags)
    .concat(span_container_tags);

var ignore_span_tag = [
    "LawNum", "LawTitle",
    "TOC",
    "ArticleTitle", "ParagraphNum", "ItemTitle",
    "Subitem1Title", "Subitem2Title", "Subitem3Title",
    "Subitem4Title", "Subitem5Title", "Subitem6Title",
    "Subitem7Title", "Subitem8Title", "Subitem9Title",
    "Subitem10Title",
    "SupplProvision",
];

class Env {
    law_type: string
    container_stack: Array<EL>
    parents: Array<EL>
    constructor(law_type: string, container_stack: Array<EL> = [], parents: Array<EL> = []) {
        this.law_type = law_type;
        this.container_stack = container_stack;
        this.parents = parents;
    }

    copy() {
        return new Env(
            this.law_type,
            this.container_stack.slice(),
            this.parents.slice(),
        );
    }
}

class Span {
    index: number
    el: EL
    env: Env
    text: string
    constructor(index, el, env) {
        this.index = index;
        this.el = el;
        this.env = env;

        this.text = el.text;
    }
}

function extract_spans(law: EL): [Array<Span>, Array<[EL, [number, number]]>] {

    let spans: Array<Span> = [];
    let containers: Array<[EL, [number, number]]> = [];

    let extract = (el: EL, _env: Env) => {

        if (!el.tag) return;

        if (ignore_span_tag.indexOf(el.tag) >= 0) return;

        let env = _env.copy();

        let is_mixed = false;
        for (let subel of el.children) {
            if (typeof subel === "string") {
                is_mixed = true;
                break;
            }
        }

        if (is_mixed && el.children.length !== 1) {
            console.error(`unexpected mixed content! ${JSON.stringify(el)}`);
        }

        if (is_mixed) {
            el.attr.span_index = String(spans.length);
            spans.push(new Span(spans.length, el, env));
        } else {
            env.parents.push(el);
            let is_container = container_tags.indexOf(el.tag) >= 0;
            if (is_container) {
                env.container_stack.push(el);
            }

            let start_span_index = spans.length;
            for (let subel of el.children) {
                if (isString(subel)) continue;
                extract(subel, env);
            }
            let end_span_index = spans.length; // half open

            if (is_container) {
                containers.push([
                    el,
                    [start_span_index, end_span_index],
                ]);
            }
        }
    };

    extract(law, new Env(law.attr.LawType));

    return [spans, containers];
}

class Pos {
    span: Span
    span_index: number
    text_index: number
    length: number
    env: Env
    constructor(span: Span, span_index: number, text_index: number, length: number, env: Env) {
        this.span = span
        this.span_index = span_index
        this.text_index = text_index
        this.length = length
        this.env = env
    }
}

class ____Declaration extends EL {
    type: string
    name: string
    scope: Array<ScopeRange>
    value: string | null
    name_pos: Pos
    constructor(type: string, name: string, value: string | null, scope: Array<ScopeRange>, name_pos: Pos) {
        super("____Declaration");

        this.type = type;
        this.name = name;
        this.value = value;
        this.scope = scope;
        this.name_pos = name_pos;

        this.attr.type = type;
        this.attr.name = name;
        if (value !== null) this.attr.value = value;
        this.attr.scope = JSON.stringify(scope);
        this.attr.name_pos = JSON.stringify({
            span_index: name_pos.span_index,
            text_index: name_pos.text_index,
            length: name_pos.length,
        });

        this.append(name);
    }
}

class ScopeRange {
    start_span_index: number
    start_text_index: number
    end_span_index: number
    end_text_index: number
    constructor(
        start_span_index: number,
        start_text_index: number,
        end_span_index: number, // half open
        end_text_index: number, // half open
    ) {
        this.start_span_index = start_span_index;
        this.start_text_index = start_text_index;
        this.end_span_index = end_span_index;
        this.end_text_index = end_text_index;
    }
}

class ____VarRef extends EL {
    ref_name: string
    declaration: ____Declaration
    ref_pos: Pos
    constructor(ref_name: string, declaration: ____Declaration, ref_pos: Pos) {
        super("____VarRef");

        this.ref_name = ref_name;
        this.declaration = declaration;
        this.ref_pos = ref_pos;

        this.attr.ref_declaration_index = declaration.attr.declaration_index;

        this.append(ref_name);
    }
}

class Declarations {
    declarations: Array<____Declaration>
    constructor() {
        this.declarations = [];
    }

    *iterate(span_index: number): IterableIterator<____Declaration> {
        for (let declaration of this.declarations) {
            if (
                declaration.scope.some(range =>
                    range.start_span_index <= span_index &&
                    span_index < range.end_span_index
                )
            ) {
                yield declaration;
            }
        }
    }

    add(declaration: ____Declaration) {
        this.declarations.push(declaration);
    }

    get length(): number {
        return this.declarations.length;
    }

    get(index: number): ____Declaration {
        return this.declarations[index];
    }
}

function detect_declarations(law: EL, spans: Array<Span>) {

    let detect_lawname = (spans: Array<Span>, span_index: number) => {
        if (spans.length <= span_index + 3) return;
        let [
            lawname_span,
            start_span,
            lawnum_span,
        ] = spans.slice(span_index, span_index + 3);

        if (!(
            start_span.el.tag === "__PStart" &&
            start_span.el.attr.type === "round"
        )) return;

        let match = lawnum_span.text.match(/^(?:明治|大正|昭和|平成)[元〇一二三四五六七八九十]+年\S+?第[〇一二三四五六七八九十百千]+号/);
        if (!match) return;

        let law_num = match[0];
        let lawname_length = get_law_name_length(law_num);
        let lawname_text_index = lawname_span.text.length - lawname_length;
        let law_name = lawname_span.text.slice(lawname_text_index);

        let lawnum_el = new EL("____LawNum", {}, [law_num]);

        if (
            lawnum_span.text.length <= law_num.length &&
            lawnum_span.index + 1 < spans.length
        ) {

            let after_span = spans[lawnum_span.index + 1];

            if (
                after_span.el.tag === "__PEnd" &&
                after_span.el.attr.type === "round"
            ) {
                let scope = [
                    new ScopeRange(
                        after_span.index + 1,
                        0,
                        spans.length, // half open
                        0, // half open
                    ),
                ];

                let name_pos = new Pos(
                    lawname_span,       // span
                    lawname_span.index, // span_index
                    lawname_text_index, // text_index
                    lawname_length,     // length
                    lawname_span.env,   // env
                );

                let declaration = new ____Declaration(
                    "LawName", // type
                    law_name,  // name
                    law_num,   // value
                    scope,     // scope
                    name_pos,  // name_pos
                );

                lawname_span.el.replace_span(lawname_text_index, lawname_text_index + lawname_length, declaration);
                lawnum_span.el.replace_span(0, law_num.length, lawnum_el);

                return declaration;
            }

        } else if (
            law_num.length < lawnum_span.text.length &&
            lawnum_span.text[law_num.length] == "。" &&
            lawnum_span.index + 5 < spans.length
        ) {
            let [
                name_start_span,
                name_span,
                name_end_span,
                name_after_span,
            ] = spans.slice(lawnum_span.index + 1, lawnum_span.index + 5);

            let scope_match = lawnum_span.text.slice(law_num.length + 1).match(/^(以下)?(?:([^。]+?)において)?$/);
            let name_after_match = name_after_span.text.match(/^という。/);
            if (
                scope_match &&
                name_start_span.el.tag === "__PStart" &&
                name_start_span.el.attr.type === "square" &&
                name_end_span.el.tag === "__PEnd" &&
                name_end_span.el.attr.type === "square" &&
                name_after_match
            ) {
                let following = scope_match[1] !== undefined;
                let scope_text = scope_match[2] || null;

                let scope = [
                    new ScopeRange(
                        name_after_span.index,
                        name_after_match[0].length,
                        spans.length, // half open
                        0, // half open
                    ),
                ];

                let name_pos = new Pos(
                    name_span,       // span
                    name_span.index, // span_index
                    0,               // text_index
                    name_span.text.length, // length
                    name_span.env,   // env
                );

                let declaration = new ____Declaration(
                    "LawName", // type
                    name_span.text,  // name
                    law_num,   // value
                    scope,     // scope
                    name_pos,  // name_pos
                );

                lawname_span.el.replace_span(lawname_text_index, lawname_text_index + lawname_length, new EL("____DeclarationVal", {}, [law_name]));
                name_span.el.replace_span(0, name_span.text.length, declaration);
                lawnum_span.el.replace_span(0, law_num.length, lawnum_el);
                return declaration;
            }
        }

    };

    let detect_name = (spans: Array<Span>, span_index: number) => {
        if (spans.length < span_index + 5) return;
        let [
            name_before_span,
            name_start_span,
            name_span,
            name_end_span,
            name_after_span,
        ] = spans.slice(span_index, span_index + 5);

        let scope_match = name_before_span.text.match(/(以下)?(?:([^。]+?)において)?$/);
        let name_after_match = name_after_span.text.match(/^という。/);
        if (
            scope_match &&
            name_start_span.el.tag === "__PStart" &&
            name_start_span.el.attr.type === "square" &&
            name_end_span.el.tag === "__PEnd" &&
            name_end_span.el.attr.type === "square" &&
            name_after_match
        ) {
            let following = scope_match[1] !== undefined;
            let scope_text = scope_match[2] || null;

            let scope = [
                new ScopeRange(
                    name_after_span.index,
                    name_after_match[0].length,
                    spans.length, // half open
                    0, // half open
                ),
            ];

            let name_pos = new Pos(
                name_span,       // span
                name_span.index, // span_index
                0,               // text_index
                name_span.text.length, // length
                name_span.env,   // env
            );

            let declaration = new ____Declaration(
                "LawName", // type
                name_span.text,  // name
                null,   // value
                scope,     // scope
                name_pos,  // name_pos
            );

            name_span.el.replace_span(0, name_span.text.length, declaration);
            return declaration;
        }
    };

    let declarations = new Declarations();

    for (let span_index = 0; span_index < spans.length; span_index++) {
        let declaration =
            detect_lawname(spans, span_index) ||
            detect_name(spans, span_index);
        if (declaration) {
            declaration.attr.declaration_index = String(declarations.length);
            declarations.add(declaration);
        }
    }

    return declarations;
}

function detect_variable_references(law: EL, spans: Array<Span>, declarations: Declarations) {

    let variable_references: Array<____VarRef> = [];

    let detect = (span: Span) => {
        let parent = span.env.parents[span.env.parents.length - 1];
        if (parent.tag === "__PContent" && parent.attr.type === "square") return;
        let ret: Array<____VarRef> = [];
        for (let declaration of declarations.iterate(span.index)) {
            let text_scope = {
                start: 0,
                end: Number.POSITIVE_INFINITY,
            };
            let next_index_offset = 0;
            for (let child of span.el.children) {
                let index_offset = next_index_offset;
                next_index_offset += (child instanceof EL ? child.text : child).length;
                if (child instanceof EL) continue;

                let index = -1;
                let search_index = 0;
                while ((index = child.indexOf(declaration.name, search_index)) >= 0) {
                    search_index = index + declaration.name.length;

                    if (text_scope.start <= index && index < text_scope.end) {
                        let ref_pos = new Pos(
                            span,       // span
                            span.index, // span_index
                            index + index_offset,      // text_index
                            declaration.name.length, // length
                            span.env,   // env
                        );

                        let varref = new ____VarRef(declaration.name, declaration, ref_pos);
                        span.el.replace_span(index + index_offset, search_index + index_offset, varref);
                        ret.push(varref);
                    }

                }
            }
        }
        return ret;
    };

    for (let span of spans) {
        let varrefs = detect(span);
        if (varrefs) {
            variable_references = variable_references.concat(varrefs);
        }
    }

    return variable_references;
}

export function analyze(law: EL) {
    let [spans, containers] = extract_spans(law);
    let declarations = detect_declarations(law, spans);
    let variable_references = detect_variable_references(law, spans, declarations);
    return {
        declarations: declarations,
    };
}

export function stdxml_to_ext(el: EL) {
    if (["LawNum", "QuoteStruct"].indexOf(el.tag) < 0) {
        let is_mixed = el.children.some(child => typeof child === 'string' || child instanceof String);
        if (is_mixed) {
            el.children = parser.parse(el.innerXML(), { startRule: "INLINE" });
        } else {
            el.children = el.children.map(stdxml_to_ext)
        }
    }
    return el;
};