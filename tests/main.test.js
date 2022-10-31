const database = require("./database.mock");
const pgDumpRestore = require("../index");
const fs = require("fs-extra");

describe("Can dump and restore database", () => {
  beforeAll(async () => {
    await database.sequelize.sync({ force: true });
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
    test("can dump database with table include/exclude", async () => {
      expect.assertions(1);
      await pgDumpRestore.dump({
        ...database.CREDENTIALS,
        file: "./test_include_exclude_table.pgdump",
        table: "tabl*",
        // schema: "public",
        // table: ["public.table_A"],
        excludeTableData: "public.table_*",
      });
      expect(
        await fs.pathExists("./test_include_exclude_table.pgdump")
      ).toBeTruthy();
    });
  });
  describe("Can restore", () => {
    test("can restore database", async () => {
      expect.assertions(4);
      await database.sequelize.drop();
      await pgDumpRestore.restore({
        ...database.CREDENTIALS,
        filename: "./test.pgdump",
      });
      const tableAElements = await database.TableA.findAll();
      expect(tableAElements.length).toBe(1);
      const tableBElements = await database.TableB.findAll();
      expect(tableBElements.length).toBe(1);
      const tableCElements = await database.TableC.findAll();
      expect(tableCElements.length).toBe(1);
      const tableDElements = await database.TableD.findAll();
      expect(tableDElements.length).toBe(1);
    });
    test("can restore database with table include/exclude", async () => {
      expect.assertions(4);
      await database.sequelize.drop();
      await pgDumpRestore.restore({
        ...database.CREDENTIALS,
        filename: "./test_include_exclude_table.pgdump",
      });
      const tableAElements = await database.TableA.findAll();
      expect(tableAElements.length).toBe(1);
      const tableBElements = await database.TableB.findAll();
      expect(tableBElements.length).toBe(1);
      const tableCElements = await database.TableC.findAll();
      expect(tableCElements.length).toBe(1);
      const tableDElements = await database.TableD.findAll();
      expect(tableDElements.length).toBe(1);
    });
  });
  afterAll(async () => {
    await fs.remove("./test.pgdump");
    await fs.remove("./test_include_exclude_table.pgdump");
  });
});
