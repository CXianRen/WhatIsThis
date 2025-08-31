

# 用户管理 (Auth / User)
POST   /auth/login              -> 登录
POST   /auth/logout             -> 登出
POST   /auth/register           -> 注册（sign up）
POST   /auth/login-as           -> 以某用户身份登录（管理员或调试用）

PUT    /users/{id}/password     -> 修改密码
GET    /users/me                -> 获取当前登录用户信息


# vocab: 基础词汇功能 每次查词会记录用户查的词 用来统计分析
POST   /vocab/explain           -> AI 解释 Lang_1 单词（返回 Lang_2 解释）
POST   /vocab/analyse           -> AI 分析 Lang_1 单词（返回 Lang_2 分析）

GET    /vocab/history           -> 获取用户查询过的单词（用于统计/分析）


# word tag: 用户新词管理功能
POST   /tags                    -> 添加新标签
GET    /tags                    -> 获取用户所有标签
DELETE /tags/{id}               -> 删除标签
PUT    /tags/{id}               -> 修改标签名称

POST   /tags/{id}/words         -> 给标签添加单词
DELETE /tags/{id}/words/{word}  -> 从标签移除单词
GET    /tags/{id}/words         -> 获取某个标签下的单词

GET    /words?tag={id}          -> 根据标签筛选单词


# book manage: 用户书籍管理： 书架， 书库， 书管理
POST   /books                   -> 新建书籍
GET    /books                   -> 获取用户创建的书籍
GET    /books/published         -> 获取所有已发布书籍
GET    /books/{id}              -> 获取书籍详情
PUT    /books/{id}              -> 更新书籍
DELETE /books/{id}              -> 删除书籍

POST   /books/{id}/chapters     -> 添加章节
PUT    /books/{id}/chapters/{cid} -> 更新章节
DELETE /books/{id}/chapters/{cid} -> 删除章节

POST   /shelf/{id}              -> 把已发布书籍添加到书架
DELETE /shelf/{id}              -> 从书架移除书籍
GET    /shelf                   -> 获取用户书架书籍

GET /books/{id}/chapters/{cid}/content -> 获取章节内容


# database 

users - 用户表

| 字段           | 类型                 | 说明         |
| -------------- | -------------------- | ------------ |
| id             | BIGINT PK            | 用户 ID      |
| username       | VARCHAR(50) UNIQUE   | 用户名       |
| email          | VARCHAR(100) UNIQUE  | 邮箱         |
| password\_hash | VARCHAR(255)         | 密码（加密） |
| nickname       | VARCHAR(50)          | 昵称         |
| avatar         | VARCHAR(255)         | 头像 URL     |
| role           | ENUM('user','admin') | 用户角色     |
| created\_at    | DATETIME             | 注册时间     |
| updated\_at    | DATETIME             | 更新时间     |

user_sessions
| 字段       | 类型                | 说明              |
| ---------- | ------------------- | ----------------- |
| id         | BIGINT PK           |                   |
| user\_id   | BIGINT FK users(id) | 用户 ID           |
| token      | VARCHAR(255)        | JWT 或 Session ID |
| login\_at  | DATETIME            | 登录时间          |
| logout\_at | DATETIME            | 登出时间          |

vocab_history
| 字段        | 类型                                                             | 说明                                |
| ----------- | ---------------------------------------------------------------- | ----------------------------------- |
| id          | BIGINT PRIMARY KEY AUTO\_INCREMENT                               | 记录 ID                             |
| user\_id    | BIGINT NULL                                                      | 查询用户 ID（可为空，表示全局缓存） |
| word        | VARCHAR(100) NOT NULL                                            | 查询单词                            |
| lang\_from  | VARCHAR(10) NOT NULL                                             | 查询语言（原语言）                  |
| lang\_to    | VARCHAR(10) NOT NULL                                             | 返回语言                            |
| explanation | TEXT NULL                                                        | AI 返回的解释（可空，部分生成）     |
| analysis    | TEXT NULL                                                        | AI 返回的分析（可空，部分生成）     |
| is\_cache   | BOOLEAN DEFAULT TRUE                                             | 是否作为缓存使用                    |
| created\_at | DATETIME DEFAULT CURRENT\_TIMESTAMP                              | 创建时间                            |
| updated\_at | DATETIME DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP | 更新时间                            |



tags - 用户标签表
| 字段        | 类型                | 说明                 |
| ----------- | ------------------- | -------------------- |
| id          | BIGINT PK           | 标签 ID              |
| user\_id    | BIGINT FK users(id) | 用户 ID              |
| name        | VARCHAR(50)         | 标签名               |
| lang        | VARCHAR(10)         | 标签所属语言（可选） |
| created\_at | DATETIME            | 创建时间             |
| updated\_at | DATETIME            | 更新时间             |


tag_words - 标签与单词关系表（多对多）
| 字段         | 类型                  | 说明            |
| ------------ | --------------------- | --------------- |
| id           | BIGINT PK             | 标签单词记录 ID |
| tag\_id      | BIGINT FK tags(id)    | 标签 ID         |
| word         | VARCHAR(100)          | 单词            |
| lang         | VARCHAR(10)           | 单词语言        |
| has\_context | BOOLEAN DEFAULT FALSE | 是否已有上下文  |
| created\_at  | DATETIME              | 创建时间        |
| updated\_at  | DATETIME              | 更新时间        |

tag_word_context（单词上下文表）
| 字段          | 类型                        | 说明                |
| ------------- | --------------------------- | ------------------- |
| id            | BIGINT PK                   | 上下文记录 ID       |
| tag\_word\_id | BIGINT FK tag\_words(id)    | 对应标签单词        |
| book\_id      | BIGINT FK books(id) NULL    | 所属书籍 ID（可选） |
| chapter\_id   | BIGINT FK chapters(id) NULL | 所属章节 ID（可选） |
| sentence      | TEXT                        | 上下文句子          |
| lang          | VARCHAR(10)                 | 句子语言            |
| created\_at   | DATETIME                    | 添加时间            |


books - 书籍表
| 字段        | 类型                                 | 说明       |
| ----------- | ------------------------------------ | ---------- |
| id          | BIGINT PK                            | 书籍 ID    |
| user\_id    | BIGINT FK users(id)                  | 创建者     |
| title       | VARCHAR(255)                         | 书名       |
| description | TEXT                                 | 简介       |
| cover\_url  | VARCHAR(255)                         | 封面 URL   |
| status      | ENUM('draft','published','archived') | 发布状态   |
| category    | VARCHAR(50)                          | 分类，可选 |
| created\_at | DATETIME                             |            |
| updated\_at | DATETIME                             |            |

chapters - 章节表
| 字段        | 类型                | 说明     |
| ----------- | ------------------- | -------- |
| id          | BIGINT PK           | 章节 ID  |
| book\_id    | BIGINT FK books(id) | 所属书籍 |
| title       | VARCHAR(255)        | 章节标题 |
| content     | TEXT                | 章节内容 |
| order       | INT                 | 章节顺序 |
| created\_at | DATETIME            |          |
| updated\_at | DATETIME            |          |

shelf_books - 用户书架表（多对多）
| 字段      | 类型                | 说明     |
| --------- | ------------------- | -------- |
| id        | BIGINT PK           |          |
| user\_id  | BIGINT FK users(id) | 用户 ID  |
| book\_id  | BIGINT FK books(id) | 书籍 ID  |
| added\_at | DATETIME            | 添加时间 |
