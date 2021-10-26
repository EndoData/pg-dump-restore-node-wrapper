# pg-dump-restore-node-wrapper

This very small utility includes pg_dump and pg_restore binaries for Windows and macOS, taken from Postgres 13.4. DLLs and dylibs are also included.

A thin CLI wrapper is also provided.



### Creating the binaries

pg_dump V<=X can be restored using pg_restore V>=X.

I chose to use pg_dump and pg_restore for Postgres 13, as most of the machines I manage have Postgres 13, and I only use Postgres 12 features.

### macOS

I used macdylibbundler from https://github.com/SCG82/macdylibbundler to list all dll files and I then copied and renamed them.

I did not use the tool to bundle the dependencies as it would corrupt the executable.

### Windows

I used https://github.com/lucasg/Dependencies to determine the required DLL, filtering only the local dependencies.
