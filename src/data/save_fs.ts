import Zip from "node-stream-zip";
import path from "path";
import { allXMLZipURL } from "../elaws_api";
import os from "os";
import fs from "fs";
import fetch from "node-fetch";
import fsExtra from "fs-extra";
import { promisify } from "util";
import { getLawCSVList, LawInfo, makeList, TextFetcher } from "@coresrc/data/lawlist";
import { getLawdataPath } from "./paths";

export const download = async (
    dataPath: string,
    onProgress: (ratio: number, message: string) => void = () => undefined,
): Promise<void> => {

    const lawdataPath = getLawdataPath(dataPath);

    const progress = (() => {
        let currentRatio = 0;
        let currentMessage = "";
        return (ratio?: number, message?: string) => {
            currentRatio = ratio ?? currentRatio;
            currentMessage = message ?? currentMessage;
            onProgress(currentRatio, currentMessage);
        };
    })();

    const tempDir = path.join(os.tmpdir(), "lawtext_core_db_download");
    await promisify(fsExtra.ensureDir)(tempDir);
    const tempZip = path.join(tempDir, "lawdata.zip");
    const tempZipStream = fs.createWriteStream(tempZip);

    progress(0, "");

    console.log(`\nTemporary dir: ${tempDir}`);
    console.log(`Downloading ${allXMLZipURL}`);
    const res = await fetch(
        allXMLZipURL,
    );
    if (!res.ok) throw new Error(res.statusText);
    const contentLength = Number(res.headers.get("Content-Length"));
    const totalBytesStr = contentLength.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    console.log(`Total ${totalBytesStr} bytes`);
    await new Promise(r => res.body.once("readable", r));

    let currentLength = 0;
    for await (const chunk of res.body) {
        if (!chunk) break;
        tempZipStream.write(chunk);
        currentLength += chunk.length;
        const currentBytesStr = currentLength.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        progress(currentLength / contentLength, `${currentBytesStr} / ${totalBytesStr} bytes`);
    }

    tempZipStream.close();
    progress(1);

    console.log("\nExtracting zip file...");

    progress(0, "");
    await promisify(fsExtra.ensureDir)(lawdataPath);
    currentLength = 0;
    const zip = new Zip.async({ file: tempZip });
    zip.on("extract", (entry) => {
        currentLength += entry.compressedSize;
        progress(currentLength / contentLength, entry.name);
    });
    await zip.extract(null, lawdataPath);
    await zip.close();
    progress(1);
};

export const saveList = async (
    dataPath: string,
    listJsonPath: string,
    onProgress: (ratio: number, message: string) => void = () => undefined,
    textFetcher: TextFetcher,
    sjisTextFetcher: TextFetcher,
): Promise<void> => {

    const progress = (() => {
        let currentRatio = 0;
        let currentMessage = "";
        return (ratio?: number, message?: string) => {
            currentRatio = ratio || currentRatio;
            currentMessage = message || currentMessage;
            onProgress(currentRatio, currentMessage);
        };
    })();

    progress(0, "Loading CSV...");

    console.log("\nListing up XMLs...");
    const infos = await getLawCSVList(dataPath, sjisTextFetcher);

    if (infos === null) {
        console.error("CSV list cannot be fetched.");
        return;
    }

    console.log(`Processing ${infos.length} XMLs...`);

    const list = await makeList(
        infos.map(LawInfo.fromBaseLawInfo),
        dataPath,
        textFetcher,
        infos.length,
        progress,
    );
    await promisify(fs.writeFile)(listJsonPath, JSON.stringify(list), { encoding: "utf-8" });
};
