const execa = require("execa");
const psql = require("./psql");
const utils = require("./utils");

const restore = async function ({
    port = 5432,
    host,
    dbname,
    username,
    password,
    verbose,
    version = '17rc1',
    filename,
    disableTriggers,
    clean,
    create,
    createWith = ''
}) {
    let args = [];

    if (disableTriggers) {
        args.push("--disable-triggers");
    }

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

    if (!filename) {
        throw new Error("Needs filename in the options");
    }
    args.push(filename);

    if (verbose) {
        args.push("--verbose");
    }

    // As mentioned in Postgres documentation, Clean should clean the database;
    // But it does not work in some versions of the pg_restore, so the clean is done manually
    if (clean) {
        await psql.cleanDatabase({
            host,
            port,
            dbname,
            username,
            password
        }, {
            verbose
        });
    }

    // As mentioned in Postgres documentation, 'Create' with 'Clean' makes a drop
    // throughout the bank and then recreates it, so we are here manually eliminating it
    // so that below is created.
    // See https://www.postgresql.org/docs/current/app-pgdump.html
    if (clean && create) {
        await psql.dropDatabaseIfExists({
            host,
            port,
            username,
            password
        }, {
            verbose,
            dbname
        }
        );
    }

    // As mentioned in Postgres documentation, Create should clean the database;
    // But it does not work in some versions of the pg_restore, so Create is done manually 
    if (create) {
        await psql.createDatabase({
            host,
            port,
            username,
            password,
        }, {
            createWith,
            verbose,
            dbname
        });
    }

    const subprocess = execa(utils.binariesPath(version, 'pg_restore'), args, {});
    subprocess.stdout.on('data', data => utils.checkError(data, { dbname, create }));
    subprocess.stderr.on('data', data => utils.checkError(data, { dbname, create }));
    return subprocess;
};

module.exports = restore;
