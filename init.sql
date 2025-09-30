-- 恋爱记录数据库初始化脚本
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS ky CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE ky;

-- 创建恋爱记录表
CREATE TABLE IF NOT EXISTS love_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(10) NOT NULL COMMENT '分类：K, Y, K&Y',
    date DATE NOT NULL COMMENT '记录日期',
    description TEXT NOT NULL COMMENT '事件描述',
    mood VARCHAR(20) NOT NULL COMMENT '心情标签',
    timestamp BIGINT NOT NULL COMMENT '时间戳',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_date (date),
    INDEX idx_mood (mood),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='恋爱记录表';

-- 插入初始数据（K栏记录）
INSERT INTO love_records (category, date, description, mood, timestamp) VALUES
('K', '2024-06-29', '正式认识啦，你惦记着我去南方玩有没有带伞，实际我是要工作去了', '开心', UNIX_TIMESTAMP('2024-06-29') * 1000),
('K', '2024-10-14', '陪你过的第一个生日', '开心', UNIX_TIMESTAMP('2024-10-14') * 1000),
('K', '2024-11-18', '我的生日，收到了小叶紫檀，开心', '开心', UNIX_TIMESTAMP('2024-11-18') * 1000),
('K', '2024-12-31', '马上就2025了，第一次和你跨年，有点激动', '兴奋', UNIX_TIMESTAMP('2024-12-31') * 1000),
('K', '2025-01-24', '去见你了，又紧张又激动的', '兴奋', UNIX_TIMESTAMP('2025-01-24') * 1000),
('K', '2025-01-25', '在一起啦，你是我的了', '甜蜜', UNIX_TIMESTAMP('2025-01-25') * 1000),
('K', '2025-03-15', '你跟我说有个好消息，5月份你要跟小姨去武汉，我们可以见面，我可开心了', '兴奋', UNIX_TIMESTAMP('2025-03-15') * 1000),
('K', '2025-04-25', '你到武汉了，我可激动了，心思全在你那，晚上还勾引你，哈哈哈，没事，明天就见到了', '兴奋', UNIX_TIMESTAMP('2025-04-25') * 1000),
('K', '2025-04-26', '终于又见到你了，我都想死你了，趴你身上抱你好久，嘻嘻', '甜蜜', UNIX_TIMESTAMP('2025-04-26') * 1000),
('K', '2025-05-20', '520那天，说了很多情话，两个人满眼都是对方，看到你开心的样子，我也很满足，觉得我们可以一辈子。', '甜蜜', UNIX_TIMESTAMP('2025-05-20') * 1000),
('K', '2025-05-27', '吵架了，很激烈，你还说了伤人的话，心都碎了', '难过', UNIX_TIMESTAMP('2025-05-27') * 1000),
('K', '2025-06-01', '儿童节我收到了你送的糖果和软软的兔子，嘎嘎开心~', '开心', UNIX_TIMESTAMP('2025-06-01') * 1000);

-- 插入一些Y栏和K&Y栏的示例数据
INSERT INTO love_records (category, date, description, mood, timestamp) VALUES
('Y', '2025-01-25', '在一起啦~', '甜蜜', UNIX_TIMESTAMP('2025-01-25') * 1000),
('K&Y', '2025-01-25', '我们正式在一起的日子，永远记得这一天', '甜蜜', UNIX_TIMESTAMP('2025-01-25') * 1000),
('K&Y', '2025-08-19', '一起看综艺，这种简单的快乐真好', '开心', UNIX_TIMESTAMP('2025-08-19') * 1000),
('K&Y', '2025-08-20', '一起制作了这个恋爱记录网页，记录我们的美好时光', '甜蜜', UNIX_TIMESTAMP('2025-08-20') * 1000),
('Y', '2025-09-03', '晚上睡不着好想老婆，掰了一下日子发现我们已经又过去了与第一次分别的时间相等的时间，而且居然还需要这么久才能见到宝宝，忧愁', '难过', UNIX_TIMESTAMP('2025-09-03') * 1000),
('Y', '2025-09-08', '今天有和老婆一起忙碌，她工作我学习，晚上贴贴小香猪', '开心', UNIX_TIMESTAMP('2025-09-08') * 1000);

-- 创建用户表（可选，用于未来扩展）
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建设置表（用于存储应用设置）
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用设置表';

-- 插入默认设置
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('app_name', '恋爱记录', '应用名称'),
('version', '1.0.0', '应用版本'),
('theme', 'default', '默认主题');

-- 创建数据库视图（用于统计）
CREATE VIEW record_stats AS
SELECT 
    category,
    COUNT(*) as total_records,
    COUNT(DISTINCT mood) as mood_types,
    MIN(date) as first_record_date,
    MAX(date) as last_record_date
FROM love_records 
GROUP BY category;

-- 创建索引优化查询性能
CREATE INDEX idx_created_at ON love_records(created_at);
CREATE INDEX idx_category_date ON love_records(category, date);

-- 显示创建结果
SELECT 'Database initialization completed successfully!' as status;