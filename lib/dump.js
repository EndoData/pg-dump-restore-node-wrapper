const execa = require("execa");
const utils = require("./utils");

const dump = function ({
    port = 5432,
    host,
    dbname,
    username,
    password,
    verbose,
    file,
    format = "c",
}) {
    let args = [];
    if (password) {
        if (!(username && password && host && port && dbname)) {
            throw new Error(
                "When password is provided, username, password, host, port and dbname must be provided"
            );
        }
        let url = `postgresql://${username}:${password}@${host}:${port}/${dbname}`;
        args.push("--dbname");
        args.push(url);
    } else {
        if (host) {
            args.push("--host");
            args.push(host);
        }
        if (port) {
            args.push("--port");
            args.push(port);
        }
        if (dbname) {
            args.push("--dbname");
            args.push(dbname);
        }
        if (username) {
            args.push("--username");
            args.push(username);
        }
        if (password) {
            args.push("--password");
            args.push(password);
        }
    }

    if (file) {
        args.push("--file");
        args.push(file);
    }
    if (format) {
        args.push("--format");
        args.push(format);
    }
    if (verbose) {
        args.push("--verbose");
    }

    const subprocess = execa(utils.pgDumpPath, args, {});
    subprocess.stdout.on('data', data => utils.checkError(data, { dbname }));
    subprocess.stderr.on('data', data => utils.checkError(data, { dbname }));
    return subprocess;
};

module.exports = dump;

