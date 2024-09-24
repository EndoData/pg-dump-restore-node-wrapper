const database = require("./database.mock");
const pgDumpRestore = require("../index");
const fs = require("fs-extra");

beforeAll(async () => {
  await database.dropDatabaseIfExists();
  await database.createDatabase();
  await database.createAndPopuleTableMock();
});
test("should dump database", async () => {
  expect.assertions(1);
  await pgDumpRestore.dump({
    ...database.CREDENTIALS,
    file: "./test.pgdump",
  });
  expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
});
test("should not restore the database when it already exists", async () => {
  expect.assertions(1);
  try {

    await pgDumpRestore.restore({
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
  expect.assertions(1);

  await pgDumpRestore.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump",
    clean: true,
    create: true,
  });
  expect(true).toBe(true);

});
test("shoud restore database create parameters (createWith)", async () => {

  await database.dropDatabaseIfExists();
  await pgDumpRestore.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump",
    create: true,
    createWith: `TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';`
  });
  const allDataMock = await database.getDataMock();
  const collate = await database.checkLCCollate()

  expect(allDataMock.length).toBe(1);
  expect(collate === 'C').toBe(true);

});
test("Should restore the bank by maintaining existing tables", async () => {

  await database.dropDatabaseIfExists();
  await database.createDatabase();
  await database.createAndPopuleExtraTableMock();
  await pgDumpRestore.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump"
  });
  const allDataMock = await database.getDataMock();
  const allDataMockExtra = await database.getDataMockExtra();
  expect(allDataMock.length + allDataMockExtra.length).toBe(2);

});
test("Should restore the bank eliminating existing tables", async () => {

  await database.dropDatabaseIfExists();
  await database.createDatabase();
  await database.createAndPopuleExtraTableMock();
  await pgDumpRestore.restore({
    ...database.CREDENTIALS,
    filename: "./test.pgdump",
    clean: true
  });
  const allDataMock = await database.getDataMock();
  const allDataMockExtra = await database.getDataMockExtra();
  expect(allDataMock.length + allDataMockExtra.length).toBe(1);

});
afterAll(async () => {
  await fs.remove("./test.pgdump");
}); 
