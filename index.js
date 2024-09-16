const execa = require("execa");
const path = require("path");

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
  return execa(pgDumpPath, args, {});
};
const restore = function ({
  port = 5432,
  host,
  dbname,
  username,
  password,
  filename,
  clean,
  create,
  disableTriggers
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
  if (create) {
    args.push("--create");
  } 
  if (disableTriggers) {
    args.push("--disable-triggers");
  }
  if (!filename) {
    throw new Error("Needs filename in the options");
  }
  args.push(filename);
  return execa(pgRestorePath, args, {});
};

module.exports = { dump, restore, pgRestorePath, pgDumpPath };
