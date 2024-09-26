const path = require("path");

const binariesPath = (version, type) => {

    let os = process.platform === "win32" ? "win" : "macos";
    let subFolder = process.platform === "win32" ? "" : "bin";

    return path.join(
        __dirname.replace("app.asar", "app.asar.unpacked"),
        "..",
        "bin",
        os,
        version,
        subFolder,
        os === "win" ? `${type}.exe` : type,
    );

}

const checkError = (data, args) => {

    const message = data.toString().trim();
    if (message.includes('error:')) {
        if (!(args?.create && !message.includes('already exists'))) {
            console.error(message);
        }
    } else {
        console.info(message);
    }

}

module.exports = {
    checkError,
    binariesPath,
};

