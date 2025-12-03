const fs = require('fs');
const path = require('path');

// 配置：你想为哪个目录生成索引
const targetDir = path.join(__dirname, '../');
const outputFile = path.join(targetDir, './index.html');

// 读取目标目录下的所有文件（排除index.html自身和点开头的隐藏文件）
const files = fs.readdirSync(targetDir).filter(file => 
    file !== 'index.html' && !file.startsWith('.')
);
console.log(files);
// 生成HTML内容
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>文件目录 - documents</title>
    <style>
        body { font-family: sans-serif; margin: 2rem; }
        ul { list-style: none; padding: 0; }
        li { margin: 0.5rem 0; }
        a { text-decoration: none; color: #0366d6; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>文件列表</h1>
    <p>当前目录下共有 ${files.length} 个文件：</p>
    <ul>
        ${files.map(file => `<li><a href="${encodeURI(file)}" download>${file}</a></li>`).join('\n            ')}
    </ul>
    <p><small>页面生成于 ${new Date().toLocaleString()}</small></p>
</body>
</html>`;

// 将生成的HTML写入文件
fs.writeFileSync(outputFile, htmlContent);
console.log(`✅ 已成功为目录 "${targetDir}" 生成索引文件，共找到 ${files.length} 个文件。`);