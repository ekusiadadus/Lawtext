import * as chai from "chai";
import { it } from "mocha";
import { renderToString } from "react-dom/server";
import * as std from "../../core/src/std_law";
import * as util from "../../core/src/util"
import { LawView } from "../src/components/LawView";
import { Dispatchers, mapDispatchToProps } from '../src/containers/LawtextAppPageContainer';
import * as states from '../src/states';
import store from '../src/store';
import { getLawList, getLawXml } from "./prepare_test";



export const makeDummyProps = (lawtextAppPageState: Partial<states.LawtextAppPageState> = {}) => {
    const props: states.LawtextAppPageState & Dispatchers = Object.assign(
        {},

        {
            law: null,
            loadingLaw: false,
            loadingLawMessage: "",
            lawSearchKey: null,
            lawSearchedKey: null,
            analysis: null,
            hasError: false,
            errors: [],
        },
        lawtextAppPageState,

        mapDispatchToProps(store.dispatch),

    );

    return props as states.LawtextAppPageState & Dispatchers & states.RouteState;

}


(async () => {

    const [list, listByLawnum] = await getLawList();

    for (const { LawNum: lawNum, LawTitle: lawTitle } of list) {

        it(`${lawTitle}（${lawNum}）`, async () => {

            const origXML = await getLawXml(lawNum);

            const origEL = util.xmlToJson(origXML);

            const lawView = new LawView(makeDummyProps({ law: origEL as std.Law }));

            const renderedElement = lawView.render();

            const renderedString = renderToString(renderedElement);

            chai.assert(
                !lawView.props.hasError,
                [
                    `${lawTitle}（${lawNum}）`,
                    lawView.props.errors.map(e => `[${e.name}]${e.message}`).join(", "),
                ].join("\n"),
            );

        });

    }

    run();

})();