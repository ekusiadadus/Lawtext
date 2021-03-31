import React from "react";
import chai from "chai";
import { it } from "mocha";
import ReactDOMServer from "react-dom/server";
import { analyze } from "@coresrc/analyzer";
import * as std from "@coresrc/std_law";
import * as util from "@coresrc/util";
import { LawView } from "@appsrc/components/LawView";
import { FSStoredLoader } from "@coresrc/data/loaders/FSStoredLoader";
import path from "path";
import { LawtextAppPageState } from "./components/LawtextAppPageState";

const dataPath = path.join(__dirname, "../../core/data");
const loader = new FSStoredLoader(dataPath);

const renderAllLaws = async () => {

    const pickedLawNum = "平成二十六年政令第三百九十四号";

    const { lawInfos } = await loader.loadLawInfosStruct();

    for (const { LawNum: lawNum, LawTitle: lawTitle } of lawInfos.filter(o => o.LawNum === pickedLawNum)) {

        it(`${lawTitle}（${lawNum}）`, async () => {

            const lawInfo = await loader.getLawInfoByLawNum(lawNum);
            if (lawInfo === null) throw Error("LawInfo not found");
            const origXML = await loader.loadLawXMLByInfo(lawInfo);
            if (origXML === null) throw Error("XML not found");

            const origEL = util.xmlToJson(origXML);
            const analysis = analyze(origEL);

            let currentState: LawtextAppPageState = {
                law: {
                    source: "file_xml",
                    el: origEL as std.Law,
                    xml: origXML,
                    analysis,
                },
                loadingLaw: false,
                loadingLawMessage: "",
                lawSearchKey: "",
                lawSearchedKey: "",
                analysis: null,
                hasError: false,
                errors: [],
            };

            const origSetState: React.Dispatch<React.SetStateAction<LawtextAppPageState>> = (newState: LawtextAppPageState | ((prevState: LawtextAppPageState) => LawtextAppPageState)) => {
                currentState = typeof newState === "function" ? newState(currentState) : newState;
            };

            const setState = (newState: Partial<LawtextAppPageState>) => {
                origSetState({ ...currentState, ...newState });
            };

            void ReactDOMServer.renderToStaticMarkup(
                <LawView
                    origState={currentState}
                    setState={setState}
                    origSetState={origSetState}
                />,
            );

            chai.assert(
                !currentState.hasError,
                [
                    `${lawTitle}（${lawNum}）`,
                    currentState.errors.map(e => `[${e.name}]${e.message}`).join(", "),
                ].join("\n"),
            );

        });

    }
};


void (async () => {

    await renderAllLaws();

    run();

})();
