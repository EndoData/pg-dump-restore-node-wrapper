const execa = require("execa");
const path = require("path");
const { Client } = require("pg");

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
  subprocess.stdout.on('data', checkError);
  subprocess.stderr.on('data', checkError);
  return subprocess; 

};
 
const checkError = (data, args) => {

  const message = data.toString().trim();
  if (message.includes('error:')) {
    if ((args?.createMethod == 'auto' || args?.createMethod == 'psql') && message.includes('already exists')) {
      console.info(`Trying to create ${dbname} using psql...`);
    } else {
      console.error(message);
    }
  } else {
    console.info(message);
  }

}

const createDatabaseAndRetry = async function (params) {

  const dbname = params.args.dbname;
  const pgRestorePath = params.filename;
  const args = params.args;
  const execaArgs = params.execaArgs;
  const createPsqlWith = params.args.createPsqlWith;

  console.info(`Trying to create ${dbname} using psql...`);

  const client = new Client({
    host: args.host,
    port: args.port,
    database: 'postgres',
    user: args.username,
    password: args.password
  });

  await client.connect();
  await client.query(`CREATE DATABASE ${dbname}${createPsqlWith ? ' WITH ' + createPsqlWith : ''};`);
  console.info(`Database ${dbname} created successfully. Continuing with pg_restore...`);
  await client.end();

  const retrySubprocess = execa(pgRestorePath, execaArgs, {});
  retrySubprocess.stdout.on('data', checkError);
  retrySubprocess.stderr.on('data', checkError);  
  return retrySubprocess;

}

const restore = async function ({
  port = 5432,
  host,
  dbname,
  username,
  password,
  verbose,
  filename,
  clean,
  create,
  createMethod = 'pg_restore'
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

  if (clean) {
    args.push("--clean");
  }
  if (create && (createMethod === 'auto' || createMethod === 'pg_restore')) {
    args.push("--create");
  }
  if (!filename) {
    throw new Error("Needs filename in the options");
  }
  args.push(filename);
  
  if (verbose) {
    args.push("--verbose");
  }

  const subprocess = execa(pgRestorePath, args, {});
  subprocess.stdout.on('data', data => checkError(data, { createMethod }));
  subprocess.stderr.on('data', data => checkError(data, { createMethod }));

  let result = null;
  try {

    return await subprocess;

  } catch (error) {

    if (error.exitCode !== 0 &&
      error.stderr.startsWith("pg_restore: error:") &&
      error.stderr.endsWith("does not exist") &&
      create &&
      (createMethod === 'auto' || createMethod === 'psql')) {

      return createDatabaseAndRetry({
        filename: pgRestorePath,
        args: { host, port, dbname, username, password, createPsqlWith },
        execaArgs: args
      });

    } else {

      console.error(error.message);
      return result

    }

  }

};

module.exports = { dump, restore, pgRestorePath, pgDumpPath };
