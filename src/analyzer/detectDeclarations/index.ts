import { Span } from "../../node/span";
import { Declarations } from "../common/declaration";
import detectLawname from "./detectLawname";
import detectNameInline from "./detectNameInline";
import detectNameList from "./detectNameList";


export const detectDeclarations = (spans: Span[]) => {

    const declarations = new Declarations();

    for (let spanIndex = 0; spanIndex < spans.length; spanIndex++) {
        const declaration =
            detectLawname(spans, spanIndex) ||
            detectNameInline(spans, spanIndex);
        if (declaration) {
            declaration.attr.declaration_index = String(declarations.length);
            declarations.add(declaration);
        }

        for (const declaration of detectNameList(spans, spanIndex)) {
            declaration.attr.declaration_index = String(declarations.length);
            declarations.add(declaration);
        }
    }

    return declarations;
};

export default detectDeclarations;
