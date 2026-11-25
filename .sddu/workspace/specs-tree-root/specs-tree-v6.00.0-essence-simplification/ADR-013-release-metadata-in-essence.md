# ADR-013: 发布元数据随本体分发——README/LICENSE 入本体目录，CHANGELOG 不增设（评估 B3 部分采纳）

## 状态
PROPOSED（2026-11-24 用户拍板）

## 背景
多视角评估（开源库视角）指出 v6 仓库缺少开源发布三件套：
1. **LICENSE**——无 license 法律上默认「保留所有权利」，对要推广的产品是硬阻断；
2. **README**——现为旧 npm 插件形态描述，与 v6 设计严重不一致，开源访客第一屏失真；
3. **CHANGELOG**——历史发布记录缺失。

## 决策
1. **README 与 LICENSE 纳入规划，落位本体目录 `.sddu/.sddu/`**（与 sddu.md、modules/ 同级）：
   - **随本体分发**——安装 = `cp -r` 复制整棵模板，用户项目天然获得 LICENSE（合法使用授权随装即得）与 README（本地可查的项目说明），零额外安装逻辑；
   - **与「设计态即运行态」自洽**——仓库内 `sddu-project-template/.sddu/.sddu/README.md` 与安装后路径逐项相同，零路径改写（ADR-007）；
   - **仓库根不再另设副本**——README/LICENSE 各仅一份，杜绝双权威（与 sddu.md 单权威原则同构）；
   - README 内容重排为「本质先行」：SDDU 是什么 / 如何安装（一条 cp 命令）/ 7 阶段概览 → 指向 `sddu.md`（唯一入口），不转写方法论（FR-002 引用原则同样适用）。
2. **CHANGELOG 不增设**——ROADMAP.md 已承载历史：§3 specs-tree 实时投影 + 修订记录即版本史；零 build 项目手工维护两份历史文件必然漂移，ROADMAP 即 CHANGELOG。

## 对既有设计的修订
- **plan §5.1 树**：仓库根 `README.md`（✎M）改为 **MOVE**（→ `sddu-project-template/.sddu/.sddu/README.md`，内容重排）；根 `LICENSE` 同步 **MOVE** 入本体；`.sddu/.sddu/` 下新增 `README.md` / `LICENSE` 两行。
- **plan §5.2**：`MODIFY README.md` 行改为 `MOVE+MODIFY`；新增 `MOVE LICENSE` 行。
- 契约计数不变（31）；README/LICENSE 属发布元数据，非产物契约，不进 contracts/。

## 后果
- 正面：开源分发合法性与第一屏信息一次到位；元数据随本体分发零机制成本；用户安装后即持有 LICENSE。
- 负面：仓库根无 README，GitHub 首屏不渲染项目简介——已判定可接受（访客第一跳即 `.sddu/.sddu/README.md`，路径浅、可发现性损失极小；且杜绝双副本漂移收益更大）。
- 不可逆性：低——纯文件落位变更，未来如需根 README 可增设跳转页。
