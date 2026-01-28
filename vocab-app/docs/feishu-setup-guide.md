# 飞书云同步设置指南

## 一、创建多维表格

### 1.1 新建表格

1. 登录 [飞书](https://feishu.cn)
2. 点击左侧导航栏的 **"多维表格"** 图标 📊
3. 点击右上角 **"新建"** → **"新建多维表格"**
4. 输入表格名称，例如："Vocab App 单词库"
5. 点击 **"创建"**

### 1.2 获取 app_token

创建完成后，URL 格式为：
```
https://xxx.feishu.cn/base/bascnXXXXXX/appXXXXXX
```

**app_token** 就是 URL 中的 `appXXXXXX` 部分

---

## 二、设置单词数据表

### 2.1 创建数据表

在新创建的多维表格中：

1. 点击 **"新建数据表"**
2. 选择 **"空白数据表"**
3. 命名为 **"单词表"**

### 2.2 添加字段

点击表格右上角的 **"..."** → **"编辑字段"**，添加以下字段：

| 字段名称 | 字段类型 | 说明 |
|---------|---------|------|
| user_id | 文本 | 用户ID，用于区分不同用户的数据 |
| word | 文本 | 单词 |
| phonetic | 文本 | 音标 |
| partOfSpeech | 文本 | 词性 |
| definitionEn | 文本 | 英文释义 |
| definitionZh | 文本 | 中文释义 |
| example | 文本 | 例句 |
| interval | 数字 | 复习间隔（天）|
| easeFactor | 数字 | 容易度因子 |
| nextReviewAt | 数字 | 下次复习时间戳 |
| reviewCount | 数字 | 复习次数 |
| lastReviewAt | 数字 | 上次复习时间戳 |
| createdAt | 数字 | 创建时间戳 |
| local_id | 文本 | 本地ID（格式：word-partOfSpeech）|

### 2.3 获取 table_id

1. 点击表格右上角的 **"..."**
2. 选择 **"开发者选项"**
3. 复制 **"表格 ID"**（格式：`tblXXXXXX`）

---

## 三、配置应用权限（可选）

如果你想通过 API 自动创建表格，需要配置应用权限：

### 3.1 创建应用

1. 访问 [飞书开放平台](https://open.feishu.cn)
2. 登录后进入 **"管理后台"**
3. 点击 **"创建应用"** → **"自建应用"**
4. 填写应用信息并创建

### 3.2 获取凭证

在应用页面中：
- **App ID**：已预配置在代码中：`cli_a87ad870fe31500c`
- **App Secret**：已预配置在代码中

### 3.3 申请权限

在应用权限管理中，申请并开通以下权限：
- `bitable:app` - 查看、评论、编辑和管理多维表格
- `bitable:app:readonly` - 只读权限（可选）

---

## 四、在应用中登录

1. 启动 Vocab App
2. 点击右上角的 **"云同步登录"** 按钮
3. 按照指引填写：
   - **App Token**：从步骤 1.2 获取
   - **单词表 Table ID**：从步骤 2.3 获取
   - **用户表 Table ID**：留空（暂未使用）
4. 点击 **"保存并登录"**

---

## 五、快速测试

登录后，可以：

1. **添加几个单词**到本地复习列表
2. 点击 **"同步"**按钮
3. 在飞书多维表格中查看数据是否成功上传

---

## 六、常见问题

### Q: app_token 在哪里？
A: 在多维表格的 URL 中，格式为 `https://xxx.feishu.cn/base/{app_token}/...`

### Q: table_id 在哪里？
A: 表格右上角 → ... → 开发者选项 → 表格 ID

### Q: 如何验证同步是否成功？
A: 在飞书表格中查看是否有新增的记录，或者在应用中查看"最后同步时间"

### Q: 多设备如何同步？
A: 在每个设备上使用相同的 app_token 和 table_id 登录即可（user_id 会自动生成不同的值，但可以通过修改配置实现多设备共享）

---

## 七、表格示例

完成设置后，你的表格应该类似这样：

| user_id | word | phonetic | partOfSpeech | definitionEn | definitionZh | example | interval | easeFactor | nextReviewAt | reviewCount | createdAt | local_id |
|---------|------|----------|--------------|--------------|--------------|---------|----------|------------|--------------|-------------|-----------|----------|
| user_123 | ephemeral | /ɪˈfem(ə)rəl/ | adjective | lasting for a very short time | 短暂的 | The ephemeral beauty of sunset | 0 | 2.5 | 1706457600000 | 0 | 1706457600000 | ephemeral-adjective |

---

## 八、高级配置（可选）

### 多设备共享同一账户

如果你想在手机和电脑上共享同一套单词数据：

1. 在第一台设备登录后，打开浏览器开发者工具
2. 在 Console 中输入：`localStorage.getItem('vocab_sync_config')`
3. 复制输出的 JSON 配置
4. 在其他设备上，打开同一页面，在 Console 中输入：
   ```javascript
   localStorage.setItem('vocab_sync_config', '你复制的配置')
   ```
5. 刷新页面

这样两台设备就会使用同一个 user_id，数据完全同步。
