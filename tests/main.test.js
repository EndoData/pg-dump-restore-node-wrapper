const database = require("./database.mock");
const pgDumpRestore = require("../index");
const fs = require("fs-extra");

describe("Can dump and restore database", () => {
  beforeAll(async () => {
    await database.dropDatabaseIfExists();
    await database.createDatabase();
    await database.populate();
  });
  describe("Can dump", () => {
    test("can dump database", async () => {
      expect.assertions(1);
      await pgDumpRestore.dump({
        ...database.CREDENTIALS,
        file: "./test.pgdump",
      });
      expect(await fs.pathExists("./test.pgdump")).toBeTruthy();
    });
  });
  describe("Can restore", () => {
    test("can restore database", async () => {
      expect.assertions(1);
      await database.dropDatabaseIfExists();
      await pgDumpRestore.restore({
        ...database.CREDENTIALS,
        filename: "./test.pgdump",
      });
      allUsers = await database.getUsers();
      expect(allUsers.length).toBe(1);
    });
  });
  test("can restore database with create (psql)", async () => {

    await database.dropDatabaseIfExists();
    await pgDumpRestore.restore({
      ...database.CREDENTIALS,
      filename: "./test.pgdump",
      create: true,
      createMethod: 'psql',
      createPsqlWith: `TEMPLATE=template0 ENCODING='UTF8' LC_COLLATE='en-US' LC_CTYPE='en-US';`
    });
    allUsers = await database.getUsers();
    expect(allUsers.length).toBe(1);
    expect(await database.checkLCCollate()).equal('en-US');

  });
  afterAll(async () => {
    await fs.remove("./test.pgdump");
  });
});
