const database = require("./database.mock");
const pgWrapper = require("../index");
const psql = require("../lib/psql");
const fs = require("fs-extra");

beforeAll(async () => {
  await database.dropDatabaseIfExists({ args: database.CREDENTIALS });
  await database.createDatabase();
  await database.createAndPopuleTableMock();
});
test("should dump database", async () => {

  expect.assertions(1);
  await pgWrapper.dump({
    ...database.CREDENTIALS,
    file: "./test.pgdump",
  });
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();

});
test("should not restore the database when it already exists", async () => {

  try {

    expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
    await pgWrapper.restore({
      ...database.CREDENTIALS,
      filename: "./test.pgdump",
      create: true,
    });
    expect(true).toBe(false);

  } catch (error) {

    expect(true).toBe(true);

  }

});
test("should restore database when already exists if clean requested", async () => {

  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
  await pgWrapper.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump",
    clean: true,
    create: true,
  });
  expect(true).toBe(true);

});
test("should restore database create parameters (createWith)", async () => {

  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
  await database.dropDatabaseIfExists();
  await pgWrapper.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump",
    create: true,
    createWith: `TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';`
  });
  const allDataMock = await database.getDataMock();
  const collate = await psql.checkLCCollate({ args: database.CREDENTIALS })

  expect(allDataMock.length).toBe(1);
  expect(collate === 'C').toBe(true);

});
test("Should restore the database by maintaining existing tables", async () => {

  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
  await database.dropDatabaseIfExists();
  await psql.createDatabase({ args: database.CREDENTIALS })
  await database.createAndPopuleExtraTableMock();
  await pgWrapper.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump"
  });
  const allDataMock = await database.getDataMock();
  const allDataMockExtra = await database.getDataMockExtra();
  expect(allDataMock.length + allDataMockExtra.length).toBe(2);

});
test("Should restore the database eliminating existing tables", async () => {

  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
  await database.dropDatabaseIfExists();
  await psql.createDatabase({ args: database.CREDENTIALS });
  await database.createAndPopuleExtraTableMock();
  await pgWrapper.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump",
    clean: true
  });
  const allDataMock = await database.getDataMock();
  const allDataMockExtra = await database.getDataMockExtra();
  expect(allDataMock.length + allDataMockExtra.length).toBe(1);

});

test("should dump database (with verbose)", async () => {

  const log = await pgWrapper.dump({
    ...database.CREDENTIALS,
    file: "./test.pgdump",
    verbose: true
  });
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
  expect(log.stderr.includes('pg_dump:')).toBeTruthy();

});
test("should restore database (with verbose)", async () => {

  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
  await database.dropDatabaseIfExists();
  const log = await pgWrapper.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump",
    create: true,
    verbose: true
  });
  const allDataMock = await database.getDataMock();
  expect(allDataMock.length).toBe(1);
  expect(log.stderr.includes('pg_restore:')).toBeTruthy();

});
afterAll(async () => {
  await fs.remove("./test.pgdump");
}); 
