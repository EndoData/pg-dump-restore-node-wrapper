const execa = require("execa");
const path = require("path");
const { Client } = require("pg");
const psql = require("./lib/psql");
const compare = require('./compare');



const binariesPath = (version, type) => {

  let os = process.platform === "win32" ? "win" : "macos";
  let subFolder = process.platform === "win32" ? "" : "bin";

  return path.join(
    __dirname.replace("app.asar", "app.asar.unpacked"),
    "bin",
    os,
    version,
    subFolder,
    os === "win" ? `${type}.exe` : type,
  );

}

const dump = function ({
  port = 5432,
  host,
  dbname,
  username,
  password,
  version = '17rc1',
  verbose,
  file,
  format = "c",
}) {
  let args = [];
  let pgDumpPath = binariesPath(version, 'pg_dump');

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

  const subprocess = execa(pgDumpPath, args, {});
  subprocess.stdout.on('data', data => checkError(data, { dbname }));
  subprocess.stderr.on('data', data => checkError(data, { dbname }));
  return subprocess;
};
const restore = async function ({
  port = 5432,
  host,
  dbname,
  username,
  password,
  version = '17rc1',
  verbose,
  filename,
  disableTriggers,
  clean,
  create,
  createWith = ''
}) {
  let args = [];
  let pgRestorePath = binariesPath(version, 'pg_restore');

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
      args: { host, port, dbname, username, password, verbose }
    })

  }

  // As mentioned in Postgres documentation, 'Create' with 'Clean' makes a drop
  // throughout the bank and then recreates it, so we are here manually eliminating it
  // so that below is created.
  // See https://www.postgresql.org/docs/current/app-pgdump.html
  if (clean && create) {
    await psql.dropDatabaseIfExists({
      args: { host, port, dbname, username, password, verbose }
    })
  }

  // As mentioned in Postgres documentation, Create should clean the database;
  // But it does not work in some versions of the pg_restore, so Create is done manually 
  if (create) {

    await psql.createDatabase({
      args: { host, port, dbname, username, password, createWith, verbose }
    });

  }

  const subprocess = execa(pgRestorePath, args, {});
  subprocess.stdout.on('data', data => checkError(data, { dbname, create }));
  subprocess.stderr.on('data', data => checkError(data, { dbname, create }));
  return subprocess;

};

module.exports = { dump, restore, compare, pgRestorePath, pgDumpPath };
