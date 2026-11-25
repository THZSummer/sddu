---
name: sddu
description: "当用户要在本项目中使用 SDDU（Spec-Driven Development Ultimate）规格驱动开发工作流时加载——包括发起、继续或查询任一 Feature 的 discovery / spec / plan / tasks / build / review / validate 阶段，查询 Feature 状态、版本路线图（ROADMAP），或询问 SDDU 的用法、7 阶段流程、门禁与状态规则。加载后唯一动作是读取方法论内核 .sddu/.sddu/sddu.md，由内核路由表分发到对应阶段模块。"
---

<!-- 本文件是 SDDU 的纯索引/引导，跨版本稳定，仅负责引导 Agent 加载唯一入口。 -->

# SDDU

> 加载本文档后，**唯一动作**是读取并遵循方法论内核：`.sddu/.sddu/sddu.md`。

收到 `<stage> <feature>` 请求时，由内核的路由表解析并读取对应模块指令：

```
.sddu/.sddu/modules/sddu-<stage>/sddu-<stage>.md
```

本索引不承载任何方法论、路由表、门禁或状态协议——那些全部在内核 `sddu.md` 中。本文件内容应保持极简且跨版本稳定。
