const execa = require("execa");
const path = require("path");



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
  return execa(pgDumpPath, args, {});
};
const restore = function ({
  port = 5432,
  host,
  dbname,
  username,
  password,
  version = '17rc1',
  filename,
  clean,
  create,
}) {
  let args = [];
  let pgRestorePath = binariesPath(version, 'pg_restore');;
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
  if (!filename) {
    throw new Error("Needs filename in the options");
  }
  args.push(filename);
  return execa(pgRestorePath, args, {});
};

module.exports = { dump, restore };
