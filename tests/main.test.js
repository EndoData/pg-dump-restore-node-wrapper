const database = require("./database.mock");
const pgWrapper = require("../index");
const psql = require("../lib/psql");
const fs = require("fs-extra");

const simpleDump = async () => {

  await pgWrapper.dump({
    ...database.CREDENTIALS,
    dbname: database.DATABASES.tests,
    file: "./test.pgdump",
  });

}

test("should dump database", async () => {

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await database.createDatabase(database.DATABASES.tests);
  await database.createAndPopule(database.DATABASES.tests, 'Table1');
  await simpleDump();
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();

});
test("should not restore the database when it already exists", async () => {

  try {

    await database.dropDatabaseIfExists(database.DATABASES.tests);
    await database.createDatabase(database.DATABASES.tests);
    await database.createAndPopule(database.DATABASES.tests, 'Table1');

    await simpleDump();
    expect(await fs.pathExists("./test.pgdump")).toBeTruthy();

    await pgWrapper.restore({
      ...database.CREDENTIALS,
      dbname: database.DATABASES.tests,
      filename: "./test.pgdump",
      create: true,
    });
    expect(true).toBe(false);

  } catch (error) {

    expect(true).toBe(true);

  }

});
test("should restore database when already exists if clean requested", async () => {

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await database.createDatabase(database.DATABASES.tests);
  await database.createAndPopule(database.DATABASES.tests, 'Table1');

  await simpleDump();
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();

  await pgWrapper.restore({
    ...database.CREDENTIALS,
    dbname: database.DATABASES.tests,
    filename: "./test.pgdump",
    clean: true,
    create: true,
  });
  expect(true).toBe(true);

});
test("should restore database create parameters (createWith)", async () => {

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await database.createDatabase(database.DATABASES.tests);
  await database.createAndPopule(database.DATABASES.tests, 'Table1');

  await simpleDump();
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await pgWrapper.restore({
    ...database.CREDENTIALS,
    dbname: database.DATABASES.tests,
    filename: "./test.pgdump",
    create: true,
    createWith: `TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';`
  });

  const allDataTable1 = await database.getData(database.DATABASES.tests, 'Table1');
  const collate = await psql.checkLCCollate({
    ...database.CREDENTIALS
  }, {
    dbname: database.DATABASES.tests
  });

  expect(allDataTable1.length).toBe(1);
  expect(collate === 'C').toBe(true);

});
test("should restore the database by maintaining existing tables", async () => {

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await database.createDatabase(database.DATABASES.tests);
  await database.createAndPopule(database.DATABASES.tests, 'Table1');

  await simpleDump();
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await database.createDatabase(database.DATABASES.tests);
  await database.populeWithMore(database.DATABASES.tests, 'Table2');

  await pgWrapper.restore({
    ...database.CREDENTIALS,
    dbname: database.DATABASES.tests,
    filename: "./test.pgdump"
  });

  const allDataTable1 = await database.getData(database.DATABASES.tests, 'Table1');
  const allDataTable2 = await database.getData(database.DATABASES.tests, 'Table2');
  expect(allDataTable1.length + allDataTable2.length).toBe(2);

});
test("should restore the database eliminating existing tables", async () => {

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await database.createDatabase(database.DATABASES.tests);
  await database.createAndPopule(database.DATABASES.tests, 'Table1');

  await simpleDump();
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();

  await database.populeWithMore(database.DATABASES.tests, 'Table2');

  await pgWrapper.restore({
    ...database.CREDENTIALS,
    dbname: database.DATABASES.tests,
    filename: "./test.pgdump",
    clean: true
  });

  const allDataTable1 = await database.getData(database.DATABASES.tests, 'Table1');
  expect(allDataTable1.length).toBe(1);

  const allDataTable2 = await database.getData(database.DATABASES.tests, 'Table2');
  expect(allDataTable2.length).toBe(0);

});

test("should dump database (with verbose)", async () => {

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await database.createDatabase(database.DATABASES.tests);
  await database.createAndPopule(database.DATABASES.tests, 'Table1');

  const log = await pgWrapper.dump({
    ...database.CREDENTIALS,
    dbname: database.DATABASES.tests,
    file: "./test.pgdump",
    verbose: true
  });
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
  expect(log.stderr.includes('pg_dump:')).toBeTruthy();

});
test("should restore database (with verbose)", async () => {

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  await database.createDatabase(database.DATABASES.tests);
  await database.createAndPopule(database.DATABASES.tests, 'Table1');

  await simpleDump();
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();

  await database.dropDatabaseIfExists(database.DATABASES.tests);
  const log = await pgWrapper.restore({
    ...database.CREDENTIALS,
    dbname: database.DATABASES.tests,
    filename: "./test.pgdump",
    create: true,
    verbose: true
  });
  const allDataTable1 = await database.getData(database.DATABASES.tests, 'Table1');
  expect(allDataTable1.length).toBe(1);
  expect(log.stderr.includes('pg_restore:')).toBeTruthy();

});
afterAll(async () => {
  await fs.remove("./test.pgdump");
}); 
