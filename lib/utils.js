const path = require("path");
let os = process.platform === "win32" ? "win" : "macos";

binariesPath = path.join(
    __dirname.replace("app.asar", "app.asar.unpacked"),
    "..",
    "bin",
    os,
    "bin"
);

let pgRestorePath = path.join(
    binariesPath,
    os === "win" ? "pg_restore.exe" : "pg_restore"
);

let pgDumpPath = path.join(
    binariesPath,
    os === "win" ? "pg_dump.exe" : "pg_dump"
);


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
    pgRestorePath,
    pgDumpPath
};

