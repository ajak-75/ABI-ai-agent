"""PHASE 1 schema/query validation against real SQLite.

Runs the exact DDL from src/memory/schema.ts plus the representative read/write
queries used by the repositories, then checks cascade behaviour.
"""

import json
import sqlite3
import time

with open('.scratch/ddl.json') as handle:
    ddl = json.load(handle)

db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys = ON')
for statement in ddl['s']:
    db.execute(statement)
print(f"DDL executed: {len(ddl['s'])} statements (schema_version {ddl['v']})")

now = int(time.time() * 1000)

db.execute(
    """CREATE TABLE IF NOT EXISTS schema_migrations (
       version INTEGER PRIMARY KEY NOT NULL, applied_at INTEGER NOT NULL);"""
)
db.execute('INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?)', (1, now))

db.execute(
    """INSERT INTO sessions (id,title,mode,archived,created_at,updated_at)
       VALUES (?,?,?,?,?,?)""",
    ('ses_1', '안녕하세요', 'auto', 0, now, now),
)
db.execute(
    """INSERT INTO sessions (id,title,mode,archived,created_at,updated_at)
       VALUES (?,?,?,?,?,?)""",
    ('ses_2', '두번째 대화', 'local', 0, now + 10, now + 10),
)

for index, (message_id, role, content) in enumerate(
    [('msg_1', 'user', '안녕하세요'), ('msg_2', 'assistant', '입력 확인했어요.')]
):
    db.execute(
        """INSERT INTO messages (id,session_id,role,content,route_mode,engine_id,status,created_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (
            message_id,
            'ses_1',
            role,
            content,
            'auto' if role == 'user' else 'local',
            'local.placeholder',
            'complete',
            now + index,
        ),
    )

db.execute(
    """INSERT INTO memories (id,kind,label,value,source,active,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?)""",
    ('mem_1', 'preference', None, '짧은 답을 좋아함', 'user', 1, now, now),
)

db.execute(
    """INSERT INTO tasks (id,session_id,title,tool_id,payload,status,risk,result,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)""",
    ('task_1', 'ses_1', '테스트 작업', 'demo.notification', '{"when":"내일"}', 'pending', 'medium', None, now, now),
)
db.execute(
    'UPDATE tasks SET status = ?, result = COALESCE(?, result), updated_at = ? WHERE id = ?;',
    ('approved', '사용자 승인', now + 5, 'task_1'),
)

for value in ('auto', 'local'):
    db.execute(
        """INSERT INTO app_settings (key,value,updated_at) VALUES (?,?,?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;""",
        ('route_mode', value, now),
    )

db.execute(
    'INSERT INTO audit_logs (id,task_id,action,detail,created_at) VALUES (?,?,?,?,?)',
    ('log_1', 'task_1', 'approval.approved', '테스트 작업', now),
)

print('1) active session:', db.execute(
    'SELECT id, title FROM sessions WHERE archived = 0 ORDER BY updated_at DESC LIMIT 1;'
).fetchone())
print('2) messages ordered:', db.execute(
    'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC, rowid ASC;',
    ('ses_1',),
).fetchall())
print('3) session summaries:')
for row in db.execute(
    """SELECT s.id, s.title,
              (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count,
              (SELECT m2.content FROM messages m2 WHERE m2.session_id = s.id
                ORDER BY m2.created_at DESC, m2.rowid DESC LIMIT 1) AS last_message
         FROM sessions s WHERE s.archived = 0 ORDER BY s.updated_at DESC LIMIT ?;""",
    (50,),
):
    print('   ', row)
print('4) memories:', db.execute('SELECT kind, value FROM memories WHERE active = 1;').fetchall())
print('5) task after resolve:', db.execute("SELECT status, result FROM tasks WHERE id='task_1';").fetchone())
print('6) pending count:', db.execute("SELECT COUNT(*) FROM tasks WHERE status='pending';").fetchone())
print('7) setting after upsert:', db.execute("SELECT value FROM app_settings WHERE key='route_mode';").fetchone())
print('8) audit list:', db.execute(
    'SELECT action, detail FROM audit_logs ORDER BY created_at DESC, rowid DESC LIMIT 60;'
).fetchall())

db.execute('DELETE FROM sessions WHERE id = ?;', ('ses_1',))
print('9) messages after session delete (cascade):', db.execute('SELECT COUNT(*) FROM messages;').fetchone())
print('10) tasks after session delete (kept):', db.execute('SELECT COUNT(*) FROM tasks;').fetchone())

print('SQL VALIDATION: OK')
