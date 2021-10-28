# pg-dump-restore-node-wrapper

This very small utility includes pg_dump and pg_restore binaries for Windows and macOS, taken from Postgres 13.4. DLLs and dylibs are also included.

A thin CLI wrapper is also provided.

## Usage

```js
import pg_dump_restore from "pg-dump-restore-node-wrapper";

async function main() {
  const { stdout, stderr } = await pg_dump_restore.dump({
    port, // defaults to 5432
    host,
    dbname,
    username,
    password,
    file: "./test.pgdump",
    format, // defaults to 'c'
  }); // outputs an execa object

  const { stdout, stderr } = await pg_dump_restore.restore({
    port, // defaults to 5432
    host,
    dbname,
    username,
    password,
    filename: "./test.pgdump", // note the filename instead of file, following the pg_restore naming.
    clean, // defaults to false
    create, // defaults to false
  }); // outputs an execa object
}
```

Please see the [pg_dump](https://www.postgresql.org/docs/12/app-pgdump.html) and [pg_restore](https://www.postgresql.org/docs/12/app-pgrestore.html) documentation for details on the arguments.

### Creating the binaries

pg_dump V<=X can be restored using pg_restore V>=X.

I chose to use pg_dump and pg_restore for Postgres 13, as most of the machines I manage have Postgres 13, (and I only use Postgres 12 features).

### macOS

I used macdylibbundler from https://github.com/SCG82/macdylibbundler to list all dll files and I then copied and renamed them.

I did not use the tool to bundle the dependencies as it would corrupt the executable.

### Windows

I used https://github.com/lucasg/Dependencies to determine the required DLL, filtering only the local dependencies.
