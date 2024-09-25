const execa = require("execa");
const path = require("path");
const { Client } = require("pg");
const psql = require("./lib/psql");

let os = process.platform === "win32" ? "win" : "macos";

let binariesPath = path.join(
  __dirname.replace("app.asar", "app.asar.unpacked"),
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
  verbose,
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

module.exports = { dump, restore, pgRestorePath, pgDumpPath };
