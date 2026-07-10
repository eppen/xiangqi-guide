# 象棋入门指南

面向中国象棋初学者的静态学习站点，介绍棋盘规则、棋子走法，以及常用制胜杀法。

在线访问：https://xiangqi.eppencn.com（GitHub Pages 自定义域名）

备用地址：https://eppen.github.io/xiangqi-guide/

## 内容模块

- **认识象棋** — 棋盘结构、棋子阵营、胜负判定
- **棋子走法** — 七种棋子交互式走法示意
- **基本规则** — 对局规则与子力价值参考
- **制胜杀法** — 马后炮、双车错、重炮、铁门栓、闷宫、捉双、抽将、弃子攻杀
- **开局要点** — 三大原则与常见开局
- **战术与残局练习** — 6 道交互式练习题（4 道一步杀法 + 2 道两步残局），点击走棋、提示与正解判定
- **记谱回放** — 3 局经典棋谱动画演示，支持播放控制与速度调节
- **残局常识** — 基本定式与练习建议

## 本地预览

```bash
cd xiangqi-guide
python3 -m http.server 8080
```

浏览器访问 http://localhost:8080

## 自定义域名（xiangqi.eppencn.com）

站点通过 GitHub Pages 发布，仓库根目录 [`CNAME`](CNAME) 已配置二级域名。

### 1. GitHub 仓库设置

推送代码后，在 GitHub 打开 **Settings → Pages → Custom domain**，填入：

```text
xiangqi.eppencn.com
```

保存后等待 DNS 检查通过，并勾选 **Enforce HTTPS**。

### 2. 域名 DNS 配置（eppencn.com 服务商处）

添加一条 **CNAME** 记录：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| CNAME | `xiangqi` | `eppen.github.io` |

> 项目站点（`username.github.io/repo`）的 CNAME 目标为 **`eppen.github.io`**，不要写成带路径的地址。

DNS 生效后（通常几分钟到几小时），GitHub 会自动签发 HTTPS 证书。

## 技术栈

- 纯 HTML / CSS / JavaScript，无需构建
- 响应式布局，支持明暗主题切换
- 交互式象棋棋盘演示

## 目录结构

```
xiangqi-guide/
├── index.html
├── css/style.css
├── js/app.js
└── README.md
```
