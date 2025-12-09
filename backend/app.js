const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const cors = require("koa-cors");
const logger = require("koa-logger");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const app = new Koa();
const router = new Router();

// 中间件
app.use(logger()); // 日志
app.use(cors()); // 跨域
app.use(bodyParser()); // 解析请求体

// 静态文件服务
app.use(serve(path.join(__dirname, "../frontend"))); // 前端页面
app.use(serve(path.join(__dirname, "static"))); // 静态资源 (xlsx 文件等)

// 路由
router.get("/api/hello", async (ctx) => {
  ctx.body = {
    success: true,
    message: "Hello from Koa!",
    timestamp: new Date().toISOString(),
  };
});

router.get("/api/health", async (ctx) => {
  ctx.body = {
    status: "ok",
    uptime: process.uptime(),
  };
});

// 示例：POST 请求
router.post("/api/data", async (ctx) => {
  const data = ctx.request.body;
  ctx.body = {
    success: true,
    received: data,
  };
});

// 读取本地 xlsx 文件
// GET /api/xlsx?file=xxx.xlsx
router.get("/api/xlsx", async (ctx) => {
  const fileName = ctx.query.file || "1.xlsx";
  const filePath = path.join(__dirname, "static/xlsx", fileName);

  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: `文件不存在: ${fileName}`,
      };
      return;
    }

    // 读取 xlsx 文件
    const workbook = XLSX.readFile(filePath);

    // 转换所有 sheet 为 JSON
    const sheets = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
      });
      return { sheetName, data };
    });

    ctx.body = {
      success: true,
      fileName,
      sheetCount: workbook.SheetNames.length,
      sheets,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "读取文件失败: " + error.message,
    };
  }
});

// 读取本地 xlsx 文件
// GET /api/xlsx?file=xxx.xlsx
router.get("/api/xlsxv2", async (ctx) => {
  const fileName = ctx.query.file || "1.xlsx";
  const filePath = path.join(__dirname, "static/xlsx", fileName);

  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: `文件不存在: ${fileName}`,
      };
      return;
    }

    // 读取 xlsx 文件
    const workbook = XLSX.readFile(filePath);

    // 转换所有 sheet 为 JSON
    // const sheets = workbook.SheetNames.map(sheetName => {
    //     const worksheet = workbook.Sheets[sheetName];
    //     const data = XLSX.utils.sheet_to_json(worksheet, {
    //         header: 1,
    //         defval: null
    //     });
    //     return { sheetName, data };
    // });

    ctx.body = {
      success: true,
      fileName,
      sheets: XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "读取文件失败: " + error.message,
    };
  }
});
// 将 JSON 导出为 xlsx 文件
// POST /api/export
router.post("/api/export", async (ctx) => {
  try {
    // 默认数据
    const defaultData = [
      { 姓名: "张三", 年龄: 28, 城市: "北京", 职业: "工程师", 薪资: 15000 },
      { 姓名: "李四", 年龄: 32, 城市: "上海", 职业: "设计师", 薪资: 12000 },
      { 姓名: "王五", 年龄: 25, 城市: "广州", 职业: "产品经理", 薪资: 18000 },
      { 姓名: "赵六", 年龄: 30, 城市: "深圳", 职业: "数据分析师", 薪资: 16000 },
      { 姓名: "钱七", 年龄: 27, 城市: "杭州", 职业: "运营", 薪资: 10000 },
    ];

    const {
      data = defaultData,
      fileName = "导出文件",
      sheetName = "Sheet1",
    } = ctx.request.body || {};

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(defaultData);
    worksheet["A1"] = {
      v: "123",
      t: "s",
      s: {
        font: {
          color: { rgb: "0187FA" },
        },
      },
    };
    worksheet["!cols"] = [
      { wpx: 200 }, //设置第1列列宽为200像素
      { wch: 50 }, //设置第2列列宽为50字符
    ];

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 生成 buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      compression: true,
    });

    // 设置响应头
    ctx.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    ctx.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}.xlsx"`
    );

    ctx.body = buffer;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "导出失败: " + error.message,
    };
  }
});

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(
    `Static files served from: ${path.join(__dirname, "../frontend")}`
  );
});
