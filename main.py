from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime, date
import json
import logging
from contextlib import asynccontextmanager

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 数据库配置
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'database': os.getenv('MYSQL_DATABASE', 'ky'),
    'user': os.getenv('MYSQL_USERNAME', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'wynx'),
    'charset': 'utf8mb4',
    'autocommit': True,
    'sql_mode': 'TRADITIONAL',  # 明确设置SQL模式
    'connection_timeout': 30,    # 连接超时设置
    'raise_on_warnings': False    # 关闭警告提升为错误
}

# 数据库初始化函数
def init_database():
    """
    初始化数据库表结构
    会检查表是否存在，不存在才创建
    确保多次启动不会重复初始化
    """
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        # 检查并创建love_records表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS love_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            date DATE NOT NULL,
            description TEXT NOT NULL,
            mood VARCHAR(20) NOT NULL,
            timestamp BIGINT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        logger.info("love_records表检查完成")
        
        # 检查并创建anniversaries表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS anniversaries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            description TEXT,
            category VARCHAR(20) DEFAULT 'anniversary',
            is_recurring BOOLEAN DEFAULT FALSE,
            reminder_days INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        logger.info("anniversaries表检查完成")
        
        # 检查并创建operation_logs表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS operation_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            operation_type VARCHAR(50) NOT NULL,
            table_name VARCHAR(50) NOT NULL,
            record_id INT,
            operation_data JSON,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        logger.info("operation_logs表检查完成")
        
        logger.info("数据库表结构检查完成")
        connection.commit()  # 确保DDL操作提交
    except Error as e:
        # 如果是表已存在的错误，记录为警告而不是错误
        if "already exists" in str(e):
            logger.warning(f"数据库表已存在，继续启动: {str(e)}")
        else:
            logger.error(f"数据库初始化失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"数据库初始化失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理器
    替代过时的on_event装饰器
    在应用启动时初始化数据库
    """
    # 启动时执行
    logger.info("应用启动中...")
    init_database()
    logger.info("应用启动完成，数据库已就绪")
    
    yield
    
    # 关闭时执行（如果需要清理资源）
    logger.info("应用正在关闭...")

# 创建FastAPI应用实例，使用新的lifespan管理器
app = FastAPI(
    title="恋爱记录 API", 
    description="恋爱记录管理系统API",
    lifespan=lifespan
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应限制为具体域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有HTTP头
)

# Pydantic模型
class LoveRecord(BaseModel):
    id: Optional[int] = None
    category: str
    date: str
    description: str
    mood: str
    timestamp: int

class LoveRecordCreate(BaseModel):
    category: str
    date: str
    description: str
    mood: str
    timestamp: int

class LoveRecordUpdate(BaseModel):
    category: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    mood: Optional[str] = None
    timestamp: Optional[int] = None

# 纪念日相关模型
class Anniversary(BaseModel):
    id: Optional[int] = None
    title: str
    date: str
    description: Optional[str] = None
    category: str = "anniversary"
    is_recurring: bool = False
    reminder_days: int = 0

class AnniversaryCreate(BaseModel):
    title: str
    date: str
    description: Optional[str] = None
    category: str = "anniversary"
    is_recurring: bool = False
    reminder_days: int = 0

class AnniversaryUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_recurring: Optional[bool] = None
    reminder_days: Optional[int] = None

# 操作日志相关模型
class OperationLog(BaseModel):
    id: int
    operation_type: str
    table_name: str
    record_id: Optional[int] = None
    operation_data: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

# 数据库连接函数
def get_db_connection():
    try:
        logger.info(f"尝试连接数据库: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
        connection = mysql.connector.connect(**DB_CONFIG)
        logger.info("数据库连接成功")
        return connection
    except Error as e:
        logger.error(f"数据库连接失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"数据库连接失败: {str(e)}")

# 操作日志记录函数
def log_operation(operation_type: str, table_name: str, record_id: int = None, 
                 operation_data: dict = None, request = None):
    """记录操作日志"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        ip_address = None
        user_agent = None
        
        if request:
            # 获取客户端IP地址
            ip_address = request.client.host
            # 获取用户代理
            user_agent = request.headers.get("user-agent", "")
        
        cursor.execute("""
            INSERT INTO operation_logs (operation_type, table_name, record_id, operation_data, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (operation_type, table_name, record_id, json.dumps(operation_data) if operation_data else None, 
              ip_address, user_agent))
        
        logger.info(f"操作日志记录成功: {operation_type} - {table_name} - {record_id}")
    except Exception as e:
        logger.error(f"记录操作日志失败: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# API路由
@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")

@app.get("/api/records", response_model=List[LoveRecord])
async def get_records(category: Optional[str] = None, mood: Optional[str] = None):
    """获取所有记录，支持按分类和心情筛选"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = "SELECT * FROM love_records WHERE 1=1"
        params = []
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        if mood:
            query += " AND mood = %s"
            params.append(mood)
        
        query += " ORDER BY date DESC"
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        
        # 转换日期格式
        for record in records:
            if isinstance(record['date'], date):
                record['date'] = record['date'].strftime('%Y-%m-%d')
        
        return records
    except Error as e:
        raise HTTPException(status_code=500, detail=f"查询记录失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/api/records", response_model=LoveRecord)
async def create_record(record: LoveRecordCreate, request: Request):
    """创建新记录"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = """
        INSERT INTO love_records (category, date, description, mood, timestamp)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            record.category,
            record.date,
            record.description,
            record.mood,
            record.timestamp
        ))
        
        # 获取新创建的记录
        record_id = cursor.lastrowid
        cursor.execute("SELECT * FROM love_records WHERE id = %s", (record_id,))
        new_record = cursor.fetchone()
        
        if isinstance(new_record['date'], date):
            new_record['date'] = new_record['date'].strftime('%Y-%m-%d')
        
        # 记录操作日志
        log_operation("CREATE", "love_records", record_id, 
                     record.dict(), request)
        
        return new_record
    except Error as e:
        raise HTTPException(status_code=500, detail=f"创建记录失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.put("/api/records/{record_id}", response_model=LoveRecord)
async def update_record(record_id: int, record: LoveRecordUpdate, request: Request):
    """更新记录"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # 获取更新前的记录用于日志
        cursor.execute("SELECT * FROM love_records WHERE id = %s", (record_id,))
        old_record = cursor.fetchone()
        
        if not old_record:
            raise HTTPException(status_code=404, detail="记录不存在")
        
        # 构建更新查询
        update_fields = []
        params = []
        
        if record.category is not None:
            update_fields.append("category = %s")
            params.append(record.category)
        
        if record.date is not None:
            update_fields.append("date = %s")
            params.append(record.date)
        
        if record.description is not None:
            update_fields.append("description = %s")
            params.append(record.description)
        
        if record.mood is not None:
            update_fields.append("mood = %s")
            params.append(record.mood)
        
        if record.timestamp is not None:
            update_fields.append("timestamp = %s")
            params.append(record.timestamp)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="没有提供要更新的字段")
        
        params.append(record_id)
        query = f"UPDATE love_records SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(query, params)
        
        # 获取更新后的记录
        cursor.execute("SELECT * FROM love_records WHERE id = %s", (record_id,))
        updated_record = cursor.fetchone()
        
        if isinstance(updated_record['date'], date):
            updated_record['date'] = updated_record['date'].strftime('%Y-%m-%d')
        
        # 记录操作日志
        log_data = {
            "old_data": dict(old_record),
            "new_data": record.dict(exclude_unset=True)
        }
        log_operation("UPDATE", "love_records", record_id, log_data, request)
        
        return updated_record
    except Error as e:
        raise HTTPException(status_code=500, detail=f"更新记录失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.delete("/api/records/{record_id}")
async def delete_record(record_id: int, request: Request):
    """删除记录"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # 获取要删除的记录用于日志
        cursor.execute("SELECT * FROM love_records WHERE id = %s", (record_id,))
        record_to_delete = cursor.fetchone()
        
        if not record_to_delete:
            raise HTTPException(status_code=404, detail="记录不存在")
        
        cursor.execute("DELETE FROM love_records WHERE id = %s", (record_id,))
        
        # 记录操作日志
        log_operation("DELETE", "love_records", record_id, 
                     dict(record_to_delete), request)
        
        return {"message": "记录删除成功"}
    except Error as e:
        raise HTTPException(status_code=500, detail=f"删除记录失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/records/export")
async def export_records(category: Optional[str] = None):
    """导出记录为JSON格式"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = "SELECT * FROM love_records WHERE 1=1"
        params = []
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        query += " ORDER BY date ASC"
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        
        # 转换日期格式
        for record in records:
            if isinstance(record['date'], date):
                record['date'] = record['date'].strftime('%Y-%m-%d')
            if isinstance(record['created_at'], datetime):
                record['created_at'] = record['created_at'].isoformat()
            if isinstance(record['updated_at'], datetime):
                record['updated_at'] = record['updated_at'].isoformat()
        
        return {
            "export_time": datetime.now().isoformat(),
            "total_records": len(records),
            "category_filter": category,
            "records": records
        }
    except Error as e:
        raise HTTPException(status_code=500, detail=f"导出记录失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/stats")
async def get_stats():
    """获取统计信息"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # 总记录数
        cursor.execute("SELECT COUNT(*) as total FROM love_records")
        total = cursor.fetchone()['total']
        
        # 按分类统计
        cursor.execute("SELECT category, COUNT(*) as count FROM love_records GROUP BY category")
        category_stats = cursor.fetchall()
        
        # 按心情统计
        cursor.execute("SELECT mood, COUNT(*) as count FROM love_records GROUP BY mood")
        mood_stats = cursor.fetchall()
        
        # 最近记录
        cursor.execute("SELECT * FROM love_records ORDER BY date DESC LIMIT 1")
        latest_record = cursor.fetchone()
        if latest_record and isinstance(latest_record['date'], date):
            latest_record['date'] = latest_record['date'].strftime('%Y-%m-%d')
        
        return {
            "total_records": total,
            "category_stats": category_stats,
            "mood_stats": mood_stats,
            "latest_record": latest_record
        }
    except Error as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# 纪念日相关API接口
@app.get("/api/anniversaries", response_model=List[Anniversary])
async def get_anniversaries(category: Optional[str] = None):
    """获取所有纪念日，支持按分类筛选"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = "SELECT * FROM anniversaries WHERE 1=1"
        params = []
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        query += " ORDER BY date ASC"
        
        cursor.execute(query, params)
        anniversaries = cursor.fetchall()
        
        # 转换日期格式
        for anniversary in anniversaries:
            if isinstance(anniversary['date'], date):
                anniversary['date'] = anniversary['date'].strftime('%Y-%m-%d')
        
        return anniversaries
    except Error as e:
        raise HTTPException(status_code=500, detail=f"查询纪念日失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/api/anniversaries", response_model=Anniversary)
async def create_anniversary(anniversary: AnniversaryCreate, request: Request):
    """创建新纪念日"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute(
            """INSERT INTO anniversaries (title, date, description, category, is_recurring, reminder_days) 
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (anniversary.title, anniversary.date, anniversary.description, 
             anniversary.category, anniversary.is_recurring, anniversary.reminder_days)
        )
        
        anniversary_id = cursor.lastrowid
        
        # 获取创建的记录
        cursor.execute("SELECT * FROM anniversaries WHERE id = %s", (anniversary_id,))
        new_anniversary = cursor.fetchone()
        
        if isinstance(new_anniversary['date'], date):
            new_anniversary['date'] = new_anniversary['date'].strftime('%Y-%m-%d')
        
        # 记录操作日志
        log_operation("CREATE", "anniversaries", anniversary_id, 
                     anniversary.dict(), request)
        
        return new_anniversary
    except Error as e:
        raise HTTPException(status_code=500, detail=f"创建纪念日失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.put("/api/anniversaries/{anniversary_id}", response_model=Anniversary)
async def update_anniversary(anniversary_id: int, anniversary: AnniversaryUpdate, request: Request):
    """更新纪念日"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # 获取更新前的记录用于日志
        cursor.execute("SELECT * FROM anniversaries WHERE id = %s", (anniversary_id,))
        old_anniversary = cursor.fetchone()
        
        if not old_anniversary:
            raise HTTPException(status_code=404, detail="纪念日不存在")
        
        update_fields = []
        params = []
        
        if anniversary.title is not None:
            update_fields.append("title = %s")
            params.append(anniversary.title)
        
        if anniversary.date is not None:
            update_fields.append("date = %s")
            params.append(anniversary.date)
        
        if anniversary.description is not None:
            update_fields.append("description = %s")
            params.append(anniversary.description)
        
        if anniversary.category is not None:
            update_fields.append("category = %s")
            params.append(anniversary.category)
        
        if anniversary.is_recurring is not None:
            update_fields.append("is_recurring = %s")
            params.append(anniversary.is_recurring)
        
        if anniversary.reminder_days is not None:
            update_fields.append("reminder_days = %s")
            params.append(anniversary.reminder_days)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="没有提供要更新的字段")
        
        params.append(anniversary_id)
        query = f"UPDATE anniversaries SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(query, params)
        
        # 获取更新后的记录
        cursor.execute("SELECT * FROM anniversaries WHERE id = %s", (anniversary_id,))
        updated_anniversary = cursor.fetchone()
        
        if isinstance(updated_anniversary['date'], date):
            updated_anniversary['date'] = updated_anniversary['date'].strftime('%Y-%m-%d')
        
        # 记录操作日志
        log_data = {
            "old_data": dict(old_anniversary),
            "new_data": anniversary.dict(exclude_unset=True)
        }
        log_operation("UPDATE", "anniversaries", anniversary_id, log_data, request)
        
        return updated_anniversary
    except Error as e:
        raise HTTPException(status_code=500, detail=f"更新纪念日失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.delete("/api/anniversaries/{anniversary_id}")
async def delete_anniversary(anniversary_id: int, request: Request):
    """删除纪念日"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # 获取要删除的记录用于日志
        cursor.execute("SELECT * FROM anniversaries WHERE id = %s", (anniversary_id,))
        anniversary_to_delete = cursor.fetchone()
        
        if not anniversary_to_delete:
            raise HTTPException(status_code=404, detail="纪念日不存在")
        
        cursor.execute("DELETE FROM anniversaries WHERE id = %s", (anniversary_id,))
        
        # 记录操作日志
        log_operation("DELETE", "anniversaries", anniversary_id, 
                     dict(anniversary_to_delete), request)
        
        return {"message": "纪念日删除成功"}
    except Error as e:
        raise HTTPException(status_code=500, detail=f"删除纪念日失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/anniversaries/upcoming")
async def get_upcoming_anniversaries(days: int = 30):
    """获取即将到来的纪念日（未来指定天数内）"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # 查询即将到来的纪念日
        query = """
        SELECT *, 
               DATEDIFF(
                   CASE 
                       WHEN is_recurring = 1 THEN 
                           DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(date), '-', DAY(date)))
                       ELSE date 
                   END, 
                   CURDATE()
               ) as days_until
        FROM anniversaries 
        WHERE (
            (is_recurring = 1 AND 
             DATEDIFF(
                 DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(date), '-', DAY(date))), 
                 CURDATE()
             ) BETWEEN 0 AND %s)
            OR 
            (is_recurring = 0 AND DATEDIFF(date, CURDATE()) BETWEEN 0 AND %s)
        )
        ORDER BY days_until ASC
        """
        
        cursor.execute(query, (days, days))
        upcoming = cursor.fetchall()
        
        # 转换日期格式
        for anniversary in upcoming:
            if isinstance(anniversary['date'], date):
                anniversary['date'] = anniversary['date'].strftime('%Y-%m-%d')
        
        return upcoming
    except Error as e:
        raise HTTPException(status_code=500, detail=f"查询即将到来的纪念日失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/operation-logs", response_model=List[OperationLog])
async def get_operation_logs(limit: int = 100, offset: int = 0, table_name: Optional[str] = None):
    """获取操作日志"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        where_clause = ""
        params = []
        
        if table_name:
            where_clause = "WHERE table_name = %s"
            params.append(table_name)
        
        query = f"""
        SELECT id, operation_type, table_name, record_id, operation_data, 
               ip_address, user_agent, created_at
        FROM operation_logs 
        {where_clause}
        ORDER BY created_at DESC 
        LIMIT %s OFFSET %s
        """
        
        params.extend([limit, offset])
        cursor.execute(query, params)
        logs = cursor.fetchall()
        
        # 处理JSON数据
        for log in logs:
            if log['operation_data']:
                try:
                    log['operation_data'] = json.loads(log['operation_data'])
                except json.JSONDecodeError:
                    log['operation_data'] = None
        
        return logs
    except Error as e:
        raise HTTPException(status_code=500, detail=f"查询操作日志失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/operation-logs/stats")
async def get_operation_stats():
    """获取操作统计信息"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # 按操作类型统计
        cursor.execute("""
            SELECT operation_type, COUNT(*) as count
            FROM operation_logs
            GROUP BY operation_type
            ORDER BY count DESC
        """)
        operation_stats = cursor.fetchall()
        
        # 按表名统计
        cursor.execute("""
            SELECT table_name, COUNT(*) as count
            FROM operation_logs
            GROUP BY table_name
            ORDER BY count DESC
        """)
        table_stats = cursor.fetchall()
        
        # 今日操作统计
        cursor.execute("""
            SELECT COUNT(*) as today_count
            FROM operation_logs
            WHERE DATE(created_at) = CURDATE()
        """)
        today_stats = cursor.fetchone()
        
        return {
            "operation_stats": operation_stats,
            "table_stats": table_stats,
            "today_count": today_stats['today_count'] if today_stats else 0
        }
    except Error as e:
        raise HTTPException(status_code=500, detail=f"查询操作统计失败: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# 挂载静态文件
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# 启动服务器
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)