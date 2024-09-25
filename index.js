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
    await cleanDatabase({
      args: { host, port, dbname, username, password, verbose }
    })

  }

  // As mentioned in Postgres documentation, 'Create' with 'Clean' makes a drop
  // throughout the bank and then recreates it, so we are here manually eliminating it
  // so that below is created.
  // See https://www.postgresql.org/docs/current/app-pgdump.html
  if (clean && create) {
    await dropDatabaseIfExists()
  }

  // As mentioned in Postgres documentation, Create should clean the database;
  // But it does not work in some versions of the pg_restore, so Create is done manually 
  if (create) {

    await createDatabase({
      filename: pgRestorePath,
      args: { host, port, dbname, username, password, createWith, verbose },
      execaArgs: args
    });

  }

  const subprocess = execa(pgRestorePath, args, {});
  subprocess.stdout.on('data', data => checkError(data, { dbname, create }));
  subprocess.stderr.on('data', data => checkError(data, { dbname, create }));
  return subprocess;

};

const dropDatabaseIfExists = async function (params) {

  const args = params.args;
  const verbose = params.args.verbose;

  if (verbose) {
    console.info(`Dropping ${args?.dbname} using psql...`);
  }

  const client = new Client({
    host: args.host,
    port: args.port,
    database: 'postgres',
    user: args.username,
    password: args.password
  });

  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${args?.dbname};`);
  await client.end();

  if (verbose) {
    console.info(`Database ${args?.dbname} dropped successfully.`);
  }

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


const cleanDatabase = async function (params) {

  const args = params.args;
  const verbose = params.args.verbose;

  if (verbose) {
    console.info(`Cleaning ${args?.dbname} using psql...`);
  }

  const client = new Client({
    host: args.host,
    port: args.port,
    database: args.dbname,
    user: args.username,
    password: args.password
  });

  await client.connect();
  await client.query(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$; 
  `);
  await client.end();

  if (verbose) {
    console.info(`Database ${dbname} cleaned successfully.`);
  }

}

const createDatabase = async function (params) {

  const dbname = params.args.dbname;
  const args = params.args;
  const createWith = params.args.createWith;
  const verbose = params.args.verbose;

  if (verbose) {
    console.info(`Creating ${args?.dbname} using psql...`);
  }

  const client = new Client({
    host: args.host,
    port: args.port,
    database: 'postgres',
    user: args.username,
    password: args.password
  });

  await client.connect();
  await client.query(`CREATE DATABASE ${dbname}${createWith ? ' WITH ' + createWith : ''};`);
  await client.end();

  if (verbose) {
    console.info(`Database ${dbname} created successfully.`);
  }

}

module.exports = { dump, restore, pgRestorePath, pgDumpPath };
